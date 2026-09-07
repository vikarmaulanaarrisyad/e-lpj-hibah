import { dokumentasiRepository } from "@/repositories/dokumentasi.repository";
import { uploadDokumentasiPhotoToCloudinary, deleteImageFromCloudinary } from "@/lib/cloudinary";
import type {
  DokumentasiFormData,
  DokumentasiPhoto,
  ActivityDocumentationRecord,
  ServiceResponse,
} from "@/types";

export class DokumentasiService {
  /**
   * Menyimpan dokumen dokumentasi kegiatan ke Database dan mengunggah foto Base64 ke Cloudinary
   * dengan konfigurasi kompresi hemat kapasitas (max 1280px, auto:good quality, strip metadata).
   * Otomatis menghapus foto lama dari Cloudinary jika ada foto yang diubah atau dihapus.
   */
  async saveDokumentasi(
    userId: string,
    formData: DokumentasiFormData
  ): Promise<ServiceResponse<ActivityDocumentationRecord>> {
    try {
      if (!formData.namaKegiatan || !formData.namaKegiatan.trim()) {
        return {
          success: false,
          message: "Nama kegiatan wajib diisi.",
        };
      }

      // 1. Deteksi foto yang dihapus atau diubah dibanding arsip lama, lalu hapus dari Cloudinary
      if (formData.id) {
        const existingRecord = await dokumentasiRepository.findById(formData.id, userId);
        if (existingRecord) {
          let previousPhotos: DokumentasiPhoto[] = [];
          try {
            previousPhotos = JSON.parse(existingRecord.photosJson);
          } catch {
            previousPhotos = [];
          }

          const currentIdentifiers = new Set(
            formData.photos
              .map((p) => p.publicId || p.url)
              .filter((val): val is string => Boolean(val && (val.startsWith("http") || !val.startsWith("data:"))))
          );

          for (const oldPhoto of previousPhotos) {
            const oldIdentifier = oldPhoto.publicId || oldPhoto.url;
            if (oldIdentifier && !currentIdentifiers.has(oldIdentifier)) {
              // Foto telah dihapus atau diganti oleh user -> hapus dari Cloudinary
              await deleteImageFromCloudinary(oldIdentifier);
            }
          }
        }
      }

      // 2. Unggah foto Base64 baru ke Cloudinary secara efisien
      const processedPhotos: DokumentasiPhoto[] = [];

      for (const photo of formData.photos) {
        if (photo.url && photo.url.startsWith("data:image")) {
          const uploadRes = await uploadDokumentasiPhotoToCloudinary(photo.url);
          if (uploadRes.success && uploadRes.url) {
            processedPhotos.push({
              ...photo,
              url: uploadRes.url,
              publicId: uploadRes.publicId,
            });
          } else {
            // Jika upload gagal, tetap simpan lokal
            processedPhotos.push(photo);
          }
        } else {
          // Foto sudah berupa remote URL (Cloudinary / CDN)
          processedPhotos.push(photo);
        }
      }

      const updatedFormData: DokumentasiFormData = {
        ...formData,
        photos: processedPhotos,
      };

      // 3. Simpan ke database PostgreSQL
      const savedRecord = await dokumentasiRepository.createOrUpdate(userId, updatedFormData);

      return {
        success: true,
        message: "Dokumentasi kegiatan dan foto berhasil disimpan ke database dan Cloudinary (teroptimasi).",
        data: savedRecord,
      };
    } catch (error: any) {
      console.error("[DokumentasiService.saveDokumentasi] Error:", error);
      return {
        success: false,
        message: error?.message || "Terjadi kesalahan saat menyimpan dokumentasi ke database.",
      };
    }
  }

  /**
   * Mengambil daftar seluruh dokumen dokumentasi milik user
   */
  async getDokumentasiList(
    userId: string
  ): Promise<ServiceResponse<ActivityDocumentationRecord[]>> {
    try {
      const list = await dokumentasiRepository.findManyByUserId(userId);
      return {
        success: true,
        message: `Berhasil memuat ${list.length} arsip dokumentasi.`,
        data: list,
      };
    } catch (error: any) {
      console.error("[DokumentasiService.getDokumentasiList] Error:", error);
      return {
        success: false,
        message: "Gagal memuat daftar dokumentasi kegiatan.",
        data: [],
      };
    }
  }

  /**
   * Mengambil 1 dokumen dokumentasi berdasarkan ID
   */
  async getDokumentasiById(
    id: string,
    userId: string
  ): Promise<ServiceResponse<ActivityDocumentationRecord | null>> {
    try {
      const item = await dokumentasiRepository.findById(id, userId);
      if (!item) {
        return {
          success: false,
          message: "Dokumen dokumentasi tidak ditemukan.",
        };
      }
      return {
        success: true,
        message: "Dokumen dokumentasi berhasil dimuat.",
        data: item,
      };
    } catch (error: any) {
      console.error("[DokumentasiService.getDokumentasiById] Error:", error);
      return {
        success: false,
        message: "Gagal memuat dokumen dokumentasi.",
      };
    }
  }

  /**
   * Menghapus dokumen dokumentasi beserta seluruh foto terkait di Cloudinary
   */
  async deleteDokumentasi(
    id: string,
    userId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      // 1. Ambil dokumen untuk menghapus seluruh fotonya di Cloudinary
      const existing = await dokumentasiRepository.findById(id, userId);
      if (existing) {
        let photos: DokumentasiPhoto[] = [];
        try {
          photos = JSON.parse(existing.photosJson);
        } catch {
          photos = [];
        }

        for (const p of photos) {
          const identifier = p.publicId || p.url;
          if (identifier && (identifier.startsWith("http") || p.publicId)) {
            await deleteImageFromCloudinary(identifier);
          }
        }
      }

      // 2. Hapus dari database PostgreSQL
      const ok = await dokumentasiRepository.delete(id, userId);
      return {
        success: ok,
        message: ok
          ? "Dokumentasi kegiatan dan seluruh foto di Cloudinary berhasil dihapus."
          : "Dokumen tidak ditemukan atau gagal dihapus.",
      };
    } catch (error: any) {
      console.error("[DokumentasiService.deleteDokumentasi] Error:", error);
      return {
        success: false,
        message: "Gagal menghapus dokumentasi kegiatan.",
      };
    }
  }

  /**
   * Menghapus satu foto langsung dari Cloudinary
   */
  async deleteSinglePhoto(publicIdOrUrl: string): Promise<ServiceResponse<boolean>> {
    try {
      if (!publicIdOrUrl) {
        return { success: false, message: "ID atau URL foto tidak valid." };
      }
      const ok = await deleteImageFromCloudinary(publicIdOrUrl);
      return {
        success: ok,
        message: ok
          ? "Foto berhasil dihapus dari Cloudinary."
          : "Foto tidak ditemukan atau sudah terhapus.",
        data: ok,
      };
    } catch (err: any) {
      console.error("[DokumentasiService.deleteSinglePhoto] Error:", err);
      return {
        success: false,
        message: err?.message || "Gagal menghapus foto dari Cloudinary.",
      };
    }
  }
}

export const dokumentasiService = new DokumentasiService();
