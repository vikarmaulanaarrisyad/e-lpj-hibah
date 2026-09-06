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
 * Delete an image from Cloudinary by public ID
 */
export async function deleteImageFromCloudinary(publicId: string): Promise<boolean> {
  try {
    if (!isCloudinaryConfigured || !publicId) return false;
    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === "ok";
  } catch (error) {
    console.error("[Cloudinary] Destroy failed:", error);
    return false;
  }
}
