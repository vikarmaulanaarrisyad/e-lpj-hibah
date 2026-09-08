import { prisma } from "@/lib/prisma";
import { getYearDateRange } from "@/lib/utils/tahun-anggaran";
import type { PurchaseOrder, CreatePesananInput } from "@/types";

export class PesananRepository {
  /**
   * Menyimpan atau memperbarui dokumen Surat Pesanan (Purchase Order)
   */
  async createOrUpdate(userId: string, input: CreatePesananInput): Promise<PurchaseOrder> {
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

      // If cleanReceiptId is provided, unlink any other PO belonging to this user that currently holds it
      if (cleanReceiptId) {
        const existingLinkedPo = await prisma.purchaseOrder.findUnique({
          where: { receiptId: cleanReceiptId },
        });
        if (existingLinkedPo && existingLinkedPo.id !== input.id) {
          if (existingLinkedPo.userId === userId) {
            await prisma.purchaseOrder.update({
              where: { id: existingLinkedPo.id },
              data: { receiptId: null },
            });
          } else {
            cleanReceiptId = null;
          }
        }
      }

      const dataFields = {
        nomorSp: input.nomorSp,
        tanggal: parsedDate,
        namaPaket: input.namaPaket,
        pihak1Nama: input.pihak1Nama,
        pihak1Jabatan: input.pihak1Jabatan,
        pihak1Alamat: input.pihak1Alamat ?? null,
        pihak2Toko: input.pihak2Toko,
        pihak2Nama: input.pihak2Nama,
        pihak2Jabatan: input.pihak2Jabatan ?? null,
        pihak2Alamat: input.pihak2Alamat ?? null,
        itemsJson: itemsJsonString,
        subtotal: input.subtotal,
        pajak: input.pajak,
        pajakKeterangan: input.pajakKeterangan ?? null,
        totalHarga: input.totalHarga,
        terbilang: input.terbilang,
        batasWaktu: input.batasWaktu ?? null,
        waktuPenyelesaian: input.waktuPenyelesaian ?? null,
        alamatPengiriman: input.alamatPengiriman ?? null,
        alamatPemeriksaan: input.alamatPemeriksaan ?? null,
        dendaKeterlambatan: input.dendaKeterlambatan ?? null,
        receiptId: cleanReceiptId,
      };

      // 1. If explicit ID provided and exists, update that record
      if (input.id) {
        const existingById = await prisma.purchaseOrder.findUnique({
          where: { id: input.id },
        });
        if (existingById && existingById.userId === userId) {
          return await prisma.purchaseOrder.update({
            where: { id: input.id },
            data: dataFields,
          });
        }
      }

      // 2. If cleanReceiptId provided and an existing PO is already linked, update it
      if (cleanReceiptId) {
        const existingByReceipt = await prisma.purchaseOrder.findUnique({
          where: { receiptId: cleanReceiptId },
        });
        if (existingByReceipt && existingByReceipt.userId === userId) {
          return await prisma.purchaseOrder.update({
            where: { id: existingByReceipt.id },
            data: dataFields,
          });
        }
      }

      // 3. Fallback to upsert by userId and nomorSp
      return await prisma.purchaseOrder.upsert({
        where: {
          userId_nomorSp: {
            userId,
            nomorSp: input.nomorSp,
          },
        } as any,
        update: dataFields,
        create: {
          ...dataFields,
          userId,
        },
      });
    } catch (error) {
      console.error("[PesananRepository.createOrUpdate] Error:", error);
      throw new Error("Gagal menyimpan dokumen Surat Pesanan ke database.");
    }
  }

  /**
   * Mengambil semua daftar Surat Pesanan milik pengguna, opsional difilter per tahun anggaran
   */
  async findManyByUserId(userId: string, tahun?: string | null): Promise<PurchaseOrder[]> {
    try {
      const { startDate, endDate } = getYearDateRange(tahun);
      return await prisma.purchaseOrder.findMany({
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
      });
    } catch (error) {
      console.error("[PesananRepository.findManyByUserId] Error:", error);
      return [];
    }
  }

  /**
   * Mengambil satu Surat Pesanan berdasarkan ID
   */
  async findById(id: string, userId: string): Promise<PurchaseOrder | null> {
    try {
      return await prisma.purchaseOrder.findFirst({
        where: { id, userId },
        include: {
          receipt: true,
        },
      });
    } catch (error) {
      console.error("[PesananRepository.findById] Error:", error);
      return null;
    }
  }

  /**
   * Mengambil satu Surat Pesanan berdasarkan nomor SP
   */
  async findByNomorSp(nomorSp: string, userId: string): Promise<PurchaseOrder | null> {
    try {
      return await prisma.purchaseOrder.findFirst({
        where: { nomorSp, userId },
        include: {
          receipt: true,
        },
      });
    } catch (error) {
      console.error("[PesananRepository.findByNomorSp] Error:", error);
      return null;
    }
  }

  /**
   * Mengambil Surat Pesanan berdasarkan receiptId
   */
  async findByReceiptId(receiptId: string, userId: string): Promise<PurchaseOrder | null> {
    try {
      return await prisma.purchaseOrder.findFirst({
        where: { receiptId, userId },
        include: {
          receipt: true,
        },
      });
    } catch (error) {
      console.error("[PesananRepository.findByReceiptId] Error:", error);
      return null;
    }
  }

  /**
   * Menghitung total dokumen Surat Pesanan milik pengguna, opsional difilter per tahun anggaran
   */
  async countByUserId(userId: string, tahun?: string | null): Promise<number> {
    try {
      const { startDate, endDate } = getYearDateRange(tahun);
      return await prisma.purchaseOrder.count({
        where: {
          userId,
          ...(startDate && endDate ? { tanggal: { gte: startDate, lte: endDate } } : {}),
        },
      });
    } catch (error) {
      console.error("[PesananRepository.countByUserId] Error:", error);
      return 0;
    }
  }

  /**
   * Menghapus dokumen Surat Pesanan
   */
  async delete(id: string, userId: string): Promise<boolean> {
    try {
      await prisma.purchaseOrder.deleteMany({
        where: { id, userId },
      });
      return true;
    } catch (error) {
      console.error("[PesananRepository.delete] Error:", error);
      return false;
    }
  }

  /**
   * Mengambil semua nomor Surat Pesanan yang telah digunakan oleh user
   */
  async getAllNomorSp(userId: string): Promise<string[]> {
    try {
      const list = await prisma.purchaseOrder.findMany({
        where: { userId },
        select: { nomorSp: true },
      });
      return list.map((item) => item.nomorSp);
    } catch (error) {
      console.error("[PesananRepository.getAllNomorSp] Error:", error);
      return [];
    }
  }
}

export const pesananRepository = new PesananRepository();
