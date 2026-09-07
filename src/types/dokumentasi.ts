export type DokumentasiLayout = "2-per-page" | "4-per-page" | "1-per-page";

export interface DokumentasiPhoto {
  id: string;
  url: string;
  publicId?: string;
  caption: string;
  tanggal?: string;
  lokasi?: string;
}

export interface DokumentasiFormData {
  id?: string;
  judulDokumentasi: string;
  subJudul: string;
  namaKegiatan: string;
  nomorReferensi?: string;
  tanggalKegiatan: string;
  lokasiKegiatan: string;
  layout: DokumentasiLayout;
  keteranganUmum?: string;
  photos: DokumentasiPhoto[];
  sertakanTandaTangan: boolean;
  penandatangan1Jabatan: string; // Pihak Penyerah / Toko
  penandatangan1Nama: string;
  penandatangan2Jabatan: string; // Pihak Penerima / Ketua Ranting
  penandatangan2Nama: string;
}

export interface ActivityDocumentationRecord {
  id: string;
  judulDokumentasi: string;
  subJudul: string;
  namaKegiatan: string;
  nomorReferensi?: string | null;
  tanggalKegiatan: Date | string;
  lokasiKegiatan: string;
  layout: string;
  photosJson: string;
  sertakanTandaTangan: boolean;
  penandatangan1Jabatan?: string | null;
  penandatangan1Nama?: string | null;
  penandatangan2Jabatan?: string | null;
  penandatangan2Nama?: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
