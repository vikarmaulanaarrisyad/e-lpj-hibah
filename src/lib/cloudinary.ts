import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary SDK
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
const apiKey = process.env.CLOUDINARY_API_KEY || "";
const apiSecret = process.env.CLOUDINARY_API_SECRET || "";

const isCloudinaryConfigured = Boolean(
  cloudName &&
  apiKey &&
  apiSecret &&
  apiKey.trim() !== "" &&
  apiSecret.trim() !== ""
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export interface CloudinaryUploadResult {
  success: boolean;
  url: string;
  publicId?: string;
  isCloudinary: boolean;
  message?: string;
}

/**
 * Upload an image (base64 data URI or image buffer string) to Cloudinary.
 * If Cloudinary API credentials are not yet configured in .env, falls back
 * safely to storing the data URI directly so the UI continues working.
 */
export async function uploadImageToCloudinary(
  fileBase64OrUri: string,
  folder: string = "elpj-hibah/logos"
): Promise<CloudinaryUploadResult> {
  try {
    if (!fileBase64OrUri || !fileBase64OrUri.trim()) {
      return {
        success: false,
        url: "",
        isCloudinary: false,
        message: "Gambar tidak ditemukan.",
      };
    }

    if (isCloudinaryConfigured) {
      const uploadResponse = await cloudinary.uploader.upload(fileBase64OrUri, {
        folder,
        resource_type: "image",
        transformation: [
          { width: 500, height: 500, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      });

      return {
        success: true,
        url: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
        isCloudinary: true,
        message: "Logo berhasil diunggah ke Cloudinary CDN!",
      };
    }

    // Fallback: Store data URI directly in DB when Cloudinary keys are pending
    return {
      success: true,
      url: fileBase64OrUri,
      isCloudinary: false,
      message: "Logo tersimpan di database lokal (Cloudinary keys belum diisi di .env).",
    };
  } catch (error: any) {
    console.error("[Cloudinary] Upload failed:", error);
    // If Cloudinary network fails, fall back to base64 so user doesn't lose their logo
    return {
      success: true,
      url: fileBase64OrUri,
      isCloudinary: false,
      message: `Gagal koneksi Cloudinary (${error?.message || "error"}), disimpan sebagai data URI lokal.`,
    };
  }
}

/**
 * Ekstrak publicId dari Cloudinary URL atau string publicId langsung
 */
export function extractCloudinaryPublicId(urlOrId: string): string {
  if (!urlOrId) return "";
  if (!urlOrId.startsWith("http://") && !urlOrId.startsWith("https://")) {
    return urlOrId.trim();
  }
  try {
    const urlObj = new URL(urlOrId);
    const pathname = urlObj.pathname;
    const uploadIndex = pathname.indexOf("/upload/");
    if (uploadIndex === -1) return "";

    const afterUpload = pathname.substring(uploadIndex + "/upload/".length);
    const parts = afterUpload.split("/");
    const cleanParts: string[] = [];

    for (const part of parts) {
      // Lewati versi (v123456789) atau transformation segment (cth: w_1280,c_limit)
      if (/^v\d+$/.test(part) || part.includes(",")) {
        continue;
      }
      cleanParts.push(part);
    }

    const fullPath = cleanParts.join("/");
    // Buang ekstensi file (.jpg, .png, .webp, dll)
    const dotIndex = fullPath.lastIndexOf(".");
    return dotIndex !== -1 ? fullPath.substring(0, dotIndex) : fullPath;
  } catch (err) {
    console.warn("Gagal mengekstrak Cloudinary publicId:", err);
    return "";
  }
}

/**
 * Delete an image from Cloudinary by public ID or full image URL
 */
export async function deleteImageFromCloudinary(publicIdOrUrl: string): Promise<boolean> {
  try {
    if (!isCloudinaryConfigured || !publicIdOrUrl) return false;
    const publicId = extractCloudinaryPublicId(publicIdOrUrl);
    if (!publicId) return false;

    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === "ok";
  } catch (error) {
    console.error("[Cloudinary] Destroy failed:", error);
    return false;
  }
}

/**
 * Upload foto dokumentasi kegiatan ke Cloudinary dengan optimasi kompresi hemat kapasitas:
 * 1. max width/height 1280px (cukup tajam untuk cetak 300 DPI F4, hemat 85% ukuran asli)
 * 2. quality: "auto:good" (kompresi cerdas Cloudinary)
 * 3. fetch_format: "auto" (format WebP/AVIF modern hemat kuota)
 * 4. flags: "strip_profile" (membersihkan metadata EXIF yang berat)
 */
export async function uploadDokumentasiPhotoToCloudinary(
  fileBase64OrUri: string,
  folder: string = "elpj-hibah/dokumentasi"
): Promise<CloudinaryUploadResult> {
  try {
    if (!fileBase64OrUri || !fileBase64OrUri.trim()) {
      return {
        success: false,
        url: "",
        isCloudinary: false,
        message: "Gambar tidak ditemukan.",
      };
    }

    if (isCloudinaryConfigured) {
      const uploadResponse = await cloudinary.uploader.upload(fileBase64OrUri, {
        folder,
        resource_type: "image",
        transformation: [
          { width: 1280, height: 1280, crop: "limit" },
          { quality: "auto:good" },
          { fetch_format: "auto" },
          { flags: "strip_profile" },
        ],
      });

      return {
        success: true,
        url: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
        isCloudinary: true,
        message: "Foto dokumentasi berhasil diunggah ke Cloudinary (teroptimasi hemat kapasitas).",
      };
    }

    return {
      success: true,
      url: fileBase64OrUri,
      isCloudinary: false,
      message: "Foto tersimpan lokal (Cloudinary keys belum diatur).",
    };
  } catch (error: any) {
    console.error("[Cloudinary] Upload dokumentasi failed:", error);
    return {
      success: true,
      url: fileBase64OrUri,
      isCloudinary: false,
      message: `Gagal koneksi Cloudinary (${error?.message || "error"}), disimpan sebagai data URI.`,
    };
  }
}
