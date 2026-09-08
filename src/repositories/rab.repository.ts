import { prisma } from "@/lib/prisma";
import type { RabItem, UpdateRabItemInput } from "@/types";

export const DEFAULT_RAB_CATEGORIES: Array<{
  kode: string;
  nama: string;
  anggaran: number;
  keterangan?: string | null;
}> = [];

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
      if (existing.length > 0 || DEFAULT_RAB_CATEGORIES.length === 0) {
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
  async updateItem(id: string, data: { kode?: string; nama?: string; anggaran?: number; keterangan?: string | null }): Promise<RabItem> {
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

      if (DEFAULT_RAB_CATEGORIES.length > 0) {
        await prisma.rabItem.createMany({
          data: DEFAULT_RAB_CATEGORIES.map((item) => ({
            ...item,
            userId,
          })),
        });
      }

      return await this.findByUserId(userId);
    } catch (error) {
      console.error("[RabRepository] Error in resetToNphdDefaults:", error);
      throw error;
    }
  }
}

export const rabRepository = new RabRepository();
