import { prisma } from "@/lib/prisma";
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

      const dataFields = {
        nomorBast: input.nomorBast,
        tanggal: parsedDate,
        hariTanggal: input.hariTanggal,
        tanggalTerbilang: input.tanggalTerbilang,
        nomorSpk: input.nomorSpk,
        tanggalSpk: input.tanggalSpk,
        namaKegiatan: input.namaKegiatan,
        pihak1Nama: input.pihak1Nama,
        pihak1Jabatan: input.pihak1Jabatan,
        pihak2Nama: input.pihak2Nama,
        pihak2Toko: input.pihak2Toko,
        itemsJson: itemsJsonString,
        catatanUji: input.catatanUji ?? null,
        statusUji: input.statusUji ?? "Lulus Uji Coba",
        fotoFisikNama: input.fotoFisikNama ?? null,
        receiptId: input.receiptId ?? null,
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

      // 2. If receiptId provided and an existing BAST is already linked, update it
      if (input.receiptId) {
        const existingByReceipt = await prisma.bastDocument.findUnique({
          where: { receiptId: input.receiptId },
        });
        if (existingByReceipt && existingByReceipt.userId === userId) {
          return await prisma.bastDocument.update({
            where: { id: existingByReceipt.id },
            data: dataFields,
          });
        }
      }

      // 3. Fallback to upsert by nomorBast
      return await prisma.bastDocument.upsert({
        where: { nomorBast: input.nomorBast },
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
   * Mengambil semua dokumen BAST milik user
   */
  async findManyByUserId(userId: string): Promise<BastWithReceipt[]> {
    try {
      return (await prisma.bastDocument.findMany({
        where: { userId },
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
  async findByNomorBast(nomorBast: string): Promise<BastWithReceipt | null> {
    try {
      return (await prisma.bastDocument.findUnique({
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
   * Menghitung total dokumen BAST user
   */
  async countByUserId(userId: string): Promise<number> {
    try {
      return await prisma.bastDocument.count({
        where: { userId },
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
}

export const bastRepository = new BastRepository();
