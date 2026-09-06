import type { BastDocument as PrismaBastDocument } from "@prisma/client";

export type BastDocument = PrismaBastDocument;

export interface BastItem {
  id?: string;
  no: number;
  jenisBarang: string;
  spesifikasi?: string;
  pesanan: string;     // Contoh: "1 unit"
  realisasi: string;   // Contoh: "1 unit"
  kondisi: "Baik" | "Tidak Baik" | string;
}

export interface BastFormData {
  id?: string;
  nomorBast: string;
  tanggal: string;          // ISO format YYYY-MM-DD for date inputs
  hariTanggal: string;      // Contoh: "Senin, 31 Juli 2026"
  tanggalTerbilang: string; // Contoh: "Pada hari ini, Senin tanggal tiga puluh satu bulan Juli tahun Dua Ribu Dua Puluh Enam (31 - 07 - 2026)"
  nomorSpk: string;         // Rujukan Surat Pesanan / SPK
  tanggalSpk: string;       // Tanggal Surat Pesanan (YYYY-MM-DD or formatted)
  namaKegiatan: string;     // Program / Rincian Kegiatan Anggaran
  pihak1Nama: string;       // Nama Ketua Organisasi (Penerima)
  pihak1Jabatan: string;    // Jabatan Ketua
  pihak2Nama: string;       // Nama Pemilik / Penyedia
  pihak2Toko: string;       // Nama Toko / Badan Usaha Rekanan
  items: BastItem[];
  catatanUji?: string;       // Catatan pemeriksaan uji coba fungsi
  statusUji?: string;        // "Lulus Uji Coba" | "Perlu Perbaikan"
  fotoFisikNama?: string;
  geoTag?: string;
  receiptId?: string | null;
  linkedReceiptNominal?: number;
  linkedReceiptNomor?: string;
}

export interface CreateBastInput {
  nomorBast: string;
  tanggal: string | Date;
  hariTanggal: string;
  tanggalTerbilang: string;
  nomorSpk: string;
  tanggalSpk: string;
  namaKegiatan: string;
  pihak1Nama: string;
  pihak1Jabatan: string;
  pihak2Nama: string;
  pihak2Toko: string;
  items: BastItem[];
  catatanUji?: string;
  statusUji?: string;
  fotoFisikNama?: string;
  receiptId?: string | null;
}
