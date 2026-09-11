"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  Printer,
  Building2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Settings,
  Receipt,
  CheckCircle2,
  UploadCloud,
  X,
  Eye,
  Scissors,
  Image as ImageIcon,
  ChevronDown,
  FileDown,
  Loader2,
} from "lucide-react";
import { KopSuratModal } from "@/components/kop-surat/kop-surat-modal";
import { NotaCanvas } from "./nota-canvas";
import type { NotaFormData, InstitutionProfile } from "@/types";
import { formatRupiahNumber } from "@/lib/utils/terbilang";
import { extractNamaTempat } from "@/lib/utils/pesanan-date";

interface ReceiptOption {
  id: string;
  nomor: string;
  nama: string;
  tanggal: string;
  pihak1Nama?: string;
  pihak2Nama?: string;
  nominal?: number;
}

interface NotaFormProps {
  initialProfile?: InstitutionProfile | null;
  userProfile?: {
    name: string;
    leaderName?: string | null;
    institution?: string | null;
  };
  receiptOptions: ReceiptOption[];
  initialSelectedReceiptNo?: string | null;
  initialTargetTanggal?: string | null;
}

export function NotaForm({
  initialProfile,
  userProfile,
  receiptOptions = [],
  initialSelectedReceiptNo,
  initialTargetTanggal,
}: NotaFormProps) {
  const [profile, setProfile] = useState<InstitutionProfile | null>(initialProfile || null);
  const [isKopModalOpen, setIsKopModalOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("preview");
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultKota = extractNamaTempat(profile, "Dawuhan");
  const defaultKetua = profile?.namaKetua || userProfile?.leaderName || "HENI FUJIATI";
  const defaultBendahara = profile?.namaBendahara || userProfile?.name || "NUR ALIMAH";

  const initialReceipt = initialSelectedReceiptNo
    ? receiptOptions.find((r) => r.nomor === initialSelectedReceiptNo) || receiptOptions[0]
    : receiptOptions[0];

  const resolvedInitialTanggal =
    initialTargetTanggal ||
    (initialReceipt?.tanggal ? initialReceipt.tanggal.split("T")[0] : "2026-08-04");

  const [selectedReceiptNo, setSelectedReceiptNo] = useState<string>(
    initialReceipt?.nomor || ""
  );

  const [formData, setFormData] = useState<NotaFormData>({
    judul: "NOTA",
    nomorBukti: initialReceipt?.nomor || "",
    uraian: initialReceipt?.nama || "",
    namaToko: initialReceipt?.pihak2Nama || "",
    nominal: initialReceipt?.nominal || 0,
    tanggal: resolvedInitialTanggal,
    kota: defaultKota,
    ketuaJabatanLabel: "Setuju dibayar",
    ketuaJabatan: "Ketua",
    ketuaNama: initialReceipt?.pihak1Nama || defaultKetua,
    bendaharaJabatanLabel: "Dibayar oleh",
    bendaharaJabatan: "Bendahara",
    bendaharaNama: defaultBendahara,
    mode: "blank", // Default blanko bersih untuk tempel fisik seperti di foto
    photoUrl: null,
    photoCaption: "",
    showGuideBorder: true,
    showMetadataFooter: false,
    paperSize: "F4",
    signaturePosition: "center", // Default pas di tengah
    showJudul: false, // Default tulisan "NOTA" disembunyikan/hidden
  });

  // Saat kwitansi dipilih, perbarui data tanggal, nomor bukti, penerima, dan periksa foto lokal jika ada
  const handleSelectReceipt = (nomor: string) => {
    setSelectedReceiptNo(nomor);
    const rc = receiptOptions.find((r) => r.nomor === nomor);
    if (!rc) return;

    let foundPhoto: string | null = null;
    let foundCaption = "";

    // Cek LocalStorage untuk foto yang pernah diunggah di Kwitansi
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`elpj_kwitansi_photos_${nomor}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            foundPhoto = parsed[0].url;
            foundCaption = parsed[0].caption || `Nota Belanja - ${rc.nama}`;
          }
        }
      } catch (err) {
        console.warn("Gagal membaca foto kwitansi:", err);
      }
    }

    setFormData((prev) => ({
      ...prev,
      nomorBukti: rc.nomor,
      uraian: rc.nama,
      namaToko: rc.pihak2Nama || prev.namaToko,
      nominal: rc.nominal || prev.nominal,
      tanggal: rc.tanggal ? rc.tanggal.split("T")[0] : prev.tanggal, // Selalu otomatis mengikuti kwitansi
      ketuaNama: rc.pihak1Nama || defaultKetua,
      photoUrl: foundPhoto || prev.photoUrl,
      photoCaption: foundCaption || prev.photoCaption,
    }));
  };

  // Efek sinkronisasi otomatis saat kwitansi awal atau URL param berganti
  useEffect(() => {
    if (initialSelectedReceiptNo) {
      const matched = receiptOptions.find((r) => r.nomor === initialSelectedReceiptNo);
      if (matched) {
        setSelectedReceiptNo(matched.nomor);
        setFormData((prev) => ({
          ...prev,
          nomorBukti: matched.nomor,
          uraian: matched.nama,
          namaToko: matched.pihak2Nama || prev.namaToko,
          nominal: matched.nominal || prev.nominal,
          tanggal: initialTargetTanggal || (matched.tanggal ? matched.tanggal.split("T")[0] : prev.tanggal),
          ketuaNama: matched.pihak1Nama || prev.ketuaNama,
        }));
      }
    }
  }, [initialSelectedReceiptNo, initialTargetTanggal, receiptOptions]);

  // Efek memuat foto kwitansi awal
  useEffect(() => {
    if (selectedReceiptNo && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`elpj_kwitansi_photos_${selectedReceiptNo}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFormData((prev) => ({
              ...prev,
              photoUrl: parsed[0].url,
              photoCaption: parsed[0].caption || prev.photoCaption,
            }));
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }, [selectedReceiptNo]);

  // Handler upload foto nota digital manual
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        mode: "photo",
        photoUrl: result,
        photoCaption: prev.photoCaption || `Nota Belanja: ${formData.uraian || file.name}`,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handlePrint = () => {
    const prevTitle = document.title;
    const cleanNo = (formData.nomorBukti || "Nota")
      .trim()
      .replace(/[/\\?%*:|"<>.]/g, "_")
      .replace(/\s+/g, "_");
    document.title = `Lembar_Nota_${cleanNo}_F4`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 2000);
  };

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    try {
      setIsExportingPdf(true);
      const { exportNotaToPdf } = await import("@/lib/nota-pdf");
      await exportNotaToPdf({
        elementId: "notaPrintArea",
        nomorBukti: formData.nomorBukti,
        formData: formData,
        profile: profile,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0F172A] text-slate-100 flex flex-col antialiased">
      {/* ================= TOP COMMAND & WORKSPACE HEADER ================= */}
      <div
        id="topCommandBar"
        className="sticky top-16 sm:top-20 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 no-print"
      >
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Sisi Kiri: Breadcrumb & Judul */}
          <div className="flex items-center gap-3">
            <Link
              href="/user"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-tight">
                  Lembar Penempelan Nota Asli
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[10.5px] font-semibold">
                  F4 Portrait
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Format resmi penempelan bukti belanja & nota fisik toko LPJ Hibah
              </span>
            </div>
          </div>

          {/* Sisi Kanan: Kontrol Zoom, Kop, & Tombol Cetak */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Zoom Controls */}
            <div className="hidden xl:flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-xl p-1 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.max(60, prev - 10))}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Perkecil Tampilan"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono px-1.5 text-[11px] font-semibold text-slate-300 min-w-[42px] text-center">
                {zoomScale}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.min(140, prev + 10))}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Perbesar Tampilan"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(100)}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Reset Skala 100%"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tombol Kop Lembaga */}
            <button
              type="button"
              onClick={() => setIsKopModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              title="Sesuaikan Kop Surat, Logo, & Alamat Lembaga"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Kop Lembaga</span>
            </button>

            {/* Tombol Ekspor PDF */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-950/40 transition-all border border-emerald-500/40 cursor-pointer disabled:opacity-50 active:scale-95"
              title="Unduh langsung dokumen PDF ukuran F4 (215mm × 330mm) / A4"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
              ) : (
                <FileDown className="w-4 h-4 text-emerald-200" />
              )}
              <span>{isExportingPdf ? "Memproses..." : "Ekspor PDF"}</span>
            </button>

            {/* Tombol Cetak Dokumen F4 */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-secondary text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all border border-emerald-500/40 cursor-pointer active:scale-95"
              title="Cetak Lembar Nota Ukuran Kertas F4 (Ctrl + P)"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Cetak Lembar Nota</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= SWITCH TAB MOBILE ================= */}
      <div className="lg:hidden flex border-b border-slate-800 bg-slate-900 px-4 py-2 gap-2 no-print">
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
            mobileTab === "preview"
              ? "bg-brand-primary text-white"
              : "text-slate-400 hover:text-slate-200 bg-slate-950"
          }`}
        >
          👁️ Pratinjau Kertas
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("form")}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
            mobileTab === "form"
              ? "bg-brand-primary text-white"
              : "text-slate-400 hover:text-slate-200 bg-slate-950"
          }`}
        >
          ⚙️ Pengaturan Nota
        </button>
      </div>

      {/* ================= WORKSPACE BODY DUA KOLOM ================= */}
      <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 py-6 flex-1 flex flex-col lg:flex-row gap-8 items-start">
        {/* ================= KOLOM KIRI: FORM KONTROL & PILIH KWITANSI ================= */}
        <div
          id="formLedgerPanel"
          className={`w-full lg:w-[420px] shrink-0 flex flex-col gap-6 no-print ${
            mobileTab === "preview" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Card 1: Pilih Transaksi Kwitansi Belanja */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Hubungkan ke Kwitansi</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {receiptOptions.length} Kwitansi
              </span>
            </div>

            {receiptOptions.length > 0 ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Pilih Bukti Belanja / Kwitansi:
                </label>
                <select
                  value={selectedReceiptNo}
                  onChange={(e) => handleSelectReceipt(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="">-- Buat Lembar Nota Manual (Kwitansi Bebas) --</option>
                  {receiptOptions.map((r) => (
                    <option key={r.id} value={r.nomor}>
                      {r.nomor} — {r.nama.length > 40 ? r.nama.substring(0, 40) + "..." : r.nama} (
                      {formatRupiahNumber(r.nominal || 0)})
                    </option>
                  ))}
                </select>

                {selectedReceiptNo && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl flex flex-col gap-1.5 text-xs text-emerald-300 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-200">
                        {formData.nomorBukti}
                      </span>
                      <span className="font-bold text-white">
                        {formatRupiahNumber(formData.nominal || 0)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{formData.uraian}</p>
                    {formData.namaToko && (
                      <span className="text-[11px] text-emerald-400">
                        🏪 Toko / Rekanan: {formData.namaToko}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400">
                Belum ada kwitansi transaksi belanja tersimpan pada tahun aktif. Anda tetap dapat
                mencetak lembar nota dengan mengisi data di bawah.
              </div>
            )}
          </div>

          {/* Card 2: Pengaturan Mode Penempelan (Fisik vs Foto Digital) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
              <Scissors className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Metode Penempelan Nota</h3>
            </div>

            {/* Pilihan Radio Mode */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, mode: "blank" }))}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                  formData.mode === "blank"
                    ? "bg-emerald-950/70 border-emerald-500/80 text-white shadow-md shadow-emerald-950/40"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300">Tempel Fisik</span>
                  {formData.mode === "blank" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <span className="text-[11px] text-slate-400 leading-tight">
                  Kertas kosong bersih siap jepit / lem nota asli.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, mode: "photo" }))}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                  formData.mode === "photo"
                    ? "bg-emerald-950/70 border-emerald-500/80 text-white shadow-md shadow-emerald-950/40"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300">Foto Digital</span>
                  {formData.mode === "photo" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <span className="text-[11px] text-slate-400 leading-tight">
                  Tampilkan gambar nota yang diunggah.
                </span>
              </button>
            </div>

            {/* Jika Mode Foto: Kontrol Upload Gambar */}
            {formData.mode === "photo" && (
              <div className="space-y-3 pt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                {formData.photoUrl ? (
                  <div className="relative border border-slate-700 rounded-xl overflow-hidden bg-slate-950 p-2 flex flex-col gap-2">
                    <div className="relative max-h-40 overflow-hidden rounded flex items-center justify-center bg-black/40">
                      <img
                        src={formData.photoUrl}
                        alt="Pratinjau Nota"
                        className="max-h-36 object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, photoUrl: null }))}
                        className="absolute top-2 right-2 p-1 rounded-full bg-red-900/80 hover:bg-red-800 text-white transition-colors"
                        title="Hapus Foto Ini"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ganti Gambar Nota</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-700 hover:border-emerald-500/80 p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-emerald-300 transition-colors bg-slate-950/60 cursor-pointer"
                  >
                    <UploadCloud className="w-6 h-6 text-emerald-400" />
                    <span className="text-xs font-semibold">Unggah Foto / Scan Nota</span>
                    <span className="text-[10.5px] text-slate-500">
                      JPG, PNG, atau scan kamera HP
                    </span>
                  </button>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Keterangan Foto (Opsional):
                  </label>
                  <input
                    type="text"
                    value={formData.photoCaption || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, photoCaption: e.target.value }))
                    }
                    placeholder="Contoh: Nota Toko Anshori Snack"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Opsi Tampilan Judul & Panduan Tempel */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.showJudul || false}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, showJudul: e.target.checked }))
                  }
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Tampilkan Tulisan Judul &ldquo;NOTA&rdquo;</span>
              </label>
              <p className="text-[10.5px] text-slate-500 pl-5">
                (Saat ini disembunyikan/hidden agar ruang penempelan nota lebih luas dan bersih).
              </p>

              {formData.mode === "blank" && (
                <>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      checked={formData.showGuideBorder}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, showGuideBorder: e.target.checked }))
                      }
                      className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>Tampilkan kotak panduan penempelan di layar</span>
                  </label>
                  <p className="text-[10.5px] text-slate-500 pl-5">
                    (Kotak panduan otomatis disembunyikan saat dicetak sehingga kertas cetak tetap putih bersih).
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Card 3: Form Kustomisasi Teks & Tanda Tangan */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
              <Settings className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Detail Penandatangan</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Kota & Tanggal */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Tempat / Kota:
                </label>
                <input
                  type="text"
                  value={formData.kota}
                  onChange={(e) => setFormData((prev) => ({ ...prev, kota: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Tanggal Nota:
                  </label>
                  {selectedReceiptNo && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Sesuai Kwitansi</span>
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tanggal: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {selectedReceiptNo && (
                  <div className="flex items-center justify-between mt-1 text-[10.5px]">
                    <span className="text-slate-400">
                      Otomatis tersinkron dari kwitansi.
                    </span>
                    {(() => {
                      const activeRc = receiptOptions.find((r) => r.nomor === selectedReceiptNo);
                      if (activeRc?.tanggal && activeRc.tanggal !== formData.tanggal) {
                        return (
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                tanggal: activeRc.tanggal.split("T")[0],
                              }))
                            }
                            className="text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
                          >
                            Reset ke Tgl Kwitansi
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Nama Ketua & Bendahara */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Ketua (Setuju Dibayar):
                </label>
                <input
                  type="text"
                  value={formData.ketuaNama}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ketuaNama: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs uppercase font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Bendahara (Dibayar Oleh):
                </label>
                <input
                  type="text"
                  value={formData.bendaharaNama}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bendaharaNama: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs uppercase font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Ukuran Kertas & Posisi Tanda Tangan */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Posisi Tanda Tangan:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, signaturePosition: "center" }))}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      formData.signaturePosition === "center" || !formData.signaturePosition
                        ? "bg-emerald-950 border-emerald-500 text-emerald-300 shadow-sm"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Pas di Tengah
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, signaturePosition: "right" }))}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      formData.signaturePosition === "right"
                        ? "bg-emerald-950 border-emerald-500 text-emerald-300 shadow-sm"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Kanan
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, signaturePosition: "spread" }))}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      formData.signaturePosition === "spread"
                        ? "bg-emerald-950 border-emerald-500 text-emerald-300 shadow-sm"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Melebar Penuh
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Ukuran Kertas Cetak:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, paperSize: "F4" }))}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      formData.paperSize === "F4"
                        ? "bg-emerald-950 border-emerald-500 text-emerald-300 shadow-sm"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    F4 / Folio (330 mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, paperSize: "A4" }))}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      formData.paperSize === "A4"
                        ? "bg-emerald-950 border-emerald-500 text-emerald-300 shadow-sm"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    A4 (297 mm)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= KOLOM KANAN: PRATINJAU KANVAS DOKUMEN F4 ================= */}
        <div
          className={`flex-1 w-full flex flex-col items-center justify-start overflow-x-auto ${
            mobileTab === "form" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Petunjuk Interaktif & Tombol Cepat di Atas Kanvas */}
          <div className="w-full max-w-[780px] mb-3 flex items-center justify-between text-xs text-slate-400 px-1 no-print">
            <span className="flex items-center gap-1.5">
              <span>📄</span>
              <span>Lembar Siap Cetak (Pratinjau Kertas {formData.paperSize || "F4"})</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="px-3 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                title="Download PDF F4 Langsung"
              >
                {isExportingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>{isExportingPdf ? "Memproses..." : "Ekspor PDF"}</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Cetak langsung (Ctrl + P)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak</span>
              </button>
            </div>
          </div>

          {/* Wrapper Kanvas dengan Skala Zoom Dinamis */}
          <div
            className="transition-transform origin-top shrink-0 flex flex-col items-center gap-6 duration-150"
            style={{
              transform: `scale(${zoomScale / 100})`,
              transformOrigin: "top center",
            }}
          >
            <NotaCanvas
              data={formData}
              profile={profile}
              onUpdateJudul={(judul) => setFormData((prev) => ({ ...prev, judul }))}
              onUpdateKota={(kota) => setFormData((prev) => ({ ...prev, kota }))}
              onUpdateKetuaNama={(ketuaNama) => setFormData((prev) => ({ ...prev, ketuaNama }))}
              onUpdateBendaharaNama={(bendaharaNama) =>
                setFormData((prev) => ({ ...prev, bendaharaNama }))
              }
            />
          </div>
        </div>
      </div>

      {/* Modal Pengaturan Kop Lembaga */}
      <KopSuratModal
        isOpen={isKopModalOpen}
        onClose={() => setIsKopModalOpen(false)}
        initialProfile={profile}
        onProfileUpdated={(updated) => {
          setProfile(updated);
          if (updated.namaKetua) {
            setFormData((prev) => ({ ...prev, ketuaNama: updated.namaKetua! }));
          }
          if (updated.namaBendahara) {
            setFormData((prev) => ({ ...prev, bendaharaNama: updated.namaBendahara! }));
          }
        }}
      />
    </div>
  );
}
