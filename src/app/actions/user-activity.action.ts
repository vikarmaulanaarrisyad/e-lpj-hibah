"use server";

import { authService } from "@/services/auth.service";
import { loggerService } from "@/services/logger.service";

/**
 * Mengambil riwayat aktivitas user yang sedang login dari system_logs
 */
export async function getUserActivityLogsAction(params?: {
  level?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const session = await authService.getSession();
    if (!session) {
      return {
        success: false,
        message: "Sesi tidak ditemukan.",
        data: { items: [], total: 0 },
      };
    }

    const result = await loggerService.getLogsByUserId(session.sub, params);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("[getUserActivityLogsAction] Error:", error);
    return {
      success: false,
      message: "Gagal memuat riwayat aktivitas.",
      data: { items: [], total: 0 },
    };
  }
}
