"use client";

import { useState, useTransition } from "react";
import type { RabSummary, RabStatusItem, Receipt } from "@/types";
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Plus,
  ArrowUpRight,
  Receipt as ReceiptIcon,
  Search,
  Filter,
  Layers,
  PieChart,
  DollarSign,
  ShieldCheck,
  Save,
  X,
  Loader2,
  PlusCircle,
  Trash2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  updateRabAllocationAction,
  createRabItemAction,
  deleteRabItemAction,
} from "@/app/actions/rab.action";

interface RabDashboardProps {
  initialSummary: RabSummary;
  receipts?: Receipt[];
  institutionName?: string;
  userName?: string;
}

export function RabDashboard({
  initialSummary,
  receipts = [],
  institutionName = "PR Fatayat NU Dawuhan Selatan",
  userName = "NUR ALIMAH",
}: RabDashboardProps) {
  const [summary, setSummary] = useState<RabSummary>(initialSummary);
  const [selectedKode, setSelectedKode] = useState<string>("ALL");
  const [editingItem, setEditingItem] = useState<RabStatusItem | null>(null);
  const [editPaguValue, setEditPaguValue] = useState<string>("");
  const [editKeterangan, setEditKeterangan] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal Tambah Pos Rekening RAB state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newKode, setNewKode] = useState<string>("");
  const [newNama, setNewNama] = useState<string>("");
  const [newAnggaran, setNewAnggaran] = useState<string>("");
  const [newKeterangan, setNewKeterangan] = useState<string>("");

  const formatRupiah = (val: number) => "Rp " + Math.round(val).toLocaleString("id-ID");

  const openAddModal = () => {
    // Generate rekomendasi kode rekening berikutnya
    const existingKodes = summary.items.map((it) => it.kode);
    let suggestedKode = "5.2.5";
    for (let i = 5; i <= 25; i++) {
      const candidate = `5.2.${i}`;
      if (!existingKodes.includes(candidate)) {
        suggestedKode = candidate;
        break;
      }
    }
    setNewKode(suggestedKode);
    setNewNama("");
    setNewAnggaran("");
    setNewKeterangan("");
    setFeedbackMsg(null);
    setIsAddModalOpen(true);
  };

  const handleCreateRab = () => {
    if (!newKode.trim()) {
      setFeedbackMsg({ type: "error", text: "Kode rekening pos RAB wajib diisi (contoh: 5.2.5)." });
      return;
    }
    if (!newNama.trim()) {
      setFeedbackMsg({ type: "error", text: "Nama pos rekening wajib diisi." });
      return;
    }
    const num = parseFloat(newAnggaran);
    if (isNaN(num) || num < 0) {
      setFeedbackMsg({ type: "error", text: "Pagu anggaran harus berupa nominal angka valid (>= 0)." });
      return;
    }

    startTransition(async () => {
      const res = await createRabItemAction({
        kode: newKode.trim(),
        nama: newNama.trim(),
        anggaran: num,
        keterangan: newKeterangan.trim(),
      });

      if (res.success && res.data) {
        setSummary((prev) => {
          const exists = prev.items.some((it) => it.kode === res.data!.kode);
          const updatedItems = exists
            ? prev.items.map((it) => (it.kode === res.data!.kode ? res.data! : it))
            : [...prev.items, res.data!].sort((a, b) => a.kode.localeCompare(b.kode));

          const totalAnggaran = updatedItems.reduce((acc, curr) => acc + curr.anggaran, 0);
          const totalRealisasi = updatedItems.reduce((acc, curr) => acc + curr.realisasi, 0);
          const totalSisaPagu = totalAnggaran - totalRealisasi;
          const persentaseSerapanTotal =
            totalAnggaran > 0 ? Math.round((totalRealisasi / totalAnggaran) * 1000) / 10 : 0;

          return {
            ...prev,
            totalAnggaran,
            totalRealisasi,
            totalSisaPagu,
            persentaseSerapanTotal,
            statusTotal: totalSisaPagu < 0 ? "DEFICIT" : persentaseSerapanTotal >= 80 ? "WARNING" : "SAFE",
            items: updatedItems,
          };
        });
        setFeedbackMsg({ type: "success", text: res.message });
        setTimeout(() => {
          setIsAddModalOpen(false);
          setFeedbackMsg(null);
        }, 1200);
      } else {
        setFeedbackMsg({ type: "error", text: res.message });
      }
    });
  };

  const handleDeleteRab = (item: RabStatusItem) => {
    if (
      !confirm(
        `Yakin ingin menghapus pos rekening "${item.kode} - ${item.nama}"? Tindakan ini hanya dapat dilakukan jika belum ada kwitansi yang menggunakan pos ini.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await deleteRabItemAction(item.id);
      if (res.success) {
        setSummary((prev) => {
          const updatedItems = prev.items.filter((it) => it.id !== item.id);
          const totalAnggaran = updatedItems.reduce((acc, curr) => acc + curr.anggaran, 0);
          const totalRealisasi = updatedItems.reduce((acc, curr) => acc + curr.realisasi, 0);
          const totalSisaPagu = totalAnggaran - totalRealisasi;
          const persentaseSerapanTotal =
            totalAnggaran > 0 ? Math.round((totalRealisasi / totalAnggaran) * 1000) / 10 : 0;

          return {
            ...prev,
            totalAnggaran,
            totalRealisasi,
            totalSisaPagu,
            persentaseSerapanTotal,
            statusTotal: totalSisaPagu < 0 ? "DEFICIT" : persentaseSerapanTotal >= 80 ? "WARNING" : "SAFE",
            items: updatedItems,
          };
        });
      } else {
        alert(res.message);
      }
    });
  };

  const openEditModal = (item: RabStatusItem) => {
    setEditingItem(item);
    setEditPaguValue(item.anggaran.toString());
    setEditKeterangan(item.keterangan || "");
    setFeedbackMsg(null);
  };

  const handleSavePagu = () => {
    if (!editingItem) return;
    const num = parseFloat(editPaguValue);
    if (isNaN(num) || num < 0) {
      setFeedbackMsg({ type: "error", text: "Pagu anggaran harus berupa angka positif." });
      return;
    }

    startTransition(async () => {
      const res = await updateRabAllocationAction({
        kode: editingItem.kode,
        nama: editingItem.nama,
        anggaran: num,
        keterangan: editKeterangan,
      });

      if (res.success && res.data) {
        // Update local state
        setSummary((prev) => {
          const updatedItems = prev.items.map((it) => (it.kode === res.data!.kode ? res.data! : it));
          const totalAnggaran = updatedItems.reduce((acc, curr) => acc + curr.anggaran, 0);
          const totalRealisasi = updatedItems.reduce((acc, curr) => acc + curr.realisasi, 0);
          const totalSisaPagu = totalAnggaran - totalRealisasi;
          const persentaseSerapanTotal =
            totalAnggaran > 0 ? Math.round((totalRealisasi / totalAnggaran) * 1000) / 10 : 0;

          return {
            ...prev,
            totalAnggaran,
            totalRealisasi,
            totalSisaPagu,
            persentaseSerapanTotal,
            statusTotal: totalSisaPagu < 0 ? "DEFICIT" : persentaseSerapanTotal >= 80 ? "WARNING" : "SAFE",
            items: updatedItems,
          };
        });
        setFeedbackMsg({ type: "success", text: res.message });
        setTimeout(() => {
          setEditingItem(null);
          setFeedbackMsg(null);
        }, 1500);
      } else {
        setFeedbackMsg({ type: "error", text: res.message });
      }
    });
  };

  // Filter receipts based on selected RAB code
  const filteredReceipts = receipts.filter((r) => {
    if (selectedKode === "ALL") return true;
    return r.kategoriRab?.startsWith(selectedKode);
  });

  return (
    <div className="space-y-6">
      {/* ================= HEADER INTRO ================= */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-mono text-xs font-semibold">
              KONTROL PAGU NPHD 2026
            </span>
            <span className="text-xs text-slate-400 font-medium">• {institutionName}</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Pengawasan Pagu RAB & Pencegahan Defisit
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Pantau batas maksimal pengeluaran per pos rekening belanja, cegah defisit anggaran secara dini, dan kelola alokasi dana hibah dengan akuntabel sesuai NPHD.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center gap-2 border border-emerald-500/50 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Tambah Pos Rekening RAB</span>
          </button>
          <Link
            href="/user/kwitansi"
            className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-secondary text-white text-xs font-semibold shadow-md flex items-center gap-2 border border-emerald-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Kwitansi Belanja</span>
          </Link>
          <Link
            href="/user/bku"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-2"
          >
            <ReceiptIcon className="w-4 h-4 text-emerald-400" />
            <span>Buku Kas Umum</span>
          </Link>
        </div>
      </div>

      {/* ================= SUMMARY STAT METRICS CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pagu */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Pagu Alokasi NPHD</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-3 font-mono">
            {formatRupiah(summary.totalAnggaran)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Total ketetapan hibah daerah</p>
        </div>

        {/* Total Realisasi */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Realisasi Belanja</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-700/50 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-cyan-300 mt-3 font-mono">
            {formatRupiah(summary.totalRealisasi)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Akumulasi bukti kwitansi tersimpan</p>
        </div>

        {/* Sisa Pagu */}
        <div
          className={`border rounded-2xl p-5 shadow-lg ${
            summary.totalSisaPagu < 0
              ? "bg-red-950/30 border-red-700/60"
              : summary.totalSisaPagu === 0
              ? "bg-amber-950/30 border-amber-700/60"
              : "bg-slate-900/80 border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Sisa Pagu Anggaran</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                summary.totalSisaPagu < 0
                  ? "bg-red-900/80 text-red-300 border border-red-700"
                  : "bg-emerald-950/80 text-emerald-400 border border-emerald-700/50"
              }`}
            >
              {summary.totalSisaPagu < 0 ? (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
            </div>
          </div>
          <p
            className={`text-2xl font-bold mt-3 font-mono ${
              summary.totalSisaPagu < 0 ? "text-red-400" : "text-emerald-300"
            }`}
          >
            {summary.totalSisaPagu < 0 ? "-" : ""}
            {formatRupiah(Math.abs(summary.totalSisaPagu))}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.totalSisaPagu < 0 ? "Defisit anggaran terdeteksi!" : "Dana yang masih dapat dibelanjakan"}
          </p>
        </div>

        {/* Persentase Serapan Total */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Persentase Serapan</span>
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-400">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <p className="text-2xl font-bold text-amber-300 font-mono">
              {summary.persentaseSerapanTotal}%
            </p>
            <span className="text-xs text-slate-400">Terserap</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className={`h-2 rounded-full ${
                summary.persentaseSerapanTotal > 100
                  ? "bg-red-500"
                  : summary.persentaseSerapanTotal >= 80
                  ? "bg-amber-400"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, summary.persentaseSerapanTotal)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ================= POS REKENING RAB CARDS GRID ================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Rincian Pos Rekening Anggaran Biaya (RAB)
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 text-xs font-mono font-bold border border-slate-700">
                {summary.items.length} Pos
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Klik tombol pensil untuk mengubah pagu penetapan NPHD atau tambah pos rekening baru
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold border border-emerald-500/50 shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Tambah Pos Rekening RAB</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.items.map((item) => {
            const isDeficit = item.sisaPagu < 0;
            const isWarning = item.persentaseSerapan >= 80 && !isDeficit;

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all shadow-md flex flex-col justify-between ${
                  isDeficit
                    ? "bg-red-950/20 border-red-700/60"
                    : isWarning
                    ? "bg-amber-950/20 border-amber-700/50"
                    : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-xs font-bold text-emerald-400 border border-slate-700">
                          {item.kode}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isDeficit
                              ? "bg-red-900/80 text-red-200 border border-red-600"
                              : isWarning
                              ? "bg-amber-900/80 text-amber-200 border border-amber-600"
                              : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          }`}
                        >
                          {isDeficit ? "DEFISIT" : isWarning ? "WASPADA" : "AMAN"}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1.5">{item.nama}</h4>
                      {item.keterangan && (
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.keterangan}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.jumlahTransaksi === 0 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRab(item)}
                          className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-950/80 text-slate-400 hover:text-red-400 border border-slate-700/80 hover:border-red-700/60 transition-colors cursor-pointer"
                          title="Hapus Pos Rekening (Belum ada transaksi)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                        title="Ubah Alokasi Pagu"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Metrics Table */}
                  <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Pagu NPHD</span>
                      <span className="font-mono text-xs font-bold text-slate-200">
                        {formatRupiah(item.anggaran)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Realisasi ({item.jumlahTransaksi} Kwt)</span>
                      <span className="font-mono text-xs font-semibold text-cyan-300">
                        {formatRupiah(item.realisasi)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Sisa Pagu</span>
                      <span
                        className={`font-mono text-xs font-bold ${
                          isDeficit ? "text-red-400" : "text-emerald-400"
                        }`}
                      >
                        {isDeficit ? "-" : ""}
                        {formatRupiah(Math.abs(item.sisaPagu))}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Tingkat Penyerapan</span>
                      <span
                        className={`font-mono font-bold ${
                          isDeficit ? "text-red-400" : isWarning ? "text-amber-400" : "text-emerald-400"
                        }`}
                      >
                        {item.persentaseSerapan}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          isDeficit ? "bg-red-500" : isWarning ? "bg-amber-400" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, item.persentaseSerapan)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedKode(selectedKode === item.kode ? "ALL" : item.kode)}
                    className="text-slate-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                  >
                    <span>{selectedKode === item.kode ? "Tampilkan Semua Pos" : "Lihat Kwitansi Pos Ini"}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <Link
                    href={`/user/kwitansi`}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    + Buat Kwitansi
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= TRANSAKSI TERKAIT TABEL ================= */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ReceiptIcon className="w-4 h-4 text-emerald-400" />
              Daftar Kwitansi Belanja Terikat RAB ({filteredReceipts.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Filter aktif: <strong>{selectedKode === "ALL" ? "Semua Pos Anggaran" : `Pos ${selectedKode}`}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedKode !== "ALL" && (
              <button
                type="button"
                onClick={() => setSelectedKode("ALL")}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-300 font-semibold border-b border-slate-800">
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3 w-28">Tanggal</th>
                <th className="py-3 px-3 w-36">No. Bukti Kas</th>
                <th className="py-3 px-3 w-28">Pos Rekening</th>
                <th className="py-3 px-4 min-w-[200px]">Rincian Barang / Jasa</th>
                <th className="py-3 px-3 w-32 text-right text-emerald-400">Nominal Bruto</th>
                <th className="py-3 px-3 w-28 text-right text-amber-300">Pot. Pajak</th>
                <th className="py-3 px-3 w-32 text-right text-cyan-300">Netto Rekanan</th>
                <th className="py-3 px-3 w-20 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Belum ada data kwitansi pada pos anggaran ini.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                      {new Date(r.tanggal).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-200 whitespace-nowrap">
                      {r.nomorBukti}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-[11px] font-medium text-emerald-400">
                        {r.kategoriRab || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      <p className="line-clamp-1">{r.uraian}</p>
                      {r.penerima && (
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Penerima: <strong className="text-slate-300">{r.penerima}</strong>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white whitespace-nowrap">
                      {formatRupiah(r.nominal)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-amber-300 whitespace-nowrap">
                      {r.totalPajak && r.totalPajak > 0 ? formatRupiah(r.totalPajak) : "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-cyan-300 whitespace-nowrap">
                      {formatRupiah(r.nominalBersih || r.nominal)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Link
                        href={`/user/kwitansi?no=${r.nomorBukti}`}
                        className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800/50 text-emerald-300 text-[11px] font-semibold transition-colors"
                      >
                        Buka
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL EDIT ALOKASI PAGU ================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                Penetapan Alokasi Pagu {editingItem.kode}
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nama Pos Rekening</label>
                <input
                  type="text"
                  disabled
                  value={editingItem.nama}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-semibold opacity-70 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Alokasi Pagu NPHD (Rp)
                </label>
                <input
                  type="number"
                  value={editPaguValue}
                  onChange={(e) => setEditPaguValue(e.target.value)}
                  className="w-full font-mono font-bold text-sm bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-emerald-400 focus:outline-none focus:border-emerald-600"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Realisasi saat ini: {formatRupiah(editingItem.realisasi)}
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Keterangan Pos Anggaran
                </label>
                <textarea
                  rows={2}
                  value={editKeterangan}
                  onChange={(e) => setEditKeterangan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-600 resize-none"
                />
              </div>

              {feedbackMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    feedbackMsg.type === "success"
                      ? "bg-emerald-950/80 border border-emerald-700/60 text-emerald-200"
                      : "bg-red-950/80 border border-red-800/60 text-red-200"
                  }`}
                >
                  {feedbackMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{feedbackMsg.text}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={handleSavePagu}
                className="flex-1 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-secondary text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all border border-emerald-600/40 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Simpan Perubahan Pagu</span>
              </button>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH POS REKENING RAB ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Tambah Pos Rekening RAB
                    </h3>
                    <p className="text-xs text-slate-400">
                      Tambahkan pos rekening anggaran belanja baru sesuai NPHD
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Template Cepat */}
              <div className="mt-4 p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pilihan Cepat / Rekomendasi Template:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { kode: "5.2.5", nama: "Belanja Pengadaan Alat Rebana & Hadroh", pagu: "5800000", ket: "Pembelian perlengkapan grup rebana/kesenian" },
                    { kode: "5.2.6", nama: "Belanja Publikasi, Banner & Jilid LPJ", pagu: "1000000", ket: "Dokumentasi foto, cetak banner & penjilidan laporan" },
                    { kode: "5.2.7", nama: "Belanja Konsumsi Pelatihan / Kegiatan", pagu: "1500000", ket: "Konsumsi konsolidasi anggota & pelatihan" },
                    { kode: "5.2.8", nama: "Belanja ATK & Kertas Administrasi", pagu: "750000", ket: "Kertas HVS, tinta printer, map dan alat tulis kantor" },
                    { kode: "5.2.9", nama: "Belanja Transportasi & Logistik", pagu: "1200000", ket: "Transportasi tim dan akomodasi pengadaan barang" },
                  ].map((tpl) => (
                    <button
                      key={tpl.kode}
                      type="button"
                      onClick={() => {
                        setNewKode(tpl.kode);
                        setNewNama(tpl.nama);
                        setNewAnggaran(tpl.pagu);
                        setNewKeterangan(tpl.ket);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-emerald-950 hover:text-emerald-300 text-slate-300 text-[11px] border border-slate-700 hover:border-emerald-700 transition-all text-left"
                    >
                      <span className="font-mono font-bold text-emerald-400 mr-1">{tpl.kode}</span>
                      <span>{tpl.nama.split(" ")[1] || tpl.nama}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Kode Rekening <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 5.2.5"
                    value={newKode}
                    onChange={(e) => setNewKode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Format: 5.2.X</span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nama Pos Rekening Anggaran <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Belanja Peralatan Kesenian"
                    value={newNama}
                    onChange={(e) => setNewNama(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Alokasi Pagu NPHD (Rp) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm font-semibold">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    placeholder="0"
                    value={newAnggaran}
                    onChange={(e) => setNewAnggaran(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white font-mono text-sm font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>
                {newAnggaran && !isNaN(parseFloat(newAnggaran)) && (
                  <p className="text-[11px] text-emerald-400 font-mono mt-1 font-semibold">
                    Preview: {formatRupiah(parseFloat(newAnggaran) || 0)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Keterangan / Rincian Pos Anggaran (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Pengadaan alat rebana kualitas super untuk kegiatan latihan rutin"
                  value={newKeterangan}
                  onChange={(e) => setNewKeterangan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-600 resize-none"
                />
              </div>

              {feedbackMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    feedbackMsg.type === "success"
                      ? "bg-emerald-950/80 border border-emerald-700/60 text-emerald-200"
                      : "bg-red-950/80 border border-red-800/60 text-red-200"
                  }`}
                >
                  {feedbackMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{feedbackMsg.text}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={handleCreateRab}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all border border-emerald-500/40 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                ) : (
                  <PlusCircle className="w-4 h-4" />
                )}
                <span>Simpan Pos Rekening RAB</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
