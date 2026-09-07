import { institutionRepository } from "@/repositories/institution.repository";
import { userRepository } from "@/repositories/user.repository";
import { uploadImageToCloudinary, deleteImageFromCloudinary } from "@/lib/cloudinary";
import type {
  InstitutionProfile,
  UpdateInstitutionProfileInput,
  ServiceResponse,
} from "@/types";

export class InstitutionService {
  /**
   * Mengambil profil lembaga & kop surat.
   * Jika belum ada di database, otomatis membuat profil default otentik Fatayat NU Dawuhan Selatan.
   */
  async getProfile(userId: string): Promise<ServiceResponse<InstitutionProfile>> {
    try {
      let profile = await institutionRepository.findByUserId(userId);

      if (!profile) {
        // Ambil data user jika ada
        const user = await userRepository.findById(userId);

        profile = await institutionRepository.upsertProfile(userId, {
          namaLembaga: "PIMPINAN RANTING FATAYAT NU",
          subNama: "DAWUHAN SELATAN",
          instansiInduk: "KECAMATAN TALANG KABUPATEN TEGAL",
          alamat: "Jl. Kemuning 2016 Desa Dawuhan RT.23 RW.06 Talang – Tegal 52193",
          email: "prfnudawuhanselatan@gmail.com",
          noHp: "085642719869",
          noRegistrasi: "HBH-2026-NU-0428",
          logoUrl: null,
          logoPublicId: null,
          namaKetua: user?.leaderName || "HENI FUJIATI",
          jabatanKetua: "Ketua Pimpinan Ranting Fatayat NU Dawuhan Selatan",
          namaBendahara: user?.name || "NUR ALIMAH",
          formatNomorSp: "/A/PR.FNU/",
          formatNomorBast: "/A/PR.FNU/",
          formatNomorKwitansi: "BKU-HB",
        });
      }

      return {
        success: true,
        message: "Profil lembaga dan kop surat berhasil dimuat.",
        data: profile,
      };
    } catch (error) {
      console.error("[InstitutionService] Failed to get profile:", error);
      return {
        success: false,
        message: "Gagal memuat profil lembaga.",
      };
    }
  }

  /**
   * Menyimpan / memperbarui profil kop surat dan mengunggah logo ke Cloudinary
   */
  async updateProfile(
    userId: string,
    input: UpdateInstitutionProfileInput
  ): Promise<ServiceResponse<InstitutionProfile>> {
    try {
      let finalLogoUrl: string | undefined = undefined;
      let finalLogoPublicId: string | undefined = undefined;

      // 1. Cek apakah ada logo baru dalam format base64
      if (input.logoBase64OrUrl && input.logoBase64OrUrl.startsWith("data:image")) {
        const currentProfile = await institutionRepository.findByUserId(userId);
        // Hapus logo lama dari Cloudinary jika ada publicId
        if (currentProfile?.logoPublicId) {
          await deleteImageFromCloudinary(currentProfile.logoPublicId);
        }

        const uploadResult = await uploadImageToCloudinary(input.logoBase64OrUrl);
        if (uploadResult.success) {
          finalLogoUrl = uploadResult.url;
          finalLogoPublicId = uploadResult.publicId;
        }
      } else if (input.logoBase64OrUrl && input.logoBase64OrUrl.startsWith("http")) {
        finalLogoUrl = input.logoBase64OrUrl;
      } else if (input.logoBase64OrUrl === "") {
        // Hapus logo
        const currentProfile = await institutionRepository.findByUserId(userId);
        if (currentProfile?.logoPublicId) {
          await deleteImageFromCloudinary(currentProfile.logoPublicId);
        }
        finalLogoUrl = null as any;
        finalLogoPublicId = null as any;
      }

      // 2. Simpan ke database PostgreSQL
      const updated = await institutionRepository.upsertProfile(userId, {
        namaLembaga: input.namaLembaga.trim(),
        subNama: input.subNama.trim(),
        instansiInduk: input.instansiInduk.trim(),
        alamat: input.alamat.trim(),
        email: input.email.trim(),
        noHp: input.noHp.trim(),
        noRegistrasi: input.noRegistrasi.trim(),
        ...(finalLogoUrl !== undefined && { logoUrl: finalLogoUrl }),
        ...(finalLogoPublicId !== undefined && { logoPublicId: finalLogoPublicId }),
        namaKetua: input.namaKetua?.trim(),
        jabatanKetua: input.jabatanKetua?.trim(),
        namaBendahara: input.namaBendahara?.trim(),
        formatNomorSp: input.formatNomorSp !== undefined ? input.formatNomorSp?.trim() : undefined,
        formatNomorBast: input.formatNomorBast !== undefined ? input.formatNomorBast?.trim() : undefined,
        formatNomorKwitansi: input.formatNomorKwitansi !== undefined ? input.formatNomorKwitansi?.trim() : undefined,
      });

      // 3. Sinkronkan nama lembaga dan ketua ke user
      const fullInstitutionName = `${input.namaLembaga} ${input.subNama}`.trim();
      await userRepository.updateInstitutionAndLeader(userId, {
        institution: fullInstitutionName,
        leaderName: input.namaKetua?.trim() || undefined,
      });

      return {
        success: true,
        message: "Kop Surat, Logo, dan Nomor berhasil diperbarui di database!",
        data: updated,
      };
    } catch (error) {
      console.error("[InstitutionService] Failed to update profile:", error);
      return {
        success: false,
        message: "Gagal menyimpan pengaturan Kop Surat ke database.",
      };
    }
  }
}

export const institutionService = new InstitutionService();
