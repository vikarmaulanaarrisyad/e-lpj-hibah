import type { Metadata } from "next";
import { authService } from "@/services/auth.service";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { ShieldCheck, UserCheck, Activity } from "lucide-react";
import { getAdminDashboardDataAction } from "@/app/actions/admin.action";
import { AdminMonitoringDashboard } from "@/components/admin/admin-monitoring-dashboard";

export const metadata: Metadata = {
  title: "Super Admin & Monitoring Sistem | E-LPJ Hibah",
  description: "Portal Pengawasan & Monitoring Error, Bug, Pendaftaran User, serta Transaksi Keuangan Hibah Daerah.",
};

export default async function AdminDashboardPage() {
  const session = await authService.getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const res = await getAdminDashboardDataAction();
  const dashboardData = res.data || {
    sessionUser: session,
    users: [],
    receipts: [],
    purchaseOrders: [],
    bastDocuments: [],
    totalBelanjaNominal: 0,
    totalReceiptsCount: 0,
    logStats: { total: 0, errors: 0, warns: 0, infos: 0 },
    serverHealth: {
      status: "ONLINE",
      uptimeSeconds: 0,
      nodeVersion: process.version,
      database: "PostgreSQL",
      heapUsedMb: 0,
      heapTotalMb: 0,
      rssMb: 0,
      serverTime: new Date().toISOString(),
    },
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Navbar Header */}
      <header className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/40">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">E-LPJ Hibah</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300">
                Super Admin / Pengawas Sistem
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pusat Monitoring Error Aplikasi, Bug Tracker, Pendaftaran Akun, dan Audit Transaksi Hibah
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-200">{session.name}</p>
            <p className="text-[11px] text-slate-400 font-mono">{session.email}</p>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1720px] mx-auto mt-6 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/40 text-emerald-300 text-[11px] font-medium mb-2">
                <UserCheck className="w-3.5 h-3.5" />
                Sesi Super Admin Aktif
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Selamat Datang, {session.name}
              </h2>
              <p className="mt-1 text-xs text-slate-300 max-w-2xl leading-relaxed">
                Anda berada di portal pengawasan pusat. Anda memiliki akses penuh untuk memantau pendaftaran lembaga,
                audit seluruh transaksi keuangan & pengadaan, diagnosa exception/bug runtime aplikasi, serta inspeksi status kesehatan server.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
              <div className="bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-500">NIP:</span>{" "}
                <span className="font-mono text-slate-300">{session.nip || "-"}</span>
              </div>
              <div className="bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-500">Instansi:</span>{" "}
                <span className="text-slate-300">{session.institution || "Pengawas Daerah"}</span>
              </div>
              <div className="bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-500">Akses:</span>{" "}
                <span className="font-mono text-emerald-400 font-bold">{session.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Interactive Monitoring Dashboard */}
        <AdminMonitoringDashboard initialData={dashboardData} />
      </main>
    </div>
  );
}
