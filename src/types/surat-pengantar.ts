export interface SuratPengantarFormData {
  kotaTanggal: string;
  nomorSurat: string;
  lampiran: string;
  perihal: string;
  tujuanJabatan: string;
  tujuanTempat: string;
  instansiPemberi: string;
  nominal: number;
  terbilang: string;
  tahunAnggaran: string;
  namaLembagaPenerima: string;
  paragrafPenutup: string;
  penandatanganKota: string;
  penandatanganTanggal: string;
  penandatanganBulanTahun?: string;
  penandatanganJabatan: string;
  penandatanganNama: string;
  paperSize: "F4" | "A4";
  logoUrl?: string | null;
}
