import { prisma } from "@/lib/prisma";
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

      const dataFields = {
        nomorSp: input.nomorSp,
        tanggal: parsedDate,
        namaPaket: input.namaPaket,
        pihak1Nama: input.pihak1Nama,
        pihak1Jabatan: input.pihak1Jabatan,
        pihak1Alamat: input.pihak1Alamat ?? null,
        pihak2Toko: input.pihak2Toko,
        pihak2Nama: input.pihak2Nama,
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
        receiptId: input.receiptId ?? null,
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

      // 2. If receiptId provided and an existing PO is already linked, update it
      if (input.receiptId) {
        const existingByReceipt = await prisma.purchaseOrder.findUnique({
          where: { receiptId: input.receiptId },
        });
        if (existingByReceipt && existingByReceipt.userId === userId) {
          return await prisma.purchaseOrder.update({
            where: { id: existingByReceipt.id },
            data: dataFields,
          });
        }
      }

      // 3. Fallback to upsert by nomorSp
      return await prisma.purchaseOrder.upsert({
        where: { nomorSp: input.nomorSp },
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
   * Mengambil semua daftar Surat Pesanan milik pengguna
   */
  async findManyByUserId(userId: string): Promise<PurchaseOrder[]> {
    try {
      return await prisma.purchaseOrder.findMany({
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
   * Menghitung total dokumen Surat Pesanan milik pengguna
   */
  async countByUserId(userId: string): Promise<number> {
    try {
      return await prisma.purchaseOrder.count({
        where: { userId },
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
}

export const pesananRepository = new PesananRepository();
