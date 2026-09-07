import { prisma } from "@/lib/prisma";
import { getYearDateRange } from "@/lib/utils/tahun-anggaran";
import type { BastDocument, CreateBastInput } from "@/types";

export interface BastWithReceipt extends BastDocument {
  receipt?: {
    id: string;
    nomorBukti: string;
    nominal: number;
    tanggal: Date;
    uraian: string;
    penerima: string;
  } | null;
}

export class BastRepository {
  /**
   * Menyimpan atau memperbarui dokumen Berita Acara Serah Terima (BAST)
   */
  async createOrUpdate(userId: string, input: CreateBastInput): Promise<BastDocument> {
    try {
      let parsedDate = new Date(input.tanggal);
      if (isNaN(parsedDate.getTime())) {
        parsedDate = new Date();
      }

      const itemsJsonString = JSON.stringify(input.items || []);

      // Sanitize receiptId: ensure it's a non-empty string and actually exists in receipts for this user
      let cleanReceiptId: string | null = null;
      if (input.receiptId && typeof input.receiptId === "string" && input.receiptId.trim().length > 0) {
        const validReceipt = await prisma.receipt.findFirst({
          where: { id: input.receiptId.trim(), userId },
        });
        if (validReceipt) {
          cleanReceiptId = validReceipt.id;
        }
      }

      // If cleanReceiptId is provided, unlink any other BAST belonging to this user that currently holds it
      if (cleanReceiptId) {
        const existingLinkedBast = await prisma.bastDocument.findUnique({
          where: { receiptId: cleanReceiptId },
        });
        if (existingLinkedBast && existingLinkedBast.id !== input.id) {
          if (existingLinkedBast.userId === userId) {
            await prisma.bastDocument.update({
              where: { id: existingLinkedBast.id },
              data: { receiptId: null },
            });
          } else {
            // Receipt is linked to another user's BAST, don't hijack
            cleanReceiptId = null;
          }
        }
      }

      const dataFields = {
        nomorBast: input.nomorBast?.trim() || "01/A/PR.FNU/IX/2026",
        tanggal: parsedDate,
        hariTanggal: input.hariTanggal?.trim() || "Senin, 01 September 2026",
        tanggalTerbilang: input.tanggalTerbilang?.trim() || "-",
        nomorSpk: input.nomorSpk?.trim() || "-",
        tanggalSpk: input.tanggalSpk?.trim() || parsedDate.toISOString().split("T")[0],
        namaKegiatan: input.namaKegiatan?.trim() || "-",
        pihak1Nama: input.pihak1Nama?.trim() || "Ketua",
        pihak1Jabatan: input.pihak1Jabatan?.trim() || "Ketua",
        pihak2Nama: input.pihak2Nama?.trim() || "Penyedia",
        pihak2Toko: input.pihak2Toko?.trim() || "Toko Penyedia",
        itemsJson: itemsJsonString,
        catatanUji: input.catatanUji ?? null,
        statusUji: input.statusUji ?? "Lulus Uji Coba",
        fotoFisikNama: input.fotoFisikNama ?? null,
        receiptId: cleanReceiptId,
      };

      // 1. If explicit ID provided and exists, update that record
      if (input.id) {
        const existingById = await prisma.bastDocument.findUnique({
          where: { id: input.id },
        });
        if (existingById && existingById.userId === userId) {
          return await prisma.bastDocument.update({
            where: { id: input.id },
            data: dataFields,
          });
        }
      }

      // 2. If cleanReceiptId provided and an existing BAST of this user is already linked, update it
      if (cleanReceiptId) {
        const existingByReceipt = await prisma.bastDocument.findUnique({
          where: { receiptId: cleanReceiptId },
        });
        if (existingByReceipt && existingByReceipt.userId === userId) {
          return await prisma.bastDocument.update({
            where: { id: existingByReceipt.id },
            data: dataFields,
          });
        }
      }

      // 3. Fallback to upsert by compound unique [userId, nomorBast]
      return await prisma.bastDocument.upsert({
        where: {
          userId_nomorBast: {
            userId,
            nomorBast: dataFields.nomorBast,
          },
        } as any,
        update: dataFields,
        create: {
          ...dataFields,
          userId,
        },
      });
    } catch (error) {
      console.error("[BastRepository] Error in createOrUpdate:", error);
      throw error;
    }
  }

  /**
   * Mengambil semua dokumen BAST milik user, opsional difilter per tahun anggaran
   */
  async findManyByUserId(userId: string, tahun?: string | null): Promise<BastWithReceipt[]> {
    try {
      const { startDate, endDate } = getYearDateRange(tahun);
      return (await prisma.bastDocument.findMany({
        where: {
          userId,
          ...(startDate && endDate ? { tanggal: { gte: startDate, lte: endDate } } : {}),
        },
        include: {
          receipt: {
            select: {
              id: true,
              nomorBukti: true,
              nominal: true,
              tanggal: true,
              uraian: true,
              penerima: true,
            },
          },
        },
        orderBy: { tanggal: "desc" },
      })) as BastWithReceipt[];
    } catch (error) {
      console.error("[BastRepository] Error in findManyByUserId:", error);
      throw error;
    }
  }

  /**
   * Mengambil satu dokumen BAST berdasarkan nomor register
   */
  async findByNomorBast(nomorBast: string, userId?: string): Promise<BastWithReceipt | null> {
    try {
      if (userId) {
        return (await prisma.bastDocument.findUnique({
          where: {
            userId_nomorBast: {
              userId,
              nomorBast,
            },
          } as any,
          include: {
            receipt: {
              select: {
                id: true,
                nomorBukti: true,
                nominal: true,
                tanggal: true,
                uraian: true,
                penerima: true,
              },
            },
          },
        })) as BastWithReceipt | null;
      }

      return (await prisma.bastDocument.findFirst({
        where: { nomorBast },
        include: {
          receipt: {
            select: {
              id: true,
              nomorBukti: true,
              nominal: true,
              tanggal: true,
              uraian: true,
              penerima: true,
            },
          },
        },
      })) as BastWithReceipt | null;
    } catch (error) {
      console.error("[BastRepository] Error in findByNomorBast:", error);
      throw error;
    }
  }

  /**
   * Mengambil BAST yang terhubung dengan kwitansi tertentu
   */
  async findByReceiptId(receiptId: string): Promise<BastDocument | null> {
    try {
      return await prisma.bastDocument.findUnique({
        where: { receiptId },
      });
    } catch (error) {
      console.error("[BastRepository] Error in findByReceiptId:", error);
      throw error;
    }
  }

  /**
   * Menghitung total dokumen BAST user, opsional difilter per tahun anggaran
   */
  async countByUserId(userId: string, tahun?: string | null): Promise<number> {
    try {
      const { startDate, endDate } = getYearDateRange(tahun);
      return await prisma.bastDocument.count({
        where: {
          userId,
          ...(startDate && endDate ? { tanggal: { gte: startDate, lte: endDate } } : {}),
        },
      });
    } catch (error) {
      console.error("[BastRepository] Error in countByUserId:", error);
      throw error;
    }
  }

  /**
   * Menghapus dokumen BAST
   */
  async delete(id: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.bastDocument.deleteMany({
        where: { id, userId },
      });
      return result.count > 0;
    } catch (error) {
      console.error("[BastRepository] Error in delete:", error);
      throw error;
    }
  }

  /**
   * Mengambil semua nomor register BAST milik pengguna
   */
  async getAllNomorBast(userId: string): Promise<string[]> {
    try {
      const items = await prisma.bastDocument.findMany({
        where: { userId },
        select: { nomorBast: true },
      });
      return items.map((i) => i.nomorBast);
    } catch (error) {
      console.error("[BastRepository] Error in getAllNomorBast:", error);
      return [];
    }
  }
}

export const bastRepository = new BastRepository();
