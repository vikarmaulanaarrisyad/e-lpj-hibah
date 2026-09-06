import { rabRepository } from "@/repositories/rab.repository";
import { receiptRepository } from "@/repositories/receipt.repository";
import type {
  RabSummary,
  RabStatusItem,
  RabAbsorptionStatus,
  BudgetCeilingCheckResult,
  UpdateRabItemInput,
  ServiceResponse,
} from "@/types";

export class RabService {
  /**
   * Helper untuk memeriksa apakah kategori pada kwitansi cocok dengan kode pos RAB
   * Contoh: "5.2.1" cocok dengan "5.2.1", "5.2.1 Perlengkapan", "5.2.1 Peralatan"
   */
  private isCategoryMatch(receiptCategory: string | null | undefined, rabKode: string): boolean {
    if (!receiptCategory) return false;
    const cleanReceipt = receiptCategory.trim().toLowerCase();
    const cleanKode = rabKode.trim().toLowerCase();
    return cleanReceipt === cleanKode || cleanReceipt.startsWith(cleanKode);
  }

  /**
   * Mengambil status penyerapan anggaran RAB lengkap per pos rekening & agregat
   */
  async getRabStatus(userId: string): Promise<ServiceResponse<RabSummary>> {
    try {
      // 1. Pastikan pos RAB bawaan tersedia
      const rabItems = await rabRepository.seedDefaultCategoriesIfEmpty(userId);

      // 2. Ambil semua kwitansi yang tercatat
      const receipts = await receiptRepository.findManyByUserId(userId);

      // 3. Hitung serapan per pos rekening
      let totalAnggaran = 0;
      let totalRealisasi = 0;

      const items: RabStatusItem[] = rabItems.map((item) => {
        const matchingReceipts = receipts.filter((r) =>
          this.isCategoryMatch(r.kategoriRab, item.kode)
        );

        const realisasi = matchingReceipts.reduce((acc, curr) => acc + curr.nominal, 0);
        const sisaPagu = item.anggaran - realisasi;
        const persentaseSerapan =
          item.anggaran > 0 ? (realisasi / item.anggaran) * 100 : 0;

        let status: RabAbsorptionStatus = "SAFE";
        if (sisaPagu < 0) {
          status = "DEFICIT";
        } else if (persentaseSerapan >= 80) {
          status = "WARNING";
        }

        totalAnggaran += item.anggaran;
        totalRealisasi += realisasi;

        return {
          id: item.id,
          kode: item.kode,
          nama: item.nama,
          anggaran: item.anggaran,
          realisasi,
          sisaPagu,
          persentaseSerapan: Math.round(persentaseSerapan * 10) / 10,
          status,
          keterangan: item.keterangan,
          jumlahTransaksi: matchingReceipts.length,
        };
      });

      const totalSisaPagu = totalAnggaran - totalRealisasi;
      const persentaseSerapanTotal =
        totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0;

      let statusTotal: RabAbsorptionStatus = "SAFE";
      if (totalSisaPagu < 0) {
        statusTotal = "DEFICIT";
      } else if (persentaseSerapanTotal >= 80) {
        statusTotal = "WARNING";
      }

      const summary: RabSummary = {
        totalAnggaran,
        totalRealisasi,
        totalSisaPagu,
        persentaseSerapanTotal: Math.round(persentaseSerapanTotal * 10) / 10,
        statusTotal,
        items,
      };

      return {
        success: true,
        message: "Status pagu RAB berhasil dimuat.",
        data: summary,
      };
    } catch (error) {
      console.error("[RabService] Failed to get RAB status:", error);
      return {
        success: false,
        message: "Gagal memuat data kontrol pagu RAB.",
      };
    }
  }

  /**
   * Pengecekan real-time guardrail pencegahan defisit sebelum atau saat pengisian kwitansi
   */
  async checkBudgetCeiling(
    userId: string,
    kodeRab: string,
    nominalBaru: number,
    excludeReceiptNo?: string
  ): Promise<ServiceResponse<BudgetCeilingCheckResult>> {
    try {
      const rabItems = await rabRepository.seedDefaultCategoriesIfEmpty(userId);
      const targetRab = rabItems.find((r) => this.isCategoryMatch(kodeRab, r.kode));

      if (!targetRab) {
        // Jika kode tidak terdaftar secara spesifik di database
        return {
          success: true,
          message: "Kategori belum memiliki batas pagu terspesifikasi.",
          data: {
            isDeficit: false,
            kode: kodeRab,
            nama: kodeRab,
            anggaran: 0,
            realisasiSebelum: 0,
            sisaPaguSebelum: 0,
            nominalBaru,
            proyeksiSisaPagu: 0,
            proyeksiPersentase: 0,
            selisihDefisit: 0,
            status: "SAFE",
          },
        };
      }

      // Ambil transaksi yang sudah tersimpan pada pos ini (kecuali kwitansi yang sedang diedit)
      const receipts = await receiptRepository.findManyByUserId(userId);
      const matchingReceipts = receipts.filter(
        (r) =>
          this.isCategoryMatch(r.kategoriRab, targetRab.kode) &&
          r.nomorBukti !== excludeReceiptNo
      );

      const realisasiSebelum = matchingReceipts.reduce((acc, curr) => acc + curr.nominal, 0);
      const sisaPaguSebelum = targetRab.anggaran - realisasiSebelum;
      const proyeksiSisaPagu = sisaPaguSebelum - nominalBaru;
      const isDeficit = proyeksiSisaPagu < 0;
      const selisihDefisit = isDeficit ? Math.abs(proyeksiSisaPagu) : 0;
      const proyeksiPersentase =
        targetRab.anggaran > 0
          ? Math.round(((realisasiSebelum + nominalBaru) / targetRab.anggaran) * 1000) / 10
          : 0;

      let status: RabAbsorptionStatus = "SAFE";
      let warningMessage: string | undefined;

      if (isDeficit) {
        status = "DEFICIT";
        warningMessage = `PERINGATAN DEFISIT: Nominal transaksi (Rp ${nominalBaru.toLocaleString(
          "id-ID"
        )}) melebihi sisa pagu rekening ${targetRab.kode} sebesar Rp ${sisaPaguSebelum.toLocaleString(
          "id-ID"
        )}. Transaksi ini akan menyebabkan defisit -Rp ${selisihDefisit.toLocaleString("id-ID")}!`;
      } else if (proyeksiPersentase >= 80) {
        status = "WARNING";
        warningMessage = `PERHATIAN: Transaksi ini akan meningkatkan serapan pagu ${targetRab.kode} menjadi ${proyeksiPersentase}% (Sisa Pagu: Rp ${proyeksiSisaPagu.toLocaleString(
          "id-ID"
        )}).`;
      }

      return {
        success: true,
        message: isDeficit ? "Peringatan defisit anggaran terdeteksi." : "Pagu anggaran aman.",
        data: {
          isDeficit,
          kode: targetRab.kode,
          nama: targetRab.nama,
          anggaran: targetRab.anggaran,
          realisasiSebelum,
          sisaPaguSebelum,
          nominalBaru,
          proyeksiSisaPagu,
          proyeksiPersentase,
          selisihDefisit,
          status,
          warningMessage,
        },
      };
    } catch (error) {
      console.error("[RabService] Failed to check budget ceiling:", error);
      return {
        success: false,
        message: "Gagal memeriksa pagu anggaran.",
      };
    }
  }

  /**
   * Memperbarui alokasi pagu anggaran RAB
   */
  async updateRabAllocation(
    userId: string,
    input: UpdateRabItemInput
  ): Promise<ServiceResponse<RabStatusItem>> {
    try {
      if (input.anggaran < 0) {
        return {
          success: false,
          message: "Pagu anggaran tidak boleh bernilai negatif.",
        };
      }

      const updated = await rabRepository.upsert(userId, input);

      // Ambil transaksi untuk menghitung realisasi
      const receipts = await receiptRepository.findManyByUserId(userId);
      const matchingReceipts = receipts.filter((r) =>
        this.isCategoryMatch(r.kategoriRab, updated.kode)
      );
      const realisasi = matchingReceipts.reduce((acc, curr) => acc + curr.nominal, 0);
      const sisaPagu = updated.anggaran - realisasi;
      const persentaseSerapan =
        updated.anggaran > 0 ? (realisasi / updated.anggaran) * 100 : 0;

      return {
        success: true,
        message: `Pagu pos ${updated.kode} (${updated.nama}) berhasil diperbarui menjadi Rp ${updated.anggaran.toLocaleString("id-ID")}.`,
        data: {
          id: updated.id,
          kode: updated.kode,
          nama: updated.nama,
          anggaran: updated.anggaran,
          realisasi,
          sisaPagu,
          persentaseSerapan: Math.round(persentaseSerapan * 10) / 10,
          status: sisaPagu < 0 ? "DEFICIT" : persentaseSerapan >= 80 ? "WARNING" : "SAFE",
          keterangan: updated.keterangan,
          jumlahTransaksi: matchingReceipts.length,
        },
      };
    } catch (error) {
      console.error("[RabService] Failed to update RAB allocation:", error);
      return {
        success: false,
        message: "Gagal memperbarui alokasi pagu RAB.",
      };
    }
  }
}

export const rabService = new RabService();
