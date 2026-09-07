export interface InstitutionProfile {
  id: string;
  userId: string;
  namaLembaga: string;
  subNama: string;
  instansiInduk: string;
  alamat: string;
  email: string;
  noHp: string;
  noRegistrasi: string;
  logoUrl: string | null;
  logoPublicId: string | null;
  namaKetua: string | null;
  jabatanKetua: string | null;
  namaBendahara: string | null;
  formatNomorSp?: string | null;
  formatNomorBast?: string | null;
  formatNomorKwitansi?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateInstitutionProfileInput {
  namaLembaga: string;
  subNama: string;
  instansiInduk: string;
  alamat: string;
  email: string;
  noHp: string;
  noRegistrasi: string;
  logoBase64OrUrl?: string;
  namaKetua?: string | null;
  jabatanKetua?: string | null;
  namaBendahara?: string | null;
  formatNomorSp?: string | null;
  formatNomorBast?: string | null;
  formatNomorKwitansi?: string | null;
}

export interface KopSuratData {
  namaLembaga: string;
  subNama: string;
  instansiInduk: string;
  alamat: string;
  email: string;
  noHp: string;
  noRegistrasi: string;
  logoUrl?: string | null;
  namaKetua?: string | null;
  jabatanKetua?: string | null;
  namaBendahara?: string | null;
  formatNomorSp?: string | null;
  formatNomorBast?: string | null;
  formatNomorKwitansi?: string | null;
}
