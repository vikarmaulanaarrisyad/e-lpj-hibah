"use server";

import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";
import { loggerService } from "@/services/logger.service";
import { revalidatePath } from "next/cache";

/**
 * Memastikan pemanggil adalah Super Admin yang sah
 */
async function requireAdminSession() {
  const session = await authService.getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Akses ditolak. Tindakan ini hanya dapat dilakukan oleh Super Admin.");
  }
  return session;
}

/**
 * Mengambil ringkasan metrik sistem, daftar user, dan transaksi
 */
export async function getAdminDashboardDataAction() {
  try {
    const session = await requireAdminSession();

    // 1. Ambil seluruh pengguna terdaftar dengan relasi hitungan
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        institutionProfile: {
          select: {
            namaLembaga: true,
            subNama: true,
            noRegistrasi: true,
            namaKetua: true,
            namaBendahara: true,
          },
        },
        _count: {
          select: {
            receipts: true,
            bkuTransactions: true,
            bastDocuments: true,
            purchaseOrders: true,
            activityDocumentations: true,
            rabItems: true,
            vendors: true,
          },
        },
      },
    });

    // 2. Agregasi Transaksi Kwitansi Lintas Seluruh User
    const receipts = await prisma.receipt.findMany({
      orderBy: { tanggal: "desc" },
      take: 50,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            institution: true,
          },
        },
      },
    });

    // 3. Agregasi Surat Pesanan (SP) Lintas Seluruh User
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      orderBy: { tanggal: "desc" },
      take: 50,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            institution: true,
          },
        },
      },
    });

    // 4. Agregasi Berita Acara (BAST) Lintas Seluruh User
    const bastDocuments = await prisma.bastDocument.findMany({
      orderBy: { tanggal: "desc" },
      take: 50,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            institution: true,
          },
        },
      },
    });

    // 5. Total Belanja Keseluruhan
    const totalBelanjaAgg = await prisma.receipt.aggregate({
      _sum: { nominal: true },
      _count: { id: true },
    });

    // 6. Hitung statistik log sistem
    const logStats = await loggerService.getStats();

    // 7. Status Server / Environment Health
    const memUsage = process.memoryUsage();
    const serverHealth = {
      status: "ONLINE" as const,
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      database: "PostgreSQL (Prisma Connected)",
      heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(memUsage.heapTotal / 1024 / 1024),
      rssMb: Math.round(memUsage.rss / 1024 / 1024),
      serverTime: new Date().toISOString(),
    };

    return {
      success: true,
      data: {
        sessionUser: session,
        users,
        receipts,
        purchaseOrders,
        bastDocuments,
        totalBelanjaNominal: totalBelanjaAgg._sum.nominal || 0,
        totalReceiptsCount: totalBelanjaAgg._count.id || 0,
        logStats,
        serverHealth,
      },
    };
  } catch (error) {
    console.error("[getAdminDashboardDataAction] Error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal memuat data monitoring.",
    };
  }
}

/**
 * Mengambil daftar Log Sistem (Error, Warning, Bug, Audit)
 */
export async function getSystemLogsAction(params?: {
  level?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    await requireAdminSession();
    const result = await loggerService.getLogs(params);
    const stats = await loggerService.getStats();

    return {
      success: true,
      data: {
        ...result,
        stats,
      },
    };
  } catch (error) {
    console.error("[getSystemLogsAction] Error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal memuat log sistem.",
      data: { items: [], total: 0, stats: { total: 0, errors: 0, warns: 0, infos: 0 } },
    };
  }
}

/**
 * Simulasi pemicu error / bug test untuk verifikasi logger Super Admin
 */
export async function triggerTestErrorAction(scenario?: string) {
  try {
    const session = await requireAdminSession();

    let errorScenario = scenario || "Simulasi Error Uji Coba Super Admin";
    let mockStackTrace = new Error(
      `[SIMULASI] ${errorScenario} pada ${new Date().toLocaleString("id-ID")}`
    );

    await loggerService.logError("SIMULATION_TEST_BUG", mockStackTrace, {
      endpoint: "/admin (Simulasi Manual)",
      userId: session.sub,
      userEmail: session.email,
    });

    revalidatePath("/admin");
    return {
      success: true,
      message: "Log simulasi error berhasil dicatat ke database system_logs.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal memicu simulasi error.",
    };
  }
}

/**
 * Bersihkan seluruh log sistem (Maintenance)
 */
export async function clearSystemLogsAction() {
  try {
    await requireAdminSession();
    const result = await loggerService.clearAll();

    revalidatePath("/admin");
    return {
      success: true,
      message: `Berhasil membersihkan ${result.count} catatan log sistem.`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal membersihkan log.",
    };
  }
}

/**
 * Hapus pengguna dari sistem (Manajemen Akun)
 */
export async function deleteUserAction(targetUserId: string) {
  try {
    const session = await requireAdminSession();

    if (session.sub === targetUserId) {
      return {
        success: false,
        message: "Anda tidak dapat menghapus akun Anda sendiri saat sedang aktif.",
      };
    }

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { email: true, name: true },
    });

    if (!target) {
      return { success: false, message: "Pengguna tidak ditemukan." };
    }

    await prisma.user.delete({
      where: { id: targetUserId },
    });

    // Catat ke log sistem
    await loggerService.log({
      level: "WARN",
      action: "USER_DELETED_BY_ADMIN",
      message: `Super Admin ${session.email} menghapus pengguna: ${target.name} (${target.email})`,
      userId: session.sub,
      userEmail: session.email,
    });

    revalidatePath("/admin");
    return {
      success: true,
      message: `Pengguna ${target.name} (${target.email}) berhasil dihapus dari sistem.`,
    };
  } catch (error) {
    console.error("[deleteUserAction] Error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menghapus pengguna.",
    };
  }
}
