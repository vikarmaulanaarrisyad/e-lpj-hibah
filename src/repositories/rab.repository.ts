import { prisma } from "@/lib/prisma";
import type { RabItem, UpdateRabItemInput } from "@/types";

export const DEFAULT_RAB_CATEGORIES = [
  {
    kode: "5.2.1",
    nama: "Belanja Peralatan & Perlengkapan",
    anggaran: 10000000,
    keterangan: "Pengadaan alat kantor, sound system portable, dan inventaris kegiatan",
  },
  {
    kode: "5.2.2",
    nama: "Belanja Makanan & Minuman / Konsumsi",
    anggaran: 5000000,
    keterangan: "Snack box, konsumsi rapat panitia, dan jamuan peserta pengajian/kegiatan",
  },
  {
    kode: "5.2.3",
    nama: "Belanja Sewa Sarana & Prasarana",
    anggaran: 7000000,
    keterangan: "Sewa panggung, tenda, sound system, kursi, dan sarana acara akbar",
  },
  {
    kode: "5.2.4",
    nama: "Belanja Transportasi & Seragam",
    anggaran: 3000000,
    keterangan: "Transport narasumber, biaya perjalanan dinas, dan seragam kader",
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
}

export const rabRepository = new RabRepository();
