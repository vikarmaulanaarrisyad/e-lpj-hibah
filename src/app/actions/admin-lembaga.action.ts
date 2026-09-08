"use server";

import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";
import { rabService } from "@/services/rab.service";
import { bkuService } from "@/services/bku.service";

async function requireAdminSession() {
  const session = await authService.getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Akses ditolak. Hanya Super Admin.");
  }
  return session;
}

/**
 * Mengambil detail lengkap satu lembaga/user untuk monitoring Admin
 */
export async function getAdminLembagaDetailAction(targetUserId: string) {
  try {
    await requireAdminSession();

    const [user, rabRes, bkuRes, receipts, bastDocuments, purchaseOrders] = await Promise.all([
      prisma.user.findUnique({
        where: { id: targetUserId },
        include: {
          institutionProfile: true,
          _count: {
            select: {
              receipts: true,
              bkuTransactions: true,
              bastDocuments: true,
              purchaseOrders: true,
              rabItems: true,
              vendors: true,
            },
          },
        },
      }),
      rabService.getRabStatus(targetUserId),
      bkuService.getBkuLedger(targetUserId),
      prisma.receipt.findMany({
        where: { userId: targetUserId },
        orderBy: { tanggal: "desc" },
        take: 10,
      }),
      prisma.bastDocument.findMany({
        where: { userId: targetUserId },
        orderBy: { tanggal: "desc" },
        take: 5,
      }),
      prisma.purchaseOrder.findMany({
        where: { userId: targetUserId },
        orderBy: { tanggal: "desc" },
        take: 5,
      }),
    ]);

    if (!user) {
      return { success: false, message: "Pengguna tidak ditemukan." };
    }

    return {
      success: true,
      data: {
        user,
        rabSummary: rabRes.data,
        bkuSummary: bkuRes.data?.summary,
        recentReceipts: receipts,
        recentBast: bastDocuments,
        recentPesanan: purchaseOrders,
      },
    };
  } catch (error) {
    console.error("[getAdminLembagaDetailAction] Error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal memuat data lembaga.",
    };
  }
}