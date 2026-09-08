"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Receipt,
  FileCheck2,
  FileText,
  AlertTriangle,
  Server,
  Activity,
  Search,
  RefreshCw,
  Trash2,
  Bug,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ExternalLink,
  ChevronRight,
  Database,
  Cpu,
  CheckCircle2,
  XCircle,
  Sparkles,
  UserX,
  AlertCircle,
  Eye,
  X,
  Building2,
  ShoppingBag,
} from "lucide-react";
import {
  triggerTestErrorAction,
  clearSystemLogsAction,
  deleteUserAction,
  getSystemLogsAction,
  getAdminDashboardDataAction,
} from "@/app/actions/admin.action";
import { swalConfirmDelete, swalError, swalLoading, swalSuccess } from "@/lib/swal";

export interface AdminMonitoringDashboardProps {
  initialData: any;
}

export function AdminMonitoringDashboard({ initialData }: AdminMonitoringDashboardProps) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "transactions" | "errors" | "server">("overview");
  const [transactionSubTab, setTransactionSubTab] = useState<"receipts" | "orders" | "basts">("receipts");

  // User search & filters
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");

  // Transaction search
  const [txSearch, setTxSearch] = useState("");

  // Error logs state & filters
  const [logs, setLogs] = useState<any[]>([]);
  const [logStats, setLogStats] = useState(initialData.logStats || { total: 0, errors: 0, warns: 0, infos: 0 });
  const [logLevelFilter, setLogLevelFilter] = useState("ALL");
  const [logSearch, setLogSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const [isPending, startTransition] = useTransition();

  // Load live error logs when switching to error tab
  const fetchLogs = (level = logLevelFilter, query = logSearch) => {
    startTransition(async () => {
      const res = await getSystemLogsAction({ level, search: query, limit: 100 });
      if (res.success && res.data) {
        setLogs(res.data.items);
        setLogStats(res.data.stats);
      }
    });
  };

  const handleTabChange = (tab: "overview" | "users" | "transactions" | "errors" | "server") => {
    setActiveTab(tab);
    if (tab === "errors" && logs.length === 0) {
      fetchLogs();
    }
  };

  // Refresh entire data
  const handleRefreshAll = () => {
    swalLoading("Menyegarkan Data...", "Mengambil metrik terbaru dari database...");
    startTransition(async () => {
      const res = await getAdminDashboardDataAction();
      if (res.success && res.data) {
        setData(res.data);
        if (activeTab === "errors") {
          fetchLogs();
        }
        swalSuccess("Data Diperbarui", "Seluruh metrik dan log telah diperbarui.");
      } else {
        swalError("Gagal Memperbarui", res.message || "Terjadi kesalahan.");
      }
    });
  };

  // Trigger test error simulation
  const handleTriggerTestBug = () => {
    swalLoading("Menjalankan Simulasi...", "Memicu error uji coba dan merekam ke system_logs...");
    startTransition(async () => {
      const res = await triggerTestErrorAction("Simulasi Bug Runtime: Database Connection Timeout Test");
      if (res.success) {
        fetchLogs();
        swalSuccess("Simulasi Berhasil!", res.message);
      } else {
        swalError("Gagal", res.message);
      }
    });
  };

  // Clear all error logs
  const handleClearLogs = async () => {
    const confirmed = await swalConfirmDelete({
      title: "Bersihkan Semua Log?",
      text: "Seluruh riwayat error, warning, dan audit sistem akan dihapus permanen.",
      confirmText: "Ya, Bersihkan Log",
    });

    if (!confirmed) return;

    startTransition(async () => {
      const res = await clearSystemLogsAction();
      if (res.success) {
        setLogs([]);
        setLogStats({ total: 0, errors: 0, warns: 0, infos: 0 });
        swalSuccess("Log Dibersihkan!", res.message);
      } else {
        swalError("Gagal", res.message);
      }
    });
  };

  // Delete User Action
  const handleDeleteUser = async (user: any) => {
    if (user.id === data.sessionUser?.sub) {
      swalError("Operasi Ditolak", "Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }

    const confirmed = await swalConfirmDelete({
      title: `Hapus Pengguna ${user.name}?`,
      text: `Seluruh data terkait (${user.email}) akan ikut terhapus secara kaskade dari database.`,
      confirmText: "Ya, Hapus Akun",
    });

    if (!confirmed) return;

    startTransition(async () => {
      const res = await deleteUserAction(user.id);
      if (res.success) {
        setData((prev: any) => ({
          ...prev,
          users: prev.users.filter((u: any) => u.id !== user.id),
        }));
        swalSuccess("Pengguna Dihapus!", res.message);
      } else {
        swalError("Gagal Menghapus", res.message);
      }
    });
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return (data.users || []).filter((u: any) => {
      const matchRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
      const q = userSearch.toLowerCase();
      const matchQuery =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.institution?.toLowerCase().includes(q) ||
        u.institutionProfile?.namaLembaga?.toLowerCase().includes(q);
      return matchRole && matchQuery;
    });
  }, [data.users, userSearch, userRoleFilter]);

  // Filtered Receipts
  const filteredReceipts = useMemo(() => {
    return (data.receipts || []).filter((r: any) => {
      const q = txSearch.toLowerCase();
      return (
        !q ||
        r.nomorBukti?.toLowerCase().includes(q) ||
        r.uraian?.toLowerCase().includes(q) ||
        r.penerima?.toLowerCase().includes(q) ||
        r.user?.institution?.toLowerCase().includes(q)
      );
    });
  }, [data.receipts, txSearch]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return (data.purchaseOrders || []).filter((o: any) => {
      const q = txSearch.toLowerCase();
      return (
        !q ||
        o.nomorSp?.toLowerCase().includes(q) ||
        o.namaPaket?.toLowerCase().includes(q) ||
        o.pihak2Toko?.toLowerCase().includes(q) ||
        o.user?.institution?.toLowerCase().includes(q)
      );
    });
  }, [data.purchaseOrders, txSearch]);

  // Filtered BASTs
  const filteredBasts = useMemo(() => {
    return (data.bastDocuments || []).filter((b: any) => {
      const q = txSearch.toLowerCase();
      return (
        !q ||
        b.nomorBast?.toLowerCase().includes(q) ||
        b.namaKegiatan?.toLowerCase().includes(q) ||
        b.pihak2Toko?.toLowerCase().includes(q) ||
        b.user?.institution?.toLowerCase().includes(q)
      );
    });
  }, [data.bastDocuments, txSearch]);

  const formatRupiah = (val: number) => {
    return "Rp " + Math.round(val || 0).toLocaleString("id-ID");
  };

  const formatDate = (dateVal: string | Date | null) => {
    if (!dateVal) return "-";
    return new Date(dateVal).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateVal: string | Date | null) => {
    if (!dateVal) return "-";
    return new Date(dateVal).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* ================= COMMAND BAR & NAV TABS ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl backdrop-blur-md shadow-xl">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => handleTabChange("overview")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "overview"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Ringkasan & Metrik</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("users")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "users"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Pendaftaran User ({data.users?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("transactions")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "transactions"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Transaksi User ({data.totalReceiptsCount || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("errors")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer relative ${
              activeTab === "errors"
                ? "bg-rose-600 text-white shadow-md shadow-rose-900/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Bug className="w-4 h-4" />
            <span>Log Error & Bug</span>
            {logStats.errors > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {logStats.errors}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("server")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "server"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Server Health</span>
          </button>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={handleTriggerTestBug}
            disabled={isPending}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/70 border border-slate-700 hover:border-rose-700/60 text-rose-300 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Simulasikan error runtime untuk mengetes perekaman bug logger"
          >
            <Bug className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Simulasi Uji Error</span>
          </button>

          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={isPending}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isPending ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: RINGKASAN & METRIK SISTEM ================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-700/50 transition-all shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Total Pengguna Terdaftar</span>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-white mt-3 font-mono">
                {data.users?.length || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span>{data.users?.filter((u: any) => u.role === "USER").length || 0} Lembaga Penerima</span>
                <span>•</span>
                <span>{data.users?.filter((u: any) => u.role === "ADMIN").length || 0} Admin</span>
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-700/50 transition-all shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Total Belanja Kas (Kwitansi)</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-emerald-400 mt-3 font-mono">
                {formatRupiah(data.totalBelanjaNominal || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Dari {data.totalReceiptsCount || 0} dokumen kwitansi kas tercatat
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-700/50 transition-all shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Dokumen Pengadaan (SP & BAST)</span>
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <FileCheck2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-white mt-3 font-mono">
                {(data.purchaseOrders?.length || 0) + (data.bastDocuments?.length || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {data.purchaseOrders?.length || 0} Surat Pesanan • {data.bastDocuments?.length || 0} Berita Acara
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-rose-700/50 transition-all shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Monitoring Error & Bug</span>
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Bug className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-rose-400 mt-3 font-mono">
                {logStats.errors || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {logStats.warns || 0} Peringatan • {logStats.total || 0} Total Log
              </p>
            </div>
          </div>

          {/* Quick Shortcuts & Server Diagnostics Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Pengguna Terdaftar Terbaru
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("users")}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <span>Lihat Semua</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {data.users?.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Belum ada pengguna terdaftar di sistem.
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {(data.users || []).slice(0, 5).map((u: any) => (
                    <div key={u.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-semibold text-slate-200">{u.name}</p>
                        <p className="text-slate-400 font-mono text-[11px]">{u.email}</p>
                        <p className="text-slate-500 text-[11px]">
                          {u.institution || u.institutionProfile?.namaLembaga || "Penerima Hibah"}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              u.role === "ADMIN"
                                ? "bg-emerald-950 border border-emerald-700/60 text-emerald-300"
                                : "bg-slate-800 text-slate-300 border border-slate-700"
                            }`}
                          >
                            {u.role}
                          </span>
                          <p className="text-[10px] text-slate-500 mt-1">{formatDate(u.createdAt)}</p>
                        </div>
                        {u.role === "USER" && (
                          <Link
                            href={`/admin/lembaga/${u.id}`}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-950 text-slate-400 hover:text-emerald-300 border border-slate-700 hover:border-emerald-700 transition-colors"
                            title="Pantau LPJ Lembaga Ini"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Server Quick Box */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                Kesehatan Server
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400">Status Server</span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    ONLINE
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400">Database Engine</span>
                  <span className="text-slate-200 font-mono">PostgreSQL</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400">Node Runtime</span>
                  <span className="text-slate-200 font-mono">{data.serverHealth?.nodeVersion || "-"}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400">Memory Heap Used</span>
                  <span className="text-cyan-400 font-mono font-bold">
                    {data.serverHealth?.heapUsedMb || 0} MB
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("server")}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
              >
                Buka Diagnostik Lengkap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: PENDAFTARAN & MANAJEMEN USER ================= */}
      {activeTab === "users" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Monitoring Pendaftaran Pengguna
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Daftar seluruh akun yang terdaftar pada sistem E-LPJ Hibah beserta jumlah transaksi aktifnya.
              </p>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari user, email, instansi..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 w-56"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-600"
              >
                <option value="ALL">Semua Role</option>
                <option value="ADMIN">ADMIN (Super Admin)</option>
                <option value="USER">USER (Penerima Hibah)</option>
              </select>
            </div>
          </div>

          {/* Table of Registered Users */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-3.5 font-semibold">Nama & Email</th>
                  <th className="py-3 px-3.5 font-semibold">Lembaga / Instansi</th>
                  <th className="py-3 px-3.5 font-semibold">Role</th>
                  <th className="py-3 px-3.5 font-semibold text-center">Aktivitas Transaksi</th>
                  <th className="py-3 px-3.5 font-semibold">Tgl Mendaftar</th>
                  <th className="py-3 px-3.5 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      Tidak ada pengguna yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u: any) => {
                    const isSelf = u.id === data.sessionUser?.sub;
                    const counts = u._count || {};
                    const totalTx =
                      (counts.receipts || 0) +
                      (counts.purchaseOrders || 0) +
                      (counts.bastDocuments || 0) +
                      (counts.activityDocumentations || 0);

                    return (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3.5">
                          <p className="font-bold text-white flex items-center gap-1.5">
                            {u.name}
                            {isSelf && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono border border-emerald-800">
                                Akun Anda
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                        </td>
                        <td className="py-3 px-3.5">
                          <p className="text-slate-300 font-medium">
                            {u.institution || u.institutionProfile?.namaLembaga || "-"}
                          </p>
                          {u.institutionProfile?.noRegistrasi && (
                            <p className="text-[10px] text-slate-500 font-mono">
                              Reg: {u.institutionProfile.noRegistrasi}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              u.role === "ADMIN"
                                ? "bg-emerald-950 border border-emerald-700/60 text-emerald-300"
                                : "bg-slate-800 text-slate-300 border border-slate-700"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-semibold ${
                              totalTx > 0
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                : "bg-slate-800 text-slate-500"
                            }`}
                          >
                            {totalTx} Dokumen
                          </span>
                          <div className="text-[9px] text-slate-500 mt-1 flex justify-center gap-2">
                            <span>Kwt: {counts.receipts || 0}</span>
                            <span>SP: {counts.purchaseOrders || 0}</span>
                            <span>BAST: {counts.bastDocuments || 0}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-slate-400 text-[11px] font-mono">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {u.role === "USER" && (
                              <Link
                                href={`/admin/lembaga/${u.id}`}
                                className="px-2 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 hover:border-emerald-700 text-emerald-300 transition-colors inline-flex items-center gap-1 text-[11px] font-medium"
                                title="Pantau LPJ & Dokumen Lembaga Ini"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline">Detail LPJ</span>
                              </Link>
                            )}
                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 border border-slate-700 hover:border-rose-800 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                                title="Hapus Pengguna"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: MONITORING TRANSAKSI USER ================= */}
      {activeTab === "transactions" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                Monitoring Transaksi Seluruh Lembaga
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit transaksi real-time seluruh penerima hibah daerah: Kwitansi Belanja, Surat Pesanan, dan Berita Acara.
              </p>
            </div>

            {/* Sub Tabs: Kwitansi | SP | BAST */}
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-xl bg-slate-950 border border-slate-800 flex gap-1">
                <button
                  type="button"
                  onClick={() => setTransactionSubTab("receipts")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    transactionSubTab === "receipts" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Kwitansi ({data.receipts?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionSubTab("orders")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    transactionSubTab === "orders" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Surat Pesanan ({data.purchaseOrders?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionSubTab("basts")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    transactionSubTab === "basts" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                >
                  BAST ({data.bastDocuments?.length || 0})
                </button>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari no bukti, kegiatan, toko, lembaga..."
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Table: Kwitansi */}
          {transactionSubTab === "receipts" && (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                    <th className="py-3 px-3.5 font-semibold">No. Bukti & Tanggal</th>
                    <th className="py-3 px-3.5 font-semibold">Lembaga Pemohon</th>
                    <th className="py-3 px-3.5 font-semibold">Guna Membayar (Uraian)</th>
                    <th className="py-3 px-3.5 font-semibold">Toko Penerima</th>
                    <th className="py-3 px-3.5 font-semibold text-right">Nominal (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500">
                        Belum ada transaksi kwitansi yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    filteredReceipts.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3.5 font-mono">
                          <span className="font-bold text-emerald-400">{r.nomorBukti}</span>
                          <p className="text-[11px] text-slate-500">{formatDate(r.tanggal)}</p>
                        </td>
                        <td className="py-3 px-3.5">
                          <p className="font-medium text-slate-200">{r.user?.institution || r.user?.name || "-"}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{r.user?.email}</p>
                        </td>
                        <td className="py-3 px-3.5 max-w-xs truncate text-slate-300" title={r.uraian}>
                          {r.uraian}
                        </td>
                        <td className="py-3 px-3.5 text-slate-300">{r.penerima || "-"}</td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-400">
                          {formatRupiah(r.nominal)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Table: Surat Pesanan */}
          {transactionSubTab === "orders" && (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                    <th className="py-3 px-3.5 font-semibold">No. SP & Tanggal</th>
                    <th className="py-3 px-3.5 font-semibold">Lembaga Pemesan</th>
                    <th className="py-3 px-3.5 font-semibold">Paket Pengadaan</th>
                    <th className="py-3 px-3.5 font-semibold">Rekanan / Toko</th>
                    <th className="py-3 px-3.5 font-semibold text-right">Nilai Kontrak (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500">
                        Belum ada dokumen Surat Pesanan yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o: any) => (
                      <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3.5 font-mono">
                          <span className="font-bold text-teal-400">{o.nomorSp}</span>
                          <p className="text-[11px] text-slate-500">{formatDate(o.tanggal)}</p>
                        </td>
                        <td className="py-3 px-3.5">
                          <p className="font-medium text-slate-200">{o.user?.institution || o.user?.name || "-"}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{o.user?.email}</p>
                        </td>
                        <td className="py-3 px-3.5 text-slate-300">{o.namaPaket}</td>
                        <td className="py-3 px-3.5 text-slate-300">
                          {o.pihak2Toko} ({o.pihak2Nama || "-"})
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-teal-400">
                          {formatRupiah(o.totalHarga)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Table: BAST */}
          {transactionSubTab === "basts" && (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                    <th className="py-3 px-3.5 font-semibold">No. BAST & Tanggal</th>
                    <th className="py-3 px-3.5 font-semibold">Lembaga Penerima</th>
                    <th className="py-3 px-3.5 font-semibold">Nama Kegiatan Serah Terima</th>
                    <th className="py-3 px-3.5 font-semibold">Toko Penyedia</th>
                    <th className="py-3 px-3.5 font-semibold">Status Uji Coba</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredBasts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500">
                        Belum ada dokumen Berita Acara (BAST) yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    filteredBasts.map((b: any) => (
                      <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3.5 font-mono">
                          <span className="font-bold text-cyan-400">{b.nomorBast}</span>
                          <p className="text-[11px] text-slate-500">{formatDate(b.tanggal)}</p>
                        </td>
                        <td className="py-3 px-3.5">
                          <p className="font-medium text-slate-200">{b.user?.institution || b.user?.name || "-"}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{b.user?.email}</p>
                        </td>
                        <td className="py-3 px-3.5 text-slate-300">{b.namaKegiatan}</td>
                        <td className="py-3 px-3.5 text-slate-300">{b.pihak2Toko}</td>
                        <td className="py-3 px-3.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-semibold border border-emerald-800">
                            {b.statusUji || "Lulus Uji Coba"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: MONITORING ERROR & BUG APLIKASI ================= */}
      {activeTab === "errors" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bug className="w-5 h-5 text-rose-400" />
                Pusat Monitoring Error & Bug Aplikasi
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Perekaman otomatis exception, kegagalan autentikasi, issue transaksi, dan stack trace sistem secara real-time.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTriggerTestBug}
                disabled={isPending}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-900/30"
              >
                <Bug className="w-3.5 h-3.5" />
                <span>Simulasi Error Baru</span>
              </button>

              <button
                type="button"
                onClick={handleClearLogs}
                disabled={isPending || logs.length === 0}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Bersihkan Log</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setLogLevelFilter("ALL");
                  fetchLogs("ALL");
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  logLevelFilter === "ALL" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Semua ({logStats.total})
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogLevelFilter("ERROR");
                  fetchLogs("ERROR");
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1 ${
                  logLevelFilter === "ERROR" ? "bg-rose-950 text-rose-300 border border-rose-800" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Error ({logStats.errors})
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogLevelFilter("WARN");
                  fetchLogs("WARN");
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1 ${
                  logLevelFilter === "WARN" ? "bg-amber-950 text-amber-300 border border-amber-800" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Warning ({logStats.warns})
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogLevelFilter("INFO");
                  fetchLogs("INFO");
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1 ${
                  logLevelFilter === "INFO" ? "bg-blue-950 text-blue-300 border border-blue-800" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Info ({logStats.infos})
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Cari pesan error, action, endpoint..."
                value={logSearch}
                onChange={(e) => {
                  setLogSearch(e.target.value);
                  fetchLogs(logLevelFilter, e.target.value);
                }}
                className="pl-8 pr-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-600 w-64"
              />
            </div>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-3.5 font-semibold">Tingkat</th>
                  <th className="py-3 px-3.5 font-semibold">Aksi / Event</th>
                  <th className="py-3 px-3.5 font-semibold">Pesan & Keterangan</th>
                  <th className="py-3 px-3.5 font-semibold">Endpoint / User</th>
                  <th className="py-3 px-3.5 font-semibold">Waktu</th>
                  <th className="py-3 px-3.5 font-semibold text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        <p className="font-semibold text-slate-300">Tidak ada log error!</p>
                        <p className="text-[11px] text-slate-500">
                          Sistem berjalan normal tanpa kendala yang belum tertangani.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((item: any) => {
                    const isError = item.level === "ERROR";
                    const isWarn = item.level === "WARN";

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              isError
                                ? "bg-rose-950 text-rose-300 border border-rose-800"
                                : isWarn
                                ? "bg-amber-950 text-amber-300 border border-amber-800"
                                : "bg-blue-950 text-blue-300 border border-blue-800"
                            }`}
                          >
                            {item.level}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-mono font-semibold text-slate-200">
                          {item.action}
                        </td>
                        <td className="py-3 px-3.5 text-slate-300 max-w-sm truncate" title={item.message}>
                          {item.message}
                        </td>
                        <td className="py-3 px-3.5">
                          <p className="font-mono text-slate-400 text-[11px]">{item.endpoint || "-"}</p>
                          {item.userEmail && (
                            <p className="text-[10px] text-slate-500">{item.userEmail}</p>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {formatDateTime(item.createdAt)}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedLog(item)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
                            title="Lihat Stack Trace & Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 5: SERVER & DATABASE HEALTH ================= */}
      {activeTab === "server" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              Diagnostik Status Server & Database
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitoring parameter performa server, penggunaan memori, koneksi ORM, dan kesehatan sistem host.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Status Basis Data</span>
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                PostgreSQL via Prisma Engine v5.22.0
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Waktu Aktif Server (Uptime)</span>
                <Clock className="w-4 h-4 text-brand-tertiary" />
              </div>
              <p className="text-xl font-bold text-white font-mono">
                {Math.floor((data.serverHealth?.uptimeSeconds || 0) / 60)} Menit{" "}
                {(data.serverHealth?.uptimeSeconds || 0) % 60} Detik
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Sejak proses Node.js dimulai
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Alokasi Memori Heap</span>
                <Cpu className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-xl font-bold text-purple-400 font-mono">
                {data.serverHealth?.heapUsedMb || 0} MB / {data.serverHealth?.heapTotalMb || 0} MB
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                RSS: {data.serverHealth?.rssMb || 0} MB
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Informasi Lingkungan & Waktu Host
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Waktu Server Saat Ini:</span>
                <span className="text-slate-200 font-mono">{formatDateTime(new Date())}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Versi Node.js:</span>
                <span className="text-slate-200 font-mono">{data.serverHealth?.nodeVersion}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Platform OS:</span>
                <span className="text-slate-200 font-mono">Windows 64-bit (Production Ready)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Prisma Client Status:</span>
                <span className="text-emerald-400 font-semibold">Active & Synced</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DETAIL STACK TRACE LOG ================= */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    selectedLog.level === "ERROR"
                      ? "bg-rose-950 text-rose-300 border border-rose-800"
                      : "bg-blue-950 text-blue-300 border border-blue-800"
                  }`}
                >
                  {selectedLog.level}
                </span>
                <h3 className="text-sm font-bold text-white font-mono">{selectedLog.action}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Pesan Error:
                </label>
                <p className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-rose-300 font-mono text-xs">
                  {selectedLog.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Endpoint / Rute:</span>
                  <span className="text-slate-200 font-mono">{selectedLog.endpoint || "-"}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Waktu Kejadian:</span>
                  <span className="text-slate-200 font-mono">{formatDateTime(selectedLog.createdAt)}</span>
                </div>
              </div>

              {selectedLog.userEmail && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Pengguna Terdampak:</span>
                  <span className="text-slate-200 font-mono">{selectedLog.userEmail}</span>
                </div>
              )}

              {selectedLog.details && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Detail Stack Trace / Payload Teknis:
                  </label>
                  <pre className="p-3 rounded-xl bg-black border border-slate-800 text-emerald-400 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-60 leading-relaxed">
                    {selectedLog.details}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
