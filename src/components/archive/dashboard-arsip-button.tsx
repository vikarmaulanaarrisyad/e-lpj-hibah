"use client";

import { useState } from "react";
import { Package, Download, Sparkles } from "lucide-react";
import { DownloadArsipModal } from "./download-arsip-modal";

interface DashboardArsipButtonProps {
  currentTahun?: string;
  totalBerkas?: number;
}

export function DashboardArsipButton({
  currentTahun = "2026",
  totalBerkas = 0,
}: DashboardArsipButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-md">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                📦 Paket Arsip Lengkap LPJ ({currentTahun === "ALL" ? "Semua Tahun" : `TA ${currentTahun}`})
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Siap Audit</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Unduh seluruh berkas pertanggungjawaban (Cover, Pengantar, RAB, BKU, Kwitansi, SP, BAST) dalam satu file kompresi .ZIP.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-all shadow-md hover:shadow-amber-500/20 flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
        >
          <Download className="w-4 h-4 text-slate-950" />
          <span>Download Arsip (.ZIP)</span>
        </button>
      </div>

      <DownloadArsipModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialTahun={currentTahun}
      />
    </>
  );
}
