"use client";

import { useState, useRef } from "react";
import {
  Printer,
  FileDown,
  Building2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  FileText,
  Calendar,
  Send,
  UserCheck,
  CheckCircle2,
  Info,
} from "lucide-react";
import { KopSuratModal } from "@/components/kop-surat/kop-surat-modal";
import { SuratPengantarCanvas } from "./surat-pengantar-canvas";
import { angkaKeTerbilang, formatRupiahNumber } from "@/lib/utils/terbilang";
import { formatDateIndo, buildFormattedDocumentNumber, extractNamaTempat } from "@/lib/utils/pesanan-date";
import type { SuratPengantarFormData, InstitutionProfile } from "@/types";

interface SuratPengantarFormProps {
  initialProfile?: InstitutionProfile | null;
  userProfile?: {
    name: string;
    leaderName?: string | null;
    institution?: string | null;
  };
  defaultAnggaran?: number;
}

export function SuratPengantarForm({
  initialProfile,
  userProfile,
  defaultAnggaran = 100000000,
}: SuratPengantarFormProps) {
  const [profile, setProfile] = useState<InstitutionProfile | null>(initialProfile || null);
  const [isKopModalOpen, setIsKopModalOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const defaultNamaLembaga =
    profile?.namaLembaga && profile?.subNama
      ? `${profile.namaLembaga} ${profile.subNama} Desa Dawuhan Kecamatan Talang Kabupaten Tegal`
      : "Pimpinan Ranting Fatayat NU Dawuhan Selatan Desa Dawuhan Kecamatan Talang Kabupaten Tegal";

  const defaultNamaKetua =
    profile?.namaKetua || userProfile?.leaderName || "HENI FUJIATI";

  const [rawDate, setRawDate] = useState<string>("2026-12-31");

  // Format nomor resmi otomatis diambil dari pola database profil akun (contoh: 01/A/PR.FNU/XII/2026)
  const patternFromDb = profile?.formatNomorSp || profile?.formatNomorBast || "/A/PR.FNU/";
  const initialNomorSurat = buildFormattedDocumentNumber("01", patternFromDb, "2026-12-31");

  const initialKota = extractNamaTempat(profile, "Dawuhan");

  const [formData, setFormData] = useState<SuratPengantarFormData>({
    kotaTanggal: `${initialKota}, 31 Desember 2026`,
    nomorSurat: initialNomorSurat,
    lampiran: "1 (satu) bendel",
    perihal: "Laporan Pertanggungjawaban\nBantuan Hibah",
    tujuanJabatan: "BUPATI TEGAL",
    tujuanTempat: "Di – Tempat",
    instansiPemberi: "Pemerintah Kabupaten Tegal c.q. Bagian Kesejahteraan Rakyat Sekretariat Daerah Kabupaten Tegal",
    nominal: defaultAnggaran,
    terbilang: angkaKeTerbilang(defaultAnggaran),
    tahunAnggaran: "2026",
    namaLembagaPenerima: defaultNamaLembaga,
    paragrafPenutup: "Demikian laporan kami untuk menjadikan periksa dan guna seperlunya.",
    penandatanganKota: initialKota,
    penandatanganTanggal: "31 Desember 2026",
    penandatanganBulanTahun: "31 Desember 2026",
    penandatanganJabatan: profile?.jabatanKetua || "Ketua",
    penandatanganNama: defaultNamaKetua,
    paperSize: "F4",
    logoUrl: profile?.logoUrl || null,
  });

  const printAreaRef = useRef<HTMLDivElement>(null);

  const handleNominalChange = (valStr: string) => {
    const rawVal = parseInt(valStr.replace(/\D/g, ""), 10) || 0;
    setFormData((prev) => ({
      ...prev,
      nominal: rawVal,
      terbilang: rawVal > 0 ? angkaKeTerbilang(rawVal) : "Nol Rupiah",
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const { exportSuratPengantarToPdf } = await import("@/lib/surat-pengantar-pdf");
      await exportSuratPengantarToPdf({
        elementId: "suratPengantarPrintArea",
        formData,
        profile,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ================= TOP ACTION BAR & BREADCRUMB ================= */}
      <div className="no-print bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Surat Pengantar LPJ Hibah
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Halaman ke-2 (Setelah Cover)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Surat permohonan penerimaan & penyampaian berkas LPJ kepada Bupati Tegal c.q. Kesra
            </p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Tombol Pengaturan Kop Surat Modal */}
          <button
            type="button"
            onClick={() => setIsKopModalOpen(true)}
            className="btn-press flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition-all shadow-sm"
          >
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Atur Kop & Logo</span>
          </button>

          {/* Cetak Browser / Printer */}
          <button
            type="button"
            onClick={handlePrint}
            className="btn-press flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Cetak Surat</span>
          </button>

          {/* Ekspor Dokumen PDF (~300 DPI) */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="btn-press flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4" />
            <span>{isExportingPdf ? "Memproses PDF..." : "Ekspor PDF F4"}</span>
          </button>
        </div>
      </div>

      {/* ================= MOBILE TAB SWITCHER ================= */}
      <div className="no-print flex lg:hidden w-full bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
        <button
          type="button"
          onClick={() => setMobileTab("form")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
            mobileTab === "form"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Formulir Surat
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
            mobileTab === "preview"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Pratinjau Kertas F4 (Live)
        </button>
      </div>

      {/* ================= MAIN SPLIT WORKSPACE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: FORM EDIT (lg:col-span-5) */}
        <div
          className={`no-print lg:col-span-5 flex flex-col gap-5 ${
            mobileTab === "preview" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Card 1: Pengaturan Kepala & Penomoran Surat */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Kepala & Penomoran Surat
              </h2>
            </div>

            <div className="flex flex-col gap-3.5">
              {/* Tanggal Surat Kanan Atas */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tempat & Tanggal Surat (Kanan Atas)
                </label>
                <input
                  type="text"
                  value={formData.kotaTanggal}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, kotaTanggal: e.target.value }))
                  }
                  placeholder="Dawuhan, 31 Desember 2026"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Nomor Surat & Lampiran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">
                      Nomor Surat
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-800/60">
                      Format DB: {profile?.formatNomorSp || "/A/PR.FNU/"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={formData.nomorSurat}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, nomorSurat: e.target.value }))
                      }
                      placeholder="01/A/PR.FNU/XII/2026"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const pattern = profile?.formatNomorSp || profile?.formatNomorBast || "/A/PR.FNU/";
                        const regenerated = buildFormattedDocumentNumber("01", pattern, rawDate || "2026-12-31");
                        setFormData((prev) => ({ ...prev, nomorSurat: regenerated }));
                      }}
                      className="btn-press px-2 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1"
                      title="Sinkronkan ulang nomor surat dari pola format database"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[10px]">Sync DB</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Lampiran
                  </label>
                  <input
                    type="text"
                    value={formData.lampiran}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, lampiran: e.target.value }))
                    }
                    placeholder="1 (satu) bendel"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Tujuan Surat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Kepada Yang Terhormat
                  </label>
                  <input
                    type="text"
                    value={formData.tujuanJabatan}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, tujuanJabatan: e.target.value }))
                    }
                    placeholder="BUPATI TEGAL"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 uppercase font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tempat Tujuan
                  </label>
                  <input
                    type="text"
                    value={formData.tujuanTempat}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, tujuanTempat: e.target.value }))
                    }
                    placeholder="Di – Tempat"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Isi Narasi & Besaran Bantuan Hibah */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                2. Narasi & Besaran Hibah
              </h2>
            </div>

            <div className="flex flex-col gap-3.5">
              {/* Instansi Pemberi Bantuan */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Instansi Pemberi Hibah
                </label>
                <textarea
                  rows={2}
                  value={formData.instansiPemberi}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, instansiPemberi: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Besaran Nominal Angka & Tahun Anggaran */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nominal Bantuan Hibah (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-emerald-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={formatRupiahNumber(formData.nominal)}
                      onChange={(e) => handleNominalChange(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tahun Anggaran
                  </label>
                  <input
                    type="text"
                    value={formData.tahunAnggaran}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, tahunAnggaran: e.target.value }))
                    }
                    placeholder="2026"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Terbilang Otomatis */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Terbilang (Otomatis)
                </label>
                <input
                  type="text"
                  value={formData.terbilang}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, terbilang: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-emerald-300 italic focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Nama Lembaga Penerima Dalam Kalimat */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nama Lembaga Penerima (Dalam Narasi)
                </label>
                <input
                  type="text"
                  value={formData.namaLembagaPenerima}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      namaLembagaPenerima: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Penandatangan & Ukuran Kertas */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                3. Penandatangan & Kertas
              </h2>
            </div>

            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Kota Penandatangan
                  </label>
                  <input
                    type="text"
                    value={formData.penandatanganKota}
                    onChange={(e) => {
                      const newKota = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        penandatanganKota: newKota,
                        kotaTanggal: `${newKota}, ${prev.penandatanganTanggal}`,
                      }));
                    }}
                    placeholder="Dawuhan"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                    <span>Tanggal Surat (Hari, Bulan &amp; Tahun)</span>
                    <span className="text-[10px] text-emerald-400 font-medium">Ada Tanggal</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={formData.penandatanganTanggal}
                      onChange={(e) => {
                        const newTgl = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          penandatanganTanggal: newTgl,
                          kotaTanggal: `${prev.penandatanganKota}, ${newTgl}`,
                        }));
                      }}
                      placeholder="31 Desember 2026"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                    <div className="relative shrink-0" title="Pilih Tanggal dari Kalender">
                      <input
                        type="date"
                        value={rawDate}
                        onChange={(e) => {
                          const dVal = e.target.value;
                          setRawDate(dVal);
                          if (dVal) {
                            const formatted = formatDateIndo(dVal);
                            setFormData((prev) => ({
                              ...prev,
                              penandatanganTanggal: formatted,
                              kotaTanggal: `${prev.penandatanganKota}, ${formatted}`,
                            }));
                          }
                        }}
                        className="w-9 h-8 px-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Jabatan Penandatangan
                  </label>
                  <input
                    type="text"
                    value={formData.penandatanganJabatan}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        penandatanganJabatan: e.target.value,
                      }))
                    }
                    placeholder="Ketua"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nama Lengkap Ketua
                  </label>
                  <input
                    type="text"
                    value={formData.penandatanganNama}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        penandatanganNama: e.target.value,
                      }))
                    }
                    placeholder="HENI FUJIATI"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-bold uppercase"
                  />
                </div>
              </div>

              {/* Pemilihan Ukuran Kertas */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Ukuran Kertas Dokumen
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, paperSize: "F4" }))}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                      formData.paperSize === "F4"
                        ? "bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    F4 / Folio (215 × 330 mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, paperSize: "A4" }))}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                      formData.paperSize === "A4"
                        ? "bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    A4 (210 × 297 mm)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE CANVAS PREVIEW (lg:col-span-7) */}
        <div
          className={`lg:col-span-7 flex flex-col items-center gap-3.5 ${
            mobileTab === "form" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Zoom Controller & Canvas Status Bar */}
          <div className="no-print w-full flex items-center justify-between px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-300 shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-200">
                Pratinjau Kertas {formData.paperSize} Portrait
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                • Skala: {zoomScale}%
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.max(prev - 10, 50))}
                className="btn-press p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Perkecil Pratinjau (Zoom Out)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setZoomScale(100)}
                className="btn-press px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono font-semibold text-slate-300 transition-colors"
                title="Reset Zoom 100%"
              >
                {zoomScale}%
              </button>

              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.min(prev + 10, 150))}
                className="btn-press p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Perbesar Pratinjau (Zoom In)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas Scrollable Wrapper */}
          <div
            ref={printAreaRef}
            className="w-full overflow-x-auto flex justify-center py-2 px-1"
          >
            <div
              style={{
                transform: `scale(${zoomScale / 100})`,
                transformOrigin: "top center",
                transition: "transform 0.15s ease-out",
              }}
              className="w-full flex justify-center"
            >
              <SuratPengantarCanvas data={formData} profile={profile} />
            </div>
          </div>
        </div>
      </div>

      {/* Kop Surat & Logo Modal */}
      <KopSuratModal
        isOpen={isKopModalOpen}
        onClose={() => setIsKopModalOpen(false)}
        initialProfile={profile}
        onProfileUpdated={(updatedProfile) => {
          setProfile(updatedProfile);
          if (updatedProfile.logoUrl) {
            setFormData((prev) => ({ ...prev, logoUrl: updatedProfile.logoUrl }));
          }
          if (updatedProfile.namaKetua) {
            setFormData((prev) => ({ ...prev, penandatanganNama: updatedProfile.namaKetua! }));
          }
          const nextPattern = updatedProfile.formatNomorSp || updatedProfile.formatNomorBast || "/A/PR.FNU/";
          const nextNomor = buildFormattedDocumentNumber("01", nextPattern, rawDate || "2026-12-31");
          setFormData((prev) => ({ ...prev, nomorSurat: nextNomor }));
        }}
      />
    </div>
  );
}
