"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Printer,
  Building2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileDown,
  Loader2,
  Sparkles,
  ArrowLeft,
  Settings,
  Image as ImageIcon,
} from "lucide-react";
import { KopSuratModal } from "@/components/kop-surat/kop-surat-modal";
import { CoverCanvas } from "./cover-canvas";
import type { CoverFormData, CoverBorderStyle, InstitutionProfile } from "@/types";

interface CoverFormProps {
  initialProfile?: InstitutionProfile | null;
  userProfile?: {
    name: string;
    leaderName?: string | null;
    institution?: string | null;
  };
}

export function CoverForm({ initialProfile, userProfile }: CoverFormProps) {
  const [profile, setProfile] = useState<InstitutionProfile | null>(initialProfile || null);
  const [isKopModalOpen, setIsKopModalOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const defaultInstitution =
    profile?.namaLembaga ||
    (userProfile?.institution ? userProfile.institution.toUpperCase() : "PIMPINAN RANTING FATAYAT NU");
  const defaultSubNama = profile?.subNama || "DAWUHAN SELATAN";
  const defaultAlamat =
    profile?.alamat || "Jl. Kemuning 2016 Desa Dawuhan RT.23 RW.06 Talang – Tegal 52193";

  const [formData, setFormData] = useState<CoverFormData>({
    judulLaporan: "LAPORAN PERTANGGUNGJAWABAN",
    subJudul: "BANTUAN HIBAH",
    namaPemerintah: profile?.instansiInduk || "PEMERINTAH DAERAH KABUPATEN TEGAL",
    tahunAnggaran: "2026",
    kataPengantar: "OLEH",
    namaLembaga: defaultInstitution,
    subNama: defaultSubNama,
    alamat: defaultAlamat,
    borderStyle: "ornament-classic",
    logoUrl: profile?.logoUrl || null,
  });

  // Sinkronisasi data saat profil diperbarui via KopSuratModal
  const handleProfileUpdated = (updated: InstitutionProfile) => {
    setProfile(updated);
    setFormData((prev) => ({
      ...prev,
      namaLembaga: updated.namaLembaga || prev.namaLembaga,
      subNama: updated.subNama || prev.subNama,
      alamat: updated.alamat || prev.alamat,
      namaPemerintah: updated.instansiInduk || prev.namaPemerintah,
      logoUrl: updated.logoUrl !== undefined ? updated.logoUrl : prev.logoUrl,
    }));
  };

  const handleResetToDefault = () => {
    setFormData({
      judulLaporan: "LAPORAN PERTANGGUNGJAWABAN",
      subJudul: "BANTUAN HIBAH",
      namaPemerintah: profile?.instansiInduk || "PEMERINTAH DAERAH KABUPATEN TEGAL",
      tahunAnggaran: "2026",
      kataPengantar: "OLEH",
      namaLembaga: defaultInstitution,
      subNama: defaultSubNama,
      alamat: defaultAlamat,
      borderStyle: "ornament-classic",
      logoUrl: profile?.logoUrl || null,
    });
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const { exportCoverToPdf } = await import("@/lib/cover-pdf");
      await exportCoverToPdf({
        elementId: "coverPrintArea",
        formData,
        profile,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full">
      {/* ================= TOP SUB-HEADER COMMAND RIBBON ================= */}
      <div className="w-full bg-slate-900 border-b border-slate-800 py-2.5 px-4 sm:px-8 mb-6 shadow-sm">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/user"
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors font-medium btn-press"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-2 font-mono text-slate-300">
              <span className="text-slate-400">Modul:</span>
              <span className="font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
                Sampul Cover LPJ
              </span>
              <span className="px-2 py-0.5 bg-teal-950 border border-teal-700/60 text-teal-300 rounded font-semibold text-[11px]">
                Format Standar F4 (215mm × 330mm)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setIsKopModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-[#004532]/80 hover:bg-[#004532] border border-[#006c4e] text-emerald-300 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm btn-press hover:shadow-emerald-950/40 cursor-pointer"
              title="Sesuaikan Kop Surat, Logo Cloudinary, dan Nomor Lembaga"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Atur Kop & Logo</span>
            </button>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 btn-press cursor-pointer hover:text-white"
              title="Kembalikan teks formulir ke pengaturan awal profil database"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Default</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/50 text-white text-xs font-semibold transition-all shadow-md hover:shadow-emerald-900/50 flex items-center gap-1.5 disabled:opacity-50 btn-press cursor-pointer"
              title="Ekspor Sampul Cover langsung ke file PDF ukuran F4 Portrait (215mm x 330mm) siap jilid"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>Ekspor PDF (F4)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= WORKSPACE (Left Form : Right Live F4 Preview) ================= */}
      <div className="max-w-[1720px] w-full mx-auto px-3 sm:px-8 pb-12">
        {/* Responsive Mobile / Tablet View Switcher Tab (< xl screens) */}
        <div className="xl:hidden mb-6 flex items-center bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shadow-lg">
          <button
            type="button"
            onClick={() => setMobileTab("form")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all btn-press flex items-center justify-center gap-2 ${
              mobileTab === "form"
                ? "bg-brand-primary text-white shadow-md border border-emerald-600/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Formulir Sampul Cover</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all btn-press flex items-center justify-center gap-2 ${
              mobileTab === "preview"
                ? "bg-brand-primary text-white shadow-md border border-emerald-600/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Pratinjau Kertas F4 (Live)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* ================= LEFT COLUMN: FORM SETTINGS (5 Cols) ================= */}
          <div
            className={`xl:col-span-5 flex-col gap-5 ${mobileTab === "preview" ? "hidden xl:flex" : "flex"}`}
          >
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 sm:p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Parameter Sampul LPJ</h3>
                    <p className="text-[11px] text-slate-400">Tersinkronisasi otomatis dengan database lembaga</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[10px] font-bold">
                  Kertas F4
                </span>
              </div>

              {/* Model Bingkai Halaman */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-200">
                  Model Bingkai Halaman (Page Border)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "ornament-classic", label: "Ornamen Klasik", desc: "Kotak Diagonal LPJ" },
                    { id: "formal-double", label: "Garis Ganda", desc: "Double Line Formal" },
                    { id: "minimalist", label: "Garis Tunggal", desc: "Minimalis Bersih" },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, borderStyle: style.id as CoverBorderStyle })}
                      className={`p-2.5 rounded-xl border text-left transition-all btn-press cursor-pointer flex flex-col ${
                        formData.borderStyle === style.id
                          ? "bg-[#004532]/60 border-emerald-500 text-white shadow-sm"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-xs font-bold">{style.label}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{style.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 1: Teks Judul Laporan */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  1. Judul & Tahun Anggaran
                </span>

                <div>
                  <label className="text-[11px] text-slate-300 font-medium block mb-1">
                    Judul Utama Laporan
                  </label>
                  <input
                    type="text"
                    value={formData.judulLaporan}
                    onChange={(e) => setFormData({ ...formData, judulLaporan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 uppercase font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-medium block mb-1">
                    Subjudul / Jenis Bantuan
                  </label>
                  <input
                    type="text"
                    value={formData.subJudul}
                    onChange={(e) => setFormData({ ...formData, subJudul: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 uppercase font-bold text-emerald-300"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-slate-300 font-medium block mb-1">
                      Pemerintah Daerah Pemberi Hibah
                    </label>
                    <input
                      type="text"
                      value={formData.namaPemerintah}
                      onChange={(e) => setFormData({ ...formData, namaPemerintah: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-300 font-medium block mb-1">
                      Tahun Anggaran
                    </label>
                    <input
                      type="text"
                      value={formData.tahunAnggaran}
                      onChange={(e) => setFormData({ ...formData, tahunAnggaran: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white text-center font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Logo Cloudinary Lembaga */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>2. Logo Lembaga (Tengah)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsKopModalOpen(true)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold transition-colors btn-press"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Ubah via Cloudinary</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="w-12 h-12 bg-white rounded border border-slate-700 p-1 flex items-center justify-center shrink-0">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-[#006c4e] flex items-center justify-center text-white text-[8px] font-bold">
                        FATAYAT
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-semibold text-slate-200 truncate">
                      {formData.logoUrl ? "Logo Cloudinary Tersambung" : "Logo Standar Fatayat NU (Vektor)"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formData.logoUrl
                        ? "Logo resmi lembaga otomatis tampil di tengah cover berbingkai."
                        : "Klik 'Ubah via Cloudinary' jika ingin mengganti dengan logo orisinil instansi."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Lembaga Penyusun (Bawah) */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                  3. Lembaga Penerima Hibah (Penyusun)
                </span>

                <div>
                  <label className="text-[11px] text-slate-300 font-medium block mb-1">
                    Nama Lembaga
                  </label>
                  <input
                    type="text"
                    value={formData.namaLembaga}
                    onChange={(e) => setFormData({ ...formData, namaLembaga: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 uppercase font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-medium block mb-1">
                    Sub Nama Lembaga / Ranting / Cabang
                  </label>
                  <input
                    type="text"
                    value={formData.subNama}
                    onChange={(e) => setFormData({ ...formData, subNama: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 uppercase font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-medium block mb-1">
                    Alamat Lengkap Sekretariat
                  </label>
                  <textarea
                    rows={2}
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/50 text-white text-xs font-semibold rounded-xl transition-all shadow-md hover:shadow-emerald-900/40 flex items-center justify-center gap-2 disabled:opacity-50 btn-press cursor-pointer"
                  title="Unduh langsung PDF F4 Portrait dengan Margin Jilid Kiri"
                >
                  {isExportingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                  <span>Ekspor PDF Cover (F4)</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 text-xs font-semibold rounded-xl transition-all btn-press flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Printer</span>
                </button>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: Exact F4 Physical Printed Document Preview (7 Cols) ================= */}
          <div
            className={`xl:col-span-7 flex-col gap-4 items-center w-full ${mobileTab === "form" ? "hidden xl:flex" : "flex"}`}
          >
            {/* Live Document Control Header Bar */}
            <div className="w-full max-w-[780px] bg-slate-900 border border-slate-800 rounded-xl px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Pratinjau Kertas F4 Portrait (215mm × 330mm)
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setZoomScale((prev) => Math.max(60, prev - 10))}
                  className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all btn-press cursor-pointer"
                  title="Perkecil"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-xs text-slate-300 min-w-[38px] text-center">
                  {zoomScale}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomScale((prev) => Math.min(130, prev + 10))}
                  className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all btn-press cursor-pointer"
                  title="Perbesar"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="ml-1 sm:ml-2 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all border border-emerald-500/40 disabled:opacity-50 btn-press cursor-pointer"
                  title="Ekspor PDF F4 Portrait Sampul LPJ"
                >
                  {isExportingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">Ekspor PDF (F4)</span>
                  <span className="sm:hidden">PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-2.5 sm:px-3 py-1.5 bg-[#004532] hover:bg-[#003626] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all btn-press cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cetak</span>
                </button>
              </div>
            </div>

            {/* Canvas Container with dynamic zoom */}
            <div className="w-full overflow-x-auto pb-6 flex flex-col items-center">
              <div
                className="transition-transform origin-top shrink-0 flex flex-col items-center"
                style={{
                  transform: `scale(${zoomScale / 100})`,
                  transformOrigin: "top center",
                }}
              >
                <CoverCanvas data={formData} profile={profile} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kop Surat & Logo Modal */}
      <KopSuratModal
        isOpen={isKopModalOpen}
        onClose={() => setIsKopModalOpen(false)}
        initialProfile={profile}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
}
