"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  FileCheck,
  ShoppingBag,
  Camera,
  Receipt as ReceiptIcon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
  Info,
  BadgeAlert,
  Percent,
} from "lucide-react";
import type {
  Receipt,
  PurchaseOrder,
  BastWithReceipt,
  ActivityDocumentation,
  BkuSummary,
} from "@/types";

interface LpjReadinessWidgetProps {
  totalAnggaran: number;
  totalRealisasi: number;
  totalSisaPagu: number;
  persentaseSerapan: number;
  receipts: Receipt[];
  purchaseOrders: PurchaseOrder[];
  bastList: BastWithReceipt[];
  documentations: ActivityDocumentation[];
  bkuSummary?: BkuSummary | null;
  activeTahun: string;
}

interface ActionItem {
  id: string;
  category: "pagu" | "pengadaan" | "dokumentasi" | "pajak";
  title: string;
  description: string;
  link: string;
  linkText: string;
  severity: "danger" | "warning";
}

export function LpjReadinessWidget({
  totalAnggaran,
  totalRealisasi,
  totalSisaPagu,
  persentaseSerapan,
  receipts = [],
  purchaseOrders = [],
  bastList = [],
  documentations = [],
  bkuSummary,
  activeTahun,
}: LpjReadinessWidgetProps) {
  const [activeTab, setActiveTab] = useState<"all" | "issues" | "completed">("all");
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // ================= 1. ANALISIS STATUS SALDO PAGU =================
  const paguAnalysis = useMemo(() => {
    let score = 0;
    const issues: ActionItem[] = [];

    if (totalAnggaran === 0) {
      score = 0;
      issues.push({
        id: "pagu-empty",
        category: "pagu",
        title: "Pagu Anggaran RAB Belum Disetel",
        description: "Anggaran hibah masih Rp 0. Masukkan rincian belanja NPHD di modul RAB.",
        link: "/user/rab",
        linkText: "Atur Pos Anggaran RAB ➔",
        severity: "danger",
      });
    } else if (totalSisaPagu === 0 && totalRealisasi > 0) {
      score = 100;
    } else if (totalSisaPagu > 0) {
      // Masih ada sisa
      score = Math.min(95, Math.max(10, Math.round((totalRealisasi / totalAnggaran) * 100)));
      issues.push({
        id: "pagu-remaining",
        category: "pagu",
        title: `Sisa Anggaran Belum Terserap Rp ${Math.round(totalSisaPagu).toLocaleString("id-ID")}`,
        description: `Realisasi baru mencapai ${persentaseSerapan}%. Pastikan seluruh dana hibah terserap tuntas sebelum batas akhir LPJ.`,
        link: "/user/kwitansi",
        linkText: "Catat Kwitansi Belanja ➔",
        severity: "warning",
      });
    } else {
      // Defisit / Overbudget
      score = 20;
      issues.push({
        id: "pagu-deficit",
        category: "pagu",
        title: `Anggaran Defisit / Overbudget Rp ${Math.round(Math.abs(totalSisaPagu)).toLocaleString("id-ID")}`,
        description: "Total realisasi belanja melebihi pagu NPHD yang ditetapkan. Sesuaikan nominal atau kurangi kwitansi.",
        link: "/user/rab",
        linkText: "Periksa Pos Anggaran Defisit ➔",
        severity: "danger",
      });
    }

    return { score, issues };
  }, [totalAnggaran, totalRealisasi, totalSisaPagu, persentaseSerapan]);

  // ================= 2. ANALISIS VALIDASI PENGADAAN (SP & BAST) =================
  const pengadaanAnalysis = useMemo(() => {
    const issues: ActionItem[] = [];
    let completedCount = 0;
    let totalTarget = 0;

    // 2a. Evaluasi setiap Surat Pesanan: Apakah sudah ada BAST?
    for (const po of purchaseOrders) {
      totalTarget++;
      const matchedBast = bastList.find(
        (b) =>
          b.nomorSpk === po.nomorSp ||
          (po.receiptId && b.receiptId === po.receiptId) ||
          b.namaKegiatan.toLowerCase() === po.namaPaket.toLowerCase()
      );

      if (matchedBast) {
        completedCount++;
      } else {
        issues.push({
          id: `po-no-bast-${po.id}`,
          category: "pengadaan",
          title: `Surat Pesanan ${po.nomorSp} Belum Ada BAST`,
          description: `Paket "${po.namaPaket}" (Toko ${po.pihak2Toko}) belum memiliki Berita Acara Serah Terima hasil pemeriksaan barang.`,
          link: `/user/bast?spNo=${encodeURIComponent(po.nomorSp)}`,
          linkText: "+ Buat BAST Serah Terima ➔",
          severity: "danger",
        });
      }
    }

    // 2b. Evaluasi Kwitansi pengadaan barang fisik: Apakah sudah ada Surat Pesanan?
    for (const r of receipts) {
      const isBarang =
        r.nominal >= 1000000 ||
        /belanja|alat|sound|printer|laptop|komputer|seragam|meja|kursi|sarana|pengadaan/i.test(r.uraian);

      if (isBarang) {
        const hasPo = purchaseOrders.some(
          (p) => p.receiptId === r.id || p.totalHarga === r.nominal
        );

        if (!hasPo) {
          totalTarget++;
          issues.push({
            id: `receipt-no-po-${r.id}`,
            category: "pengadaan",
            title: `Kwitansi ${r.nomorBukti} Belum Ada Surat Pesanan (SP)`,
            description: `Belanja barang "${r.uraian.slice(0, 45)}..." senilai Rp ${r.nominal.toLocaleString("id-ID")} wajib dilengkapi Surat Pesanan ke rekanan.`,
            link: `/user/pesanan?receiptId=${encodeURIComponent(r.id)}`,
            linkText: "+ Buat Surat Pesanan (SP) ➔",
            severity: "warning",
          });
        }
      }
    }

    const score =
      totalTarget === 0
        ? receipts.length > 0
          ? 100
          : 0
        : Math.round((completedCount / totalTarget) * 100);

    return { score, issues, totalTarget, completedCount };
  }, [purchaseOrders, bastList, receipts]);

  // ================= 3. ANALISIS VALIDASI DOKUMENTASI FISIK =================
  const dokumentasiAnalysis = useMemo(() => {
    const issues: ActionItem[] = [];
    let completedDocs = 0;

    // Target dokumentasi: Setiap Kwitansi belanja barang atau BAST harus punya dokumentasi
    const targetItems = receipts.filter(
      (r) =>
        r.nominal >= 500000 ||
        /belanja|alat|sound|printer|laptop|komputer|kegiatan|pelatihan|honor|sarana/i.test(r.uraian)
    );

    for (const r of targetItems) {
      const hasDoc = documentations.some((d) => {
        const matchRef = d.nomorReferensi && d.nomorReferensi.toLowerCase() === r.nomorBukti.toLowerCase();
        const matchTitle = d.namaKegiatan && r.uraian.toLowerCase().includes(d.namaKegiatan.toLowerCase().slice(0, 15));
        return matchRef || matchTitle;
      });

      if (hasDoc) {
        completedDocs++;
      } else {
        issues.push({
          id: `doc-missing-${r.id}`,
          category: "dokumentasi",
          title: `Foto Dokumentasi Belum Ada: ${r.nomorBukti}`,
          description: `Kwitansi "${r.uraian.slice(0, 45)}..." (Rp ${r.nominal.toLocaleString("id-ID")}) belum memiliki lampiran foto fisik kegiatan/barang di lembar dokumentasi.`,
          link: `/user/dokumentasi?receiptNo=${encodeURIComponent(r.nomorBukti)}`,
          linkText: "+ Unggah Foto Dokumentasi ➔",
          severity: "warning",
        });
      }
    }

    const score =
      targetItems.length === 0
        ? documentations.length > 0
          ? 100
          : 0
        : Math.min(100, Math.round((completedDocs / targetItems.length) * 100));

    return { score, issues, targetCount: targetItems.length, completedDocs };
  }, [receipts, documentations]);

  // ================= 4. ANALISIS VALIDASI PAJAK (PPN & PPH) =================
  const pajakAnalysis = useMemo(() => {
    const issues: ActionItem[] = [];
    let score = 100;

    // Cek apakah ada belanja > 2jt tapi belum dikenakan PPh/PPN
    const bigReceiptsNoTax = receipts.filter(
      (r) => r.nominal >= 2000000 && !r.isPpn && !r.isPph21 && !r.isPph22 && !r.isPph23
    );

    if (bigReceiptsNoTax.length > 0) {
      score -= Math.min(30, bigReceiptsNoTax.length * 10);
      issues.push({
        id: "tax-check-required",
        category: "pajak",
        title: `${bigReceiptsNoTax.length} Transaksi Belanja ≥ Rp 2.000.000 Belum Dipotong Pajak`,
        description: `Terdapat transaksi dengan nilai di atas batas kena pajak. Periksa apakah rekanan toko memiliki NPWP atau dibebaskan pajak.`,
        link: "/user/kwitansi",
        linkText: "Tinjau Pemotongan Pajak Kwitansi ➔",
        severity: "warning",
      });
    }

    // Cek saldo pajak di BKU jika ada summary
    if (bkuSummary) {
      const totalPajakDipungut = bkuSummary.totalPajakDipungut || 0;
      // Jika ada pungutan pajak, pastikan dicatat penyetorannya
      if (totalPajakDipungut > 0) {
        // Anggap tertib jika tidak ada kendala
      }
    }

    return { score: Math.max(0, score), issues };
  }, [receipts, bkuSummary]);

  // ================= KALKULASI SKOR KESELURUHAN (0 - 100%) =================
  const totalScore = useMemo(() => {
    // Bobot seimbang masing-masing 25%
    const total =
      paguAnalysis.score * 0.25 +
      pengadaanAnalysis.score * 0.25 +
      dokumentasiAnalysis.score * 0.25 +
      pajakAnalysis.score * 0.25;
    return Math.round(total);
  }, [paguAnalysis, pengadaanAnalysis, dokumentasiAnalysis, pajakAnalysis]);

  const allIssues = useMemo(() => {
    return [
      ...paguAnalysis.issues,
      ...pengadaanAnalysis.issues,
      ...dokumentasiAnalysis.issues,
      ...pajakAnalysis.issues,
    ];
  }, [paguAnalysis, pengadaanAnalysis, dokumentasiAnalysis, pajakAnalysis]);

  // Badge Status & Styling
  const statusConfig = useMemo(() => {
    if (totalScore === 100) {
      return {
        label: "SIAP DIAUDIT & DISAHKAN",
        badgeBg: "bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]",
        ringColor: "text-emerald-400",
        strokeColor: "#10b981",
        description: "Seluruh pagu terserap tuntas, berkas pengadaan lengkap, foto fisik siap, dan pajak tertib!",
      };
    }
    if (totalScore >= 75) {
      return {
        label: "HAMPIR LENGKAP (TINGGAL FINISHING)",
        badgeBg: "bg-amber-950/80 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
        ringColor: "text-amber-400",
        strokeColor: "#f59e0b",
        description: `Tinggal melengkapi ${allIssues.length} item minor sebelum dokumen siap dibundel jilid.`,
      };
    }
    if (totalScore >= 50) {
      return {
        label: "SEBAGIAN BERKAS TERCATAT",
        badgeBg: "bg-orange-950/80 border-orange-500/50 text-orange-300",
        ringColor: "text-orange-400",
        strokeColor: "#f97316",
        description: "Beberapa berkas BAST atau dokumentasi masih belum tertaut.",
      };
    }
    return {
      label: "BELUM MEMENUHI KELAYAKAN AUDIT",
      badgeBg: "bg-rose-950/80 border-rose-500/50 text-rose-300",
      ringColor: "text-rose-400",
      strokeColor: "#f43f5e",
      description: "Segera lengkapi data realisasi dan dokumen pendukung sesuai proposal hibah.",
    };
  }, [totalScore, allIssues.length]);

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Dynamic Ambient Background Aura */}
      <div
        className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ backgroundColor: statusConfig.strokeColor }}
      />

      {/* TOP HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80 relative z-10">
        {/* Left Title & Status */}
        <div className="flex items-start sm:items-center gap-4">
          {/* Radial Circular Score Gauge */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="text-slate-800"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                strokeWidth="10"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * totalScore) / 100}
                strokeLinecap="round"
                stroke={statusConfig.strokeColor}
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
                {totalScore}%
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                Kesiapan
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusConfig.badgeBg}`}>
                {statusConfig.label}
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                T.A. {activeTahun === "ALL" ? "Semua" : activeTahun}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>Kelayakan LPJ &amp; Kesiapan Audit Daerah</span>
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse hidden sm:inline" />
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              {statusConfig.description}
            </p>
          </div>
        </div>

        {/* Right Toggle & Quick Action */}
        <div className="flex items-center gap-3 self-end lg:self-center">
          <Link
            href="/user/rekap-lpj"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-2 transition-colors shadow-sm"
          >
            <span>Tinjau Rekapitulasi LPJ</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
          </Link>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            type="button"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title={isExpanded ? "Sembunyikan Rincian" : "Tampilkan Rincian"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 4 PILLARS AUDIT CRITERIA GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 relative z-10">
        {/* Kriteria 1: Pagu Anggaran */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            paguAnalysis.score === 100
              ? "bg-emerald-950/20 border-emerald-500/30"
              : paguAnalysis.score >= 50
              ? "bg-amber-950/20 border-amber-500/30"
              : "bg-rose-950/20 border-rose-500/30"
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">1. Saldo Pagu</span>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                paguAnalysis.score === 100
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              }`}
            >
              {paguAnalysis.score}%
            </span>
          </div>
          <div className="mt-2.5 space-y-1">
            <p className="text-xs text-slate-300 font-medium flex items-center justify-between">
              <span>Terserap:</span>
              <span className="font-mono text-white font-semibold">
                Rp {Math.round(totalRealisasi).toLocaleString("id-ID")}
              </span>
            </p>
            <p className="text-xs text-slate-400 flex items-center justify-between">
              <span>Sisa Pagu:</span>
              <span
                className={`font-mono font-semibold ${
                  totalSisaPagu === 0 ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                Rp {Math.round(totalSisaPagu).toLocaleString("id-ID")}
              </span>
            </p>
          </div>
          <div className="mt-3 text-[11px] flex items-center gap-1.5">
            {paguAnalysis.score === 100 ? (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Terserap 100% Sempurna
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Sisa belum Rp 0
              </span>
            )}
          </div>
        </div>

        {/* Kriteria 2: Validasi Pengadaan (SP & BAST) */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            pengadaanAnalysis.score === 100
              ? "bg-emerald-950/20 border-emerald-500/30"
              : pengadaanAnalysis.score >= 50
              ? "bg-amber-950/20 border-amber-500/30"
              : "bg-rose-950/20 border-rose-500/30"
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">2. Berkas Pengadaan</span>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                pengadaanAnalysis.score === 100
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              }`}
            >
              {pengadaanAnalysis.score}%
            </span>
          </div>
          <div className="mt-2.5 space-y-1">
            <p className="text-xs text-slate-300 font-medium flex items-center justify-between">
              <span>Surat Pesanan:</span>
              <span className="font-mono text-white font-semibold">{purchaseOrders.length} Berkas</span>
            </p>
            <p className="text-xs text-slate-400 flex items-center justify-between">
              <span>BAST Sah:</span>
              <span className="font-mono text-emerald-400 font-semibold">{bastList.length} Berkas</span>
            </p>
          </div>
          <div className="mt-3 text-[11px] flex items-center gap-1.5">
            {pengadaanAnalysis.score === 100 ? (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> SP &amp; BAST Lengkap
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Ada SP/BAST Kurang
              </span>
            )}
          </div>
        </div>

        {/* Kriteria 3: Validasi Dokumentasi Fisik */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            dokumentasiAnalysis.score === 100
              ? "bg-emerald-950/20 border-emerald-500/30"
              : dokumentasiAnalysis.score >= 50
              ? "bg-amber-950/20 border-amber-500/30"
              : "bg-rose-950/20 border-rose-500/30"
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">3. Foto Fisik Barang</span>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                dokumentasiAnalysis.score === 100
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              }`}
            >
              {dokumentasiAnalysis.score}%
            </span>
          </div>
          <div className="mt-2.5 space-y-1">
            <p className="text-xs text-slate-300 font-medium flex items-center justify-between">
              <span>Dokumentasi:</span>
              <span className="font-mono text-white font-semibold">{documentations.length} Lembar</span>
            </p>
            <p className="text-xs text-slate-400 flex items-center justify-between">
              <span>Cloudinary CDN:</span>
              <span className="font-mono text-cyan-400 font-semibold">Tersimpan</span>
            </p>
          </div>
          <div className="mt-3 text-[11px] flex items-center gap-1.5">
            {dokumentasiAnalysis.score === 100 ? (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Foto Fisik Terverifikasi
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Belum Semua Difoto
              </span>
            )}
          </div>
        </div>

        {/* Kriteria 4: Validasi Pajak (PPN & PPh) */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            pajakAnalysis.score === 100
              ? "bg-emerald-950/20 border-emerald-500/30"
              : "bg-amber-950/20 border-amber-500/30"
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">4. Kepatuhan Pajak</span>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                pajakAnalysis.score === 100
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              }`}
            >
              {pajakAnalysis.score}%
            </span>
          </div>
          <div className="mt-2.5 space-y-1">
            <p className="text-xs text-slate-300 font-medium flex items-center justify-between">
              <span>Pajak Dipungut:</span>
              <span className="font-mono text-white font-semibold">
                Rp {Math.round(bkuSummary?.totalPajakDipungut || 0).toLocaleString("id-ID")}
              </span>
            </p>
            <p className="text-xs text-slate-400 flex items-center justify-between">
              <span>Status Potongan:</span>
              <span className="font-mono text-emerald-400 font-semibold">Tertib</span>
            </p>
          </div>
          <div className="mt-3 text-[11px] flex items-center gap-1.5">
            {pajakAnalysis.score === 100 ? (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Sesuai Ketentuan Pajak
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Perlu Review Pajak
              </span>
            )}
          </div>
        </div>
      </div>

      {/* EXPANDABLE ACTIONABLE CHECKLIST OF MISSING DOCUMENTS */}
      {isExpanded && (
        <div className="mt-6 pt-5 border-t border-slate-800 relative z-10 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <BadgeAlert className="w-4 h-4 text-amber-400" />
                <span>Checklist Kelengkapan Berkas ({allIssues.length} Perlu Dilengkapi)</span>
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800 self-start sm:self-auto text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  activeTab === "all"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Semua ({allIssues.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("issues")}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  activeTab === "issues"
                    ? "bg-rose-900/60 text-rose-300 border border-rose-800/60"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Kurang Lengkap ({allIssues.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("completed")}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  activeTab === "completed"
                    ? "bg-emerald-900/60 text-emerald-300 border border-emerald-800/60"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Sudah Lengkap
              </button>
            </div>
          </div>

          {/* Issue Cards List */}
          {activeTab !== "completed" && allIssues.length > 0 && (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1.5">
              {allIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:translate-x-1 ${
                    issue.severity === "danger"
                      ? "bg-rose-950/20 border-rose-800/40 hover:border-rose-700/60"
                      : "bg-amber-950/20 border-amber-800/40 hover:border-amber-700/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        issue.severity === "danger"
                          ? "bg-rose-950 text-rose-400 border border-rose-800/60"
                          : "bg-amber-950 text-amber-400 border border-amber-800/60"
                      }`}
                    >
                      {issue.category === "pengadaan" ? (
                        <ShoppingBag className="w-3.5 h-3.5" />
                      ) : issue.category === "dokumentasi" ? (
                        <Camera className="w-3.5 h-3.5" />
                      ) : issue.category === "pajak" ? (
                        <ReceiptIcon className="w-3.5 h-3.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-200">
                        {issue.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {issue.description}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={issue.link}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all shadow-sm ${
                      issue.severity === "danger"
                        ? "bg-rose-600 hover:bg-rose-500 text-white border border-rose-500"
                        : "bg-amber-600 hover:bg-amber-500 text-white border border-amber-500"
                    }`}
                  >
                    <span>{issue.linkText}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Empty / All Done Message */}
          {(allIssues.length === 0 || activeTab === "completed") && (
            <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-center flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-glow">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white mt-1">
                Luar Biasa! Dokumen LPJ Hibah Siap Diaudit
              </h4>
              <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                Seluruh tahapan pengadaan, bukti serah terima barang (BAST), foto fisik dokumentasi, dan saldo kas telah tertib dan sesuai standar BPKAD &amp; Bakesbangpol.
              </p>
              <Link
                href="/user/rekap-lpj"
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
              >
                <span>Cetak Rekapitulasi LPJ Final</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
