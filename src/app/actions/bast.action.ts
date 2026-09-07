"use server";

import { authService } from "@/services/auth.service";
import { bastService } from "@/services/bast.service";
import { bastRepository, type BastWithReceipt } from "@/repositories/bast.repository";
import type { BastDocument, CreateBastInput, BastItem, ServiceResponse } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Mengambil seluruh daftar BAST milik user
 */
export async function getBastListAction(): Promise<ServiceResponse<BastWithReceipt[]>> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return { success: false, message: "Sesi tidak valid.", data: [] };
    }
    return await bastService.getBastList(session.sub);
  } catch (error) {
    console.error("[getBastListAction] Error:", error);
    return { success: false, message: "Terjadi kesalahan internal.", data: [] };
  }
}

/**
 * Server Action: Mengambil BAST berdasarkan nomor register
 */
export async function getBastByNomorAction(
  nomorBast: string
): Promise<ServiceResponse<{ bast: BastWithReceipt; items: BastItem[] } | null>> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return { success: false, message: "Sesi tidak valid.", data: null };
    }
    return await bastService.getBastByNomor(nomorBast, session.sub);
  } catch (error) {
    console.error("[getBastByNomorAction] Error:", error);
    return { success: false, message: "Gagal memuat BAST.", data: null };
  }
}

/**
 * Server Action: Mengambil BAST yang terhubung dengan kwitansi tertentu
 */
export async function getBastByReceiptIdAction(
  receiptId: string
): Promise<ServiceResponse<BastDocument | null>> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return { success: false, message: "Sesi tidak valid.", data: null };
    }
    return await bastService.getBastByReceiptId(receiptId, session.sub);
  } catch (error) {
    console.error("[getBastByReceiptIdAction] Error:", error);
    return { success: false, message: "Gagal memeriksa BAST.", data: null };
  }
}

/**
 * Server Action: Menyimpan atau memperbarui dokumen BAST
 */
export async function saveBastAction(
  input: CreateBastInput
): Promise<ServiceResponse<BastDocument>> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return { success: false, message: "Sesi tidak valid. Silakan login kembali." };
    }

    const res = await bastService.saveBast(input, session.sub);
    if (res.success) {
      revalidatePath("/user/bast");
      revalidatePath("/user/kwitansi");
      revalidatePath("/user/bku");
    }
    return res;
  } catch (error) {
    console.error("[saveBastAction] Error:", error);
    return { success: false, message: "Gagal menyimpan BAST." };
  }
}

/**
 * Server Action: Menghapus dokumen BAST
 */
export async function deleteBastAction(id: string): Promise<ServiceResponse<boolean>> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return { success: false, message: "Sesi tidak valid." };
    }

    const deleted = await bastRepository.delete(id, session.sub);
    if (deleted) {
      revalidatePath("/user/bast");
      return { success: true, message: "Dokumen BAST berhasil dihapus." };
    }
    return { success: false, message: "Dokumen tidak ditemukan atau gagal dihapus." };
  } catch (error) {
    console.error("[deleteBastAction] Error:", error);
    return { success: false, message: "Terjadi kesalahan internal saat menghapus BAST." };
  }
}

/**
 * Server Action: Mendapatkan nomor register BAST dan No. Urut berikutnya secara otomatis
 */
export async function getNextNomorBastAction(
  dateString?: string
): Promise<ServiceResponse<{ nomorBast: string; nomorUrut: string }>> {
  try {
    const session = await authService.getSession();
    const userId = session?.sub || "default";
    const nextData = await bastService.generateNextNomorBast(userId, dateString);
    return { success: true, message: "Nomor BAST dibuat otomatis.", data: nextData };
  } catch (error) {
    console.error("[getNextNomorBastAction] Error:", error);
    return {
      success: true,
      message: "Nomor default.",
      data: {
        nomorBast: "01/A/PR.FNU/IX/2026",
        nomorUrut: "01",
      },
    };
  }
}
