"use server";

import { bkuService, type BkuLedgerResult } from "@/services/bku.service";
import { authService } from "@/services/auth.service";
import type { ActionResponse, CreateBkuIncomeInput } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Server Action to get the complete BKU ledger and summary
 */
export async function getBkuLedgerAction(): Promise<ActionResponse<BkuLedgerResult>> {
  try {
    const session = await authService.getSession();
    if (!session) {
      return {
        success: false,
        message: "Sesi telah berakhir. Silakan login kembali.",
      };
    }

    return await bkuService.getBkuLedger(session.sub);
  } catch (error) {
    console.error("[getBkuLedgerAction] Error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat memuat data Buku Kas Umum.",
    };
  }
}

/**
 * Server Action to record grant disbursement / cash income
 */
export async function addBkuIncomeAction(
  data: CreateBkuIncomeInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await authService.getSession();
    if (!session) {
      return {
        success: false,
        message: "Sesi telah berakhir. Silakan login kembali.",
      };
    }

    const result = await bkuService.addIncome(data, session.sub);
    if (result.success) {
      revalidatePath("/user/bku");
    }
    return result;
  } catch (error) {
    console.error("[addBkuIncomeAction] Error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan internal saat mencatat kas masuk.",
    };
  }
}

/**
 * Server Action to delete a manual BKU transaction
 */
export async function deleteBkuTransactionAction(
  id: string
): Promise<ActionResponse<boolean>> {
  try {
    const session = await authService.getSession();
    if (!session) {
      return {
        success: false,
        message: "Sesi telah berakhir.",
      };
    }

    const result = await bkuService.deleteTransaction(id, session.sub);
    if (result.success) {
      revalidatePath("/user/bku");
      revalidatePath("/user/kwitansi");
      revalidatePath("/user/pesanan");
      revalidatePath("/user/berita-acara");
      revalidatePath("/user/arsip-dokumen");
      revalidatePath("/user/rab");
      revalidatePath("/user");
    }
    return result;
  } catch (error) {
    console.error("[deleteBkuTransactionAction] Error:", error);
    return {
      success: false,
      message: "Gagal menghapus transaksi.",
    };
  }
}

/**
 * Server Action to force-sync all receipts to BKU
 */
export async function syncBkuReceiptsAction(): Promise<ActionResponse<number>> {
  try {
    const session = await authService.getSession();
    if (!session) {
      return {
        success: false,
        message: "Sesi telah berakhir.",
      };
    }

    const syncedCount = await bkuService.syncAllUnsyncedReceipts(session.sub);
    revalidatePath("/user/bku");
    return {
      success: true,
      message: `Sinkronisasi selesai. ${syncedCount} kwitansi disinkronkan ke BKU.`,
      data: syncedCount,
    };
  } catch (error) {
    console.error("[syncBkuReceiptsAction] Error:", error);
    return {
      success: false,
      message: "Gagal menyinkronkan kwitansi ke BKU.",
    };
  }
}

/**
 * Server Action to get next unique SP2D / Cash Income nomor bukti
 */
export async function getNextIncomeNomorBuktiAction(
  dateString?: string
): Promise<ActionResponse<string>> {
  try {
    const session = await authService.getSession();
    const userId = session?.sub || "default";
    const nextNomor = await bkuService.generateNextIncomeNomorBukti(userId, dateString);
    return {
      success: true,
      message: "Nomor SP2D dibuat otomatis.",
      data: nextNomor,
    };
  } catch (error) {
    console.error("[getNextIncomeNomorBuktiAction] Error:", error);
    return {
      success: true,
      message: "Nomor SP2D default.",
      data: "SP2D-HB/001/IX/2026",
    };
  }
}
