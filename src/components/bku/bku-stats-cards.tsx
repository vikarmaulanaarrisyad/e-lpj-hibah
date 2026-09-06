"use client";

import type { BkuSummary } from "@/types";
import { ArrowDownRight, ArrowUpRight, Wallet, PieChart } from "lucide-react";

interface BkuStatsCardsProps {
  summary: BkuSummary;
}

export function BkuStatsCards({ summary }: BkuStatsCardsProps) {
  const formatRupiah = (val: number) => {
    return "Rp " + val.toLocaleString("id-ID");
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Total Penerimaan (Debet) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-700/50 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Penerimaan (Debet)
          </span>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xl sm:text-2xl font-bold text-white font-mono tracking-tight">
            {formatRupiah(summary.totalPenerimaan)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Dana Hibah Cair & Pendapatan Kas</span>
          </div>
        </div>
      </div>

      {/* 2. Total Pengeluaran (Kredit) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-700/50 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Pengeluaran (Kredit)
          </span>
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xl sm:text-2xl font-bold text-white font-mono tracking-tight">
            {formatRupiah(summary.totalPengeluaran)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>{summary.jumlahKwitansi} Kwitansi Belanja Sah Terdaftar</span>
          </div>
        </div>
      </div>

      {/* 3. Saldo Kas Akhir */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-cyan-700/50 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Saldo Kas Berjalan
          </span>
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <p
            className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${
              summary.saldoAkhir >= 0 ? "text-cyan-300" : "text-red-400"
            }`}
          >
            {formatRupiah(summary.saldoAkhir)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400 font-medium">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                summary.saldoAkhir >= 0 ? "bg-cyan-400" : "bg-red-400"
              }`}
            ></span>
            <span>
              {summary.saldoAkhir >= 0 ? "Kas Seimbang / Surplus" : "Kas Defisit"}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Persentase Serapan Dana */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-700/50 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Serapan Realisasi LPJ
          </span>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <PieChart className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <p className="text-xl sm:text-2xl font-bold text-white font-mono tracking-tight">
              {summary.persentaseRealisasi.toFixed(1)}%
            </p>
            <span className="text-xs text-slate-400 font-medium">
              Target: 100%
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 mt-3 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, summary.persentaseRealisasi)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
