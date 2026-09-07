import { prisma } from "@/lib/prisma";
import type { RabItem, UpdateRabItemInput } from "@/types";

export const DEFAULT_RAB_CATEGORIES = [
  {
    kode: "V",
    nama: "PELATIHAN PEMULASARAAN JENAZAH",
    anggaran: 21560000,
    keterangan: JSON.stringify([
      { id: "v-1", no: 1, uraian: "Honor Narasumber", koefisien1Vol: 3, koefisien1Satuan: "Kegiatan", koefisien2Vol: 2, koefisien2Satuan: "Orang", hargaSatuan: 300000, total: 1800000 },
      { id: "v-2", no: 2, uraian: "Penggandaan Modul", koefisien1Vol: 100, koefisien1Satuan: "Paket", koefisien2Vol: null, koefisien2Satuan: null, hargaSatuan: 15000, total: 1500000 },
      { id: "v-3", no: 3, uraian: "Banner", koefisien1Vol: 1, koefisien1Satuan: "Buah", koefisien2Vol: null, koefisien2Satuan: null, hargaSatuan: 50000, total: 50000 },
      { id: "v-4", no: 4, uraian: "Boneka Alat Peraga", koefisien1Vol: 1, koefisien1Satuan: "Paket", koefisien2Vol: null, koefisien2Satuan: null, hargaSatuan: 1000000, total: 1000000 },
      { id: "v-5", no: 5, uraian: "Kain Kafan", koefisien1Vol: 1, koefisien1Satuan: "Paket", koefisien2Vol: null, koefisien2Satuan: null, hargaSatuan: 240000, total: 240000 },
      { id: "v-6", no: 6, uraian: "Konsumsi", koefisien1Vol: 3, koefisien1Satuan: "Kegiatan", koefisien2Vol: 120, koefisien2Satuan: "box", hargaSatuan: 17000, total: 6120000 },
      { id: "v-7", no: 7, uraian: "Sewa Gedung", koefisien1Vol: 1, koefisien1Satuan: "Paket", koefisien2Vol: null, koefisien2Satuan: null, hargaSatuan: 650000, total: 650000 },
      { id: "v-8", no: 8, uraian: "Transport Peserta dan Panitia", koefisien1Vol: 3, koefisien1Satuan: "Kegiatan", koefisien2Vol: 120, koefisien2Satuan: "Orang", hargaSatuan: 25000, total: 9000000 },
      { id: "v-9", no: 9, uraian: "Kebersihan", koefisien1Vol: 3, koefisien1Satuan: "Kegiatan", koefisien2Vol: 2, koefisien2Satuan: "Orang", hargaSatuan: 100000, total: 600000 },
      { id: "v-10", no: 10, uraian: "Keamanan", koefisien1Vol: 3, koefisien1Satuan: "Kegiatan", koefisien2Vol: 2, koefisien2Satuan: "Orang", hargaSatuan: 100000, total: 600000 },
    ]),
  },
  {
    kode: "VI",
    nama: "PELATIHAN MARS",
    anggaran: 22900000,
    keterangan: JSON.stringify([
      { id: "vi-1", no: 1, uraian: "Honor Pelatih", koefisien1Vol: 3, koefisien1Satuan: "Kegiatan", koefisien2Vol: 2, koefisien2Satuan: "Orang", hargaSatuan: 500000, total: 3000000 },
      { id: "vi-2", no: 2, uraian: "Konsumsi", koefisien1Vol: 3, koefisien1Satuan: "Kegiatan", koefisien2Vol: 110, koefisien2Satuan: "Orang", hargaSatuan: 20000, total: 6600000 },
      { id: "vi-3", no: 3, uraian: "ATK", koefisien1Vol: 100, koefisien1Satuan: "Paket", koefisien2Vol: null, koefisien2Satuan: null, hargaSatuan: 10000, total: 1000000 },
      { id: "vi-4", no: 4, uraian: "Banner", koefisien1Vol: 1, koefisien1Satuan: "Buah", koefisien2Vol: null, koefisien2Satuan: null, hargaSatuan: 50000, total: 50000 },
      { id: "vi-5", no: 5, uraian: "Sewa LCD dan Sound", koefisien1Vol: 1, koefisien1Satuan: "Paket", koefisien2Vol: null, koefisien2Satuan: null, hargaSatuan: 600000, total: 600000 },
      { id: "vi-6", no: 6, uraian: "Penggandaan Modul", koefisien1Vol: 100, koefisien1Satuan: "Paket", koefisien2Vol: null, koefisien2Satuan: null, hargaSatuan: 15000, total: 1500000 },
      { id: "vi-7", no: 7, uraian: "Transport Peserta dan Panitia", koefisien1Vol: 3, koefisien1Satuan: "Kegiatan", koefisien2Vol: 110, koefisien2Satuan: "Orang", hargaSatuan: 25000, total: 8250000 },
      { id: "vi-8", no: 8, uraian: "Sewa Gedung", koefisien1Vol: 1, koefisien1Satuan: "Paket", koefisien2Vol: null, koefisien2Satuan: null, hargaSatuan: 700000, total: 700000 },
      { id: "vi-9", no: 9, uraian: "Keamanan", koefisien1Vol: 3, koefisien1Satuan: "Kegiatan", koefisien2Vol: 2, koefisien2Satuan: "Orang", hargaSatuan: 100000, total: 600000 },
      { id: "vi-10", no: 10, uraian: "Kebersihan", koefisien1Vol: 3, koefisien1Satuan: "Kegiatan", koefisien2Vol: 2, koefisien2Satuan: "Orang", hargaSatuan: 100000, total: 600000 },
    ]),
  },
  {
    kode: "VII",
    nama: "PELATIHAN KADER DASAR",
    anggaran: 23450000,
    keterangan: JSON.stringify([
      { id: "vii-1", no: 1, uraian: "Honor Narasumber", koefisien1Vol: 3, koefisien1Satuan: "Kegiatan", koefisien2Vol: 2, koefisien2Satuan: "Orang", hargaSatuan: 300000, total: 1800000 },
      { id: "vii-2", no: 2, uraian: "Konsumsi Peserta & Panitia", koefisien1Vol: 3, koefisien1Satuan: "Kegiatan", koefisien2Vol: 100, koefisien2Satuan: "Box", hargaSatuan: 20000, total: 6000000 },
      { id: "vii-3", no: 3, uraian: "Penggandaan Modul & Materi", koefisien1Vol: 100, koefisien1Satuan: "Paket", koefisien2Vol: null, koefisien2Satuan: null, hargaSatuan: 15000, total: 1500000 },
      { id: "vii-4", no: 4, uraian: "Banner Kegiatan", koefisien1Vol: 1, koefisien1Satuan: "Buah", koefisien2Vol: null, koefisien2Satuan: null, hargaSatuan: 50000, total: 50000 },
      { id: "vii-5", no: 5, uraian: "Sewa Tempat & Sound System", koefisien1Vol: 1, koefisien1Satuan: "Paket", koefisien2Vol: null, koefisien2Satuan: null, hargaSatuan: 800000, total: 800000 },
      { id: "vii-6", no: 6, uraian: "Transport Peserta dan Panitia", koefisien1Vol: 3, koefisien1Satuan: "Kegiatan", koefisien2Vol: 100, koefisien2Satuan: "Orang", hargaSatuan: 25000, total: 7500000 },
      { id: "vii-7", no: 7, uraian: "Sewa Gedung", koefisien1Vol: 1, koefisien1Satuan: "Paket", koefisien2Vol: null, koefisien2Satuan: null, hargaSatuan: 700000, total: 700000 },
      { id: "vii-8", no: 8, uraian: "Sertifikat Peserta", koefisien1Vol: 100, koefisien1Satuan: "Lembar", koefisien2Vol: null, koefisien2Satuan: null, hargaSatuan: 10000, total: 1000000 },
      { id: "vii-9", no: 9, uraian: "ATK & Buku Catatan", koefisien1Vol: 100, koefisien1Satuan: "Paket", koefisien2Vol: null, koefisien2Satuan: null, hargaSatuan: 15000, total: 1500000 },
      { id: "vii-10", no: 10, uraian: "Kebersihan & Keamanan", koefisien1Vol: 3, koefisien1Satuan: "Kegiatan", koefisien2Vol: 2, koefisien2Satuan: "Orang", hargaSatuan: 100000, total: 600000 },
    ]),
  },
  {
    kode: "VIII",
    nama: "PENGADAAN PERALATAN KESENIAN (REBANA)",
    anggaran: 5800000,
    keterangan: JSON.stringify([
      { id: "viii-1", no: 1, uraian: "Alat Rebana / Hadroh Komplit", koefisien1Vol: 1, koefisien1Satuan: "Paket", koefisien2Vol: null, koefisien2Satuan: null, hargaSatuan: 5800000, total: 5800000 },
    ]),
  },
];

export class RabRepository {
  /**
   * Mengambil semua pos RAB milik user, diurutkan berdasarkan kode rekening
   */
  async findByUserId(userId: string): Promise<RabItem[]> {
    try {
      return await prisma.rabItem.findMany({
        where: { userId },
        orderBy: { kode: "asc" },
      });
    } catch (error) {
      console.error("[RabRepository] Error in findByUserId:", error);
      throw error;
    }
  }

  /**
   * Mengambil single pos RAB berdasarkan ID
   */
  async findById(id: string): Promise<RabItem | null> {
    try {
      return await prisma.rabItem.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error("[RabRepository] Error in findById:", error);
      throw error;
    }
  }

  /**
   * Mengambil single pos RAB berdasarkan kode rekening
   */
  async findByUserIdAndKode(userId: string, kode: string): Promise<RabItem | null> {
    try {
      return await prisma.rabItem.findUnique({
        where: {
          userId_kode: {
            userId,
            kode,
          },
        },
      });
    } catch (error) {
      console.error("[RabRepository] Error in findByUserIdAndKode:", error);
      throw error;
    }
  }

  /**
   * Menambahkan atau memperbarui pagu anggaran pos RAB
   */
  async upsert(userId: string, data: UpdateRabItemInput): Promise<RabItem> {
    try {
      return await prisma.rabItem.upsert({
        where: {
          userId_kode: {
            userId,
            kode: data.kode,
          },
        },
        update: {
          nama: data.nama,
          anggaran: data.anggaran,
          keterangan: data.keterangan ?? null,
        },
        create: {
          kode: data.kode,
          nama: data.nama,
          anggaran: data.anggaran,
          keterangan: data.keterangan ?? null,
          userId,
        },
      });
    } catch (error) {
      console.error("[RabRepository] Error in upsert:", error);
      throw error;
    }
  }

  /**
   * Inisialisasi pos RAB bawaan jika user belum memiliki data
   */
  async seedDefaultCategoriesIfEmpty(userId: string): Promise<RabItem[]> {
    try {
      const existing = await this.findByUserId(userId);
      if (existing.length > 0) {
        return existing;
      }

      await prisma.rabItem.createMany({
        data: DEFAULT_RAB_CATEGORIES.map((item) => ({
          ...item,
          userId,
        })),
        skipDuplicates: true,
      });

      return await this.findByUserId(userId);
    } catch (error) {
      console.error("[RabRepository] Error in seedDefaultCategoriesIfEmpty:", error);
      throw error;
    }
  }

  /**
   * Menghapus pos RAB
   */
  async delete(userId: string, id: string): Promise<boolean> {
    try {
      const result = await prisma.rabItem.deleteMany({
        where: { id, userId },
      });
      return result.count > 0;
    } catch (error) {
      console.error("[RabRepository] Error in delete:", error);
      throw error;
    }
  }

  /**
   * Update item RAB secara langsung berdasarkan ID
   */
  async updateItem(id: string, data: { nama?: string; anggaran?: number; keterangan?: string | null }): Promise<RabItem> {
    try {
      return await prisma.rabItem.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error("[RabRepository] Error in updateItem:", error);
      throw error;
    }
  }

  /**
   * Reset / muat ulang kelompok kegiatan RAB ke format resmi NPHD gambar referensi
   */
  async resetToNphdDefaults(userId: string): Promise<RabItem[]> {
    try {
      // Hapus data lama yang belum terkait transaksi
      await prisma.rabItem.deleteMany({
        where: { userId },
      });

      await prisma.rabItem.createMany({
        data: DEFAULT_RAB_CATEGORIES.map((item) => ({
          ...item,
          userId,
        })),
      });

      return await this.findByUserId(userId);
    } catch (error) {
      console.error("[RabRepository] Error in resetToNphdDefaults:", error);
      throw error;
    }
  }
}

export const rabRepository = new RabRepository();
