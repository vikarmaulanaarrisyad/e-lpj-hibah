export type CoverBorderStyle = "ornament-classic" | "formal-double" | "minimalist";

export interface CoverFormData {
  judulLaporan: string;
  subJudul: string;
  namaPemerintah: string;
  tahunAnggaran: string;
  kataPengantar: string;
  namaLembaga: string;
  subNama: string;
  alamat: string;
  borderStyle: CoverBorderStyle;
  logoUrl?: string | null;
}
