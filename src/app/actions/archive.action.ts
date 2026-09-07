"use server";

import { authService } from "@/services/auth.service";
import { institutionService } from "@/services/institution.service";
import { rabService } from "@/services/rab.service";
import { bkuService } from "@/services/bku.service";
import { receiptRepository } from "@/repositories/receipt.repository";
import { pesananRepository } from "@/repositories/pesanan.repository";
import { bastRepository } from "@/repositories/bast.repository";
import { dokumentasiRepository } from "@/repositories/dokumentasi.repository";
import { userRepository } from "@/repositories/user.repository";
import { normalizeTahunAnggaran } from "@/lib/utils/tahun-anggaran";
import type {
  Receipt,
  PurchaseOrder,
  BastDocument,
  ActivityDocumentationRecord,
  InstitutionProfile,
  RabSummary,
  BkuLedgerEntry,
  BkuSummary,
  ServiceResponse,
} from "@/types";

export interface LpjArchiveData {
  tahun: string;
  user: {
    name: string;
    institution?: string | null;
    leaderName?: string | null;
  };
  profile: InstitutionProfile | null;
  rabSummary: RabSummary | null;
  bkuLedger: {
    entries: BkuLedgerEntry[];
    summary: BkuSummary;
  } | null;
  receipts: Receipt[];
  purchaseOrders: PurchaseOrder[];
  bastDocuments: BastDocument[];
  documentations: ActivityDocumentationRecord[];
  counts: {
    receipts: number;
    purchaseOrders: number;
    bastDocuments: number;
    bkuTransactions: number;
    documentations: number;
  };
}

/**
 * Mengumpulkan seluruh data dokumen pertanggungjawaban hibah untuk dikemas ke dalam arsip ZIP
 */
export async function getLpjArchiveDataAction(
  tahunParam?: string | null
): Promise<ServiceResponse<LpjArchiveData>> {
  try {
    const session = await authService.getSession();
    if (!session || session.role !== "USER") {
      return {
        success: false,
        message: "Sesi tidak valid. Harap masuk kembali.",
      };
    }

    const userId = session.sub;
    const tahun = normalizeTahunAnggaran(tahunParam);

    // Ambil data user, profil lembaga, dan status RAB
    const [dbUser, profileRes, rabRes] = await Promise.all([
      userRepository.findById(userId),
      institutionService.getProfile(userId),
      rabService.getRabStatus(userId),
    ]);

    // Ambil seluruh dokumen dengan filter tahun anggaran terpilih
    const [receipts, purchaseOrders, bastDocuments, bkuRes, documentations] =
      await Promise.all([
        receiptRepository.findManyByUserId(userId, tahun),
        pesananRepository.findManyByUserId(userId, tahun),
        bastRepository.findManyByUserId(userId, tahun),
        bkuService.getBkuLedger(userId, tahun),
        dokumentasiRepository.findManyByUserId(userId, tahun),
      ]);

    const bkuLedger = bkuRes.success && bkuRes.data ? bkuRes.data : null;

    const archiveData: LpjArchiveData = {
      tahun,
      user: {
        name: dbUser?.name || session.name,
        institution: dbUser?.institution || session.institution,
        leaderName: dbUser?.leaderName || profileRes.data?.namaKetua,
      },
      profile: profileRes.data || null,
      rabSummary: rabRes.success && rabRes.data ? rabRes.data : null,
      bkuLedger,
      receipts,
      purchaseOrders,
      bastDocuments,
      documentations,
      counts: {
        receipts: receipts.length,
        purchaseOrders: purchaseOrders.length,
        bastDocuments: bastDocuments.length,
        bkuTransactions: bkuLedger ? bkuLedger.entries.length : 0,
        documentations: documentations.length,
      },
    };

    return {
      success: true,
      message: "Data arsip LPJ berhasil disiapkan.",
      data: archiveData,
    };
  } catch (error) {
    console.error("[getLpjArchiveDataAction] Error:", error);
    return {
      success: false,
      message: "Gagal menyiapkan data arsip LPJ dari database.",
    };
  }
}
