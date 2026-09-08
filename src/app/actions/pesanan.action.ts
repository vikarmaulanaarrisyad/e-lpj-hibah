"use server";

import { authService } from "@/services/auth.service";
import { pesananService } from "@/services/pesanan.service";
import type { PurchaseOrder, CreatePesananInput, ServiceResponse } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Mengambil seluruh daftar Surat Pesanan (SP) milik user
 */
export async function getPurchaseOrdersAction(): Promise<ServiceResponse<PurchaseOrder[]>> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return { success: false, message: "Sesi tidak valid.", data: [] };
    }
    return await pesananService.getPurchaseOrders(session.sub);
  } catch (error) {
    console.error("[getPurchaseOrdersAction] Error:", error);
    return { success: false, message: "Terjadi kesalahan internal.", data: [] };
  }
}

/**
 * Server Action: Mengambil Surat Pesanan berdasarkan ID
 */
export async function getPurchaseOrderByIdAction(
  id: string
): Promise<ServiceResponse<PurchaseOrder | null>> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return { success: false, message: "Sesi tidak valid.", data: null };
    }
    return await pesananService.getPurchaseOrderById(id, session.sub);
  } catch (error) {
    console.error("[getPurchaseOrderByIdAction] Error:", error);
    return { success: false, message: "Gagal memuat Surat Pesanan.", data: null };
  }
}

/**
 * Server Action: Menyimpan atau memperbarui Surat Pesanan
 */
export async function savePurchaseOrderAction(
  input: CreatePesananInput
): Promise<ServiceResponse<PurchaseOrder>> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return { success: false, message: "Sesi tidak valid atau telah kedaluwarsa." };
    }

    const response = await pesananService.savePurchaseOrder(input, session.sub);

    if (response.success) {
      revalidatePath("/user/pesanan");
      revalidatePath("/user/bast");
      revalidatePath("/user/kwitansi");
      revalidatePath("/user");
    }

    return response;
  } catch (error) {
    console.error("[savePurchaseOrderAction] Error:", error);
    return {
      success: false,
      message: "Gagal memproses penyimpanan Surat Pesanan.",
    };
  }
}

/**
 * Server Action: Menghapus Surat Pesanan
 */
export async function deletePurchaseOrderAction(
  id: string
): Promise<ServiceResponse<boolean>> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return { success: false, message: "Sesi tidak valid.", data: false };
    }

    const response = await pesananService.deletePurchaseOrder(id, session.sub);

    if (response.success) {
      revalidatePath("/user/pesanan");
      revalidatePath("/user");
    }

    return response;
  } catch (error) {
    console.error("[deletePurchaseOrderAction] Error:", error);
    return { success: false, message: "Gagal menghapus Surat Pesanan.", data: false };
  }
}

/**
 * Server Action: Mendapatkan nomor register SP dan No. Urut berikutnya secara otomatis
 */
export async function getNextNomorSpAction(
  dateString?: string
): Promise<ServiceResponse<{ nomorSp: string; nomorUrut: string }>> {
  try {
    const session = await authService.getSession();
    const userId = session?.sub || "default";
    const nextData = await pesananService.generateNextNomorSp(userId, dateString);
    return { success: true, message: "Nomor SP dibuat otomatis.", data: nextData };
  } catch (error) {
    console.error("[getNextNomorSpAction] Error:", error);
    return {
      success: true,
      message: "Nomor default.",
      data: {
        nomorSp: "01/A/PR.FNU/IX/2026",
        nomorUrut: "01",
      },
    };
  }
}
