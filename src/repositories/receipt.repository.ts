import { prisma } from "@/lib/prisma";
import { getYearDateRange } from "@/lib/utils/tahun-anggaran";
import type { Receipt } from "@/types";

export interface CreateReceiptRepoData {
  id?: string;
  nomorBukti: string;
  tanggal: Date;
  pemberi: string;
  nominal: number;
  terbilang: string;
  uraian: string;
  ketua: string;
  bendahara: string;
  penerima: string;
  denganMaterai: boolean;
  template: string;
  kategoriRab?: string | null;
  userId: string;

  // Pajak Otomatis
  isPpn?: boolean;
  ppnRate?: number;
  ppnNominal?: number;
  isPph21?: boolean;
  pph21Rate?: number;
  pph21Nominal?: number;
  isPph22?: boolean;
  pph22Rate?: number;
  pph22Nominal?: number;
  isPph23?: boolean;
  pph23Rate?: number;
  pph23Nominal?: number;
  dpp?: number;
  totalPajak?: number;
  nominalBersih?: number;
  keteranganPajak?: string | null;
}

export class ReceiptRepository {
  /**
   * Save or update a receipt record into database.
   * If data.id is provided, updates that specific receipt.
   * If no id is provided, creates a new receipt record.
   */
  async create(data: CreateReceiptRepoData): Promise<Receipt> {
    try {
      if (data.id) {
        return (await prisma.receipt.update({
          where: { id: data.id },
          data: {
            nomorBukti: data.nomorBukti,
            tanggal: data.tanggal,
            pemberi: data.pemberi,
            nominal: data.nominal,
            terbilang: data.terbilang,
            uraian: data.uraian,
            ketua: data.ketua,
            bendahara: data.bendahara,
            penerima: data.penerima,
            denganMaterai: data.denganMaterai,
            template: data.template,
            kategoriRab: data.kategoriRab ?? null,
            isPpn: data.isPpn ?? false,
            ppnRate: data.ppnRate ?? 0.11,
            ppnNominal: data.ppnNominal ?? 0,
            isPph21: data.isPph21 ?? false,
            pph21Rate: data.pph21Rate ?? 0.05,
            pph21Nominal: data.pph21Nominal ?? 0,
            isPph22: data.isPph22 ?? false,
            pph22Rate: data.pph22Rate ?? 0.015,
            pph22Nominal: data.pph22Nominal ?? 0,
            isPph23: data.isPph23 ?? false,
            pph23Rate: data.pph23Rate ?? 0.02,
            pph23Nominal: data.pph23Nominal ?? 0,
            dpp: data.dpp ?? data.nominal,
            totalPajak: data.totalPajak ?? 0,
            nominalBersih: data.nominalBersih ?? data.nominal,
            keteranganPajak: data.keteranganPajak ?? null,
            userId: data.userId,
          },
        })) as Receipt;
      }

      // Check if an existing receipt exists with same nomorBukti for this user
      const existing = await prisma.receipt.findFirst({
        where: {
          nomorBukti: data.nomorBukti,
          userId: data.userId,
        },
      });

      if (existing) {
        // Update if existing matches
        return (await prisma.receipt.update({
          where: { id: existing.id },
          data: {
            tanggal: data.tanggal,
            pemberi: data.pemberi,
            nominal: data.nominal,
            terbilang: data.terbilang,
            uraian: data.uraian,
            ketua: data.ketua,
            bendahara: data.bendahara,
            penerima: data.penerima,
            denganMaterai: data.denganMaterai,
            template: data.template,
            kategoriRab: data.kategoriRab ?? null,
            isPpn: data.isPpn ?? false,
            ppnRate: data.ppnRate ?? 0.11,
            ppnNominal: data.ppnNominal ?? 0,
            isPph21: data.isPph21 ?? false,
            pph21Rate: data.pph21Rate ?? 0.05,
            pph21Nominal: data.pph21Nominal ?? 0,
            isPph22: data.isPph22 ?? false,
            pph22Rate: data.pph22Rate ?? 0.015,
            pph22Nominal: data.pph22Nominal ?? 0,
            isPph23: data.isPph23 ?? false,
            pph23Rate: data.pph23Rate ?? 0.02,
            pph23Nominal: data.pph23Nominal ?? 0,
            dpp: data.dpp ?? data.nominal,
            totalPajak: data.totalPajak ?? 0,
            nominalBersih: data.nominalBersih ?? data.nominal,
            keteranganPajak: data.keteranganPajak ?? null,
          },
        })) as Receipt;
      }

      return (await prisma.receipt.create({
        data: {
          nomorBukti: data.nomorBukti,
          tanggal: data.tanggal,
          pemberi: data.pemberi,
          nominal: data.nominal,
          terbilang: data.terbilang,
          uraian: data.uraian,
          ketua: data.ketua,
          bendahara: data.bendahara,
          penerima: data.penerima,
          denganMaterai: data.denganMaterai,
          template: data.template,
          kategoriRab: data.kategoriRab ?? null,
          isPpn: data.isPpn ?? false,
          ppnRate: data.ppnRate ?? 0.11,
          ppnNominal: data.ppnNominal ?? 0,
          isPph21: data.isPph21 ?? false,
          pph21Rate: data.pph21Rate ?? 0.05,
          pph21Nominal: data.pph21Nominal ?? 0,
          isPph22: data.isPph22 ?? false,
          pph22Rate: data.pph22Rate ?? 0.015,
          pph22Nominal: data.pph22Nominal ?? 0,
          isPph23: data.isPph23 ?? false,
          pph23Rate: data.pph23Rate ?? 0.02,
          pph23Nominal: data.pph23Nominal ?? 0,
          dpp: data.dpp ?? data.nominal,
          totalPajak: data.totalPajak ?? 0,
          nominalBersih: data.nominalBersih ?? data.nominal,
          keteranganPajak: data.keteranganPajak ?? null,
          userId: data.userId,
        },
      })) as Receipt;
    } catch (error) {
      console.error("[ReceiptRepository] Error in create:", error);
      throw error;
    }
  }

  /**
   * Find a receipt by its nomorBukti, optionally scoped to a user.
   */
  async findByNomorBukti(nomorBukti: string, userId?: string): Promise<Receipt | null> {
    try {
      return (await prisma.receipt.findFirst({
        where: {
          nomorBukti,
          ...(userId ? { userId } : {}),
        },
      })) as Receipt | null;
    } catch (error) {
      console.error("[ReceiptRepository] Error in findByNomorBukti:", error);
      throw error;
    }
  }

  /**
   * Find a receipt by its primary key ID.
   */
  async findById(id: string): Promise<Receipt | null> {
    try {
      return await prisma.receipt.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error("[ReceiptRepository] Error in findById:", error);
      throw error;
    }
  }

  /**
   * Get all receipts belonging to a user/grant recipient, optionally filtered by tahun anggaran.
   */
  async findManyByUserId(userId: string, tahun?: string | null): Promise<Receipt[]> {
    try {
      const { startDate, endDate } = getYearDateRange(tahun);
      return await prisma.receipt.findMany({
        where: {
          userId,
          ...(startDate && endDate ? { tanggal: { gte: startDate, lte: endDate } } : {}),
        },
        orderBy: { tanggal: "desc" },
      });
    } catch (error) {
      console.error("[ReceiptRepository] Error in findManyByUserId:", error);
      throw error;
    }
  }

  /**
   * Count total receipts recorded for a specific user, optionally filtered by tahun anggaran.
   */
  async countByUserId(userId: string, tahun?: string | null): Promise<number> {
    try {
      const { startDate, endDate } = getYearDateRange(tahun);
      return await prisma.receipt.count({
        where: {
          userId,
          ...(startDate && endDate ? { tanggal: { gte: startDate, lte: endDate } } : {}),
        },
      });
    } catch (error) {
      console.error("[ReceiptRepository] Error in countByUserId:", error);
      throw error;
    }
  }

  /**
   * Delete a receipt record.
   */
  async delete(id: string, userId: string): Promise<Receipt> {
    try {
      return await prisma.receipt.delete({
        where: { id, userId },
      });
    } catch (error) {
      console.error("[ReceiptRepository] Error in delete:", error);
      throw error;
    }
  }

  /**
   * Get all nomorBukti recorded in receipts for a specific user.
   */
  async getAllNomorBukti(userId: string): Promise<string[]> {
    try {
      const items = await prisma.receipt.findMany({
        where: { userId },
        select: { nomorBukti: true },
      });
      return items.map((i) => i.nomorBukti);
    } catch (error) {
      console.error("[ReceiptRepository] Error in getAllNomorBukti:", error);
      return [];
    }
  }
}

export const receiptRepository = new ReceiptRepository();
