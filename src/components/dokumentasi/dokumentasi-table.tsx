"use client";

import { useState } from "react";
import type { ActivityDocumentationRecord } from "@/types";
import {
  FolderArchive,
  Search,
  Plus,
  Pencil,
  Trash2,
  Camera,
  MapPin,
  Calendar,
  Sparkles,
  CheckCircle2,
  Layers,
  FileText,
} from "lucide-react";
import { swalConfirmDelete } from "@/lib/swal";

interface DokumentasiTableProps {
  items: ActivityDocumentationRecord[];
  activeId?: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onNew: () => void;
  onLoadPreset: () => void;
}

export function DokumentasiTable({
  items,
  activeId,
  onSelect,
  onDelete,
  onNew,
  onLoadPreset,
}: DokumentasiTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [layoutFilter, setLayoutFilter] = useState<string>("ALL");

  const formatDateIndo = (dateVal: Date | string) => {
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const parsePhotoCount = (photosJson?: string): number => {
    if (!photosJson) return 0;
    try {
      const parsed = JSON.parse(photosJson);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  const filteredItems = items.filter((doc) => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      doc.namaKegiatan.toLowerCase().includes(term) ||
      (doc.nomorReferensi && doc.nomorReferensi.toLowerCase().includes(term)) ||
      doc.lokasiKegiatan.toLowerCase().includes(term) ||
      doc.judulDokumentasi.toLowerCase().includes(term);

    const matchLayout =
      layoutFilter === "ALL" || doc.layout === layoutFilter;

    return matchSearch && matchLayout;
  });

  const handleDeleteClick = async (id: string, nama: string) => {
    const isConfirmed = await swalConfirmDelete({
      title: "Hapus Arsip Dokumentasi?",
      text: `Apakah Anda yakin ingin menghapus dokumentasi "${nama}" dari database? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: "Ya, Hapus Arsip",
    });

    if (isConfirmed) {
      await onDelete(id);
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <FolderArchive className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white">
                Tabel Arsip Dokumentasi &amp; Preset
              </h3>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300">
                {items.length} Dokumen Tersimpan
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola lembar dokumentasi fisik pengadaan, muat ke formulir untuk diedit, atau hapus berkas.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onLoadPreset}
            className="px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-700/60 text-amber-300 hover:bg-amber-900/60 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            title="Muat contoh preset demo lengkap dengan gambar dan keterangan"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Muat Contoh Demo</span>
          </button>
          <button
            type="button"
            onClick={onNew}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            title="Buat lembar dokumentasi kegiatan baru"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Dokumentasi Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kegiatan, no. referensi, lokasi..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Layout Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Format:</span>
          <select
            value={layoutFilter}
            onChange={(e) => setLayoutFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">Semua Format Layout</option>
            <option value="2-per-page">2 Foto per Halaman</option>
            <option value="4-per-page">4 Foto per Halaman</option>
            <option value="1-per-page">1 Foto per Halaman</option>
          </select>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-3 text-center w-12">No</th>
              <th className="py-3 px-3 w-28">Tanggal</th>
              <th className="py-3 px-4 min-w-[220px]">Nama Kegiatan &amp; Judul</th>
              <th className="py-3 px-3 min-w-[150px]">No. Referensi / Dasar</th>
              <th className="py-3 px-3 min-w-[160px]">Lokasi</th>
              <th className="py-3 px-3 text-center w-28">Foto &amp; Format</th>
              <th className="py-3 px-4 text-center w-36">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 px-4 text-center text-slate-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="font-semibold text-slate-300 text-sm">
                      {searchTerm || layoutFilter !== "ALL"
                        ? "Tidak ada arsip yang cocok dengan pencarian"
                        : "Belum ada arsip dokumentasi tersimpan"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {searchTerm || layoutFilter !== "ALL"
                        ? "Coba sesuaikan kata kunci pencarian atau filter format layout."
                        : "Gunakan tombol 'Muat Contoh Demo' atau 'Tambah Dokumentasi Baru' di atas untuk memulai."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((doc, idx) => {
                const isActive = activeId === doc.id;
                const photoCount = parsePhotoCount(doc.photosJson);

                return (
                  <tr
                    key={doc.id}
                    className={`transition-colors hover:bg-slate-800/40 ${
                      isActive ? "bg-indigo-950/40 border-l-4 border-l-indigo-500" : ""
                    }`}
                  >
                    {/* No */}
                    <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Tanggal */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{formatDateIndo(doc.tanggalKegiatan)}</span>
                      </div>
                    </td>

                    {/* Nama Kegiatan */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white text-xs leading-snug">
                            {doc.namaKegiatan}
                          </p>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300">
                              <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                              <span>Sedang Dibuka</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {doc.judulDokumentasi}
                        </p>
                      </div>
                    </td>

                    {/* No. Referensi */}
                    <td className="py-3 px-3">
                      {doc.nomorReferensi ? (
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 inline-block">
                          {doc.nomorReferensi}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[11px] italic">-</span>
                      )}
                    </td>

                    {/* Lokasi */}
                    <td className="py-3 px-3">
                      <div className="flex items-start gap-1 text-[11px] text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{doc.lokasiKegiatan}</span>
                      </div>
                    </td>

                    {/* Foto & Layout */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                          <Camera className="w-3 h-3 text-emerald-400" />
                          <span>{photoCount} Foto</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {doc.layout === "4-per-page"
                            ? "4 / Hal"
                            : doc.layout === "1-per-page"
                            ? "1 / Hal"
                            : "2 / Hal"}
                        </span>
                      </div>
                    </td>

                    {/* Aksi (Edit & Hapus) */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelect(doc.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                            isActive
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/30"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700"
                          }`}
                          title="Buka dan edit berkas dokumentasi ini di formulir & pratinjau"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>{isActive ? "Buka" : "Edit"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(doc.id, doc.namaKegiatan)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 border border-transparent hover:border-rose-800/60 transition-all cursor-pointer"
                          title="Hapus dokumentasi ini dari database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
  );
}
