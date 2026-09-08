import { bkuRepository } from "@/repositories/bku.repository";
import { getRomanMonth } from "@/lib/utils/pesanan-date";
import type {
  BkuLedgerEntry,
  BkuSummary,
  CreateBkuIncomeInput,
  ServiceResponse,
} from "@/types";

export interface BkuLedgerResult {
  entries: BkuLedgerEntry[];
  summary: BkuSummary;
}

export class BkuService {
  /**
   * Get complete BKU ledger with calculated running balance and financial summary.
   * Also ensures all existing receipts in the database are synced to BKU.
   */
  async getBkuLedger(userId: string, tahun?: string | null): Promise<ServiceResponse<BkuLedgerResult>> {
    try {
      // 1. Auto-sync any unsynced receipts first
      await this.syncAllUnsyncedReceipts(userId);

      // 2. Fetch all transactions ordered chronologically (opsional difilter tahun)
      const rawTransactions = await bkuRepository.findByUserId(userId, tahun);

      // 3. Compute running balance, ledger entries, and tax metrics
      let runningBalance = 0;
      let totalPenerimaan = 0;
      let totalPengeluaran = 0;
      let kwitansiCount = 0;

      let totalPpn = 0;
      let totalPph21 = 0;
      let totalPph22 = 0;
      let totalPph23 = 0;
      let totalPajakDipungut = 0;
      let totalNominalBersih = 0;

      const entries: BkuLedgerEntry[] = rawTransactions.map((tx, index) => {
        const isIncome = tx.jenis === "PENERIMAAN";
        const debet = isIncome ? tx.nominal : 0;
        const kredit = isIncome ? 0 : tx.nominal;

        runningBalance = runningBalance + debet - kredit;
        totalPenerimaan += debet;
        totalPengeluaran += kredit;
        if (tx.receiptId) kwitansiCount++;

        const ppnNominal = tx.receipt?.ppnNominal || 0;
        const pph21Nominal = tx.receipt?.pph21Nominal || 0;
        const pph22Nominal = tx.receipt?.pph22Nominal || 0;
        const pph23Nominal = tx.receipt?.pph23Nominal || 0;
        const totalPajak = tx.receipt?.totalPajak || 0;
        const nominalBersih = tx.receipt?.nominalBersih || (isIncome ? 0 : tx.nominal);

        if (!isIncome) {
          totalPpn += ppnNominal;
          totalPph21 += pph21Nominal;
          totalPph22 += pph22Nominal;
          totalPph23 += pph23Nominal;
          totalPajakDipungut += totalPajak;
          totalNominalBersih += nominalBersih;
        }

        return {
          id: tx.id,
          nomorUrut: index + 1,
          tanggal: tx.tanggal,
          nomorBukti: tx.nomorBukti,
          kategoriRab: tx.kategoriRab,
          uraian: tx.uraian,
          jenis: tx.jenis,
          debet,
          kredit,
          saldoBerjalan: runningBalance,
          receiptId: tx.receiptId,
          penerima: tx.receipt?.penerima || null,
          ketua: tx.receipt?.ketua || null,
          ppnNominal,
          pph21Nominal,
          pph22Nominal,
          pph23Nominal,
          totalPajak,
          nominalBersih,
          keteranganPajak: tx.receipt?.keteranganPajak || null,
        };
      });

      // 4. Compute summary metrics
      const persentaseRealisasi =
        totalPenerimaan > 0
          ? Math.min(100, (totalPengeluaran / totalPenerimaan) * 100)
          : 0;

      const summary: BkuSummary = {
        totalPenerimaan,
        totalPengeluaran,
        saldoAkhir: runningBalance,
        persentaseRealisasi,
        totalTransaksi: rawTransactions.length,
        jumlahKwitansi: kwitansiCount,
        totalPpn,
        totalPph21,
        totalPph22,
        totalPph23,
        totalPajakDipungut,
        totalNominalBersih,
      };

      return {
        success: true,
        message: "Data Buku Kas Umum berhasil dimuat.",
        data: { entries, summary },
      };
    } catch (error) {
      console.error("[BkuService] Failed to load BKU ledger:", error);
      return {
        success: false,
        message: "Gagal memuat data Buku Kas Umum.",
      };
    }
  }

  /**
   * Add incoming grant funding / cash disbursement (Debet).
   */
  async addIncome(
    input: CreateBkuIncomeInput,
    userId: string
  ): Promise<ServiceResponse<{ id: string }>> {
    try {
      if (input.nominal <= 0) {
        return {
          success: false,
          message: "Nominal penerimaan harus lebih besar dari 0.",
        };
      }

      if (!input.nomorBukti || !input.nomorBukti.trim()) {
        return {
          success: false,
          message: "Nomor bukti pencairan / SP2D wajib diisi.",
        };
      }

      let parsedDate = new Date(input.tanggal);
      if (isNaN(parsedDate.getTime())) {
        parsedDate = new Date();
      }

      const created = await bkuRepository.create({
        nomorBukti: input.nomorBukti.trim(),
        tanggal: parsedDate,
        uraian: input.uraian.trim() || "Penerimaan Dana Hibah",
        jenis: "PENERIMAAN",
        kategoriRab: input.kategoriRab?.trim() || "Pencairan Hibah",
        nominal: input.nominal,
        userId,
      });

      return {
        success: true,
        message: `Penerimaan kas ${created.nomorBukti} sebesar Rp ${created.nominal.toLocaleString("id-ID")} berhasil dicatat!`,
        data: { id: created.id },
      };
    } catch (error) {
      console.error("[BkuService] Failed to add income:", error);
      return {
        success: false,
        message: "Gagal mencatat transaksi penerimaan kas.",
      };
    }
  }

  /**
   * Delete a manual BKU entry. (Kwitansi-based entries must be deleted via Kwitansi).
   */
  async deleteTransaction(
    id: string,
    userId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      const tx = await bkuRepository.findById(id);
      if (!tx) {
        return { success: false, message: "Transaksi tidak ditemukan." };
      }

      if (tx.receiptId) {
        return {
          success: false,
          message:
            "Transaksi ini terhubung dengan Kwitansi. Hapus melalui menu Kwitansi untuk menjaga integritas SPJ.",
        };
      }

      const success = await bkuRepository.delete(id, userId);
      return {
        success,
        message: success
          ? "Transaksi penerimaan berhasil dihapus dari BKU."
          : "Gagal menghapus transaksi.",
      };
    } catch (error) {
      console.error("[BkuService] Failed to delete transaction:", error);
      return { success: false, message: "Terjadi kesalahan saat menghapus transaksi." };
    }
  }

  /**
   * Sync all unsynced receipts in database into BKU.
   */
  async syncAllUnsyncedReceipts(userId: string): Promise<number> {
    try {
      const unsynced = await bkuRepository.findUnsyncedReceipts(userId);
      if (unsynced.length === 0) return 0;

      await Promise.all(
        unsynced.map((receipt) =>
          bkuRepository.upsertFromReceipt(
            {
              nomorBukti: receipt.nomorBukti,
              tanggal: receipt.tanggal,
              uraian: receipt.uraian,
              jenis: "PENGELUARAN",
              kategoriRab: receipt.kategoriRab,
              nominal: receipt.nominal,
              userId: receipt.userId,
            },
            receipt.id
          )
        )
      );
      return unsynced.length;
    } catch (error) {
      console.error("[BkuService] Auto-sync receipts error:", error);
      return 0;
    }
  }

  /**
   * Helper to generate next unique SP2D/Income nomor bukti (e.g. SP2D-HB/002/IX/2026).
   */
  async generateNextIncomeNomorBukti(
    userId: string,
    targetDate?: Date | string
  ): Promise<string> {
    try {
      let dateObj = targetDate ? new Date(targetDate) : new Date();
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date();
      }
      const currentMonth = dateObj.getMonth();
      const currentYear = dateObj.getFullYear();
      const romanMonth = getRomanMonth(currentMonth);

      const allBkuNumbers = await bkuRepository.getAllNomorBukti(userId);
      const usedSet = new Set(allBkuNumbers.map((n) => n.trim().toLowerCase()));

      const parsedSeqNumbers: number[] = [];
      for (const numStr of allBkuNumbers) {
        if (numStr.toUpperCase().includes("SP2D")) {
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
      let nextSeq = maxSeq + 1;
      let candidate = `SP2D-HB/${nextSeq.toString().padStart(3, "0")}/${romanMonth}/${currentYear}`;
      while (usedSet.has(candidate.toLowerCase())) {
        nextSeq++;
        candidate = `SP2D-HB/${nextSeq.toString().padStart(3, "0")}/${romanMonth}/${currentYear}`;
      }
      return candidate;
    } catch {
      const fallbackMonth = getRomanMonth(new Date().getMonth());
      const fallbackYear = new Date().getFullYear();
      return `SP2D-HB/001/${fallbackMonth}/${fallbackYear}`;
    }
  }
}

export const bkuService = new BkuService();
