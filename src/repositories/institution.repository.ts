import { prisma } from "@/lib/prisma";
import type { InstitutionProfile } from "@/types";

export class InstitutionRepository {
  /**
   * Mengambil profil lembaga dan kop surat berdasarkan user ID
   */
  async findByUserId(userId: string): Promise<InstitutionProfile | null> {
    try {
      return await prisma.institutionProfile.findUnique({
        where: { userId },
      });
    } catch (error) {
      console.error("[InstitutionRepository] Error in findByUserId:", error);
      throw error;
    }
  }

  /**
   * Menyimpan atau memperbarui profil kop surat & lembaga
   */
  async upsertProfile(
    userId: string,
    data: {
      namaLembaga: string;
      subNama: string;
      instansiInduk: string;
      alamat: string;
      email: string;
      noHp: string;
      noRegistrasi: string;
      logoUrl?: string | null;
      logoPublicId?: string | null;
      namaKetua?: string | null;
      jabatanKetua?: string | null;
      namaBendahara?: string | null;
    }
  ): Promise<InstitutionProfile> {
    try {
      return await prisma.institutionProfile.upsert({
        where: { userId },
        update: {
          namaLembaga: data.namaLembaga,
          subNama: data.subNama,
          instansiInduk: data.instansiInduk,
          alamat: data.alamat,
          email: data.email,
          noHp: data.noHp,
          noRegistrasi: data.noRegistrasi,
          ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
          ...(data.logoPublicId !== undefined && { logoPublicId: data.logoPublicId }),
          ...(data.namaKetua !== undefined && { namaKetua: data.namaKetua }),
          ...(data.jabatanKetua !== undefined && { jabatanKetua: data.jabatanKetua }),
          ...(data.namaBendahara !== undefined && { namaBendahara: data.namaBendahara }),
        },
        create: {
          userId,
          namaLembaga: data.namaLembaga,
          subNama: data.subNama,
          instansiInduk: data.instansiInduk,
          alamat: data.alamat,
          email: data.email,
          noHp: data.noHp,
          noRegistrasi: data.noRegistrasi,
          logoUrl: data.logoUrl ?? null,
          logoPublicId: data.logoPublicId ?? null,
          namaKetua: data.namaKetua ?? "HENI FUJIATI",
          jabatanKetua: data.jabatanKetua ?? "Ketua Pimpinan Ranting Fatayat NU Dawuhan Selatan",
          namaBendahara: data.namaBendahara ?? "NUR ALIMAH",
        },
      });
    } catch (error) {
      console.error("[InstitutionRepository] Error in upsertProfile:", error);
      throw error;
    }
  }
}

export const institutionRepository = new InstitutionRepository();
