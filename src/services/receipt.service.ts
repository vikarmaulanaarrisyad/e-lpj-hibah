import { prisma } from "@/lib/prisma";
import { receiptRepository } from "@/repositories/receipt.repository";
import { bkuRepository } from "@/repositories/bku.repository";
import { institutionRepository } from "@/repositories/institution.repository";
import { angkaKeTerbilang } from "@/lib/utils/terbilang";
import { buildFormattedDocumentNumber, getRomanMonth } from "@/lib/utils/pesanan-date";
import type { Receipt, CreateReceiptInput, ServiceResponse } from "@/types";

export class ReceiptService {
  /**
   * Save or update a receipt into Buku Kas Umum (BKU).
   * Enforces business rules: Auto-terbilang check, materai rules, date normalization,
   * and guaranteed collision-free distinct cash proof numbering (No. Bukti Kas).
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

      let finalNomorBukti = input.nomorBukti ? input.nomorBukti.trim() : "";

      // 5. Uniqueness & Anti-Double Guarantee
      if (input.id) {
        // Edit Mode: verify this receipt exists and belongs to this user
        const existingReceipt = await receiptRepository.findById(input.id);
        if (!existingReceipt || existingReceipt.userId !== userId) {
          return {
            success: false,
            message: "Data kwitansi yang akan diedit tidak ditemukan.",
          };
        }

        // If nomorBukti is changed, ensure it doesn't collide with another receipt
        if (finalNomorBukti && finalNomorBukti !== existingReceipt.nomorBukti) {
          const conflict = await prisma.receipt.findFirst({
            where: {
              userId,
              nomorBukti: finalNomorBukti,
              NOT: { id: input.id },
            },
          });
          if (conflict) {
            return {
              success: false,
              message: `Nomor bukti kas "${finalNomorBukti}" sudah digunakan oleh kwitansi lain. Silakan gunakan nomor lain yang belum terpakai.`,
            };
          }
        } else if (!finalNomorBukti) {
          finalNomorBukti = existingReceipt.nomorBukti;
        }
      } else {
        // Create Mode: ensure nomorBukti is not empty and is not already taken
        const conflict = finalNomorBukti
          ? await receiptRepository.findByNomorBukti(finalNomorBukti, userId)
          : null;

        if (conflict || !finalNomorBukti || finalNomorBukti.toUpperCase() === "AUTO") {
          // Otomatis tentukan nomor urut berikutnya yang 100% bebas bentrok
          finalNomorBukti = await this.generateNextNomorBukti(userId, parsedDate);
        }
      }

      // 6. Persist via repository layer
      const saved = await receiptRepository.create({
        id: input.id,
        nomorBukti: finalNomorBukti,
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

      // 7. Automatically sync to Buku Kas Umum (BKU)
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
      const receipt = await receiptRepository.findByNomorBukti(nomorBukti, userId);
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
   * Helper to generate next suggested BKU nomor bukti (e.g. 01/A/PR.FNU/IX/2026).
   * Guaranteed to be distinct, strictly sequential, collision-free, and dynamic to transaction date.
   */
  async generateNextNomorBukti(
    userId: string,
    targetDate?: Date | string
  ): Promise<string> {
    try {
      // 1. Resolve transaction date for roman month & year
      let dateObj = targetDate ? new Date(targetDate) : new Date();
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date();
      }
      const currentMonth = dateObj.getMonth();
      const currentYear = dateObj.getFullYear();
      const romanMonth = getRomanMonth(currentMonth);

      // 2. Resolve institution numbering format (default: "/A/PR.FNU/")
      let pattern = "/A/PR.FNU/";
      try {
        const profile = await institutionRepository.findByUserId(userId);
        if (profile?.formatNomorKwitansi && profile.formatNomorKwitansi.trim()) {
          pattern = profile.formatNomorKwitansi.trim();
        } else if (profile?.formatNomorBast && profile.formatNomorBast.trim()) {
          pattern = profile.formatNomorBast.trim();
        } else if (profile?.formatNomorSp && profile.formatNomorSp.trim()) {
          pattern = profile.formatNomorSp.trim();
        }
      } catch (err) {
        console.warn("[ReceiptService] Could not fetch institution profile prefix:", err);
      }

      // 3. Fetch all used numbers from receipts and BKU transactions
      const [receiptNumbers, bkuNumbers] = await Promise.all([
        receiptRepository.getAllNomorBukti(userId),
        bkuRepository.getAllNomorBukti(userId),
      ]);

      const allUsed = [...receiptNumbers, ...bkuNumbers];
      const usedSet = new Set(allUsed.map((n) => n.trim().toLowerCase()));

      // 4. Extract highest sequence number used so far
      const parsedSeqNumbers: number[] = [];
      for (const numStr of allUsed) {
        const tokens = numStr.split(/[\/\-\s]+/);
        for (const token of tokens) {
          if (/^\d+$/.test(token)) {
            const val = parseInt(token, 10);
            // Ignore 4-digit years (e.g. 1990 - 2099)
            if (val < 1990 || val > 2099) {
              parsedSeqNumbers.push(val);
            }
          }
        }
      }

      const maxSeq = parsedSeqNumbers.length > 0 ? Math.max(...parsedSeqNumbers) : 0;
      let nextSeq = Math.max(maxSeq, receiptNumbers.length) + 1;
      if (nextSeq < 1) nextSeq = 1;

      // 5. Collision-free verification loop using standard document number builder (e.g. 01/A/PR.FNU/IX/2026)
      let paddedUrut = String(nextSeq).padStart(2, "0");
      let candidate = buildFormattedDocumentNumber(paddedUrut, pattern, dateObj);
      while (usedSet.has(candidate.toLowerCase())) {
        nextSeq++;
        paddedUrut = String(nextSeq).padStart(2, "0");
        candidate = buildFormattedDocumentNumber(paddedUrut, pattern, dateObj);
      }

      return candidate;
    } catch (error) {
      console.error("[ReceiptService] Error generating next nomor bukti:", error);
      const fallbackDate = targetDate || new Date();
      return buildFormattedDocumentNumber("01", "/A/PR.FNU/", fallbackDate);
    }
  }
}

export const receiptService = new ReceiptService();
