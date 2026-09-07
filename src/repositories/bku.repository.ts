import { prisma } from "@/lib/prisma";
import type { BkuTransaction, BkuType } from "@/types";

export interface CreateBkuRepoData {
  nomorBukti: string;
  tanggal: Date;
  uraian: string;
  jenis: BkuType;
  kategoriRab?: string | null;
  nominal: number;
  receiptId?: string | null;
  userId: string;
}

export type BkuTransactionWithReceipt = BkuTransaction & {
  receipt?: {
    ketua: string;
    bendahara: string;
    penerima: string;
    totalPajak: number;
    ppnNominal: number;
    pph21Nominal: number;
    pph22Nominal: number;
    pph23Nominal: number;
    nominalBersih: number;
    keteranganPajak: string | null;
  } | null;
};

export class BkuRepository {
  /**
   * Create a raw BKU transaction.
   */
  async create(data: CreateBkuRepoData): Promise<BkuTransaction> {
    try {
      return (await prisma.bkuTransaction.create({
        data: {
          nomorBukti: data.nomorBukti,
          tanggal: data.tanggal,
          uraian: data.uraian,
          jenis: data.jenis,
          kategoriRab: data.kategoriRab ?? null,
          nominal: data.nominal,
          receiptId: data.receiptId ?? null,
          userId: data.userId,
        },
      })) as BkuTransaction;
    } catch (error) {
      console.error("[BkuRepository] Error in create:", error);
      throw error;
    }
  }

  /**
   * Automatically upsert a BKU entry linked to a Receipt.
   * Ensures that updating a Kwitansi updates the corresponding BKU entry.
   */
  async upsertFromReceipt(data: CreateBkuRepoData, receiptId: string): Promise<BkuTransaction> {
    try {
      return (await prisma.bkuTransaction.upsert({
        where: { receiptId },
        update: {
          nomorBukti: data.nomorBukti,
          tanggal: data.tanggal,
          uraian: data.uraian,
          jenis: "PENGELUARAN",
          kategoriRab: data.kategoriRab ?? null,
          nominal: data.nominal,
          userId: data.userId,
        },
        create: {
          nomorBukti: data.nomorBukti,
          tanggal: data.tanggal,
          uraian: data.uraian,
          jenis: "PENGELUARAN",
          kategoriRab: data.kategoriRab ?? null,
          nominal: data.nominal,
          receiptId,
          userId: data.userId,
        },
      })) as BkuTransaction;
    } catch (error) {
      console.error("[BkuRepository] Error in upsertFromReceipt:", error);
      throw error;
    }
  }

  /**
   * Get all transactions for a user, sorted chronologically for accurate running balance.
   * Includes receipt data (ketua, bendahara, penerima, dan rincian pajak).
   */
  async findByUserId(userId: string): Promise<BkuTransactionWithReceipt[]> {
    try {
      return (await prisma.bkuTransaction.findMany({
        where: { userId },
        include: {
          receipt: {
            select: {
              ketua: true,
              bendahara: true,
              penerima: true,
              totalPajak: true,
              ppnNominal: true,
              pph21Nominal: true,
              pph22Nominal: true,
              pph23Nominal: true,
              nominalBersih: true,
              keteranganPajak: true,
            },
          },
        },
        orderBy: [
          { tanggal: "asc" },
          { createdAt: "asc" },
        ],
      })) as BkuTransactionWithReceipt[];
    } catch (error) {
      console.error("[BkuRepository] Error in findByUserId:", error);
      throw error;
    }
  }

  /**
   * Find single transaction by ID.
   */
  async findById(id: string): Promise<BkuTransaction | null> {
    try {
      return (await prisma.bkuTransaction.findUnique({
        where: { id },
      })) as BkuTransaction | null;
    } catch (error) {
      console.error("[BkuRepository] Error in findById:", error);
      throw error;
    }
  }

  /**
   * Delete a manual transaction (cannot delete directly if linked to a receipt).
   */
  async delete(id: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.bkuTransaction.deleteMany({
        where: { id, userId, receiptId: null },
      });
      return result.count > 0;
    } catch (error) {
      console.error("[BkuRepository] Error in delete:", error);
      throw error;
    }
  }

  /**
   * Delete a BKU transaction when a receipt is deleted.
   */
  async deleteByReceiptId(receiptId: string): Promise<boolean> {
    try {
      const result = await prisma.bkuTransaction.deleteMany({
        where: { receiptId },
      });
      return result.count > 0;
    } catch (error) {
      console.error("[BkuRepository] Error in deleteByReceiptId:", error);
      throw error;
    }
  }

  /**
   * Find all receipts that don't have a linked BKU transaction yet.
   */
  async findUnsyncedReceipts(userId: string) {
    try {
      return await prisma.receipt.findMany({
        where: {
          userId,
          bkuTransaction: null,
        },
      });
    } catch (error) {
      console.error("[BkuRepository] Error in findUnsyncedReceipts:", error);
      throw error;
    }
  }

  /**
   * Get all nomorBukti recorded in BKU transactions for a user.
   */
  async getAllNomorBukti(userId: string): Promise<string[]> {
    try {
      const items = await prisma.bkuTransaction.findMany({
        where: { userId },
        select: { nomorBukti: true },
      });
      return items.map((i) => i.nomorBukti);
    } catch (error) {
      console.error("[BkuRepository] Error in getAllNomorBukti:", error);
      return [];
    }
  }
}

export const bkuRepository = new BkuRepository();
