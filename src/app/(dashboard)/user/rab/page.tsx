import type { Metadata } from "next";
import { cookies } from "next/headers";
import { authService } from "@/services/auth.service";
import { receiptRepository } from "@/repositories/receipt.repository";
import { rabService } from "@/services/rab.service";
import { institutionService } from "@/services/institution.service";
import { redirect } from "next/navigation";
import { KwitansiHeader } from "@/components/kwitansi/kwitansi-header";
import { RabDashboard } from "@/components/rab/rab-dashboard";
import { COOKIE_TAHUN_ANGGARAN, normalizeTahunAnggaran } from "@/lib/utils/tahun-anggaran";

export const metadata: Metadata = {
  title: "Kontrol Pagu RAB & Pencegahan Defisit | E-LPJ Hibah",
  description: "Monitoring pagu anggaran NPHD, serapan riil per pos rekening, dan pencegahan defisit keuangan belanja hibah.",
};

export default async function UserRabPage() {
  const session = await authService.getSession();

  if (!session || session.role !== "USER") {
    redirect("/login");
  }

  // Active Tahun Anggaran from cookie
  const activeTahun = normalizeTahunAnggaran(
    cookies().get(COOKIE_TAHUN_ANGGARAN)?.value
  );

  // Preload RAB status, receipts, and institution profile from database
  const [rabRes, receipts, profileRes] = await Promise.all([
    rabService.getRabStatus(session.sub, activeTahun),
    receiptRepository.findManyByUserId(session.sub, activeTahun),
    institutionService.getProfile(session.sub),
  ]);

  const profile = profileRes.data || null;
  const institution = profile?.subNama
    ? `${profile.namaLembaga} ${profile.subNama}`
    : session.institution || "PIMPINAN RANTING FATAYAT NU DAWUHAN SELATAN";
  const userName = session.name || "NUR ALIMAH";

  const summary = rabRes.data || {
    totalAnggaran: 0,
    totalRealisasi: 0,
    totalSisaPagu: 0,
    persentaseSerapanTotal: 0,
    statusTotal: "SAFE",
    items: [],
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col">
      {/* ================= MAIN HEADER NAVBAR ================= */}
      <KwitansiHeader
        institution={institution}
        userName={userName}
        registrationNumber={profile?.noRegistrasi}
        initialProfile={profile}
      />

      {/* ================= WORKSPACE BODY ================= */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-8 py-6">
        <RabDashboard
          initialSummary={summary}
          receipts={receipts}
          institutionName={institution}
          userName={userName}
          leaderName={profile?.namaKetua || session.leaderName || "HENI FUJIATI"}
          treasurerName={profile?.namaBendahara || userName || "NUR ALIMAH"}
          profile={profile}
        />
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="w-full bg-slate-950 border-t border-slate-800/80 py-4 px-4 sm:px-8 text-xs text-slate-400 no-print">
        <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-400">E-LPJ Hibah Internal</span>
            <span>•</span>
            <span>Biro Kesejahteraan Rakyat & Sekretariat Daerah © 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              Kontrol Pagu & Supabase Terhubung
            </span>
            <span className="font-mono text-slate-500">v2.4.0-PROD</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
