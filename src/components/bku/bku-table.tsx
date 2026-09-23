"use client";

import { useState, useMemo } from "react";
import type { BkuLedgerEntry, BkuSummary, RabSummary, RabStatusItem } from "@/types";
import {
  Search,
  Plus,
  Printer,
  FileText,
  ExternalLink,
  Trash2,
  Filter,
  Layers,
  List,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { deleteBkuTransactionAction } from "@/app/actions/bku.action";
import { deleteReceiptAction } from "@/app/actions/receipt.action";
import { swalLoading, swalSuccess, swalError, swalConfirmDelete } from "@/lib/swal";
import { formatPersonName } from "@/lib/utils/title-case";

interface BkuTableProps {
  entries: BkuLedgerEntry[];
  summary: BkuSummary;
  rabSummary?: RabSummary;
  institutionName?: string;
  leaderName?: string;
  treasurerName?: string;
  onOpenIncomeModal: () => void;
  onRefresh: () => void;
}

/**
 * Helper to match an entry's kategoriRab to a known RabStatusItem
 */
function matchRabCategory(
  kategoriRab: string | null | undefined,
  rabItems: RabStatusItem[]
): RabStatusItem | undefined {
  if (!kategoriRab || !rabItems.length) return undefined;
  const clean = kategoriRab.trim().toLowerCase();

  // 1. Exact match on kode or nama
  const exact = rabItems.find(
    (item) => item.kode.toLowerCase() === clean || item.nama.toLowerCase() === clean
  );
  if (exact) return exact;

  // 2. Extracted code (e.g. "Pos V" or "V." -> "v" matches item.kode "V")
  const match = clean.match(/^(?:pos\s+|rekening\s+)?([0-9]+(?:\.[0-9]+)*|[ivxlcdm]+)(?:[\s\-.:]|$)/i);
  if (match) {
    const code = match[1].toLowerCase();
    const foundByCode = rabItems.find((item) => item.kode.toLowerCase() === code);
    if (foundByCode) return foundByCode;
  }

  // 3. Fallback: contains check if string is descriptive (> 3 chars)
  if (clean.length > 3) {
    const foundByName = rabItems.find(
      (item) =>
        item.nama.toLowerCase().includes(clean) || clean.includes(item.nama.toLowerCase())
    );
    if (foundByName) return foundByName;
  }

  return undefined;
}

interface PosGroupData {
  kode: string;
  nama: string;
  anggaran: number;
  entries: BkuLedgerEntry[];
  totalPengeluaran: number;
  totalPajak: number;
  sisaPagu: number;
  isDeficit: boolean;
  persentaseSerapan: number;
  rabItem?: RabStatusItem;
}

export function BkuTable({
  entries,
  summary,
  rabSummary,
  institutionName = "PIMPINAN RANTING FATAYAT NU DAWUHAN SELATAN",
  leaderName = "HENI FUJIATI, S.Pd.I",
  treasurerName = "NUR ALIMAH",
  onOpenIncomeModal,
  onRefresh,
}: BkuTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PENERIMAAN" | "PENGELUARAN">("ALL");
  const [viewMode, setViewMode] = useState<"GROUPED" | "CHRONOLOGICAL">("GROUPED");
  const [selectedPosFilter, setSelectedPosFilter] = useState<string>("ALL");
  const [collapsedPos, setCollapsedPos] = useState<Record<string, boolean>>({});

  const formatRupiah = (val: number) => {
    return val === 0 ? "-" : "Rp " + val.toLocaleString("id-ID");
  };

  const formatDate = (d: Date | string) => {
    const dateObj = new Date(d);
    return dateObj.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const rabItems = useMemo(() => rabSummary?.items || [], [rabSummary]);

  // Filter entries by Search Term and Type Filter (Debet/Kredit)
  const searchFilteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchSearch =
        e.nomorBukti.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.uraian.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.kategoriRab && e.kategoriRab.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.penerima && e.penerima.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = typeFilter === "ALL" || e.jenis === typeFilter;
      return matchSearch && matchType;
    });
  }, [entries, searchTerm, typeFilter]);

  // Entries filtered by Pos for Chronological View
  const chronologicallyFilteredEntries = useMemo(() => {
    if (selectedPosFilter === "ALL") return searchFilteredEntries;
    if (selectedPosFilter === "PENERIMAAN") {
      return searchFilteredEntries.filter((e) => e.jenis === "PENERIMAAN");
    }
    if (selectedPosFilter === "UNCATEGORIZED") {
      return searchFilteredEntries.filter(
        (e) =>
          e.jenis === "PENGELUARAN" &&
          (!e.kategoriRab || !matchRabCategory(e.kategoriRab, rabItems))
      );
    }
    return searchFilteredEntries.filter((e) => {
      if (e.jenis !== "PENGELUARAN") return false;
      const matched = matchRabCategory(e.kategoriRab, rabItems);
      return (
        matched?.kode.toLowerCase() === selectedPosFilter.toLowerCase() ||
        e.kategoriRab?.trim().toLowerCase() === selectedPosFilter.toLowerCase()
      );
    });
  }, [searchFilteredEntries, selectedPosFilter, rabItems]);

  // Grouped structure per Pos RAB
  const { incomeEntries, posGroups, uncategorizedEntries, deficitCount } = useMemo(() => {
    const income = searchFilteredEntries.filter((e) => e.jenis === "PENERIMAAN");
    const expense = searchFilteredEntries.filter((e) => e.jenis === "PENGELUARAN");

    // Mapping expenses to Pos RAB
    const matchedExpensesMap = new Map<string, BkuLedgerEntry[]>();
    const uncat: BkuLedgerEntry[] = [];

    expense.forEach((entry) => {
      const matched = matchRabCategory(entry.kategoriRab, rabItems);
      if (matched) {
        const current = matchedExpensesMap.get(matched.kode) || [];
        current.push(entry);
        matchedExpensesMap.set(matched.kode, current);
      } else {
        uncat.push(entry);
      }
    });

    let deficits = 0;
    const groups: PosGroupData[] = rabItems.map((item) => {
      const groupEntries = matchedExpensesMap.get(item.kode) || [];
      const totalPengeluaran = groupEntries.reduce((sum, e) => sum + e.kredit, 0);
      const totalPajak = groupEntries.reduce((sum, e) => sum + (e.totalPajak || 0), 0);
      const sisaPagu = item.anggaran - totalPengeluaran;
      const isDeficit = totalPengeluaran > item.anggaran;
      if (isDeficit) deficits++;
      const persentaseSerapan =
        item.anggaran > 0 ? (totalPengeluaran / item.anggaran) * 100 : 0;

      return {
        kode: item.kode,
        nama: item.nama,
        anggaran: item.anggaran,
        entries: groupEntries,
        totalPengeluaran,
        totalPajak,
        sisaPagu,
        isDeficit,
        persentaseSerapan,
        rabItem: item,
      };
    });

    return {
      incomeEntries: income,
      posGroups: groups,
      uncategorizedEntries: uncat,
      deficitCount: deficits,
    };
  }, [searchFilteredEntries, rabItems]);

  const togglePosCollapse = (kode: string) => {
    setCollapsedPos((prev) => ({
      ...prev,
      [kode]: !prev[kode],
    }));
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await swalConfirmDelete({
      title: "Hapus Transaksi BKU?",
      text: "Apakah Anda yakin ingin menghapus transaksi penerimaan kas ini dari pembukuan BKU?",
      confirmText: "Ya, Hapus!",
      cancelText: "Batal",
    });
    if (!isConfirmed) return;

    swalLoading("Menghapus Transaksi...", "Sedang memperbarui pembukuan kas umum...");
    const res = await deleteBkuTransactionAction(id);
    if (res.success) {
      swalSuccess("Berhasil Dihapus!", res.message);
      onRefresh();
    } else {
      swalError("Gagal Menghapus Transaksi", res.message);
    }
  };

  const handleDeleteReceipt = async (receiptId: string, nomorBukti: string) => {
    const isConfirmed = await swalConfirmDelete({
      title: "Hapus Transaksi & Dokumen Terkait?",
      text: `Apakah Anda yakin ingin menghapus kwitansi ${nomorBukti}? Seluruh dokumen terkait (Surat Pesanan/SP, Berita Acara/BAST, Kwitansi, dan catatan BKU) akan ikut terhapus. Pos anggaran RAB tetap aman dan pagunya akan otomatis dipulihkan.`,
      confirmText: "Ya, Hapus Semua Terkait!",
      cancelText: "Batal",
    });
    if (!isConfirmed) return;

    swalLoading("Menghapus Kwitansi...", "Sedang membersihkan transaksi dan memulihkan anggaran...");
    const res = await deleteReceiptAction(receiptId);
    if (res.success) {
      swalSuccess("Berhasil Dihapus!", res.message);
      onRefresh();
    } else {
      swalError("Gagal Menghapus Kwitansi", res.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* ================= CONTROLS & ACTION TOOLBAR ================= */}
      <div className="flex flex-col gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm no-print">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari no. bukti, rincian belanja, nama toko, pos RAB..."
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenIncomeModal}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 border border-emerald-500/40"
            >
              <Plus className="w-4 h-4" />
              <span>+ Catat Kas Masuk (SP2D)</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Cetak BKU F4</span>
            </button>
          </div>
        </div>

        {/* View Mode Switcher & Pos Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Tabs */}
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode("GROUPED")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === "GROUPED"
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-700/60 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Kelompokkan Pos RAB</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("CHRONOLOGICAL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === "CHRONOLOGICAL"
                    ? "bg-slate-800 text-cyan-300 border border-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Urutan Kronologis BKU</span>
              </button>
            </div>

            {/* Filter Pos Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
              <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-400">Pos:</span>
              <select
                value={selectedPosFilter}
                onChange={(e) => setSelectedPosFilter(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-slate-950 text-white">
                  Semua Pos RAB ({entries.length} Transaksi)
                </option>
                <option value="PENERIMAAN" className="bg-slate-950 text-emerald-400">
                  Penerimaan Kas / SP2D ({entries.filter((x) => x.jenis === "PENERIMAAN").length})
                </option>
                {rabItems.map((item) => {
                  const count = entries.filter((e) => {
                    if (e.jenis !== "PENGELUARAN") return false;
                    const m = matchRabCategory(e.kategoriRab, rabItems);
                    return m?.kode === item.kode;
                  }).length;
                  return (
                    <option key={item.id} value={item.kode} className="bg-slate-950 text-white">
                      Pos {item.kode} - {item.nama} ({count})
                    </option>
                  );
                })}
                {uncategorizedEntries.length > 0 && (
                  <option value="UNCATEGORIZED" className="bg-slate-950 text-amber-400">
                    Belum Ada Pos RAB ({uncategorizedEntries.length})
                  </option>
                )}
              </select>
            </div>

            {/* Filter Jenis: Debet / Kredit */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setTypeFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  typeFilter === "ALL" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("PENERIMAAN")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  typeFilter === "PENERIMAAN"
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-700/60"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Debet
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("PENGELUARAN")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  typeFilter === "PENGELUARAN"
                    ? "bg-amber-950 text-amber-300 border border-amber-700/60"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Kredit
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Menampilkan <strong>{searchFilteredEntries.length}</strong> transaksi</span>
            {selectedPosFilter !== "ALL" && (
              <button
                type="button"
                onClick={() => setSelectedPosFilter("ALL")}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                (Reset Filter Pos)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= VERIFIKASI DATA / DEFICIT WARNING ALERT ================= */}
      {deficitCount > 0 && (
        <div className="bg-red-950/70 border border-red-700/80 rounded-2xl p-4 text-red-200 flex items-start gap-3 shadow-md no-print">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-red-300 text-sm">
              Perhatian: Terdeteksi {deficitCount} Pos RAB yang Mengalami Defisit Anggaran!
            </p>
            <p className="mt-1 text-slate-300">
              Total belanja kwitansi di BKU melebihi pagu NPHD yang dialokasikan. Silakan periksa rincian kwitansi pada pos bertanda merah di bawah dan sesuaikan nominal atau hapus kwitansi ganda.
            </p>
          </div>
        </div>
      )}

      {/* Alert for uncategorized expenses */}
      {uncategorizedEntries.length > 0 && (
        <div className="bg-amber-950/60 border border-amber-700/70 rounded-2xl p-4 text-amber-200 flex items-start gap-3 shadow-md no-print">
          <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-amber-300">
              Terdapat {uncategorizedEntries.length} Kwitansi Belanja Belum Ditentukan Pos RAB-nya
            </p>
            <p className="mt-0.5 text-slate-300">
              Transaksi ini belum terhubung ke rekening kegiatan RAB NPHD. Klik tombol <b>Edit</b> pada kwitansi untuk memilih pos kegiatan yang sesuai agar serapan anggaran tercatat akurat.
            </p>
          </div>
        </div>
      )}

      {/* ================= QUICK POS CHIPS (IN GROUPED VIEW) ================= */}
      {viewMode === "GROUPED" && rabItems.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-print">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Lompat ke Pos:
          </span>
          {rabItems.map((item) => {
            const group = posGroups.find((g) => g.kode === item.kode);
            const count = group?.entries.length || 0;
            const isDef = group?.isDeficit;
            const isSelected = selectedPosFilter === item.kode;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setSelectedPosFilter((prev) => (prev === item.kode ? "ALL" : item.kode))
                }
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? "bg-emerald-600 text-white border-emerald-400 shadow-md"
                    : isDef
                    ? "bg-red-950/60 border-red-700/60 text-red-300 hover:bg-red-900/60"
                    : count > 0
                    ? "bg-slate-900 border-slate-700 text-slate-200 hover:border-emerald-500/60"
                    : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
                }`}
              >
                <span>Pos {item.kode}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected
                      ? "bg-emerald-800 text-white"
                      : count > 0
                      ? "bg-slate-800 text-slate-300"
                      : "bg-slate-900 text-slate-600"
                  }`}
                >
                  {count}
                </span>
                {isDef && <span className="text-[10px] text-red-400 font-bold">⚠️</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* ================= FORMAL BKU DOCUMENT CONTAINER ================= */}
      <div
        id="bkuPrintArea"
        className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden print:bg-white print:border-none print:shadow-none print:text-black"
      >
        {/* Document Header (Formal Kas Negara / LPJ) */}
        <div className="p-6 border-b border-slate-800 text-center print:border-b-2 print:border-black print:pb-4">
          <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider print:text-black">
            Buku Kas Umum (BKU)
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-emerald-400 uppercase mt-0.5 print:text-black">
            {viewMode === "GROUPED"
              ? "Rekapitulasi Belanja Kas per Pos Anggaran RAB"
              : "Laporan Pertanggungjawaban Dana Hibah (LPJ)"}
          </p>
          <p className="text-xs text-slate-400 mt-1 print:text-black">
            Entitas Penerima: <strong className="text-slate-200 print:text-black">{institutionName}</strong>
          </p>
        </div>

        {/* ================= VIEW MODE 1: KELOMPOK POS RAB ================= */}
        {viewMode === "GROUPED" ? (
          <div className="p-4 sm:p-6 space-y-6">
            {/* 1. SEKSI PENERIMAAN KAS (SP2D / PENCAIRAN) */}
            {(selectedPosFilter === "ALL" || selectedPosFilter === "PENERIMAAN") && (
              <div className="border border-emerald-800/60 rounded-2xl bg-slate-950/70 overflow-hidden shadow-lg print:border-black print:bg-transparent">
                <div className="p-4 bg-emerald-950/50 border-b border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:bg-slate-100 print:border-black">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-900/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400 print:hidden">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-emerald-300 uppercase tracking-wide print:text-black">
                        Penerimaan Kas (SP2D / Pencairan Hibah)
                      </h3>
                      <p className="text-[11px] text-slate-400 print:text-black">
                        Pencairan dana hibah resmi yang masuk ke rekening kas entitas
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block print:text-black">Total Penerimaan</span>
                      <span className="text-sm font-bold font-mono text-emerald-400 print:text-black">
                        {formatRupiah(summary.totalPenerimaan)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenIncomeModal}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg transition-colors border border-emerald-600/50 no-print"
                    >
                      + Tambah SP2D
                    </button>
                  </div>
                </div>

                {incomeEntries.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 font-medium">
                    Belum ada data pencairan dana hibah / kas masuk (SP2D). Klik tombol "+ Tambah SP2D" untuk mencatat penerimaan hibah pertama.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900/80 text-slate-300 font-semibold border-b border-slate-800 print:bg-slate-50 print:text-black print:border-black">
                          <th className="py-2.5 px-3 w-10 text-center">No</th>
                          <th className="py-2.5 px-3 w-28">Tanggal</th>
                          <th className="py-2.5 px-3 w-36">No. Bukti Kas</th>
                          <th className="py-2.5 px-4">Uraian Kas Masuk</th>
                          <th className="py-2.5 px-3 w-36 text-right text-emerald-400 print:text-black">
                            Penerimaan (Debet)
                          </th>
                          <th className="py-2.5 px-3 w-16 text-center no-print">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 print:divide-slate-300">
                        {incomeEntries.map((entry, idx) => (
                          <tr key={entry.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-2.5 px-3 text-center text-slate-400 font-mono print:text-black">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap print:text-black">
                              {formatDate(entry.tanggal)}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-200 whitespace-nowrap print:text-black">
                              {entry.nomorBukti}
                            </td>
                            <td className="py-2.5 px-4 text-slate-200 print:text-black">
                              {entry.uraian}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-400 whitespace-nowrap print:text-black">
                              {formatRupiah(entry.debet)}
                            </td>
                            <td className="py-2.5 px-3 text-center no-print">
                              <button
                                type="button"
                                onClick={() => handleDelete(entry.id)}
                                className="p-1 rounded bg-slate-800 hover:bg-red-900/60 hover:text-red-300 text-slate-400 transition-colors"
                                title="Hapus Transaksi Penerimaan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 2. DAFTAR PENGELUARAN DIKELOMPOKKAN PER POS RAB */}
            <div className="space-y-4">
              <div className="flex items-center justify-between no-print">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-emerald-400" />
                  Rincian Belanja Dikelompokkan per Pos RAB / Rekening Kegiatan
                </h3>
                <span className="text-[11px] text-slate-400">
                  {posGroups.filter((g) => g.entries.length > 0).length} dari {posGroups.length} Pos RAB telah terisi kwitansi
                </span>
              </div>

              {posGroups
                .filter((pos) => {
                  if (selectedPosFilter === "ALL") return true;
                  return pos.kode.toLowerCase() === selectedPosFilter.toLowerCase();
                })
                .map((pos) => {
                  const isCollapsed = Boolean(collapsedPos[pos.kode]);
                  return (
                    <div
                      key={pos.kode}
                      id={`pos-group-${pos.kode}`}
                      className={`border rounded-2xl overflow-hidden shadow-lg transition-all print:border-black print:shadow-none ${
                        pos.isDeficit
                          ? "border-red-700/80 bg-slate-950/80"
                          : pos.entries.length > 0
                          ? "border-slate-800 bg-slate-950/70"
                          : "border-slate-800/60 bg-slate-950/40"
                      }`}
                    >
                      {/* Pos Group Header */}
                      <div
                        onClick={() => togglePosCollapse(pos.kode)}
                        className={`p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 cursor-pointer select-none border-b transition-colors print:bg-slate-100 print:border-black ${
                          pos.isDeficit
                            ? "bg-red-950/40 border-red-800/50 hover:bg-red-950/60"
                            : "bg-slate-900/80 border-slate-800 hover:bg-slate-900"
                        }`}
                      >
                        {/* Title & Badge */}
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white no-print"
                          >
                            {isCollapsed ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronUp className="w-4 h-4" />
                            )}
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-mono text-xs font-bold print:bg-transparent print:border-black print:text-black">
                                Pos {pos.kode}
                              </span>
                              <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide print:text-black">
                                {pos.nama}
                              </h4>
                              {pos.isDeficit && (
                                <span className="px-2 py-0.5 rounded-full bg-red-900/80 border border-red-600 text-red-200 text-[10px] font-bold animate-pulse print:border-black print:text-black">
                                  ⚠️ DEFISIT
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 print:text-black">
                              {pos.entries.length} Kwitansi Tercatat • Alokasi Pagu: <strong>{formatRupiah(pos.anggaran)}</strong>
                            </p>
                          </div>
                        </div>

                        {/* Financial Metrics of this Pos */}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-5 justify-between lg:justify-end">
                          <div>
                            <span className="text-[10px] text-slate-400 block print:text-black">Total Belanja BKU</span>
                            <span
                              className={`text-xs sm:text-sm font-mono font-bold ${
                                pos.isDeficit ? "text-red-400" : "text-amber-300"
                              } print:text-black`}
                            >
                              {formatRupiah(pos.totalPengeluaran)}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block print:text-black">Sisa Pagu NPHD</span>
                            <span
                              className={`text-xs sm:text-sm font-mono font-bold ${
                                pos.isDeficit ? "text-red-400" : "text-cyan-300"
                              } print:text-black`}
                            >
                              {pos.isDeficit
                                ? `-Rp ${Math.abs(pos.sisaPagu).toLocaleString("id-ID")}`
                                : formatRupiah(pos.sisaPagu)}
                            </span>
                          </div>

                          <div className="hidden sm:block text-right min-w-[70px]">
                            <span className="text-[10px] text-slate-400 block print:text-black">Serapan</span>
                            <span className="text-xs font-mono font-semibold text-slate-200 print:text-black">
                              {pos.persentaseSerapan.toFixed(1)}%
                            </span>
                          </div>

                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="no-print"
                          >
                            <Link
                              href={`/user/kwitansi?kategori=${encodeURIComponent(pos.kode)}&mode=new`}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded-lg border border-emerald-700/60 transition-colors flex items-center gap-1 shadow-sm"
                              title="Buat kwitansi baru khusus pos ini"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Kwitansi Pos Ini</span>
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Content Table (Expanded) */}
                      {!isCollapsed && (
                        <div>
                          {pos.entries.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-500 font-medium">
                              Belum ada kwitansi yang dibukukan untuk Pos {pos.kode} ({pos.nama}). Pagu masih utuh {formatRupiah(pos.anggaran)}.
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-800 print:bg-slate-50 print:text-black print:border-black">
                                    <th className="py-2.5 px-3 w-10 text-center">No</th>
                                    <th className="py-2.5 px-3 w-28">Tanggal</th>
                                    <th className="py-2.5 px-3 w-36">No. Bukti Kas</th>
                                    <th className="py-2.5 px-4 min-w-[200px]">Uraian Belanja</th>
                                    <th className="py-2.5 px-3 w-36">Penerima / Toko</th>
                                    <th className="py-2.5 px-3 w-36 text-right text-amber-300 print:text-black">
                                      Pengeluaran (Kredit)
                                    </th>
                                    <th className="py-2.5 px-3 w-32 text-right text-cyan-300 print:text-black">
                                      Pot. Pajak
                                    </th>
                                    <th className="py-2.5 px-3 w-20 text-center no-print">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 print:divide-slate-300">
                                  {pos.entries.map((entry, idx) => (
                                    <tr
                                      key={entry.id}
                                      className="hover:bg-slate-900/40 transition-colors print:hover:bg-transparent"
                                    >
                                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono print:text-black">
                                        {idx + 1}
                                      </td>
                                      <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap print:text-black">
                                        {formatDate(entry.tanggal)}
                                      </td>
                                      <td className="py-2.5 px-3 font-mono font-medium text-slate-200 whitespace-nowrap print:text-black">
                                        {entry.nomorBukti}
                                      </td>
                                      <td className="py-2.5 px-4 text-slate-200 leading-relaxed print:text-black">
                                        <p>{entry.uraian}</p>
                                        {entry.receiptId && (
                                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400/80 font-medium no-print mt-0.5">
                                            <FileText className="w-3 h-3" /> Kwitansi LPJ
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-3 text-slate-300 print:text-black">
                                        {entry.penerima ? (
                                          <span className="font-medium text-amber-200 print:text-black">
                                            {entry.penerima}
                                          </span>
                                        ) : (
                                          <span className="text-slate-500 italic">-</span>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-300 whitespace-nowrap print:text-black">
                                        {formatRupiah(entry.kredit)}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono text-cyan-300 whitespace-nowrap print:text-black">
                                        {entry.totalPajak && entry.totalPajak > 0
                                          ? formatRupiah(entry.totalPajak)
                                          : "-"}
                                      </td>
                                      <td className="py-2.5 px-3 text-center no-print">
                                        <div className="flex items-center justify-center gap-1.5">
                                          {entry.receiptId ? (
                                            <>
                                              <Link
                                                href={`/user/kwitansi?id=${encodeURIComponent(
                                                  entry.receiptId
                                                )}&no=${encodeURIComponent(entry.nomorBukti)}`}
                                                className="p-1 rounded bg-slate-800 hover:bg-emerald-900/60 hover:text-emerald-300 text-slate-400 transition-colors"
                                                title="Buka & Edit Lembar Kwitansi"
                                              >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                              </Link>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleDeleteReceipt(
                                                    entry.receiptId!,
                                                    entry.nomorBukti
                                                  )
                                                }
                                                className="p-1 rounded bg-slate-800 hover:bg-red-900/60 hover:text-red-300 text-slate-400 transition-colors"
                                                title="Hapus Kwitansi & Pulihkan Anggaran"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => handleDelete(entry.id)}
                                              className="p-1 rounded bg-slate-800 hover:bg-red-900/60 hover:text-red-300 text-slate-400 transition-colors"
                                              title="Hapus Transaksi"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-slate-900/90 font-bold border-t border-slate-700 print:bg-slate-200 print:border-black print:text-black">
                                    <td
                                      colSpan={5}
                                      className="py-2.5 px-4 text-right uppercase tracking-wider text-slate-300 print:text-black"
                                    >
                                      Subtotal Belanja Pos {pos.kode}:
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono text-amber-300 print:text-black">
                                      {formatRupiah(pos.totalPengeluaran)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono text-cyan-300 print:text-black">
                                      {formatRupiah(pos.totalPajak)}
                                    </td>
                                    <td className="no-print"></td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* 3. SEKSI PENGELUARAN TANPA POS RAB (JIKA ADA) */}
            {uncategorizedEntries.length > 0 &&
              (selectedPosFilter === "ALL" || selectedPosFilter === "UNCATEGORIZED") && (
                <div className="border border-amber-800/70 rounded-2xl bg-slate-950/80 overflow-hidden shadow-lg print:border-black">
                  <div className="p-4 bg-amber-950/50 border-b border-amber-800/60 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wide">
                        ⚠️ Kwitansi Belanja Belum Ditentukan Pos RAB ({uncategorizedEntries.length} Transaksi)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Kwitansi berikut belum memiliki kode pos RAB atau kode pos tidak terdaftar di NPHD.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                          <th className="py-2.5 px-3 w-10 text-center">No</th>
                          <th className="py-2.5 px-3 w-28">Tanggal</th>
                          <th className="py-2.5 px-3 w-36">No. Bukti Kas</th>
                          <th className="py-2.5 px-4">Uraian Belanja</th>
                          <th className="py-2.5 px-3 w-36 text-right text-amber-300">Pengeluaran</th>
                          <th className="py-2.5 px-3 w-20 text-center no-print">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {uncategorizedEntries.map((entry, idx) => (
                          <tr key={entry.id} className="hover:bg-slate-900/40">
                            <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 text-slate-300">{formatDate(entry.tanggal)}</td>
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-200">
                              {entry.nomorBukti}
                            </td>
                            <td className="py-2.5 px-4 text-slate-200">{entry.uraian}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-300">
                              {formatRupiah(entry.kredit)}
                            </td>
                            <td className="py-2.5 px-3 text-center no-print">
                              <Link
                                href={`/user/kwitansi?id=${encodeURIComponent(
                                  entry.receiptId || ""
                                )}&no=${encodeURIComponent(entry.nomorBukti)}`}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-amber-950 hover:bg-amber-900 text-amber-300 rounded-lg border border-amber-700/60"
                              >
                                Edit Pos
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </div>
        ) : (
          /* ================= VIEW MODE 2: KRONOLOGIS BKU STANDAR ================= */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-300 font-semibold border-b border-slate-800 print:bg-slate-100 print:text-black print:border-black">
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3 w-28">Tanggal</th>
                  <th className="py-3 px-3 w-36">No. Bukti Kas</th>
                  <th className="py-3 px-3 w-32">Pos RAB</th>
                  <th className="py-3 px-4 min-w-[240px]">Uraian Transaksi</th>
                  <th className="py-3 px-3 w-36 text-right text-emerald-400 print:text-black">
                    Penerimaan (Debet)
                  </th>
                  <th className="py-3 px-3 w-36 text-right text-amber-300 print:text-black">
                    Pengeluaran (Kredit)
                  </th>
                  <th className="py-3 px-4 w-36 text-right text-cyan-300 print:text-black">
                    Saldo Berjalan
                  </th>
                  <th className="py-3 px-3 w-20 text-center no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-slate-300">
                {chronologicallyFilteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 font-medium">
                      Belum ada data transaksi Buku Kas Umum sesuai filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  chronologicallyFilteredEntries.map((entry) => {
                    const matchedPos = matchRabCategory(entry.kategoriRab, rabItems);
                    return (
                      <tr
                        key={entry.id}
                        className="hover:bg-slate-800/40 transition-colors print:hover:bg-transparent"
                      >
                        <td className="py-3 px-3 text-center text-slate-400 font-mono print:text-black">
                          {entry.nomorUrut}
                        </td>
                        <td
                          className="py-3 px-3 text-slate-300 whitespace-nowrap print:text-black"
                          suppressHydrationWarning
                        >
                          {formatDate(entry.tanggal)}
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-200 whitespace-nowrap print:text-black">
                          {entry.nomorBukti}
                        </td>
                        <td className="py-3 px-3 text-slate-400 print:text-black">
                          <span
                            className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-medium print:bg-transparent print:p-0 print:text-black"
                            title={matchedPos ? `Pos ${matchedPos.kode} - ${matchedPos.nama}` : undefined}
                          >
                            {matchedPos ? `Pos ${matchedPos.kode}` : entry.kategoriRab || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-200 leading-relaxed print:text-black">
                          <p>{entry.uraian}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {entry.penerima && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 font-medium bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40 print:text-black print:border-none print:p-0">
                                <span className="text-slate-400 print:text-black">Penerima:</span>
                                <strong>{entry.penerima}</strong>
                              </span>
                            )}
                            {entry.totalPajak && entry.totalPajak > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-cyan-300 font-medium bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40 print:text-black print:border-none print:p-0">
                                <span className="text-slate-400 print:text-black">Pot. Pajak:</span>
                                <strong>{"Rp " + entry.totalPajak.toLocaleString("id-ID")}</strong>
                              </span>
                            ) : null}
                            {entry.receiptId && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400/80 font-medium no-print">
                                <FileText className="w-3 h-3" /> Kwitansi LPJ
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-emerald-400 whitespace-nowrap print:text-black">
                          {formatRupiah(entry.debet)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-amber-300 whitespace-nowrap print:text-black">
                          {formatRupiah(entry.kredit)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-cyan-300 whitespace-nowrap print:text-black">
                          {"Rp " + entry.saldoBerjalan.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-3 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            {entry.receiptId ? (
                              <>
                                <Link
                                  href={`/user/kwitansi?id=${encodeURIComponent(
                                    entry.receiptId
                                  )}&no=${encodeURIComponent(entry.nomorBukti)}`}
                                  className="p-1 rounded bg-slate-800 hover:bg-emerald-900/60 hover:text-emerald-300 text-slate-400 transition-colors"
                                  title="Buka & Edit Lembar Kwitansi"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteReceipt(entry.receiptId!, entry.nomorBukti)
                                  }
                                  className="p-1 rounded bg-slate-800 hover:bg-red-900/60 hover:text-red-300 text-slate-400 transition-colors"
                                  title="Hapus Kwitansi & Pulihkan Anggaran"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDelete(entry.id)}
                                className="p-1 rounded bg-slate-800 hover:bg-red-900/60 hover:text-red-300 text-slate-400 transition-colors"
                                title="Hapus Transaksi Penerimaan"
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
        )}

        {/* ================= TABLE TOTAL FOOTER ================= */}
        <div className="p-4 sm:p-6 bg-slate-950 border-t-2 border-slate-700 print:bg-slate-200 print:border-black print:text-black">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block print:text-black">
                Total Penerimaan (Debet)
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-emerald-400 print:text-black">
                {"Rp " + summary.totalPenerimaan.toLocaleString("id-ID")}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block print:text-black">
                Total Pengeluaran (Kredit)
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-amber-300 print:text-black">
                {"Rp " + summary.totalPengeluaran.toLocaleString("id-ID")}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block print:text-black">
                Saldo Akhir Kas
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-cyan-300 print:text-black">
                {"Rp " + summary.saldoAkhir.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* ================= BUKU PEMBANTU PAJAK ================= */}
        <div className="p-6 bg-slate-950/60 border-t border-slate-800 print:bg-transparent print:border-t-2 print:border-black">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider print:text-black">
                Buku Pembantu Pajak (Rekapitulasi Pemungutan & Penyetoran Pajak LPJ)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 print:text-black">
                Daftar pungutan pajak bendahara atas belanja pengadaan barang/jasa hibah yang wajib disetor ke Kas Negara (NTPN)
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded bg-cyan-950 border border-cyan-800/60 text-cyan-300 font-mono text-xs font-bold print:hidden self-start sm:self-auto">
              Total Pungutan: Rp {summary.totalPajakDipungut.toLocaleString("id-ID")}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800 print:bg-transparent print:border print:border-black">
            <div>
              <span className="text-[10px] text-slate-400 block print:text-black">PPN 11%</span>
              <span className="font-mono font-bold text-slate-200 print:text-black text-xs">
                {"Rp " + summary.totalPpn.toLocaleString("id-ID")}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block print:text-black">PPh 21 (Honor/Upah)</span>
              <span className="font-mono font-bold text-slate-200 print:text-black text-xs">
                {"Rp " + summary.totalPph21.toLocaleString("id-ID")}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block print:text-black">PPh 22 (Barang &gt; 2 Jt)</span>
              <span className="font-mono font-bold text-slate-200 print:text-black text-xs">
                {"Rp " + summary.totalPph22.toLocaleString("id-ID")}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block print:text-black">PPh 23 (Sewa/Jasa)</span>
              <span className="font-mono font-bold text-slate-200 print:text-black text-xs">
                {"Rp " + summary.totalPph23.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-cyan-950/40 p-2 rounded-lg border border-cyan-800/50 print:bg-transparent print:border-none print:p-0">
              <span className="text-[10px] text-cyan-300 block font-semibold print:text-black">
                Total Setoran Pajak
              </span>
              <span className="font-mono font-bold text-cyan-200 print:text-black text-xs sm:text-sm">
                {"Rp " + summary.totalPajakDipungut.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* ================= BERITA ACARA PENUTUPAN KAS (KAS OPNAME) ================= */}
        <div className="p-6 bg-slate-950/40 border-t border-slate-800 print:bg-transparent print:border-t-2 print:border-black">
          <div className="text-xs text-slate-300 leading-relaxed print:text-black">
            <p className="font-semibold text-slate-200 print:text-black">
              Posisi Kas Akhir Buku Kas Umum per tanggal cetak:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3 p-3 bg-slate-950 rounded-xl border border-slate-800 print:bg-transparent print:border-none print:p-0">
              <div>
                <span className="text-slate-400 print:text-black text-[11px] block">1. Saldo Kas di Bank</span>
                <span className="font-mono font-bold text-slate-200 print:text-black">
                  {"Rp " + summary.saldoAkhir.toLocaleString("id-ID")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 print:text-black text-[11px] block">2. Uang Tunai di Brankas</span>
                <span className="font-mono font-bold text-slate-200 print:text-black">Rp 0</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-black text-[11px] block">3. Total Fisik Kas</span>
                <span className="font-mono font-bold text-emerald-400 print:text-black">
                  {"Rp " + summary.saldoAkhir.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          {/* Tanda Tangan Formal 2 Pihak */}
          <div className="grid grid-cols-2 gap-8 text-center mt-8 pt-4">
            <div>
              <p className="text-[11px] text-slate-400 print:text-black">Setuju / Mengetahui</p>
              <p className="text-xs font-semibold text-slate-200 print:text-black">
                Ketua {institutionName}
              </p>
              <div className="h-16 flex items-end justify-center">
                <span className="text-xs font-bold text-slate-100 underline tracking-wider print:text-black">
                  {formatPersonName(leaderName)}
                </span>
              </div>
            </div>

            <div>
              <p className="text-[11px] text-slate-400 print:text-black">Dibuat Oleh:</p>
              <p className="text-xs font-semibold text-slate-200 print:text-black">
                Bendahara Pengeluaran
              </p>
              <div className="h-16 flex items-end justify-center">
                <span className="text-xs font-bold text-slate-100 underline tracking-wider print:text-black">
                  {formatPersonName(treasurerName)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
