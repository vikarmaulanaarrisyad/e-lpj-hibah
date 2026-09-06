import type { Receipt as PrismaReceipt } from "@prisma/client";

export type Receipt = PrismaReceipt;

export type ReceiptTemplateMode = "bank" | "folio" | "triple";

export interface CreateReceiptInput {
  nomorBukti: string;
  tanggal: string; // ISO date string or formatted date
  pemberi: string;
  nominal: number;
  terbilang: string;
  uraian: string;
  ketua: string;
  bendahara: string;
  penerima: string;
  denganMaterai?: boolean;
  template?: ReceiptTemplateMode;
  kategoriRab?: string;

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

export interface ReceiptFormData {
  nomorBukti: string;
  tanggal: string;
  pemberi: string;
  nominal: string; // raw formatted display like "3.000.000"
  nominalValue: number;
  terbilang: string;
  uraian: string;
  ketua: string;
  bendahara: string;
  penerima: string;
  denganMaterai: boolean;
  template: ReceiptTemplateMode;
  kategoriRab?: string;

  // Pajak Otomatis UI State
  isPpn: boolean;
  isPpnIncluded: boolean; // true = include, false = exclude
  ppnRate: number; // default 0.11
  ppnNominal: number;

  isPph21: boolean;
  pph21Rate: number; // default 0.05
  pph21Nominal: number;

  isPph22: boolean;
  pph22Rate: number; // default 0.015
  pph22Nominal: number;

  isPph23: boolean;
  pph23Rate: number; // default 0.02
  pph23Nominal: number;

  dpp: number;
  totalPajak: number;
  nominalBersih: number;
  keteranganPajak?: string;
}
