export interface NotaFormData {
  judul: string;
  nomorBukti?: string;
  uraian?: string;
  namaToko?: string;
  nominal?: number;
  tanggal: string;
  kota: string;
  ketuaJabatanLabel: string; // default: "Setuju dibayar"
  ketuaJabatan: string;      // default: "Ketua"
  ketuaNama: string;         // default: "HENI FUJIATI"
  bendaharaJabatanLabel: string; // default: "Dibayar oleh"
  bendaharaJabatan: string;      // default: "Bendahara"
  bendaharaNama: string;         // default: "NUR ALIMAH"
  mode: "blank" | "photo";   // 'blank' = lembar kosong untuk tempel fisik, 'photo' = tampilkan gambar nota digital
  photoUrl?: string | null;
  photoCaption?: string;
  showGuideBorder?: boolean; // garis batas putus-putus tipis panduan tempel
  showMetadataFooter?: boolean; // keterangan kecil info transaksi di sudut bawah jika diinginkan
  paperSize?: "F4" | "A4";
  signaturePosition?: "center" | "right" | "spread"; // posisi tanda tangan: tengah (default) / kanan / lebar
  showJudul?: boolean; // false = sembunyikan tulisan judul "NOTA"
}
