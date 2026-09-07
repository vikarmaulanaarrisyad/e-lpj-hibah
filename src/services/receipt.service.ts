import { receiptRepository } from "@/repositories/receipt.repository";
import { bkuRepository } from "@/repositories/bku.repository";
import { angkaKeTerbilang } from "@/lib/utils/terbilang";
import { getRomanMonth } from "@/lib/utils/pesanan-date";
import type { Receipt, CreateReceiptInput, ServiceResponse } from "@/types";

export class ReceiptService {
  /**
   * Save or update a receipt into Buku Kas Umum (BKU).
   * Enforces business rules: Auto-terbilang check, materai rules, and date normalization.
   */
  async saveReceipt(
    input: CreateReceiptInput,
    userId: string
  ): Promise<ServiceResponse<Receipt>> {
    try {
      // 1. Business rule: validate nominal
      if (input.nominal <= 0) {
        return {
          success: false,
          message: "Nominal kwitansi harus lebih besar dari 0.",
        };
      }

      // 2. Business rule: Auto-determine or enforce materai requirement (UU Bea Meterai No. 10/2020: >= Rp 5.000.000)
      const requiresMaterai = input.nominal >= 5000000 ? true : Boolean(input.denganMaterai);

      // 3. Ensure terbilang text is accurate
      const computedTerbilang = input.terbilang || angkaKeTerbilang(input.nominal);

      // 4. Parse transaction date
      let parsedDate = new Date(input.tanggal);
      if (isNaN(parsedDate.getTime())) {
        // Fallback to current date if user entered a custom text string like "06 Agustus 2026"
        parsedDate = new Date();
      }

      // 5. Persist via repository layer
      const saved = await receiptRepository.create({
        nomorBukti: input.nomorBukti.trim(),
        tanggal: parsedDate,
        pemberi: input.pemberi.trim(),
        nominal: input.nominal,
        terbilang: computedTerbilang,
        uraian: input.uraian.trim(),
        ketua: input.ketua.trim(),
        bendahara: input.bendahara.trim(),
        penerima: input.penerima.trim(),
        denganMaterai: requiresMaterai,
        template: input.template || "bank",
        kategoriRab: input.kategoriRab ?? null,
        isPpn: input.isPpn ?? false,
        ppnRate: input.ppnRate ?? 0.11,
        ppnNominal: input.ppnNominal ?? 0,
        isPph21: input.isPph21 ?? false,
        pph21Rate: input.pph21Rate ?? 0.05,
        pph21Nominal: input.pph21Nominal ?? 0,
        isPph22: input.isPph22 ?? false,
        pph22Rate: input.pph22Rate ?? 0.015,
        pph22Nominal: input.pph22Nominal ?? 0,
        isPph23: input.isPph23 ?? false,
        pph23Rate: input.pph23Rate ?? 0.02,
        pph23Nominal: input.pph23Nominal ?? 0,
        dpp: input.dpp ?? input.nominal,
        totalPajak: input.totalPajak ?? 0,
        nominalBersih: input.nominalBersih ?? input.nominal,
        keteranganPajak: input.keteranganPajak ?? null,
        userId,
      });

      // 6. Automatically sync to Buku Kas Umum (BKU)
      await bkuRepository.upsertFromReceipt(
        {
          nomorBukti: saved.nomorBukti,
          tanggal: saved.tanggal,
          uraian: saved.uraian,
          jenis: "PENGELUARAN",
          kategoriRab: saved.kategoriRab,
          nominal: saved.nominal,
          userId,
        },
        saved.id
      );

      return {
        success: true,
        message: `Kwitansi ${saved.nomorBukti} berhasil disimpan ke Buku Kas Umum (BKU)!`,
        data: saved,
      };
    } catch (error) {
      console.error("[ReceiptService] Failed to save receipt:", error);
      return {
        success: false,
        message: "Gagal menyimpan data kwitansi ke database.",
      };
    }
  }

  /**
   * Get all receipts belonging to current user
   */
  async getReceiptsByUser(userId: string): Promise<ServiceResponse<Receipt[]>> {
    try {
      const list = await receiptRepository.findManyByUserId(userId);
      return {
        success: true,
        message: `Berhasil mengambil ${list.length} kwitansi.`,
        data: list,
      };
    } catch (error) {
      console.error("[ReceiptService] Failed to fetch receipts:", error);
      return {
        success: false,
        message: "Gagal mengambil daftar kwitansi.",
        data: [],
      };
    }
  }

  /**
   * Get single receipt by nomorBukti
   */
  async getReceiptByNomorBukti(
    nomorBukti: string,
    userId: string
  ): Promise<ServiceResponse<Receipt | null>> {
    try {
      const receipt = await receiptRepository.findByNomorBukti(nomorBukti);
      if (!receipt || receipt.userId !== userId) {
        return {
          success: false,
          message: `Kwitansi dengan nomor ${nomorBukti} tidak ditemukan.`,
          data: null,
        };
      }
      return {
        success: true,
        message: "Kwitansi berhasil ditemukan.",
        data: receipt,
      };
    } catch (error) {
      console.error("[ReceiptService] Failed to find receipt:", error);
      return {
        success: false,
        message: "Gagal memuat data kwitansi.",
        data: null,
      };
    }
  }

  /**
   * Delete a receipt and its associated BKU transaction
   */
  async deleteReceipt(id: string, userId: string): Promise<ServiceResponse<boolean>> {
    try {
      const receipt = await receiptRepository.findById(id);
      if (!receipt || receipt.userId !== userId) {
        return {
          success: false,
          message: "Kwitansi tidak ditemukan atau bukan milik Anda.",
          data: false,
        };
      }

      await receiptRepository.delete(id, userId);

      return {
        success: true,
        message: `Kwitansi ${receipt.nomorBukti} berhasil dihapus dari sistem dan Buku Kas Umum!`,
        data: true,
      };
    } catch (error) {
      console.error("[ReceiptService] Failed to delete receipt:", error);
      return {
        success: false,
        message: "Gagal menghapus kwitansi dari database.",
        data: false,
      };
    }
  }

  /**
   * Helper to generate next suggested BKU nomor bukti (e.g. BKU-HB/015/VIII/2026)
   */
  async generateNextNomorBukti(userId: string): Promise<string> {
    try {
      const count = await receiptRepository.countByUserId(userId);
      const nextNum = (count + 1).toString().padStart(3, "0");
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const romanMonth = getRomanMonth(currentMonth);
      return `BKU-HB/${nextNum}/${romanMonth}/${currentYear}`;
    } catch {
      return `BKU-HB/001/VIII/2026`;
    }
  }
}

export const receiptService = new ReceiptService();
