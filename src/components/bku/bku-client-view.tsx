"use client";

import { useState, useTransition } from "react";
import type { BkuLedgerEntry, BkuSummary } from "@/types";
import { BkuStatsCards } from "@/components/bku/bku-stats-cards";
import { BkuTable } from "@/components/bku/bku-table";
import { BkuIncomeModal } from "@/components/bku/bku-income-modal";
import { getBkuLedgerAction, syncBkuReceiptsAction } from "@/app/actions/bku.action";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

interface BkuClientViewProps {
  initialEntries: BkuLedgerEntry[];
  initialSummary: BkuSummary;
  institutionName?: string;
  userName: string;
  leaderName?: string;
  treasurerName?: string;
}

export function BkuClientView({
  initialEntries,
  initialSummary,
  institutionName = "PIMPINAN RANTING FATAYAT NU DAWUHAN SELATAN",
  userName,
  leaderName = "HENI FUJIATI",
  treasurerName = "NUR ALIMAH",
}: BkuClientViewProps) {
  const [entries, setEntries] = useState<BkuLedgerEntry[]>(initialEntries);
  const [summary, setSummary] = useState<BkuSummary>(initialSummary);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleRefresh = async () => {
    startTransition(async () => {
      // Automatic sync unsynced receipts first
      await syncBkuReceiptsAction();
      const res = await getBkuLedgerAction();
      if (res.success && res.data) {
        setEntries(res.data.entries);
        setSummary(res.data.summary);
      }
    });
  };

  const handleForceSync = async () => {
    startTransition(async () => {
      const syncRes = await syncBkuReceiptsAction();
      const res = await getBkuLedgerAction();
      if (res.success && res.data) {
        setEntries(res.data.entries);
        setSummary(res.data.summary);
        setFeedback({
          type: "success",
          message: syncRes.message || "Buku Kas Umum berhasil disinkronisasi dengan seluruh kwitansi tersimpan.",
        });
      } else {
        setFeedback({
          type: "error",
          message: "Gagal memperbarui Buku Kas Umum.",
        });
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Feedback Alert if any */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl text-xs font-medium border no-print transition-all ${
            feedback.type === "success"
              ? "bg-emerald-950/80 border-emerald-700/60 text-emerald-300"
              : "bg-red-950/80 border-red-700/60 text-red-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Synchronize & Status Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 no-print">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            Buku Kas Umum (BKU) Otomatis
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/50 text-[10px] font-semibold">
              Live Real-Time
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Semua kwitansi yang disimpan di generator otomatis terhubung sebagai pengeluaran kas (kredit) dan memotong saldo secara kronologis.
          </p>
        </div>

        <button
          type="button"
          onClick={handleForceSync}
          disabled={isPending}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all border border-slate-700 flex items-center gap-2 disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin text-emerald-400" : "text-slate-400"}`} />
          <span>{isPending ? "Menyinkronkan..." : "Sinkronkan Kwitansi"}</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <BkuStatsCards summary={summary} />

      {/* Main Ledger Table, Search, Filter & Kas Opname */}
      <BkuTable
        entries={entries}
        summary={summary}
        institutionName={institutionName}
        leaderName={leaderName}
        treasurerName={treasurerName}
        onOpenIncomeModal={() => setIsIncomeModalOpen(true)}
        onRefresh={handleRefresh}
      />

      {/* Add Income (Debet / SP2D) Modal */}
      <BkuIncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
