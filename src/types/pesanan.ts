export interface PurchaseOrder {
  id: string;
  nomorSp: string;
  tanggal: Date;
  namaPaket: string;

  // Pihak Kesatu (Pemesan)
  pihak1Nama: string;
  pihak1Jabatan: string;
  pihak1Alamat?: string | null;

  // Pihak Kedua (Penyedia)
  pihak2Toko: string;
  pihak2Nama: string;
  pihak2Jabatan?: string | null;
  pihak2Alamat?: string | null;

  // Rincian Barang (JSON string)
  itemsJson: string;

  // Keuangan
  subtotal: number;
  pajak: number;
  pajakKeterangan?: string | null;
  totalHarga: number;
  terbilang: string;

  // Ketentuan & Klausul Tambahan
  batasWaktu?: string | null;
  waktuPenyelesaian?: string | null;
  alamatPengiriman?: string | null;
  alamatPemeriksaan?: string | null;
  dendaKeterlambatan?: string | null;

  // Relasi & Metadata
  receiptId?: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;

  receipt?: {
    id: string;
    nomorBukti: string;
    nominal: number;
    tanggal: Date;
    uraian: string;
    penerima: string;
  } | null;
}

export interface PesananItem {
  id?: string;
  no: number;
  jenisBarang: string;
  spesifikasi?: string;
  jumlah: number;
  satuan: string;       // Contoh: "unit", "buah", "set", "paket"
  hargaSatuan: number;
  totalHarga: number;
}

export interface PesananFormData {
  id?: string;
  nomorSp: string;
  tanggal: string;          // ISO format YYYY-MM-DD for date inputs
  namaPaket: string;        // Paket Pengadaan / Rincian Pekerjaan
  
  // Pihak Kesatu (Pemesan)
  pihak1Nama: string;
  pihak1Jabatan: string;
  pihak1Alamat?: string;

  // Pihak Kedua (Penyedia)
  pihak2Toko: string;
  pihak2Nama: string;
  pihak2Jabatan?: string;
  pihak2Alamat?: string;

  // Items & Keuangan
  items: PesananItem[];
  subtotal: number;
  pajak: number;
  pajakKeterangan?: string;
  totalHarga: number;
  terbilang: string;

  // Klausul Kontrak
  batasWaktu: string;       // YYYY-MM-DD
  waktuPenyelesaian: string; // Contoh: "1 (satu) hari kalender"
  alamatPengiriman: string;
  alamatPemeriksaan: string;
  dendaKeterlambatan: string;

  receiptId?: string | null;
}

export interface CreatePesananInput {
  id?: string;
  nomorSp: string;
  tanggal: string | Date;
  namaPaket: string;
  pihak1Nama: string;
  pihak1Jabatan: string;
  pihak1Alamat?: string;
  pihak2Toko: string;
  pihak2Nama: string;
  pihak2Jabatan?: string;
  pihak2Alamat?: string;
  items: PesananItem[];
  subtotal: number;
  pajak: number;
  pajakKeterangan?: string;
  totalHarga: number;
  terbilang: string;
  batasWaktu?: string;
  waktuPenyelesaian?: string;
  alamatPengiriman?: string;
  alamatPemeriksaan?: string;
  dendaKeterlambatan?: string;
  receiptId?: string | null;
}
