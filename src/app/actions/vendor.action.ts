"use server";

import { authService } from "@/services/auth.service";
import { vendorService } from "@/services/vendor.service";
import type { Vendor, CreateVendorInput, UpdateVendorInput, ServiceResponse } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Mengambil seluruh daftar toko/rekanan langganan milik user
 */
export async function getVendorsAction(): Promise<ServiceResponse<Vendor[]>> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return { success: false, message: "Sesi tidak valid.", data: [] };
    }
    return await vendorService.getVendors(session.sub);
  } catch (error) {
    console.error("[getVendorsAction] Error:", error);
    return { success: false, message: "Terjadi kesalahan server.", data: [] };
  }
}

/**
 * Server Action: Menyimpan atau memperbarui data toko / rekanan
 */
export async function saveVendorAction(
  input: CreateVendorInput & { id?: string }
): Promise<ServiceResponse<Vendor>> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return { success: false, message: "Sesi tidak valid. Silakan login kembali." };
    }

    const res = await vendorService.saveVendor(session.sub, input);
    if (res.success) {
      revalidatePath("/user/pesanan");
      revalidatePath("/user/bast");
      revalidatePath("/user/kwitansi");
    }
    return res;
  } catch (error) {
    console.error("[saveVendorAction] Error:", error);
    return { success: false, message: "Gagal menyimpan data toko." };
  }
}

/**
 * Server Action: Simpan cepat rekanan langsung dari form
 */
export async function quickSaveVendorAction(
  input: CreateVendorInput
): Promise<ServiceResponse<Vendor>> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return { success: false, message: "Sesi tidak valid." };
    }

    const res = await vendorService.quickSaveVendor(session.sub, input);
    if (res.success) {
      revalidatePath("/user/pesanan");
      revalidatePath("/user/bast");
      revalidatePath("/user/kwitansi");
    }
    return res;
  } catch (error) {
    console.error("[quickSaveVendorAction] Error:", error);
    return { success: false, message: "Gagal menyimpan toko ke langganan." };
  }
}

/**
 * Server Action: Menghapus toko dari master data
 */
export async function deleteVendorAction(id: string): Promise<ServiceResponse<boolean>> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return { success: false, message: "Sesi tidak valid." };
    }

    const res = await vendorService.deleteVendor(id, session.sub);
    if (res.success) {
      revalidatePath("/user/pesanan");
      revalidatePath("/user/bast");
      revalidatePath("/user/kwitansi");
    }
    return res;
  } catch (error) {
    console.error("[deleteVendorAction] Error:", error);
    return { success: false, message: "Gagal menghapus toko." };
  }
}
