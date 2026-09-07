"use client";

import { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Package,
  Download,
  Calendar,
  FileText,
  Layers,
  BookOpen,
  Receipt,
  ShoppingBag,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderArchive,
  Sparkles,
} from "lucide-react";
import { getLpjArchiveDataAction, type LpjArchiveData } from "@/app/actions/archive.action";
import { downloadFullLpjZipArchive, type ZipArchiveProgress } from "@/lib/zip-archive";
import { AVAILABLE_TAHUN_ANGGARAN, DEFAULT_TAHUN_ANGGARAN } from "@/lib/utils/tahun-anggaran";
import { swalSuccess, swalError } from "@/lib/swal";

interface DownloadArsipModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTahun?: string;
}

export function DownloadArsipModal({
  isOpen,
  onClose,
  initialTahun = DEFAULT_TAHUN_ANGGARAN,
}: DownloadArsipModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [selectedTahun, setSelectedTahun] = useState<string>(initialTahun);
  const [archiveData, setArchiveData] = useState<LpjArchiveData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Download & Compression progress state
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<ZipArchiveProgress>({
    step: "",
    percent: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update selected year if prop changes
  useEffect(() => {
    if (initialTahun) {
      setSelectedTahun(initialTahun);
    }
  }, [initialTahun]);

  // Fetch document counts whenever modal opens or year changes
  const loadArchiveData = (tahun: string) => {
    setIsLoadingData(true);
    startTransition(async () => {
      const res = await getLpjArchiveDataAction(tahun);
      if (res.success && res.data) {
        setArchiveData(res.data);
      } else {
        setArchiveData(null);
      }
      setIsLoadingData(false);
    });
  };

  useEffect(() => {
    if (isOpen) {
      loadArchiveData(selectedTahun);
    }
  }, [isOpen, selectedTahun]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isDownloading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isDownloading]);

  if (!mounted || !isOpen) return null;

  const handleStartDownload = async () => {
    if (!archiveData) return;

    setIsDownloading(true);
    setProgress({ step: "Menghubungkan & membaca data arsip...", percent: 5 });

    try {
      await downloadFullLpjZipArchive(archiveData, (p) => {
        setProgress(p);
      });

      swalSuccess(
        "Arsip Berhasil Diunduh!",
        `Seluruh dokumen LPJ Hibah TA ${selectedTahun} telah dikemas rapi dalam format .ZIP.`
      );
      setTimeout(() => {
        setIsDownloading(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Gagal mengunduh arsip ZIP:", err);
      swalError("Gagal Mengunduh Arsip", err?.message || "Terjadi kesalahan saat mengompres berkas.");
      setIsDownloading(false);
    }
  };

  const totalBerkas = archiveData
    ? 4 +
      archiveData.counts.receipts +
      archiveData.counts.purchaseOrders +
      archiveData.counts.bastDocuments +
      archiveData.counts.documentations
    : 0;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Download Arsip Lengkap (ZIP)</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Semua Berkas
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Kemasan berkas PDF resmi (Cover, Pengantar, RAB, BKU, Kwitansi, SP, BAST) dalam satu folder .zip
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isDownloading}
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Pilih Tahun Anggaran */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <label className="text-xs font-semibold text-white flex items-center gap-1.5 mb-1">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Pilih Tahun Anggaran yang Diarsipkan:</span>
              </label>
              <p className="text-[11px] text-slate-400">
                Menyaring transaksi & dokumen sesuai tahun pelaksanaan
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl p-1 shrink-0">
              {AVAILABLE_TAHUN_ANGGARAN.map((th) => (
                <button
                  key={th}
                  type="button"
                  disabled={isDownloading}
                  onClick={() => setSelectedTahun(th)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedTahun === th
                      ? "bg-brand-primary text-white shadow-md border border-emerald-500/40"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {th}
                </button>
              ))}
              <button
                type="button"
                disabled={isDownloading}
                onClick={() => setSelectedTahun("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedTahun === "ALL"
                    ? "bg-brand-primary text-white shadow-md border border-emerald-500/40"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                Semua
              </button>
            </div>
          </div>

          {/* Rincian Berkas yang Ditemukan */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Dokumen yang akan Dikemas ({isLoadingData ? "..." : `${totalBerkas} Dokumen`})
              </span>
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Format Standar F4 / Siap Cetak</span>
              </span>
            </div>

            {isLoadingData ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                <span className="text-xs">Memeriksa dokumen TA {selectedTahun}...</span>
              </div>
            ) : archiveData ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. Cover & Pengantar */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="truncate">Cover & Pengantar</span>
                  </div>
                  <span className="text-lg font-bold text-white">2 Berkas</span>
                  <span className="text-[10px] text-slate-400">Sampul & Surat Resmi</span>
                </div>

                {/* 2. RAB & BKU */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold">
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span className="truncate">RAB & BKU</span>
                  </div>
                  <span className="text-lg font-bold text-white">
                    {archiveData.counts.bkuTransactions} Transaksi
                  </span>
                  <span className="text-[10px] text-slate-400">Kas Umum & Pagu</span>
                </div>

                {/* 3. Kwitansi */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                    <Receipt className="w-4 h-4 shrink-0" />
                    <span className="truncate">Kwitansi Kas</span>
                  </div>
                  <span className="text-lg font-bold text-white">
                    {archiveData.counts.receipts} Bukti
                  </span>
                  <span className="text-[10px] text-slate-400">Kwitansi Pengeluaran</span>
                </div>

                {/* 4. SP & BAST */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-purple-400 text-xs font-semibold">
                    <FileCheck className="w-4 h-4 shrink-0" />
                    <span className="truncate">SP & BAST</span>
                  </div>
                  <span className="text-lg font-bold text-white">
                    {archiveData.counts.purchaseOrders + archiveData.counts.bastDocuments} Dokumen
                  </span>
                  <span className="text-[10px] text-slate-400">Pengadaan Barang</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
                Tidak ada data dokumen ditemukan untuk tahun {selectedTahun}.
              </div>
            )}
          </div>

          {/* Progress Bar saat Downloading */}
          {isDownloading && (
            <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-4 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-300 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>{progress.step || "Sedang memproses..."}</span>
                </span>
                <span className="font-bold text-white font-mono">{progress.percent}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 text-right">
                Harap jangan menutup browser selama proses pengemasan ZIP
              </p>
            </div>
          )}

          {/* Tips / Penjelasan */}
          <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-start gap-2.5 text-xs text-emerald-200/90">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-white block">Struktur Folder Rapi & Standar Audit</span>
              <p className="text-[11px] text-slate-300">
                Berkas di dalam ZIP diberi nomor urut prefiks (01 s/d 08) sehingga saat diekstrak langsung tersusun sesuai urutan bundel penjilidan LPJ fisik.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isDownloading}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40"
          >
            Tutup
          </button>

          <button
            type="button"
            disabled={isDownloading || isLoadingData || !archiveData}
            onClick={handleStartDownload}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all shadow-lg hover:shadow-emerald-900/30 flex items-center gap-2 disabled:opacity-40 cursor-pointer"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengemas ZIP...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Unduh Arsip TA {selectedTahun} (.ZIP)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
