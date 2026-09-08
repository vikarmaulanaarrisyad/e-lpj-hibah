import type { Metadata } from "next";
import { authService } from "@/services/auth.service";
import { redirect } from "next/navigation";
import { loggerService } from "@/services/logger.service";
import { KwitansiHeader } from "@/components/kwitansi/kwitansi-header";
import { ActivityLogTable } from "@/components/riwayat/activity-log-table";
import { institutionService } from "@/services/institution.service";
import { Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Riwayat Aktivitas Akun | E-LPJ Hibah",
  description: "Audit trail dan riwayat seluruh aktivitas akun Anda — login, simpan dokumen, dan perubahan data.",
};

export default async function RiwayatPage() {
  const session = await authService.getSession();

  if (!session || session.role !== "USER") {
    redirect("/login");
  }

  const [profileRes, initialLogs] = await Promise.all([
    institutionService.getProfile(session.sub),
    loggerService.getLogsByUserId(session.sub, { limit: 25, offset: 0 }),
  ]);

  const profile = profileRes.data || null;
  const institution = profile?.subNama
    ? `${profile.namaLembaga} ${profile.subNama}`
    : session.institution || "PR Fatayat NU";

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col">
      <KwitansiHeader
        institution={institution}
        userName={session.name}
        registrationNumber={profile?.noRegistrasi}
        initialProfile={profile}
      />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/user"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Dashboard
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Activity className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Riwayat Aktivitas</h1>
                <p className="text-xs text-slate-400">Audit trail seluruh aksi yang dilakukan di akun Anda</p>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-center">
              <p className="text-xl font-bold text-amber-400">{initialLogs.total}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Total Aktivitas</p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-amber-950/20 border border-amber-800/30 rounded-2xl p-4 flex items-start gap-3">
          <Activity className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-200/80 leading-relaxed">
            <span className="font-semibold text-amber-300">Audit Trail Akun Anda</span> — Halaman ini mencatat setiap aktivitas penting:
            login, penyimpanan dokumen (kwitansi, BAST, SP), dan perubahan data. Data bersifat{" "}
            <span className="font-semibold">read-only</span> dan tidak dapat diedit.
          </div>
        </div>

        {/* Activity Table */}
        <ActivityLogTable
          initialItems={initialLogs.items}
          initialTotal={initialLogs.total}
        />
      </main>

      <footer className="w-full bg-slate-950 border-t border-slate-800/80 py-4 px-4 sm:px-8 text-xs text-slate-400">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="font-semibold text-amber-400">E-LPJ Hibah</span>
          <span>Riwayat Aktivitas & Audit Trail © 2026</span>
        </div>
      </footer>
    </div>
  );
}