import { pesananRepository } from "@/repositories/pesanan.repository";
import { institutionRepository } from "@/repositories/institution.repository";
import { purchaseOrderSchema } from "@/lib/validations/pesanan";
import { angkaKeTerbilang } from "@/lib/utils/terbilang";
import { buildFormattedDocumentNumber, deconstructDocumentNumber, ensureDocumentPrefix } from "@/lib/utils/pesanan-date";
import type { PurchaseOrder, CreatePesananInput, ServiceResponse } from "@/types";

export class PesananService {
  /**
   * Menyimpan atau memperbarui dokumen Surat Pesanan
   */
  async savePurchaseOrder(
    input: CreatePesananInput,
    userId: string
  ): Promise<ServiceResponse<PurchaseOrder>> {
    try {
      // 1. Zod Validation
      const validation = purchaseOrderSchema.safeParse(input);
      if (!validation.success) {
        const errorMsg = validation.error.errors.map((e) => e.message).join(", ");
        return {
          success: false,
          message: `Validasi gagal: ${errorMsg}`,
        };
      }

      // 2. Kalkulasi Keuangan
      const calculatedSubtotal = input.items.reduce(
        (sum, item) => sum + (item.jumlah * item.hargaSatuan),
        0
      );
      const totalHarga = input.totalHarga > 0 ? input.totalHarga : calculatedSubtotal + (input.pajak || 0);
      const terbilangText = input.terbilang || angkaKeTerbilang(totalHarga);

      const payload: CreatePesananInput = {
        ...input,
        subtotal: calculatedSubtotal,
        totalHarga,
        terbilang: terbilangText,
      };

      // 3. Validasi Anti-Duplikasi: 1 Kwitansi / Realisasi RAB = Maksimal 1 Surat Pesanan
      if (input.receiptId) {
        const existingLinkedPO = await pesananRepository.findByReceiptId(input.receiptId, userId);
        if (existingLinkedPO && existingLinkedPO.id !== input.id) {
          return {
            success: false,
            message: `Kwitansi belanja ini sudah ditautkan ke Surat Pesanan "${existingLinkedPO.nomorSp}". Satu realisasi RAB hanya dapat dibuatkan 1 kali Surat Pesanan.`,
          };
        }
      }

      // 4. Persist to Repository
      const result = await pesananRepository.createOrUpdate(userId, payload);

      return {
        success: true,
        message: `Surat Pesanan ${result.nomorSp} berhasil disimpan.`,
        data: result,
      };
    } catch (error) {
      console.error("[PesananService.savePurchaseOrder] Error:", error);
      return {
        success: false,
        message: "Terjadi kesalahan internal saat menyimpan Surat Pesanan.",
      };
    }
  }

  /**
   * Mengambil semua Surat Pesanan milik pengguna, opsional difilter per tahun anggaran
   */
  async getPurchaseOrders(userId: string, tahun?: string | null): Promise<ServiceResponse<PurchaseOrder[]>> {
    try {
      const list = await pesananRepository.findManyByUserId(userId, tahun);
      return {
        success: true,
        message: "Data Surat Pesanan berhasil dimuat.",
        data: list,
      };
    } catch (error) {
      console.error("[PesananService.getPurchaseOrders] Error:", error);
      return {
        success: false,
        message: "Gagal memuat daftar Surat Pesanan.",
        data: [],
      };
    }
  }

  /**
   * Mengambil satu Surat Pesanan berdasarkan ID
   */
  async getPurchaseOrderById(id: string, userId: string): Promise<ServiceResponse<PurchaseOrder | null>> {
    try {
      const item = await pesananRepository.findById(id, userId);
      if (!item) {
        return {
          success: false,
          message: "Dokumen Surat Pesanan tidak ditemukan.",
          data: null,
        };
      }
      return {
        success: true,
        message: "Dokumen Surat Pesanan ditemukan.",
        data: item,
      };
    } catch (error) {
      console.error("[PesananService.getPurchaseOrderById] Error:", error);
      return {
        success: false,
        message: "Gagal mengambil data Surat Pesanan.",
        data: null,
      };
    }
  }

  /**
   * Menghapus dokumen Surat Pesanan
   */
  async deletePurchaseOrder(id: string, userId: string): Promise<ServiceResponse<boolean>> {
    try {
      const deleted = await pesananRepository.delete(id, userId);
      if (!deleted) {
        return {
          success: false,
          message: "Gagal menghapus dokumen Surat Pesanan.",
          data: false,
        };
      }
      return {
        success: true,
        message: "Dokumen Surat Pesanan berhasil dihapus.",
        data: true,
      };
    } catch (error) {
      console.error("[PesananService.deletePurchaseOrder] Error:", error);
      return {
        success: false,
        message: "Terjadi kesalahan saat menghapus Surat Pesanan.",
        data: false,
      };
    }
  }

  /**
   * Menghasilkan nomor register Surat Pesanan (SP) berikutnya yang urut, otomatis, dan anti-double.
   * Terisolasi per user (multi-tenant) dan dinamis terhadap tanggal transaksi.
   */
  async generateNextNomorSp(
    userId: string,
    targetDate?: Date | string
  ): Promise<{ nomorSp: string; nomorUrut: string }> {
    try {
      let dateObj = targetDate ? new Date(targetDate) : new Date();
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date();
      }

      // Ambil format pola lembaga dari profil akun pengguna dengan prefix /SP/
      let pattern = "/SP/A/PR.FNU/";
      try {
        const profile = await institutionRepository.findByUserId(userId);
        if (profile?.formatNomorSp && profile.formatNomorSp.trim()) {
          pattern = ensureDocumentPrefix(profile.formatNomorSp.trim(), "SP");
        } else if (profile?.formatNomorBast && profile.formatNomorBast.trim()) {
          pattern = ensureDocumentPrefix(profile.formatNomorBast.trim(), "SP");
        } else if (profile?.formatNomorKwitansi && profile.formatNomorKwitansi.trim()) {
          pattern = ensureDocumentPrefix(profile.formatNomorKwitansi.trim(), "SP");
        }
      } catch (err) {
        console.warn("[PesananService] Could not load institution profile for SP pattern:", err);
      }

      // Ambil seluruh nomor SP yang sudah pernah digunakan khusus oleh pengguna ini
      const allSpNumbers = await pesananRepository.getAllNomorSp(userId);
      const usedSet = new Set(allSpNumbers.map((n) => n.trim().toLowerCase()));

      // Cari nomor urut numerik tertinggi yang pernah ada di SP
      const parsedSeqNumbers: number[] = [];
      for (const numStr of allSpNumbers) {
        const decomp = deconstructDocumentNumber(numStr);
        if (decomp.nomorUrut && /^\d+$/.test(decomp.nomorUrut)) {
          parsedSeqNumbers.push(parseInt(decomp.nomorUrut, 10));
        } else {
          const tokens = numStr.split(/[\/\-\s]+/);
          for (const token of tokens) {
            if (/^\d+$/.test(token)) {
              const val = parseInt(token, 10);
              if (val < 1990 || val > 2099) {
                parsedSeqNumbers.push(val);
              }
            }
          }
        }
      }

      const maxSeq = parsedSeqNumbers.length > 0 ? Math.max(...parsedSeqNumbers) : 0;
      let nextSeq = Math.max(maxSeq, allSpNumbers.length) + 1;
      if (nextSeq < 1) nextSeq = 1;

      let paddedUrut = String(nextSeq).padStart(3, "0");
      let candidate = buildFormattedDocumentNumber(paddedUrut, pattern, dateObj);

      while (usedSet.has(candidate.toLowerCase())) {
        nextSeq++;
        paddedUrut = String(nextSeq).padStart(3, "0");
        candidate = buildFormattedDocumentNumber(paddedUrut, pattern, dateObj);
      }

      return {
        nomorSp: candidate,
        nomorUrut: paddedUrut,
      };
    } catch (error) {
      console.error("[PesananService] Error generating next nomor SP:", error);
      const now = new Date();
      const defaultUrut = "001";
      const candidate = buildFormattedDocumentNumber(defaultUrut, "/SP/A/PR.FNU/", now);
      return {
        nomorSp: candidate,
        nomorUrut: defaultUrut,
      };
    }
  }
}

export const pesananService = new PesananService();
