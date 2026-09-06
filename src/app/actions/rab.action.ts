"use server";

import { authService } from "@/services/auth.service";
import { rabService } from "@/services/rab.service";
import type {
  RabSummary,
  BudgetCeilingCheckResult,
  UpdateRabItemInput,
  RabStatusItem,
  ServiceResponse,
} from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Mengambil status penyerapan anggaran RAB real-time
 */
export async function getRabStatusAction(): Promise<ServiceResponse<RabSummary>> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return {
        success: false,
        message: "Sesi tidak valid. Silakan login kembali.",
      };
    }

    return await rabService.getRabStatus(session.sub);
  } catch (error) {
    console.error("[getRabStatusAction] Error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan internal saat memuat data RAB.",
    };
  }
}

/**
 * Server Action: Validasi instan guardrail pencegahan defisit saat input form kwitansi
 */
export async function checkBudgetCeilingAction(
  kodeRab: string,
  nominal: number,
  excludeReceiptNo?: string
): Promise<ServiceResponse<BudgetCeilingCheckResult>> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return {
        success: false,
        message: "Sesi tidak valid.",
      };
    }

    return await rabService.checkBudgetCeiling(
      session.sub,
      kodeRab,
      nominal,
      excludeReceiptNo
    );
  } catch (error) {
    console.error("[checkBudgetCeilingAction] Error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat memeriksa pagu anggaran.",
    };
  }
}

/**
 * Server Action: Memperbarui alokasi pagu NPHD per pos rekening
 */
export async function updateRabAllocationAction(
  input: UpdateRabItemInput
): Promise<ServiceResponse<RabStatusItem>> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return {
        success: false,
        message: "Sesi tidak valid.",
      };
    }

    const res = await rabService.updateRabAllocation(session.sub, input);
    if (res.success) {
      revalidatePath("/user");
      revalidatePath("/user/rab");
      revalidatePath("/user/kwitansi");
      revalidatePath("/user/bku");
    }
    return res;
  } catch (error) {
    console.error("[updateRabAllocationAction] Error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat memperbarui pagu anggaran.",
    };
  }
}
