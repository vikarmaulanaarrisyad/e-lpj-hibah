"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  Sparkles,
  FileText,
  Package,
  Receipt,
  Calendar,
  Building,
  Check,
  ArrowRight,
} from "lucide-react";

export interface BastOrSpOption {
  id: string;
  nomor: string;
  nama: string;
  tanggal?: string;
  pihak1Nama?: string;
  pihak2Nama?: string;
}

interface SourceDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (compositeVal: string) => void;
  bastOptions: BastOrSpOption[];
  spOptions: BastOrSpOption[];
  receiptOptions: BastOrSpOption[];
  currentNomorReferensi?: string;
}

interface FlattenedSourceItem {
  compositeVal: string;
  type: "bast" | "sp" | "receipt";
  typeName: string;
  id: string;
  nomor: string;
  nama: string;
  tanggal?: string;
  pihak1Nama?: string;
  pihak2Nama?: string;
}

function formatDateIndo(dateStr?: string): string {
  if (!dateStr) return "-";
  try {
    const clean = dateStr.split("T")[0];
    const parts = clean.split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts;
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember",
      ];
      const mIdx = parseInt(m, 10) - 1;
      return `${parseInt(d, 10)} ${months[mIdx] || m} ${y}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export function SourceDocumentModal({
  isOpen,
  onClose,
  onSelect,
  bastOptions,
  spOptions,
  receiptOptions,
  currentNomorReferensi,
}: SourceDocumentModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "bast" | "sp" | "receipt">("all");

  // Reset filter when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setActiveTab("all");
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Flatten all sources into unified structure
  const allItems: FlattenedSourceItem[] = useMemo(() => {
    const list: FlattenedSourceItem[] = [];

    bastOptions.forEach((b) => {
      list.push({
        compositeVal: `bast:${b.id}`,
        type: "bast",
        typeName: "BAST (Serah Terima)",
        id: b.id,
        nomor: b.nomor,
        nama: b.nama,
        tanggal: b.tanggal,
        pihak1Nama: b.pihak1Nama,
        pihak2Nama: b.pihak2Nama,
      });
    });

    spOptions.forEach((s) => {
      list.push({
        compositeVal: `sp:${s.id}`,
        type: "sp",
        typeName: "Surat Pesanan (SP)",
        id: s.id,
        nomor: s.nomor,
        nama: s.nama,
        tanggal: s.tanggal,
        pihak1Nama: s.pihak1Nama,
        pihak2Nama: s.pihak2Nama,
      });
    });

    receiptOptions.forEach((r) => {
      list.push({
        compositeVal: `receipt:${r.id}`,
        type: "receipt",
        typeName: "Kwitansi Belanja",
        id: r.id,
        nomor: r.nomor,
        nama: r.nama,
        tanggal: r.tanggal,
        pihak1Nama: r.pihak1Nama,
        pihak2Nama: r.pihak2Nama,
      });
    });

    return list;
  }, [bastOptions, spOptions, receiptOptions]);

  // Filter items by active tab and search term
  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return allItems.filter((item) => {
      // Tab filter
      if (activeTab !== "all" && item.type !== activeTab) {
        return false;
      }

      // Search term filter
      if (!term) return true;

      const matchNomor = item.nomor?.toLowerCase().includes(term);
      const matchNama = item.nama?.toLowerCase().includes(term);
      const matchToko = item.pihak2Nama?.toLowerCase().includes(term);
      const matchTanggal = item.tanggal?.toLowerCase().includes(term);

      return matchNomor || matchNama || matchToko || matchTanggal;
    });
  }, [allItems, activeTab, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-600/50 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Pilih Berkas Sumber (Tarik Otomatis)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Pilih salah satu berkas realisasi pengadaan. Nama kegiatan, tanggal, nomor referensi, dan rekanan toko akan langsung diisikan otomatis.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar Section */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950/50 space-y-3">
          {/* Real-time Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ketik nomor berkas, nama kegiatan, atau nama rekanan..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs p-1"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === "all"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Semua</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                {allItems.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("bast")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === "bast"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>BAST</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                {bastOptions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("sp")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === "sp"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Package className="w-3.5 h-3.5 text-blue-400" />
              <span>Surat Pesanan</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                {spOptions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("receipt")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === "receipt"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              <span>Kwitansi</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                {receiptOptions.length}
              </span>
            </button>
          </div>
        </div>

        {/* List Berkas (Scrollable, Tangguh untuk Ratusan Data) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 max-h-[55vh]">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto text-lg">
                🔍
              </div>
              <p className="text-xs font-semibold text-slate-300">
                {searchTerm
                  ? `Tidak ada berkas yang cocok dengan "${searchTerm}"`
                  : "Belum ada berkas pada kategori ini"}
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Pastikan Anda telah mengisi modul BAST, Surat Pesanan, atau Kwitansi pada menu terkait.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = currentNomorReferensi && item.nomor === currentNomorReferensi;

              // Type badge styles
              const typeBadge =
                item.type === "bast"
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/60"
                  : item.type === "sp"
                  ? "bg-blue-950/80 text-blue-300 border-blue-700/60"
                  : "bg-amber-950/80 text-amber-300 border-amber-700/60";

              return (
                <div
                  key={item.compositeVal}
                  onClick={() => {
                    onSelect(item.compositeVal);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-emerald-950/40 border-emerald-500/80 shadow-sm"
                      : "bg-slate-950/60 border-slate-800 hover:border-emerald-600/70 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${typeBadge}`}
                      >
                        {item.typeName}
                      </span>
                      <span className="font-mono text-xs font-bold text-white tracking-wide">
                        {item.nomor}
                      </span>
                      {item.tanggal && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{formatDateIndo(item.tanggal)}</span>
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/90 px-2 py-0.2 rounded border border-emerald-600/40">
                          <Check className="w-3 h-3" /> Sedang Digunakan
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors line-clamp-2">
                      {item.nama}
                    </p>

                    {item.pihak2Nama && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Building className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>Penyedia / Toko: <strong className="text-slate-300">{item.pihak2Nama}</strong></span>
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                    <span className="text-[11px] px-3 py-1.5 rounded-lg bg-emerald-600/20 group-hover:bg-emerald-600 text-emerald-300 group-hover:text-white border border-emerald-600/40 font-semibold transition-all flex items-center gap-1">
                      <span>Terapkan</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 px-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Menampilkan <strong>{filteredItems.length}</strong> dari {allItems.length} berkas</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
