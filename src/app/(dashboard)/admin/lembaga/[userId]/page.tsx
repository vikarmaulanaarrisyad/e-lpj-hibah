import type { Metadata } from "next";
import { authService } from "@/services/auth.service";
import { redirect, notFound } from "next/navigation";
import { getAdminLembagaDetailAction } from "@/app/actions/admin-lembaga.action";
import { LogoutButton } from "@/components/auth/logout-button";
import {
  ShieldCheck,
  ArrowLeft,
  Building2,
  Wallet,
  TrendingDown,
  Receipt,
  FileText,
  Package,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Detail Monitoring Lembaga | E-LPJ Hibah Admin",
  description: "Monitoring realisasi anggaran, transaksi, dan dokumen per lembaga penerima hibah.",
};

function formatRupiah(v: number) {
  return "Rp " + Math.round(v).toLocaleString("id-ID");
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AdminLembagaDetailPage({
  params,
}: {
  params: { userId: string };
}) {
  const session = await authService.getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const res = await getAdminLembagaDetailAction(params.userId);
  if (!res.success || !res.data) notFound();

  const { user, rabSummary, bkuSummary, recentReceipts, recentBast, recentPesanan } = res.data;

  const profile = user.institutionProfile;
  const institution = profile?.subNama
    ? `${profile.namaLembaga} ${profile.subNama}`
    : user.institution || user.name;

  const totalAnggaran = rabSummary?.totalAnggaran || 0;
  const totalRealisasi = rabSummary?.totalRealisasi || bkuSummary?.totalPengeluaran || 0;
  const serapan = totalAnggaran > 0 ? Math.round((totalRealisasi / totalAnggaran) * 1000) / 10 : 0;
  const sisaPagu = totalAnggaran - totalRealisasi;

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-white">E-LPJ Hibah</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-400">Detail Monitoring Lembaga</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto mt-6 space-y-6">
        {/* Institution Info Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/20 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{institution}</h2>
                <p className="text-sm text-slate-400">{user.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded-lg text-amber-300">
                    {profile?.noRegistrasi || "–"}
                  </span>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-lg text-slate-300">
                    Ketua: {profile?.namaKetua || user.leaderName || "–"}
                  </span>
                </div>
              </div>
            </div>
            {/* Doc Counts */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Kwitansi", val: user._count.receipts, icon: <Receipt className="w-3.5 h-3.5" /> },
                { label: "BAST", val: user._count.bastDocuments, icon: <FileText className="w-3.5 h-3.5" /> },
                { label: "Surat Pesanan", val: user._count.purchaseOrders, icon: <Package className="w-3.5 h-3.5" /> },
              ].map(({ label, val, icon }) => (
                <div key={label} className="text-center bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                  <div className="flex justify-center text-slate-400 mb-1">{icon}</div>
                  <p className="text-lg font-bold text-white">{val}</p>
                  <p className="text-[10px] text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Pagu RAB",
              value: formatRupiah(totalAnggaran),
              icon: <Wallet className="w-4 h-4" />,
              color: "text-emerald-400",
              bg: "bg-emerald-950/30 border-emerald-800/40",
            },
            {
              label: "Total Realisasi",
              value: formatRupiah(totalRealisasi),
              icon: <TrendingDown className="w-4 h-4" />,
              color: "text-amber-400",
              bg: "bg-amber-950/30 border-amber-800/40",
            },
            {
              label: "Sisa Pagu",
              value: formatRupiah(sisaPagu),
              icon: <BarChart3 className="w-4 h-4" />,
              color: sisaPagu < 0 ? "text-red-400" : "text-blue-400",
              bg: sisaPagu < 0 ? "bg-red-950/30 border-red-800/40" : "bg-blue-950/30 border-blue-800/40",
            },
            {
              label: "Serapan Anggaran",
              value: `${serapan}%`,
              icon: <BarChart3 className="w-4 h-4" />,
              color: serapan >= 80 ? "text-emerald-400" : serapan >= 50 ? "text-amber-400" : "text-red-400",
              bg: "bg-slate-800/60 border-slate-700/50",
            },
          ].map(({ label, value, icon, color, bg }) => (
            <div key={label} className={`rounded-2xl border p-5 ${bg}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400">{label}</span>
                <div className={`${color}`}>{icon}</div>
              </div>
              <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
              {label === "Serapan Anggaran" && (
                <div className="mt-2 w-full bg-slate-700/50 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      serapan >= 80 ? "bg-emerald-500" : serapan >= 50 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(serapan, 100)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* RAB per Pos */}
        {rabSummary?.items && rabSummary.items.length > 0 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Realisasi per Pos RAB
            </h3>
            <div className="space-y-3">
              {rabSummary.items.map((item: any) => {
                const pct = item.anggaran > 0 ? Math.min(Math.round((item.realisasi / item.anggaran) * 100), 100) : 0;
                return (
                  <div key={item.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-300">
                        <span className="font-mono text-slate-500 mr-2">{item.kode}</span>
                        {item.nama}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {formatRupiah(item.realisasi)} / {formatRupiah(item.anggaran)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Kwitansi */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              10 Kwitansi Terbaru
            </h3>
            <div className="space-y-2">
              {recentReceipts.length === 0 ? (
                <p className="text-slate-500 text-xs">Belum ada kwitansi.</p>
              ) : (
                recentReceipts.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                    <div>
                      <p className="text-xs font-mono text-slate-300">{r.nomorBukti}</p>
                      <p className="text-[10px] text-slate-500">{formatDate(r.tanggal)}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-400">
                      {formatRupiah(r.nominal)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent BAST */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              BAST Terbaru
            </h3>
            <div className="space-y-2">
              {recentBast.length === 0 ? (
                <p className="text-slate-500 text-xs">Belum ada BAST.</p>
              ) : (
                recentBast.map((b: any) => (
                  <div key={b.id} className="py-1.5 border-b border-slate-800/60">
                    <p className="text-xs font-mono text-slate-300">{b.nomorBast}</p>
                    <p className="text-[10px] text-slate-500">{b.namaKegiatan} · {formatDate(b.tanggal)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent SP */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-purple-400" />
              Surat Pesanan Terbaru
            </h3>
            <div className="space-y-2">
              {recentPesanan.length === 0 ? (
                <p className="text-slate-500 text-xs">Belum ada Surat Pesanan.</p>
              ) : (
                recentPesanan.map((p: any) => (
                  <div key={p.id} className="py-1.5 border-b border-slate-800/60">
                    <p className="text-xs font-mono text-slate-300">{p.nomorSp}</p>
                    <p className="text-[10px] text-slate-500">{p.namaPaket} · {formatDate(p.tanggal)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}