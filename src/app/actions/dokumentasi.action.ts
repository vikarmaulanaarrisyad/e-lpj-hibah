"use server";

import { authService } from "@/services/auth.service";
import { dokumentasiService } from "@/services/dokumentasi.service";
import type {
  DokumentasiFormData,
  ActivityDocumentationRecord,
  ServiceResponse,
} from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Menyimpan dokumentasi kegiatan ke Database dan foto ke Cloudinary
 */
export async function saveDokumentasiAction(
  formData: DokumentasiFormData
): Promise<ServiceResponse<ActivityDocumentationRecord>> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return { success: false, message: "Sesi telah berakhir. Silakan login kembali." };
    }

    const res = await dokumentasiService.saveDokumentasi(session.sub, formData);
    if (res.success) {
      revalidatePath("/user/dokumentasi");
      revalidatePath("/user");
    }
    return res;
  } catch (error: any) {
    console.error("[saveDokumentasiAction] Error:", error);
    return { success: false, message: error?.message || "Gagal menyimpan dokumentasi kegiatan." };
  }
}

/**
 * Server Action: Mengambil seluruh arsip dokumentasi milik pengguna
 */
export async function getDokumentasiListAction(): Promise<
  ServiceResponse<ActivityDocumentationRecord[]>
> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return { success: false, message: "Sesi tidak valid.", data: [] };
    }

    return await dokumentasiService.getDokumentasiList(session.sub);
  } catch (error: any) {
    console.error("[getDokumentasiListAction] Error:", error);
    return { success: false, message: "Gagal memuat arsip dokumentasi.", data: [] };
  }
}

/**
 * Server Action: Menghapus dokumentasi kegiatan
 */
export async function deleteDokumentasiAction(
  id: string
): Promise<ServiceResponse<boolean>> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return { success: false, message: "Sesi telah berakhir." };
    }

    const res = await dokumentasiService.deleteDokumentasi(id, session.sub);
    if (res.success) {
      revalidatePath("/user/dokumentasi");
      revalidatePath("/user");
    }
    return res;
  } catch (error: any) {
    console.error("[deleteDokumentasiAction] Error:", error);
    return { success: false, message: "Gagal menghapus dokumentasi kegiatan." };
  }
}

/**
 * Server Action: Menghapus satu foto dari Cloudinary
 */
export async function deleteDokumentasiPhotoAction(
  publicIdOrUrl: string
): Promise<ServiceResponse<boolean>> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return { success: false, message: "Sesi telah berakhir." };
    }

    return await dokumentasiService.deleteSinglePhoto(publicIdOrUrl);
  } catch (error: any) {
    console.error("[deleteDokumentasiPhotoAction] Error:", error);
    return { success: false, message: "Gagal menghapus foto dari Cloudinary." };
  }
}
