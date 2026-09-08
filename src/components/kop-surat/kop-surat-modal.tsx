"use client";
/* eslint-disable react/no-unserializable-props */

import { useState, useEffect, useTransition, useRef, ChangeEvent } from "react";
import { createPortal } from "react-dom";
import {
  X,
  UploadCloud,
  Image as ImageIcon,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Trash2,
  Cloud,
  Hash,
} from "lucide-react";
import { saveInstitutionProfileAction } from "@/app/actions/institution.action";
import { swalLoading, swalSuccess, swalError } from "@/lib/swal";
import { buildFormattedDocumentNumber, getRomanMonth, ensureDocumentPrefix } from "@/lib/utils/pesanan-date";
import type { InstitutionProfile } from "@/types";

interface KopSuratModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfile?: InstitutionProfile | null;
  onProfileUpdated?: (profile: InstitutionProfile) => void;
}

export function KopSuratModal({
  isOpen,
  onClose,
  initialProfile,
  onProfileUpdated,
}: KopSuratModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    namaLembaga: initialProfile?.namaLembaga || "PIMPINAN RANTING FATAYAT NU",
    subNama: initialProfile?.subNama || "DAWUHAN SELATAN",
    instansiInduk: initialProfile?.instansiInduk || "KECAMATAN TALANG KABUPATEN TEGAL",
    alamat: initialProfile?.alamat || "Jl. Kemuning 2016 Desa Dawuhan RT.23 RW.06 Talang – Tegal 52193",
    email: initialProfile?.email || "prfnudawuhanselatan@gmail.com",
    noHp: initialProfile?.noHp || "085642719869",
    noRegistrasi: initialProfile?.noRegistrasi || "HBH-2026-NU-0428",
    namaKetua: initialProfile?.namaKetua || "HENI FUJIATI",
    jabatanKetua: initialProfile?.jabatanKetua || "Ketua",
    namaBendahara: initialProfile?.namaBendahara || "NUR ALIMAH",
    logoBase64OrUrl: initialProfile?.logoUrl || "",
    formatNomorSp: initialProfile?.formatNomorSp || "/A/PR.FNU/",
    formatNomorBast: initialProfile?.formatNomorBast || "/A/PR.FNU/",
    formatNomorKwitansi: initialProfile?.formatNomorKwitansi || "/A/PR.FNU/",
  });

  const [logoPreview, setLogoPreview] = useState<string>(initialProfile?.logoUrl || "");
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialProfile) {
      setFormData({
        namaLembaga: initialProfile.namaLembaga || "PIMPINAN RANTING FATAYAT NU",
        subNama: initialProfile.subNama || "DAWUHAN SELATAN",
        instansiInduk: initialProfile.instansiInduk || "KECAMATAN TALANG KABUPATEN TEGAL",
        alamat: initialProfile.alamat || "Jl. Kemuning 2016 Desa Dawuhan RT.23 RW.06 Talang – Tegal 52193",
        email: initialProfile.email || "prfnudawuhanselatan@gmail.com",
        noHp: initialProfile.noHp || "085642719869",
        noRegistrasi: initialProfile.noRegistrasi || "HBH-2026-NU-0428",
        namaKetua: initialProfile.namaKetua || "HENI FUJIATI",
        jabatanKetua: initialProfile.jabatanKetua || "Ketua",
        namaBendahara: initialProfile.namaBendahara || "NUR ALIMAH",
        logoBase64OrUrl: initialProfile.logoUrl || "",
        formatNomorSp: initialProfile.formatNomorSp || "/A/PR.FNU/",
        formatNomorBast: initialProfile.formatNomorBast || "/A/PR.FNU/",
        formatNomorKwitansi: initialProfile.formatNomorKwitansi || "/A/PR.FNU/",
      });
      setLogoPreview(initialProfile.logoUrl || "");
    }
  }, [initialProfile, isOpen]);

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

  if (!isOpen || !mounted) return null;

  // Handle file select & base64 encoding
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setFeedbackMsg({
        type: "error",
        text: "Ukuran file logo terlalu besar. Maksimal 3 MB.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setLogoPreview(result);
      setFormData((prev) => ({ ...prev, logoBase64OrUrl: result }));
      setFeedbackMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview("");
    setFormData((prev) => ({ ...prev, logoBase64OrUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    swalLoading("Menyimpan Kop Surat...", "Mengunggah logo dan menyimpan identitas lembaga ke Cloudinary...");
    startTransition(async () => {
      const res = await saveInstitutionProfileAction(formData);
      if (res.success && res.data) {
        if (onProfileUpdated) {
          onProfileUpdated(res.data);
        }
        onClose();
        swalSuccess("Kop Surat Disimpan!", res.message || "Pengaturan Kop Surat & Logo berhasil disimpan!");
      } else {
        const err = res.message || "Gagal menyimpan data ke database.";
        setFeedbackMsg({
          type: "error",
          text: err,
        });
        swalError("Gagal Menyimpan", err);
      }
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-hidden animate-fade-in">
      {/* Click backdrop to close */}
      <div
        className="fixed inset-0 bg-transparent"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Dialog */}
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-scale-in">
        {/* Header Modal */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#004532]/70 border border-[#006c4e] flex items-center justify-center text-emerald-300 shrink-0">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span>Pengaturan Kop Surat & Logo</span>
                <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-300">
                  Cloudinary
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1">
                Kop surat resmi dan logo otomatis tampil pada BAST, Surat Pesanan, dan Kwitansi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Modal Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto flex-1">
            {/* ================= LIVE PREVIEW STRIP ================= */}
            <div className="bg-white text-slate-900 p-3 sm:p-5 rounded-xl border border-slate-300 shadow-md">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Pratinjau Langsung Kop Surat Dokumen</span>
                <span className="text-[#006c4e]">Format Cetak LPJ</span>
              </div>

              <div className="flex items-center justify-between gap-3 sm:gap-4 pb-2">
                {/* Logo Preview */}
                <div className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center border border-slate-200 rounded p-1 bg-slate-50">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo Kop"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#004532] rounded flex flex-col items-center justify-center text-white text-[8px] font-bold text-center p-1">
                      <span className="text-emerald-300 text-xs">★</span>
                      <span>FATAYAT NU</span>
                    </div>
                  )}
                </div>

                {/* Text Preview */}
                <div className="flex-1 text-center flex flex-col justify-center">
                  <h3 className="font-bold text-sm sm:text-base leading-tight text-[#006c4e] uppercase tracking-wide">
                    {formData.namaLembaga || "NAMA LEMBAGA / ORGANISASI"}
                  </h3>
                  <h4 className="font-bold text-xs sm:text-sm leading-tight text-[#006c4e] uppercase mt-0.5">
                    {formData.subNama || "TINGKAT KEPENGURUSAN / RANTING"}
                  </h4>
                  <h5 className="font-bold text-[11px] sm:text-xs leading-tight text-[#006c4e] uppercase tracking-tight mt-0.5">
                    {formData.instansiInduk || "KECAMATAN & KABUPATEN"}
                  </h5>
                  <p className="text-[9.5px] leading-tight text-[#006c4e] mt-1 font-medium">
                    Alamat : {formData.alamat || "Alamat kantor sekretariat..."}
                  </p>
                  <p className="text-[9px] leading-tight text-[#006c4e]">
                    Email : <span className="underline">{formData.email}</span> | No. Hp: {formData.noHp}
                  </p>
                </div>
              </div>

              {/* Dual Line Border */}
              <div className="w-full flex flex-col gap-[1.5px] mt-2">
                <div className="w-full h-[2.5px] bg-[#004532]"></div>
                <div className="w-full h-[0.75px] bg-[#004532]"></div>
              </div>
            </div>

            {/* ================= UPLOAD LOGO CLOUDINARY SECTION ================= */}
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Cloud className="w-4 h-4 text-cyan-400" />
                  <span>Logo Lembaga (Cloudinary Cloud Storage)</span>
                </div>
                <span className="text-[11px] text-cyan-400 font-medium">
                  PNG, JPG, SVG, WebP (Max 3MB)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 relative group">
                  {logoPreview ? (
                    <>
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="w-full h-full object-contain p-1.5"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute inset-0 bg-red-950/80 text-red-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Hapus Logo"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-500" />
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-1.5 w-full">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                    id="logoUploadInput"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
                    >
                      <UploadCloud className="w-4 h-4 text-emerald-400" />
                      <span>Pilih Gambar Logo</span>
                    </button>

                    {logoPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-3 py-2 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-800/60 text-red-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Logo</span>
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 leading-tight">
                    Logo akan otomatis dioptimasi dan disimpan ke storage CDN Cloudinary saat tombol simpan ditekan.
                  </span>
                </div>
              </div>
            </div>

            {/* ================= KOP SURAT TEKS SECTION ================= */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Kop Baris 1 (Organisasi Utama)
                </label>
                <input
                  type="text"
                  value={formData.namaLembaga}
                  onChange={(e) =>
                    setFormData({ ...formData, namaLembaga: e.target.value })
                  }
                  placeholder="PIMPINAN RANTING FATAYAT NU"
                  className="w-full text-xs font-semibold uppercase bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Kop Baris 2 (Ranting / Wilayah)
                </label>
                <input
                  type="text"
                  value={formData.subNama}
                  onChange={(e) =>
                    setFormData({ ...formData, subNama: e.target.value })
                  }
                  placeholder="DAWUHAN SELATAN"
                  className="w-full text-xs font-semibold uppercase bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Kop Baris 3 (Kecamatan & Kab/Kota)
                </label>
                <input
                  type="text"
                  value={formData.instansiInduk}
                  onChange={(e) =>
                    setFormData({ ...formData, instansiInduk: e.target.value })
                  }
                  placeholder="KECAMATAN TALANG KABUPATEN TEGAL"
                  className="w-full text-xs font-semibold uppercase bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {/* ================= ALAMAT & KONTAK ================= */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="text-xs text-slate-300 font-medium block mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Alamat Lengkap Sekretariat</span>
                </label>
                <input
                  type="text"
                  value={formData.alamat}
                  onChange={(e) =>
                    setFormData({ ...formData, alamat: e.target.value })
                  }
                  placeholder="Jl. Kemuning 2016 Desa Dawuhan RT.23 RW.06 Talang – Tegal 52193"
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Email Resmi Lembaga</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="prfnudawuhanselatan@gmail.com"
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nomor Kontak / WhatsApp</span>
                </label>
                <input
                  type="text"
                  value={formData.noHp}
                  onChange={(e) =>
                    setFormData({ ...formData, noHp: e.target.value })
                  }
                  placeholder="085642719869"
                  className="w-full text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nomor Registrasi Hibah</span>
                </label>
                <input
                  type="text"
                  value={formData.noRegistrasi}
                  onChange={(e) =>
                    setFormData({ ...formData, noRegistrasi: e.target.value })
                  }
                  placeholder="HBH-2026-NU-0428"
                  className="w-full text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {/* ================= STRUKTUR PEJABAT ORGANISASI ================= */}
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Struktur Penandatangan Dokumen LPJ
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Nama Ketua Organisasi
                  </label>
                  <input
                    type="text"
                    value={formData.namaKetua || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, namaKetua: e.target.value })
                    }
                    className="w-full text-xs font-bold uppercase bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Jabatan Ketua
                  </label>
                  <input
                    type="text"
                    value={formData.jabatanKetua || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, jabatanKetua: e.target.value })
                    }
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Nama Bendahara
                  </label>
                  <input
                    type="text"
                    value={formData.namaBendahara || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, namaBendahara: e.target.value })
                    }
                    className="w-full text-xs font-bold uppercase bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* ================= FORMAT PENOMORAN DOKUMEN OTOMATIS ================= */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 border border-emerald-900/50 p-4 sm:p-5 rounded-xl flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      Format Penomoran Surat Otomatis
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300">
                        Database Akun
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Disimpan ke database akun Anda. Bulan Romawi & Tahun akan otomatis mengikuti tanggal pembuatan dokumen.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Format Kwitansi & BKU */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-200 font-semibold flex items-center justify-between">
                    <span>Prefix Kwitansi / Kas</span>
                    <span className="text-[10px] text-amber-400 font-mono font-normal">Contoh: /A/PR.FNU/</span>
                  </label>
                  <input
                    type="text"
                    value={formData.formatNomorKwitansi || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, formatNomorKwitansi: e.target.value })
                    }
                    placeholder="/A/PR.FNU/"
                    className="w-full text-xs font-mono font-semibold bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] flex items-center justify-between">
                    <span className="text-slate-400">Pratinjau Kas:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {buildFormattedDocumentNumber("01", ensureDocumentPrefix(formData.formatNomorKwitansi || "/A/PR.FNU/", "KW"), new Date())}
                    </span>
                  </div>
                </div>

                {/* Format Surat Pesanan (SP) */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-200 font-semibold flex items-center justify-between">
                    <span>Kode Surat Pesanan (SP)</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-normal">Contoh: /A/PR.FNU/</span>
                  </label>
                  <input
                    type="text"
                    value={formData.formatNomorSp || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, formatNomorSp: e.target.value })
                    }
                    placeholder="/A/PR.FNU/"
                    className="w-full text-xs font-mono font-semibold bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-emerald-300 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] flex items-center justify-between">
                    <span className="text-slate-400">Pratinjau SP:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {buildFormattedDocumentNumber("01", ensureDocumentPrefix(formData.formatNomorSp || "/A/PR.FNU/", "SP"), new Date())}
                    </span>
                  </div>
                </div>

                {/* Format Berita Acara (BAST) */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-200 font-semibold flex items-center justify-between">
                    <span>Kode Berita Acara (BAST)</span>
                    <span className="text-[10px] text-teal-400 font-mono font-normal">Contoh: /A/PR.FNU/</span>
                  </label>
                  <input
                    type="text"
                    value={formData.formatNomorBast || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, formatNomorBast: e.target.value })
                    }
                    placeholder="/A/PR.FNU/"
                    className="w-full text-xs font-mono font-semibold bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-teal-300 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] flex items-center justify-between">
                    <span className="text-slate-400">Pratinjau BAST:</span>
                    <span className="font-mono font-bold text-teal-400">
                      {buildFormattedDocumentNumber("01", ensureDocumentPrefix(formData.formatNomorBast || "/A/PR.FNU/", "BA"), new Date())}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Tersimpan di Database Akun & Multi-User Aman</span>
                </div>
                <p className="leading-relaxed">
                  Format penomoran ini disimpan di database profil akun masing-masing. Setiap user dapat menggunakan format yang sama (misal format baku instansi) maupun berbeda-beda sesuai kebutuhan. Urutan penomoran setiap user terpisah dan anti-bentrok.
                </p>
              </div>
            </div>

            {/* Feedback messages */}
            {feedbackMsg && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  feedbackMsg.type === "success"
                    ? "bg-emerald-950/80 border-emerald-700 text-emerald-200"
                    : "bg-red-950/80 border-red-700 text-red-200"
                }`}
              >
                {feedbackMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{feedbackMsg.text}</span>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-950/90 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-[#006c4e] hover:bg-[#004532] text-white text-xs font-semibold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-300" />
              )}
              <span>Simpan ke Database</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default KopSuratModal;
