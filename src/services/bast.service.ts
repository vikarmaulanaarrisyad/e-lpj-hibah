import { bastRepository, type BastWithReceipt } from "@/repositories/bast.repository";
import { receiptRepository } from "@/repositories/receipt.repository";
import { angkaKeTerbilang } from "@/lib/utils/terbilang";
import type { BastDocument, CreateBastInput, BastItem, ServiceResponse } from "@/types";

const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

/**
 * Format tanggal menjadi pernyataan hukum pembuka BAST:
 * Contoh: "Senin tanggal tiga puluh satu bulan Juli tahun Dua Ribu Dua Puluh Enam (31 - 07 - 2026)"
 */
export function formatTanggalTerbilang(input: Date | string): { hariTanggal: string; terbilangResmi: string } {
  let d: Date;
  if (typeof input === "string") {
    const clean = input.split("T")[0].trim();
    const parts = clean.split("-").map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      d = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      d = new Date(input);
    }
  } else {
    d = input;
  }

  if (isNaN(d.getTime())) {
    d = new Date();
  }

  const hari = NAMA_HARI[d.getDay()];
  const tgl = d.getDate();
  const bln = NAMA_BULAN[d.getMonth()];
  const thn = d.getFullYear();

  const tglTerbilang = angkaKeTerbilang(tgl).toLowerCase().replace(" rupiah", "").trim();
  const thnTerbilang = angkaKeTerbilang(thn).replace(" Rupiah", "").trim();

  const padTgl = String(tgl).padStart(2, "0");
  const padBln = String(d.getMonth() + 1).padStart(2, "0");

  const hariTanggal = `${hari}, ${tgl} ${bln} ${thn}`;
  const terbilangResmi = `${hari} tanggal ${tglTerbilang} bulan ${bln} tahun ${thnTerbilang} (${padTgl} - ${padBln} - ${thn})`;

  return { hariTanggal, terbilangResmi };
}

export class BastService {
  /**
   * Mengambil semua dokumen BAST milik user
   */
  async getBastList(userId: string): Promise<ServiceResponse<BastWithReceipt[]>> {
    try {
      const list = await bastRepository.findManyByUserId(userId);
      return {
        success: true,
        message: `Berhasil memuat ${list.length} Berita Acara Serah Terima.`,
        data: list,
      };
    } catch (error) {
      console.error("[BastService] Failed to get BAST list:", error);
      return {
        success: false,
        message: "Gagal memuat daftar Berita Acara.",
        data: [],
      };
    }
  }

  /**
   * Mengambil satu dokumen BAST beserta deserialisasi items
   */
  async getBastByNomor(
    nomorBast: string,
    userId: string
  ): Promise<ServiceResponse<{ bast: BastWithReceipt; items: BastItem[] } | null>> {
    try {
      const doc = await bastRepository.findByNomorBast(nomorBast);
      if (!doc || doc.userId !== userId) {
        return {
          success: false,
          message: `Dokumen BAST ${nomorBast} tidak ditemukan.`,
          data: null,
        };
      }

      let parsedItems: BastItem[] = [];
      try {
        parsedItems = JSON.parse(doc.itemsJson) || [];
      } catch {
        parsedItems = [];
      }

      return {
        success: true,
        message: "Dokumen BAST berhasil ditemukan.",
        data: { bast: doc, items: parsedItems },
      };
    } catch (error) {
      console.error("[BastService] Failed to get BAST:", error);
      return {
        success: false,
        message: "Gagal memuat dokumen BAST.",
        data: null,
      };
    }
  }

  /**
   * Mengambil dokumen BAST yang terhubung dengan kwitansi tertentu
   */
  async getBastByReceiptId(
    receiptId: string,
    userId: string
  ): Promise<ServiceResponse<BastDocument | null>> {
    try {
      const doc = await bastRepository.findByReceiptId(receiptId);
      if (!doc || doc.userId !== userId) {
        return {
          success: true,
          message: "Belum ada BAST untuk kwitansi ini.",
          data: null,
        };
      }
      return {
        success: true,
        message: "BAST ditemukan.",
        data: doc,
      };
    } catch (error) {
      console.error("[BastService] Error in getBastByReceiptId:", error);
      return {
        success: false,
        message: "Gagal memeriksa BAST terkait kwitansi.",
        data: null,
      };
    }
  }

  /**
   * Menyimpan atau memperbarui dokumen BAST
   */
  async saveBast(input: CreateBastInput, userId: string): Promise<ServiceResponse<BastDocument>> {
    try {
      if (!input.nomorBast || !input.nomorBast.trim()) {
        return {
          success: false,
          message: "Nomor register BAST wajib diisi.",
        };
      }

      if (!input.items || input.items.length === 0) {
        return {
          success: false,
          message: "Minimal harus ada 1 item barang yang diserahterimakan.",
        };
      }

      // Validasi Anti-Duplikasi: 1 Kwitansi / Realisasi RAB = Maksimal 1 Berita Acara (BAST)
      if (input.receiptId) {
        const existingBast = await bastRepository.findByReceiptId(input.receiptId);
        if (existingBast && existingBast.userId === userId && existingBast.id !== input.id) {
          return {
            success: false,
            message: `Kwitansi belanja ini sudah ditautkan ke Berita Acara "${existingBast.nomorBast}". Satu realisasi RAB hanya dapat dibuatkan 1 kali Berita Acara.`,
          };
        }
      }

      const saved = await bastRepository.createOrUpdate(userId, input);

      return {
        success: true,
        message: `Berita Acara Serah Terima ${saved.nomorBast} berhasil disimpan ke database!`,
        data: saved,
      };
    } catch (error) {
      console.error("[BastService] Failed to save BAST:", error);
      return {
        success: false,
        message: "Gagal menyimpan Berita Acara Serah Terima ke database.",
      };
    }
  }

  /**
   * Menghasilkan nomor register BAST berikutnya (misal: 014/BAST-HB/FTY/VII/2026)
   */
  async generateNextNomorBast(userId: string): Promise<string> {
    try {
      const count = await bastRepository.countByUserId(userId);
      const nextNum = (count + 1).toString().padStart(3, "0");
      const currentYear = new Date().getFullYear();
      return `${nextNum}/BAST-HB/FTY/VII/${currentYear}`;
    } catch {
      return `014/BAST-HB/FTY/VII/2026`;
    }
  }
}

export const bastService = new BastService();
