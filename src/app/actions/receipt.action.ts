"use server";

import { receiptSchema, type ReceiptValidationInput } from "@/lib/validations/receipt";
import { receiptService } from "@/services/receipt.service";
import { authService } from "@/services/auth.service";
import type { ActionResponse, Receipt } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Server action to save/persist receipt into BKU
 */
export async function saveReceiptAction(
  data: ReceiptValidationInput
): Promise<ActionResponse<Receipt>> {
  try {
    // 1. Authenticate caller
    const session = await authService.getSession();
    if (!session) {
      return {
        success: false,
        message: "Sesi tidak valid. Silakan login terlebih dahulu.",
      };
    }

    // 2. Validate input schema
    const validationResult = receiptSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        message: validationResult.error.errors[0]?.message || "Data kwitansi tidak valid.",
      };
    }

    // 3. Call Service Layer
    const res = await receiptService.saveReceipt(validationResult.data, session.sub);
    if (res.success) {
      revalidatePath("/user/bku");
      revalidatePath("/user/kwitansi");
      revalidatePath("/user/rab");
      revalidatePath("/user");
    }
    return res;
  } catch (error) {
    console.error("[saveReceiptAction] Unexpected error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan internal saat menyimpan kwitansi.",
    };
  }
}

/**
 * Server action to retrieve all receipts for current user
 */
export async function getReceiptsAction(): Promise<ActionResponse<Receipt[]>> {
  try {
    const session = await authService.getSession();
    if (!session) {
      return {
        success: false,
        message: "Sesi tidak valid.",
        data: [],
      };
    }

    return await receiptService.getReceiptsByUser(session.sub);
  } catch (error) {
    console.error("[getReceiptsAction] Error:", error);
    return {
      success: false,
      message: "Gagal memuat kwitansi.",
      data: [],
    };
  }
}

/**
 * Server action to retrieve a specific receipt by nomorBukti
 */
export async function getReceiptByNomorBuktiAction(
  nomorBukti: string
): Promise<ActionResponse<Receipt | null>> {
  try {
    const session = await authService.getSession();
    if (!session) {
      return {
        success: false,
        message: "Sesi tidak valid.",
        data: null,
      };
    }

    return await receiptService.getReceiptByNomorBukti(nomorBukti, session.sub);
  } catch (error) {
    console.error("[getReceiptByNomorBuktiAction] Error:", error);
    return {
      success: false,
      message: "Gagal memuat kwitansi dari database.",
      data: null,
    };
  }
}

/**
 * Server action to get next suggested BKU nomor bukti (anti-double & unique)
 */
export async function getNextNomorBuktiAction(dateString?: string): Promise<ActionResponse<string>> {
  try {
    const session = await authService.getSession();
    const userId = session?.sub || "default";
    const nextNomor = await receiptService.generateNextNomorBukti(userId, dateString);
    return {
      success: true,
      message: "Nomor bukti dibuat otomatis.",
      data: nextNomor,
    };
  } catch (error) {
    console.error("[getNextNomorBuktiAction] Error:", error);
    return {
      success: true,
      message: "Nomor bukti default.",
      data: "01/A/PR.FNU/IX/2026",
    };
  }
}

/**
 * Server action to delete a receipt
 */
export async function deleteReceiptAction(id: string): Promise<ActionResponse<boolean>> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return {
        success: false,
        message: "Sesi tidak valid. Silakan login kembali.",
        data: false,
      };
    }

    const res = await receiptService.deleteReceipt(id, session.sub);
    if (res.success) {
      revalidatePath("/user/kwitansi");
      revalidatePath("/user/bku");
      revalidatePath("/user/rab");
      revalidatePath("/user");
    }
    return res;
  } catch (error) {
    console.error("[deleteReceiptAction] Error:", error);
    return {
      success: false,
      message: "Gagal menghapus kwitansi.",
      data: false,
    };
  }
}
