import { Suspense } from "react";
import type { Metadata } from "next";
import { authService } from "@/services/auth.service";
import { userRepository } from "@/repositories/user.repository";
import { receiptRepository } from "@/repositories/receipt.repository";
import { rabService } from "@/services/rab.service";
import { institutionService } from "@/services/institution.service";
import { redirect } from "next/navigation";
import { KwitansiHeader } from "@/components/kwitansi/kwitansi-header";
import { KwitansiForm } from "@/components/kwitansi/kwitansi-form";

export const metadata: Metadata = {
  title: "Generator Kwitansi & Pratinjau | E-LPJ Hibah Internal",
  description: "Modul pembuatan bukti kas riil, format baku blanko kwitansi hibah, dan preview cetak fisik.",
};

export default async function KwitansiPage() {
  const session = await authService.getSession();

  if (!session || session.role !== "USER") {
    redirect("/login");
  }

  // Fetch full user profile, saved receipts, RAB budget status, and institution profile from database
  const [userProfile, profileRes, savedReceipts, rabStatusRes] = await Promise.all([
    userRepository.findById(session.sub),
    institutionService.getProfile(session.sub),
    receiptRepository.findManyByUserId(session.sub),
    rabService.getRabStatus(session.sub),
  ]);

  const profile = profileRes.data || null;
  const institution = profile?.subNama
    ? `${profile.namaLembaga} ${profile.subNama}`
    : userProfile?.institution || session.institution || "PR Fatayat NU Dawuhan Selatan";
  const userName = userProfile?.name || session.name;
  const leaderName = profile?.namaKetua || userProfile?.leaderName || "HENI FUJIATI";
  const initialRabSummary = rabStatusRes.data;

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col">
      {/* ================= MAIN HEADER NAVBAR (CLIENT COMPONENT) ================= */}
      <KwitansiHeader
        institution={institution}
        userName={userName}
        registrationNumber={profile?.noRegistrasi}
        initialProfile={profile}
      />

      {/* ================= WORKSPACE BODY ================= */}
      <main className="flex-1 pb-16">
        <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat Generator Kwitansi...</div>}>
          <KwitansiForm
            initialInstitution={institution}
            initialUserName={userName}
            initialLeaderName={leaderName}
            initialProfile={profile}
            savedReceipts={savedReceipts}
            initialRabSummary={initialRabSummary}
          />
        </Suspense>
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
              Server Audit & Supabase Terhubung
            </span>
            <span className="font-mono text-slate-500">v2.4.0-PROD</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
