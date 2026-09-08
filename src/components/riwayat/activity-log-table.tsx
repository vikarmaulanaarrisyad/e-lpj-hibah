"use client";

import { useState, useCallback, useTransition } from "react";
import {
  Activity,
  AlertTriangle,
  Info,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Clock,
} from "lucide-react";
import { getUserActivityLogsAction } from "@/app/actions/user-activity.action";

interface LogEntry {
  id: string;
  level: string;
  action: string;
  message: string;
  details?: string | null;
  endpoint?: string | null;
  createdAt: string | Date;
}

interface ActivityLogTableProps {
  initialItems: LogEntry[];
  initialTotal: number;
}

const LEVEL_BADGE: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  INFO: {
    bg: "bg-blue-900/40 border-blue-700/50",
    text: "text-blue-300",
    icon: <Info className="w-3 h-3" />,
  },
  WARN: {
    bg: "bg-amber-900/40 border-amber-700/50",
    text: "text-amber-300",
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  ERROR: {
    bg: "bg-red-900/40 border-red-700/50",
    text: "text-red-300",
    icon: <XCircle className="w-3 h-3" />,
  },
};

const ACTION_LABELS: Record<string, string> = {
  USER_LOGIN: "Login Akun",
  USER_REGISTERED: "Pendaftaran Akun",
  AUTH_LOGIN_FAILED: "Gagal Login",
  KWITANSI_SAVED: "Simpan Kwitansi",
  KWITANSI_UPDATED: "Perbarui Kwitansi",
  KWITANSI_DELETED: "Hapus Kwitansi",
  REGISTRATION_REJECTED: "Pendaftaran Ditolak",
  BAST_SAVED: "Simpan BAST",
  SP_SAVED: "Simpan Surat Pesanan",
};

const PAGE_SIZE = 25;

export function ActivityLogTable({ initialItems, initialTotal }: ActivityLogTableProps) {
  const [items, setItems] = useState<LogEntry[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("ALL");
  const [page, setPage] = useState(0);
  const [isPending, startTransition] = useTransition();

  const fetchLogs = useCallback((newSearch: string, newLevel: string, newPage: number) => {
    startTransition(async () => {
      const res = await getUserActivityLogsAction({
        search: newSearch || undefined,
        level: newLevel === "ALL" ? undefined : newLevel,
        limit: PAGE_SIZE,
        offset: newPage * PAGE_SIZE,
      });
      if (res.success && res.data) {
        setItems(res.data.items as LogEntry[]);
        setTotal(res.data.total);
      }
    });
  }, []);

  const handleSearch = (v: string) => { setSearch(v); setPage(0); fetchLogs(v, level, 0); };
  const handleLevel = (v: string) => { setLevel(v); setPage(0); fetchLogs(search, v, 0); };
  const handlePage = (p: number) => { setPage(p); fetchLogs(search, level, p); };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatDate = (d: string | Date) =>
    new Date(d).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Cari aktivitas, pesan, atau aksi..."
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-600 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1 shrink-0">
          {["ALL", "INFO", "WARN", "ERROR"].map((l) => (
            <button
              key={l}
              onClick={() => handleLevel(l)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                level === l
                  ? l === "ALL"
                    ? "bg-slate-700 text-white"
                    : l === "INFO"
                    ? "bg-blue-900/80 text-blue-300 border border-blue-700/50"
                    : l === "WARN"
                    ? "bg-amber-900/80 text-amber-300 border border-amber-700/50"
                    : "bg-red-900/80 text-red-300 border border-red-700/50"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {l === "ALL" ? `Semua (${total})` : l}
            </button>
          ))}
        </div>
        <button
          onClick={() => fetchLogs(search, level, page)}
          disabled={isPending}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition-all disabled:opacity-50"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800">
              <th className="px-4 py-3 text-left text-slate-400 font-semibold">Waktu</th>
              <th className="px-4 py-3 text-left text-slate-400 font-semibold">Level</th>
              <th className="px-4 py-3 text-left text-slate-400 font-semibold">Aksi</th>
              <th className="px-4 py-3 text-left text-slate-400 font-semibold">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-slate-400">
                  <RefreshCcw className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Memuat riwayat...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-16">
                  <Activity className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm font-medium">Belum ada riwayat aktivitas</p>
                  <p className="text-slate-600 text-xs mt-1">
                    Aktivitas akan tercatat saat Anda login, simpan, atau hapus dokumen.
                  </p>
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const badge = LEVEL_BADGE[item.level] || LEVEL_BADGE.INFO;
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors ${
                      idx % 2 === 0 ? "bg-slate-900/20" : ""
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3 h-3 shrink-0" />
                        {formatDate(item.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${badge.bg} ${badge.text}`}
                      >
                        {badge.icon}
                        {item.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-slate-300 text-[10px] bg-slate-800 px-2 py-0.5 rounded-lg">
                        {ACTION_LABELS[item.action] || item.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 max-w-sm">
                      <p className="truncate">{item.message}</p>
                      {item.endpoint && (
                        <p className="text-slate-500 font-mono text-[10px] mt-0.5">{item.endpoint}</p>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-slate-500">
            Menampilkan {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} dari {total} aktivitas
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePage(page - 1)}
              disabled={page === 0 || isPending}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => handlePage(page + 1)}
              disabled={page >= totalPages - 1 || isPending}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}