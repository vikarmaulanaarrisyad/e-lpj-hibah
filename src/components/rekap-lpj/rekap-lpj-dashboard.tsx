"use client";

import {
  Printer,
  ArrowLeft,
  FileText,
  Receipt as ReceiptIcon,
  Package,
  BarChart3,
  Wallet,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Building2,
  Camera,
} from "lucide-react";
import Link from "next/link";
import type { RabSummary, BkuSummary, Receipt, InstitutionProfile } from "@/types";

interface RekapLpjDashboardProps {
  institution: string;
  userName: string;
  profile: InstitutionProfile | null;
  activeTahun: string;
  rabSummary: RabSummary | null;
  bkuSummary: BkuSummary | null;
  receipts: Receipt[];
  bastCount: number;
  pesananCount: number;
}

function fRupiah(v: number) {
  return "Rp " + Math.round(v).toLocaleString("id-ID");
}

function fDate(d: Date | string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function RekapLpjDashboard({
  institution,
  userName,
  profile,
  activeTahun,
  rabSummary,
  bkuSummary,
  receipts,
  bastCount,
  pesananCount,
}: RekapLpjDashboardProps) {
  const totalAnggaran = rabSummary?.totalAnggaran || 0;
  const totalRealisasi = rabSummary?.totalRealisasi || bkuSummary?.totalPengeluaran || 0;
  const serapan = totalAnggaran > 0 ? Math.round((totalRealisasi / totalAnggaran) * 1000) / 10 : 0;
  const sisaPagu = totalAnggaran - totalRealisasi;

  const handlePrint = () => window.print();

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8 space-y-6 print:px-0 print:py-0 print:space-y-4">
      {/* Top Toolbar — no-print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <Link
            href="/user"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Rekapitulasi LPJ Final</h1>
              <p className="text-xs text-slate-400">
                {activeTahun === "ALL" ? "Semua Tahun Anggaran" : `Tahun Anggaran ${activeTahun}`}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-all shadow-lg shadow-amber-900/30"
        >
          <Printer className="w-4 h-4" />
          Cetak / Download PDF
        </button>
      </div>

      {/* ===== PRINT HEADER ===== */}
      <div className="hidden print:block text-center mb-6 pb-4 border-b-2 border-slate-700">
        <p className="text-sm font-bold uppercase tracking-wide">{institution}</p>
        <p className="text-xs text-slate-500">{profile?.alamat || ""}</p>
        <p className="text-lg font-bold mt-3 uppercase">Rekapitulasi Laporan Pertanggungjawaban (LPJ)</p>
        <p className="text-sm">
          {activeTahun === "ALL" ? "Semua Tahun Anggaran" : `Tahun Anggaran ${activeTahun}`} — No. Reg:{" "}
          {profile?.noRegistrasi || "–"}
        </p>
      </div>

      {/* Institution Banner (screen only) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border border-slate-800 rounded-2xl p-5 relative overflow-hidden print:hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-base font-bold text-white">{institution}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              No. Reg: <span className="font-mono text-amber-300">{profile?.noRegistrasi || "–"}</span>
            </p>
            <p className="text-xs text-slate-400">
              Ketua: {profile?.namaKetua || "–"} • Bendahara: {profile?.namaBendahara || userName}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 print:grid-cols-5 print:gap-2">
        {[
          { label: "Total Pagu RAB", value: fRupiah(totalAnggaran), icon: <Wallet className="w-4 h-4" />, color: "text-emerald-400" },
          { label: "Total Realisasi", value: fRupiah(totalRealisasi), icon: <TrendingDown className="w-4 h-4" />, color: "text-amber-400" },
          { label: "Sisa Pagu", value: fRupiah(sisaPagu), icon: <BarChart3 className="w-4 h-4" />, color: sisaPagu < 0 ? "text-red-400" : "text-blue-400" },
          { label: "Serapan", value: `${serapan}%`, icon: <CheckCircle2 className="w-4 h-4" />, color: serapan >= 80 ? "text-emerald-400" : "text-amber-400" },
          { label: "Kwitansi", value: receipts.length.toString(), icon: <ReceiptIcon className="w-4 h-4" />, color: "text-slate-300" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 print:rounded-md print:border print:border-slate-300 print:bg-white print:p-3">
            <div className={`${color} mb-2`}>{icon}</div>
            <p className={`text-lg font-bold font-mono ${color} print:text-slate-900`}>{value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 print:text-slate-600">{label}</p>
          </div>
        ))}
      </div>

      {/* Serapan Progress Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 print:rounded-md print:border print:border-slate-300 print:bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white print:text-slate-900">Progres Serapan Anggaran</h2>
          <span className={`text-sm font-bold ${serapan >= 80 ? "text-emerald-400" : serapan >= 50 ? "text-amber-400" : "text-red-400"}`}>
            {serapan}%
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-3 print:bg-slate-200">
          <div
            className={`h-3 rounded-full transition-all ${serapan >= 80 ? "bg-emerald-500" : serapan >= 50 ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${Math.min(serapan, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1 print:text-slate-600">
          <span>Realisasi: {fRupiah(totalRealisasi)}</span>
          <span>Pagu: {fRupiah(totalAnggaran)}</span>
        </div>
      </div>

      {/* RAB per Pos */}
      {rabSummary?.items && rabSummary.items.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 print:rounded-md print:border print:border-slate-300 print:bg-white">
          <h2 className="text-sm font-bold text-white mb-4 print:text-slate-900">Realisasi per Pos RAB</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 print:border-slate-300">
                  <th className="pb-2 text-left text-slate-400 print:text-slate-600 font-semibold">Kode</th>
                  <th className="pb-2 text-left text-slate-400 print:text-slate-600 font-semibold">Uraian</th>
                  <th className="pb-2 text-right text-slate-400 print:text-slate-600 font-semibold">Pagu</th>
                  <th className="pb-2 text-right text-slate-400 print:text-slate-600 font-semibold">Realisasi</th>
                  <th className="pb-2 text-right text-slate-400 print:text-slate-600 font-semibold">Sisa</th>
                  <th className="pb-2 text-center text-slate-400 print:text-slate-600 font-semibold">%</th>
                </tr>
              </thead>
              <tbody>
                {rabSummary.items.map((item) => {
                  const pct = item.persentaseSerapan ?? (item.anggaran > 0 ? Math.round((item.realisasi / item.anggaran) * 100) : 0);
                  const isDefisit = item.sisaPagu < 0;
                  return (
                    <tr key={item.id} className="border-b border-slate-800/50 print:border-slate-200">
                      <td className="py-2 font-mono text-slate-400 print:text-slate-500">{item.kode}</td>
                      <td className="py-2 text-slate-200 print:text-slate-900">{item.nama}</td>
                      <td className="py-2 text-right font-mono text-slate-300 print:text-slate-700">{fRupiah(item.anggaran)}</td>
                      <td className="py-2 text-right font-mono text-amber-400 print:text-slate-900 font-semibold">{fRupiah(item.realisasi)}</td>
                      <td className={`py-2 text-right font-mono font-semibold ${isDefisit ? "text-red-400" : "text-emerald-400"} print:text-slate-900`}>
                        {fRupiah(item.sisaPagu)}
                      </td>
                      <td className="py-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isDefisit ? "bg-red-900/50 text-red-300" :
                          pct >= 100 ? "bg-emerald-900/50 text-emerald-300" :
                          pct >= 50 ? "bg-amber-900/50 text-amber-300" : "bg-blue-900/50 text-blue-300"
                        } print:bg-transparent print:text-slate-900`}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-700 print:border-slate-400">
                  <td colSpan={2} className="pt-3 font-bold text-slate-200 print:text-slate-900">TOTAL</td>
                  <td className="pt-3 text-right font-bold font-mono text-emerald-400 print:text-slate-900">{fRupiah(totalAnggaran)}</td>
                  <td className="pt-3 text-right font-bold font-mono text-amber-400 print:text-slate-900">{fRupiah(totalRealisasi)}</td>
                  <td className={`pt-3 text-right font-bold font-mono ${sisaPagu < 0 ? "text-red-400" : "text-blue-400"} print:text-slate-900`}>{fRupiah(sisaPagu)}</td>
                  <td className="pt-3 text-center font-bold text-slate-300 print:text-slate-900">{serapan}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Dokumen Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Kwitansi Bukti Pengeluaran", count: receipts.length, icon: <ReceiptIcon className="w-4 h-4" />, color: "text-amber-400" },
          { label: "Berita Acara Serah Terima (BAST)", count: bastCount, icon: <FileText className="w-4 h-4" />, color: "text-blue-400" },
          { label: "Surat Pesanan (SP/SPK)", count: pesananCount, icon: <Package className="w-4 h-4" />, color: "text-purple-400" },
        ].map(({ label, count, icon, color }) => (
          <div key={label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 print:rounded-md print:border print:border-slate-300 print:bg-white">
            <div className={`${color}`}>{icon}</div>
            <div>
              <p className={`text-2xl font-bold ${color} print:text-slate-900`}>{count}</p>
              <p className="text-xs text-slate-400 print:text-slate-600">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Daftar Kwitansi */}
      {receipts.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 print:rounded-md print:border print:border-slate-300 print:bg-white">
          <h2 className="text-sm font-bold text-white mb-4 print:text-slate-900">
            Daftar Kwitansi Bukti Pengeluaran ({receipts.length} dokumen)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 print:border-slate-300">
                  <th className="pb-2 text-left text-slate-400 font-semibold">No.</th>
                  <th className="pb-2 text-left text-slate-400 font-semibold">No. Kwitansi</th>
                  <th className="pb-2 text-left text-slate-400 font-semibold">Tanggal</th>
                  <th className="pb-2 text-left text-slate-400 font-semibold">Uraian</th>
                  <th className="pb-2 text-left text-slate-400 font-semibold">Penerima</th>
                  <th className="pb-2 text-right text-slate-400 font-semibold">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r, i) => (
                  <tr key={r.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 print:border-slate-200">
                    <td className="py-2 text-slate-500">{i + 1}.</td>
                    <td className="py-2 font-mono text-slate-300 print:text-slate-700">{r.nomorBukti}</td>
                    <td className="py-2 text-slate-400 whitespace-nowrap print:text-slate-600">{fDate(r.tanggal)}</td>
                    <td className="py-2 text-slate-300 max-w-xs print:text-slate-900">
                      <p className="truncate">{r.uraian}</p>
                    </td>
                    <td className="py-2 text-slate-400 print:text-slate-600">{r.penerima}</td>
                    <td className="py-2 text-right font-mono font-bold text-amber-400 whitespace-nowrap print:text-slate-900">
                      {fRupiah(r.nominal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-700 print:border-slate-400">
                  <td colSpan={5} className="pt-3 font-bold text-slate-200 print:text-slate-900">TOTAL PENGELUARAN</td>
                  <td className="pt-3 text-right font-bold font-mono text-amber-400 print:text-slate-900">
                    {fRupiah(receipts.reduce((s, r) => s + r.nominal, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ===== AKSES CEPAT EXPORT DOKUMEN (no-print) ===== */}
      <div className="no-print bg-slate-900/60 border border-slate-700/60 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Akses Cepat Export Dokumen</h2>
            <p className="text-[11px] text-slate-400">Klik untuk langsung membuka halaman export PDF tiap dokumen LPJ</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Kwitansi */}
          <Link
            href="/user/arsip"
            className="group flex flex-col items-center gap-2.5 p-4 bg-amber-950/20 hover:bg-amber-900/30 border border-amber-800/30 hover:border-amber-600/50 rounded-xl transition-all duration-200 text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 group-hover:border-amber-500/40 flex items-center justify-center transition-colors">
              <ReceiptIcon className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-300 group-hover:text-amber-200">Kwitansi</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Bukti Pengeluaran</p>
            </div>
            <span className="text-[10px] font-mono text-amber-500/70 bg-amber-900/20 px-2 py-0.5 rounded-full">
              {receipts.length} dokumen
            </span>
          </Link>

          {/* Surat Pesanan */}
          <Link
            href="/user/arsip"
            className="group flex flex-col items-center gap-2.5 p-4 bg-purple-950/20 hover:bg-purple-900/30 border border-purple-800/30 hover:border-purple-600/50 rounded-xl transition-all duration-200 text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 group-hover:border-purple-500/40 flex items-center justify-center transition-colors">
              <Package className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-purple-300 group-hover:text-purple-200">Surat Pesanan</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">SP / SPK Pengadaan</p>
            </div>
            <span className="text-[10px] font-mono text-purple-500/70 bg-purple-900/20 px-2 py-0.5 rounded-full">
              {pesananCount} dokumen
            </span>
          </Link>

          {/* Berita Acara (BAST) */}
          <Link
            href="/user/arsip"
            className="group flex flex-col items-center gap-2.5 p-4 bg-blue-950/20 hover:bg-blue-900/30 border border-blue-800/30 hover:border-blue-600/50 rounded-xl transition-all duration-200 text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 group-hover:border-blue-500/40 flex items-center justify-center transition-colors">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-300 group-hover:text-blue-200">Berita Acara</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">BAST Serah Terima</p>
            </div>
            <span className="text-[10px] font-mono text-blue-500/70 bg-blue-900/20 px-2 py-0.5 rounded-full">
              {bastCount} dokumen
            </span>
          </Link>

          {/* Foto Dokumentasi */}
          <Link
            href="/user/arsip"
            className="group flex flex-col items-center gap-2.5 p-4 bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-800/30 hover:border-emerald-600/50 rounded-xl transition-all duration-200 text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:border-emerald-500/40 flex items-center justify-center transition-colors">
              <Camera className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-300 group-hover:text-emerald-200">Foto Dokumentasi</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Lembar Dokumentasi</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-500/70 bg-emerald-900/20 px-2 py-0.5 rounded-full">
              Buka →
            </span>
          </Link>
        </div>

        <p className="text-[10px] text-slate-500 text-center pt-1">
          💡 Klik kartu di atas untuk membuka daftar arsip dan mencetak ulang dokumen PDF yang diinginkan
        </p>
      </div>

      {/* Signature area for print */}

      <div className="hidden print:grid grid-cols-3 gap-8 mt-10 pt-6 border-t border-slate-700">
        {["Dibuat Oleh Bendahara", "Mengetahui Ketua", "Verifikasi / Pemeriksa"].map((label) => (
          <div key={label} className="text-center text-xs text-slate-600">
            <p className="font-semibold mb-16">{label}</p>
            <p className="border-t border-slate-400 pt-2">(................................................)</p>
          </div>
        ))}
      </div>

      {/* Warning banner if no data */}
      {totalAnggaran === 0 && (
        <div className="bg-amber-950/20 border border-amber-800/30 rounded-2xl p-4 flex items-start gap-3 no-print">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-200/80">
            <span className="font-semibold text-amber-300">Pagu Anggaran Belum Diisi</span> — Silakan isi data RAB
            terlebih dahulu di modul{" "}
            <Link href="/user/rab" className="underline text-amber-400 hover:text-amber-300">
              Pagu Anggaran RAB
            </Link>{" "}
            agar rekapitulasi dapat dihitung secara akurat.
          </div>
        </div>
      )}
    </div>
  );
}