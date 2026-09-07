import { bastRepository, type BastWithReceipt } from "@/repositories/bast.repository";
import { receiptRepository } from "@/repositories/receipt.repository";
import { institutionRepository } from "@/repositories/institution.repository";
import { angkaKeTerbilang } from "@/lib/utils/terbilang";
import { buildFormattedDocumentNumber, deconstructDocumentNumber } from "@/lib/utils/pesanan-date";
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
   * Mengambil semua dokumen BAST milik user, opsional difilter per tahun anggaran
   */
  async getBastList(userId: string, tahun?: string | null): Promise<ServiceResponse<BastWithReceipt[]>> {
    try {
      const list = await bastRepository.findManyByUserId(userId, tahun);
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
        const nextGenerated = await this.generateNextNomorBast(userId, input.tanggal);
        input.nomorBast = nextGenerated.nomorBast;
      }

      if (!input.items || input.items.length === 0) {
        return {
          success: false,
          message: "Minimal harus ada 1 item barang yang diserahterimakan.",
        };
      }

      // Validasi Anti-Duplikasi: 1 Kwitansi / Realisasi RAB = Maksimal 1 Berita Acara (BAST)
      const cleanReceiptId =
        input.receiptId && typeof input.receiptId === "string" && input.receiptId.trim().length > 0
          ? input.receiptId.trim()
          : null;
      input.receiptId = cleanReceiptId;

      if (cleanReceiptId) {
        const existingBast = await bastRepository.findByReceiptId(cleanReceiptId);
        if (existingBast && existingBast.userId === userId && existingBast.id !== input.id) {
          return {
            success: false,
            message: `Kwitansi belanja ini sudah ditautkan ke Berita Acara "${existingBast.nomorBast}". Satu realisasi RAB hanya dapat dibuatkan 1 kali Berita Acara.`,
          };
        }
      }

      // Validasi Nomor BAST agar tidak bentrok dengan dokumen BAST lain milik user ini
      const conflict = await bastRepository.findByNomorBast(input.nomorBast.trim(), userId);
      if (conflict && conflict.userId === userId && conflict.id !== input.id) {
        if (!input.id) {
          const nextGenerated = await this.generateNextNomorBast(userId, input.tanggal);
          input.nomorBast = nextGenerated.nomorBast;
        } else {
          return {
            success: false,
            message: `Nomor BAST "${input.nomorBast}" sudah digunakan oleh dokumen Berita Acara Anda yang lain. Silakan gunakan nomor urut yang berbeda.`,
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
      const errMsg = error instanceof Error ? error.message : "";
      let userFriendlyMsg = "Gagal menyimpan Berita Acara Serah Terima ke database.";
      if (errMsg.includes("Foreign key constraint")) {
        userFriendlyMsg = "Kwitansi yang dipilih tidak valid atau sudah tidak tersedia di database.";
      } else if (errMsg.includes("Unique constraint") || errMsg.includes("P2002")) {
        userFriendlyMsg = "Nomor BAST atau tautan Kwitansi sudah terdaftar pada dokumen lain.";
      }

      return {
        success: false,
        message: userFriendlyMsg,
      };
    }
  }

  /**
   * Menghasilkan nomor register BAST berikutnya yang urut, otomatis, dan anti-double.
   * Mengembalikan objek { nomorBast: string, nomorUrut: string }
   */
  async generateNextNomorBast(
    userId: string,
    targetDate?: Date | string
  ): Promise<{ nomorBast: string; nomorUrut: string }> {
    try {
      let dateObj = targetDate ? new Date(targetDate) : new Date();
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date();
      }

      // Ambil format pola lembaga dari profil akun
      let pattern = "/A/PR.FNU/";
      try {
        const profile = await institutionRepository.findByUserId(userId);
        if (profile?.formatNomorBast && profile.formatNomorBast.trim()) {
          pattern = profile.formatNomorBast.trim();
        }
      } catch (err) {
        console.warn("[BastService] Could not load institution profile for BAST pattern:", err);
      }

      // Ambil seluruh nomor BAST yang sudah pernah digunakan oleh pengguna
      const allBastNumbers = await bastRepository.getAllNomorBast(userId);
      const usedSet = new Set(allBastNumbers.map((n) => n.trim().toLowerCase()));

      // Cari nomor urut numerik tertinggi yang pernah ada
      const parsedSeqNumbers: number[] = [];
      for (const numStr of allBastNumbers) {
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
      let nextSeq = Math.max(maxSeq, allBastNumbers.length) + 1;
      if (nextSeq < 1) nextSeq = 1;

      let paddedUrut = String(nextSeq).padStart(nextSeq >= 100 ? 3 : 2, "0");
      let candidate = buildFormattedDocumentNumber(paddedUrut, pattern, dateObj);

      while (usedSet.has(candidate.toLowerCase())) {
        nextSeq++;
        paddedUrut = String(nextSeq).padStart(nextSeq >= 100 ? 3 : 2, "0");
        candidate = buildFormattedDocumentNumber(paddedUrut, pattern, dateObj);
      }

      return {
        nomorBast: candidate,
        nomorUrut: paddedUrut,
      };
    } catch (error) {
      console.error("[BastService] Error generating next nomor BAST:", error);
      const now = new Date();
      const defaultUrut = "01";
      const candidate = buildFormattedDocumentNumber(defaultUrut, "/A/PR.FNU/", now);
      return {
        nomorBast: candidate,
        nomorUrut: defaultUrut,
      };
    }
  }
}

export const bastService = new BastService();
