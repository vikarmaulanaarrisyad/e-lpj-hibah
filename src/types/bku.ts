export type BkuType = "PENERIMAAN" | "PENGELUARAN";

export interface BkuTransaction {
  id: string;
  nomorBukti: string;
  tanggal: Date;
  uraian: string;
  jenis: BkuType;
  kategoriRab?: string | null;
  nominal: number;
  receiptId?: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Representasi baris formal Buku Kas Umum (BKU) dengan saldo berjalan dan rincian pajak
 */
export interface BkuLedgerEntry {
  id: string;
  nomorUrut: number;
  tanggal: Date;
  nomorBukti: string;
  kategoriRab?: string | null;
  uraian: string;
  jenis: BkuType;
  debet: number;         // Kas Masuk / Penerimaan (0 jika pengeluaran)
  kredit: number;        // Kas Keluar / Pengeluaran (0 jika penerimaan)
  saldoBerjalan: number; // Akumulasi saldo berjalan kronologis
  receiptId?: string | null;
  penerima?: string | null; // Penerima Uang / Toko Rekanan (dari Kwitansi)
  ketua?: string | null;    // Nama Ketua yang menyetujui

  // Rincian Pajak untuk Buku Pembantu Pajak
  totalPajak?: number;
  ppnNominal?: number;
  pph21Nominal?: number;
  pph22Nominal?: number;
  pph23Nominal?: number;
  nominalBersih?: number;
  keteranganPajak?: string | null;
}

/**
 * Ringkasan Keuangan Buku Kas Umum dan Rekapitulasi Pajak
 */
export interface BkuSummary {
  totalPenerimaan: number;   // Total Debet (Dana Hibah Masuk)
  totalPengeluaran: number;  // Total Kredit (Belanja / Kwitansi)
  saldoAkhir: number;        // Total Penerimaan - Total Pengeluaran
  persentaseRealisasi: number; // (Total Pengeluaran / Total Penerimaan) * 100
  totalTransaksi: number;
  jumlahKwitansi: number;

  // Rekapitulasi Pajak Terpotong (Buku Pembantu Pajak)
  totalPpn: number;
  totalPph21: number;
  totalPph22: number;
  totalPph23: number;
  totalPajakDipungut: number;
  totalNominalBersih: number;
}

/**
 * Input untuk mencatat pencairan dana hibah / kas masuk baru
 */
export interface CreateBkuIncomeInput {
  nomorBukti: string; // misal: SP2D/01/VIII/2026 atau NPHD-CAIR-I
  tanggal: string;    // YYYY-MM-DD atau formatted date string
  uraian: string;     // misal: "Pencairan Dana Hibah APBD Tahap 1 sesuai NPHD..."
  nominal: number;    // Nominal uang masuk
  kategoriRab?: string; // misal: "Penerimaan Hibah"
}
