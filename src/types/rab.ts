import type { RabItem as PrismaRabItem } from "@prisma/client";

export type RabItem = PrismaRabItem;

export type RabAbsorptionStatus = "SAFE" | "WARNING" | "DEFICIT";

export interface RabStatusItem {
  id: string;
  kode: string;
  nama: string;
  anggaran: number; // Pagu NPHD
  realisasi: number; // Total belanja kwitansi tersimpan pada pos ini
  sisaPagu: number; // Anggaran - Realisasi
  persentaseSerapan: number; // (Realisasi / Anggaran) * 100
  status: RabAbsorptionStatus; // SAFE (<80%), WARNING (80-99.9%), DEFICIT (>=100%)
  keterangan?: string | null;
  jumlahTransaksi: number;
}

export interface RabSummary {
  totalAnggaran: number;
  totalRealisasi: number;
  totalSisaPagu: number;
  persentaseSerapanTotal: number;
  statusTotal: RabAbsorptionStatus;
  items: RabStatusItem[];
}

export interface UpdateRabItemInput {
  kode: string;
  nama: string;
  anggaran: number;
  keterangan?: string;
}

export interface BudgetCeilingCheckResult {
  isDeficit: boolean;
  kode: string;
  nama: string;
  anggaran: number;
  realisasiSebelum: number;
  sisaPaguSebelum: number;
  nominalBaru: number;
  proyeksiSisaPagu: number;
  proyeksiPersentase: number;
  selisihDefisit: number; // >0 if deficit
  status: RabAbsorptionStatus;
  warningMessage?: string;
}
