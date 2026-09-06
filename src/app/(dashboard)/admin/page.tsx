import { authService } from "@/services/auth.service";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { ShieldCheck, UserCheck, FileCheck, CheckSquare, Clock } from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await authService.getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 p-6 lg:p-10">
      {/* Top Navbar */}
      <header className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6 text-[#047857]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              E-LPJ Hibah
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300">
                Verifikator / Super Admin
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Portal Verifikasi Laporan Pertanggungjawaban Hibah Daerah
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-200">{session.name}</p>
            <p className="text-xs text-slate-400">{session.email}</p>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto mt-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-[#065F46]/20 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/40 text-emerald-300 text-xs font-medium mb-3">
              <UserCheck className="w-3.5 h-3.5" />
              Sesi Login Terverifikasi
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Selamat Datang, {session.name}
            </h2>
            <p className="mt-2 text-sm text-slate-300 max-w-2xl">
              Anda memiliki hak akses sebagai <strong>Verifikator / Super Admin</strong>. Anda dapat
              memeriksa validitas NPHD, mengecek anti-double-claim kwitansi, menyetujui, meminta revisi,
              atau menolak laporan pertanggungjawaban hibah.
            </p>

            <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-400">
              <div className="bg-slate-950/60 px-3.5 py-2 rounded-lg border border-slate-800">
                <span className="text-slate-500">NIP:</span>{" "}
                <span className="font-mono text-slate-300">{session.nip || "-"}</span>
              </div>
              <div className="bg-slate-950/60 px-3.5 py-2 rounded-lg border border-slate-800">
                <span className="text-slate-500">Instansi:</span>{" "}
                <span className="text-slate-300">{session.institution || "Sekretariat Daerah"}</span>
              </div>
              <div className="bg-slate-950/60 px-3.5 py-2 rounded-lg border border-slate-800">
                <span className="text-slate-500">Role:</span>{" "}
                <span className="font-mono text-emerald-400 font-semibold">{session.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Placeholder to confirm layer and UI */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">LPJ Menunggu Verifikasi</span>
              <Clock className="w-4 h-4 text-brand-tertiary" />
            </div>
            <p className="text-2xl font-bold text-white mt-3">12 Pengajuan</p>
            <p className="text-xs text-slate-500 mt-1">Perlu tindakan review verifikator</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">LPJ Disetujui</span>
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-3">48 Pengajuan</p>
            <p className="text-xs text-slate-500 mt-1">Telah lolos verifikasi berkas & SP2D</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total NPHD Aktif</span>
              <FileCheck className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-3">60 Lembaga</p>
            <p className="text-xs text-slate-500 mt-1">Tahun Anggaran 2026</p>
          </div>
        </div>
      </main>
    </div>
  );
}
