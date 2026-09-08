"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  UploadCloud,
  FileDown,
  Printer,
  Sparkles,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  ArrowUp,
  ArrowDown,
  Building2,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  Save,
  Cloud,
  FolderArchive,
  HardDrive,
  RefreshCw,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { KopSuratModal } from "@/components/kop-surat/kop-surat-modal";
import { SourceDocumentModal } from "./source-document-modal";
import { DokumentasiCanvas } from "./dokumentasi-canvas";
import { DokumentasiTable } from "./dokumentasi-table";
import {
  saveDokumentasiAction,
  deleteDokumentasiAction,
  deleteDokumentasiPhotoAction,
} from "@/app/actions/dokumentasi.action";
import { exportDokumentasiPdf } from "@/lib/dokumentasi-pdf";
import { swalError, swalSuccess } from "@/lib/swal";
import type {
  DokumentasiFormData,
  DokumentasiPhoto,
  DokumentasiLayout,
  InstitutionProfile,
  ActivityDocumentationRecord,
} from "@/types";

interface BastOrSpOption {
  id: string;
  nomor: string;
  nama: string;
  tanggal?: string;
  pihak1Nama?: string;
  pihak2Nama?: string;
}

interface DokumentasiFormProps {
  initialProfile?: InstitutionProfile | null;
  userProfile?: {
    name: string;
    leaderName?: string | null;
    institution?: string | null;
  };
  bastOptions?: BastOrSpOption[];
  spOptions?: BastOrSpOption[];
  receiptOptions?: BastOrSpOption[];
  initialSavedList?: ActivityDocumentationRecord[];
}

const DRAFT_STORAGE_KEY = "elpj_dokumentasi_draft_v1";

// Sample SVG placeholders for quick demo/preview
const SAMPLE_PHOTO_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="%23064e3b"/><rect x="40" y="40" width="720" height="420" rx="12" fill="%23065f46" stroke="%2334d399" stroke-width="3"/><circle cx="400" cy="220" r="80" fill="%23047857"/><path d="M370 190 L430 190 L430 250 L370 250 Z" fill="%23a7f3d0"/><path d="M385 160 L415 160 L415 190 L385 190 Z" fill="%236ee7b7"/><text x="400" y="340" fill="%23ffffff" font-family="sans-serif" font-size="24" font-weight="bold" text-anchor="middle">SERAH TERIMA SOUND SYSTEM PORTABLE</text><text x="400" y="380" fill="%23a7f3d0" font-family="sans-serif" font-size="16" text-anchor="middle">Penyedia Toko Surya Mas kepada Ketua Ranting Fatayat NU</text></svg>`;

const SAMPLE_PHOTO_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="%231e293b"/><rect x="40" y="40" width="720" height="420" rx="12" fill="%230f172a" stroke="%2338bdf8" stroke-width="3"/><circle cx="400" cy="220" r="80" fill="%230284c7"/><path d="M370 210 L400 180 L430 210 L415 210 L415 260 L385 260 L385 210 Z" fill="%23bae6fd"/><text x="400" y="340" fill="%23ffffff" font-family="sans-serif" font-size="24" font-weight="bold" text-anchor="middle">UJI COBA &amp; PEMERIKSAAN KONDISI BARANG</text><text x="400" y="380" fill="%237dd3fc" font-family="sans-serif" font-size="16" text-anchor="middle">Pemeriksaan fisik sarana hibah dalam keadaan baru 100% dan berfungsi baik</text></svg>`;

/**
 * Kompresi gambar client-side menggunakan HTML5 Canvas:
 * Mengecilkan resolusi ke max 1280px dan kompresi JPEG 0.8.
 * Menurunkan ukuran file kamera HP dari ~10MB menjadi ~150KB-250KB,
 * sehingga muat di localStorage dan sangat hemat kapasitas saat diunggah ke Cloudinary!
 */
async function compressImageClient(
  file: File,
  maxDimension = 1280,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.onload = (e) => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Gagal memuat format gambar"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function cleanTitle(text?: string | null): string {
  if (!text) return "";
  let clean = text.trim();
  clean = clean.split(/\s+(?:sebanyak|sebesar|sejumlah|senilai)\s+/i)[0].trim();
  clean = clean.split(/\s*x\s*@\s*Rp/i)[0].trim();
  clean = clean.split(/\s*=\s*Rp/i)[0].trim();
  return clean;
}

export function DokumentasiForm({
  initialProfile,
  userProfile,
  bastOptions = [],
  spOptions = [],
  receiptOptions = [],
  initialSavedList = [],
}: DokumentasiFormProps) {
  const [profile, setProfile] = useState<InstitutionProfile | null>(initialProfile || null);
  const [isKopModalOpen, setIsKopModalOpen] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isSourceBarExpanded, setIsSourceBarExpanded] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const [savedList, setSavedList] = useState<ActivityDocumentationRecord[]>(initialSavedList);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSourceOptions = bastOptions.length + spOptions.length + receiptOptions.length;

  const defaultLeader =
    profile?.namaKetua || userProfile?.leaderName || "HENI FUJIATI";

  const searchParams = useSearchParams();
  const urlId = searchParams.get("id");
  const urlReceiptNo = searchParams.get("receiptNo");
  const urlSpNo = searchParams.get("spNo");
  const urlBastNo = searchParams.get("bastNo");

  const [formData, setFormData] = useState<DokumentasiFormData>({
    judulDokumentasi: "LEMBAR DOKUMENTASI KEGIATAN & PENGADAAN SARANA",
    subJudul: "PROGRAM BANTUAN HIBAH DAERAH TAHUN ANGGARAN 2026",
    namaKegiatan: "",
    nomorReferensi: "",
    tanggalKegiatan: new Date().toISOString().split("T")[0],
    lokasiKegiatan: profile?.alamat || "",
    layout: "2-per-page",
    photos: [],
    sertakanTandaTangan: true,
    penandatangan1Jabatan: "Penyedia / Toko Rekanan",
    penandatangan1Nama: "",
    penandatangan2Jabatan: profile?.jabatanKetua || "Ketua Pimpinan Ranting",
    penandatangan2Nama: defaultLeader,
  });

  // 1. Pulihkan draft dari Local Storage saat pertama kali dibuka
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && parsed.namaKegiatan) {
          setFormData(parsed);
          setIsDraftRestored(true);
        }
      }
    } catch (err) {
      console.warn("[LocalStorage] Gagal membaca draft:", err);
    }
  }, []);

  // 1a. Auto-load jika ada param ?id=... dari Arsip Dokumen
  useEffect(() => {
    if (urlId && savedList.length > 0) {
      const found = savedList.find((d) => d.id === urlId);
      if (found) {
        handleSelectSavedDocumentation(urlId);
      }
    }
  }, [urlId, savedList]);

  // 1b. Auto-load dari URL Param jika diarahkan dari Alur Pengadaan (Kwitansi / SP / BAST)
  useEffect(() => {
    if (urlReceiptNo) {
      // Cek apakah sudah ada arsip dokumentasi tersimpan untuk nomor bukti ini
      const foundInSaved = savedList.find(
        (d) => d.nomorReferensi?.toLowerCase() === urlReceiptNo.toLowerCase()
      );
      if (foundInSaved) {
        handleSelectSavedDocumentation(foundInSaved.id);
        return;
      }

      // Jika belum disimpan, tarik data dari opsi Kwitansi
      const matchingReceipt = receiptOptions.find(
        (r) => r.nomor?.toLowerCase() === urlReceiptNo.toLowerCase()
      );
      if (matchingReceipt) {
        handleSelectSource(`receipt:${matchingReceipt.id}`);

        // Cek jika ada foto yang diunggah di Kwitansi Form
        try {
          const kwitansiPhotosKey = `elpj_kwitansi_photos_${urlReceiptNo}`;
          const savedKwitansiPhotos = localStorage.getItem(kwitansiPhotosKey);
          if (savedKwitansiPhotos) {
            const parsedPhotos = JSON.parse(savedKwitansiPhotos);
            if (Array.isArray(parsedPhotos) && parsedPhotos.length > 0) {
              setFormData((prev) => ({
                ...prev,
                photos: parsedPhotos,
              }));
            }
          }
        } catch (e) {
          console.warn("[AutoLoadKwitansiPhotos] Err:", e);
        }
      }
    }
  }, [urlReceiptNo]);

  // 2. Auto-save ke Local Storage setiap ada perubahan
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
      } catch (err) {
        console.warn("[LocalStorage] Quota terlampaui atau gagal simpan:", err);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData]);

  // Handle multi-photo file upload dengan client-side compression
  const handleFilesSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    try {
      const newPhotos: DokumentasiPhoto[] = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          continue;
        }

        // Kompresi resolusi ke max 1280px & JPEG 80% (menghemat ~85-95% ukuran file)
        const compressedDataUrl = await compressImageClient(file, 1280, 0.8);

        newPhotos.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url: compressedDataUrl,
          caption: "Dokumentasi serah terima / pemanfaatan barang hibah.",
          tanggal: formData.tanggalKegiatan,
          lokasi: formData.lokasiKegiatan,
        });
      }

      if (newPhotos.length > 0) {
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, ...newPhotos],
        }));
      }
    } catch (err: any) {
      console.error("Kompresi foto gagal:", err);
      swalError("Gagal Memproses Foto", "Terjadi kendala saat membaca file gambar.");
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const updatePhotoCaption = (id: string, caption: string) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.map((p) => (p.id === id ? { ...p, caption } : p)),
    }));
  };

  const removePhoto = (id: string) => {
    const photoToRemove = formData.photos.find((p) => p.id === id);
    if (photoToRemove) {
      const identifier = photoToRemove.publicId || photoToRemove.url;
      if (identifier && (identifier.startsWith("http") || photoToRemove.publicId)) {
        deleteDokumentasiPhotoAction(identifier).catch((err) =>
          console.warn("[Cloudinary] Gagal menghapus foto dari cloud:", err)
        );
      }
    }

    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p.id !== id),
    }));
  };

  const movePhoto = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formData.photos.length) return;

    const newPhotos = [...formData.photos];
    const temp = newPhotos[index];
    newPhotos[index] = newPhotos[targetIndex];
    newPhotos[targetIndex] = temp;

    setFormData((prev) => ({ ...prev, photos: newPhotos }));
  };

  // Simpan ke Cloudinary CDN & Database PostgreSQL
  const handleSaveToCloud = async () => {
    setIsSavingCloud(true);
    try {
      const res = await saveDokumentasiAction(formData);
      if (res.success && res.data) {
        let photosFromDb: DokumentasiPhoto[] = [];
        try {
          photosFromDb = JSON.parse(res.data.photosJson);
        } catch {
          photosFromDb = formData.photos;
        }

        const updated: DokumentasiFormData = {
          ...formData,
          id: res.data.id,
          photos: photosFromDb,
        };

        setFormData(updated);
        setSavedList((prev) => {
          const filtered = prev.filter((item) => item.id !== res.data!.id);
          return [res.data!, ...filtered];
        });

        // Update juga di localStorage
        try {
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.warn("Storage update err:", e);
        }

        swalSuccess(
          "Tersimpan di Cloud & Database!",
          "Dokumentasi kegiatan berhasil disimpan ke database. Foto telah teroptimasi dan tersimpan di Cloudinary."
        );
      } else {
        swalError("Gagal Menyimpan", res.message || "Terjadi kesalahan pada sistem.");
      }
    } catch (err: any) {
      swalError("Gagal Menyimpan", err?.message || "Kesalahan jaringan.");
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Memuat dokumentasi yang pernah disimpan di database
  const handleSelectSavedDocumentation = (docId: string) => {
    const found = savedList.find((d) => d.id === docId);
    if (!found) return;

    let parsedPhotos: DokumentasiPhoto[] = [];
    try {
      parsedPhotos = JSON.parse(found.photosJson);
    } catch {
      parsedPhotos = [];
    }

    const cleanTanggal = found.tanggalKegiatan
      ? (found.tanggalKegiatan as any).toISOString
        ? (found.tanggalKegiatan as any).toISOString().split("T")[0]
        : String(found.tanggalKegiatan).split("T")[0]
      : "2026-09-07";

    const loadedData: DokumentasiFormData = {
      id: found.id,
      judulDokumentasi: found.judulDokumentasi,
      subJudul: found.subJudul,
      namaKegiatan: found.namaKegiatan,
      nomorReferensi: found.nomorReferensi || "",
      tanggalKegiatan: cleanTanggal,
      lokasiKegiatan: found.lokasiKegiatan,
      layout: (found.layout as DokumentasiLayout) || "2-per-page",
      photos: parsedPhotos,
      sertakanTandaTangan: found.sertakanTandaTangan,
      penandatangan1Jabatan: found.penandatangan1Jabatan || "Penyedia / Toko Rekanan",
      penandatangan1Nama: found.penandatangan1Nama || "ANSHORI",
      penandatangan2Jabatan: found.penandatangan2Jabatan || "Ketua Pimpinan Ranting",
      penandatangan2Nama: found.penandatangan2Nama || defaultLeader,
    };

    setFormData(loadedData);
    const element = document.getElementById("formLedgerPanel");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    swalSuccess("Arsip Dimuat!", `Dokumentasi "${found.namaKegiatan}" siap diedit.`);
  };

  // Hapus dokumentasi tersimpan secara langsung (digunakan oleh tabel dan card)
  const handleDeleteSavedDocDirect = async (id: string) => {
    const res = await deleteDokumentasiAction(id);
    if (res.success) {
      setSavedList((prev) => prev.filter((item) => item.id !== id));
      if (formData.id === id) {
        setFormData((prev) => ({ ...prev, id: undefined }));
      }
      swalSuccess("Terhapus", "Arsip dokumentasi berhasil dihapus.");
    } else {
      swalError("Gagal Menghapus", res.message || "Gagal menghapus.");
    }
  };

  // Hapus dokumentasi tersimpan dari tombol card
  const handleDeleteSavedDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Apakah Anda yakin ingin menghapus arsip dokumentasi ini dari database?")) return;
    await handleDeleteSavedDocDirect(id);
  };

  // Tambah entri dokumentasi baru (bersihkan form)
  const handleNewDocumentation = () => {
    setFormData({
      id: undefined,
      judulDokumentasi: "LEMBAR DOKUMENTASI KEGIATAN & PENGADAAN SARANA",
      subJudul: "PROGRAM BANTUAN HIBAH DAERAH TAHUN ANGGARAN 2026",
      namaKegiatan: "",
      nomorReferensi: "",
      tanggalKegiatan: new Date().toISOString().split("T")[0],
      lokasiKegiatan: profile?.alamat || `Sekretariat ${userProfile?.institution || ""}`,
      layout: "2-per-page",
      photos: [],
      sertakanTandaTangan: true,
      penandatangan1Jabatan: "Penyedia / Toko Rekanan",
      penandatangan1Nama: "",
      penandatangan2Jabatan: profile?.jabatanKetua || "Ketua Pimpinan Ranting",
      penandatangan2Nama: userProfile?.leaderName || profile?.namaKetua || "HENI FUJIATI",
    });
    const element = document.getElementById("formLedgerPanel");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    swalSuccess("Formulir Baru Siap", "Formulir dokumentasi telah dikosongkan untuk entri baru.");
  };

  // Reset / Kosongkan Draft Lokal
  const handleResetDraft = () => {
    if (confirm("Kosongkan draft dan kembali ke contoh awal?")) {
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (e) {
        console.warn(e);
      }
      handleLoadSamplePreset();
      setIsDraftRestored(false);
    }
  };

  // Preset demo loader
  const handleLoadSamplePreset = () => {
    setFormData({
      id: undefined,
      judulDokumentasi: "LEMBAR DOKUMENTASI KEGIATAN & PENGADAAN SARANA",
      subJudul: "PROGRAM BANTUAN HIBAH DAERAH TAHUN ANGGARAN 2026",
      namaKegiatan: "Pengadaan Sarana Sound System & Perlengkapan Organisasi",
      nomorReferensi: "014/BAST-HB/FTY/VII/2026",
      tanggalKegiatan: "2026-09-07",
      lokasiKegiatan: "Sekretariat PR Fatayat NU Dawuhan Selatan",
      layout: "2-per-page",
      photos: [
        {
          id: "sample-1",
          url: SAMPLE_PHOTO_1,
          caption:
            "Penyerahan 1 Unit Sound Portable Huper 15 Inch dan Wireless Microphone dari Toko Surya Mas kepada Ketua Pimpinan Ranting Fatayat NU.",
          tanggal: "2026-09-07",
          lokasi: "Dawuhan Selatan",
        },
        {
          id: "sample-2",
          url: SAMPLE_PHOTO_2,
          caption:
            "Uji fungsi dan pemeriksaan kelayakan barang pengadaan sarana hibah dalam kondisi lengkap, prima, dan siap dimanfaatkan untuk kegiatan organisasi.",
          tanggal: "2026-09-07",
          lokasi: "Dawuhan Selatan",
        },
      ],
      sertakanTandaTangan: true,
      penandatangan1Jabatan: "Penyedia / Toko Surya Mas",
      penandatangan1Nama: "ANSHORI",
      penandatangan2Jabatan: "Ketua Pimpinan Ranting",
      penandatangan2Nama: defaultLeader,
    });
  };

  // Clear all photos & hapus dari Cloudinary
  const handleClearPhotos = () => {
    formData.photos.forEach((p) => {
      const identifier = p.publicId || p.url;
      if (identifier && (identifier.startsWith("http") || p.publicId)) {
        deleteDokumentasiPhotoAction(identifier).catch((err) =>
          console.warn("[Cloudinary] Gagal menghapus foto:", err)
        );
      }
    });
    setFormData((prev) => ({ ...prev, photos: [] }));
  };

  // Auto fill from BAST, SP, or Kwitansi selection
  const handleSelectSource = (compositeVal: string) => {
    if (!compositeVal) return;
    const [type, optionId] = compositeVal.split(":");

    if (type === "bast") {
      const selected = bastOptions.find((b) => b.id === optionId);
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          namaKegiatan: cleanTitle(selected.nama) || prev.namaKegiatan,
          nomorReferensi: selected.nomor || prev.nomorReferensi,
          tanggalKegiatan: selected.tanggal
            ? selected.tanggal.split("T")[0]
            : prev.tanggalKegiatan,
          penandatangan1Nama: selected.pihak2Nama || prev.penandatangan1Nama,
          penandatangan1Jabatan: `Penyedia / ${selected.pihak2Nama || "Toko Rekanan"}`,
          penandatangan2Nama: selected.pihak1Nama || prev.penandatangan2Nama,
        }));
        swalSuccess(
          "Data Ditarik dari BAST!",
          `Nama kegiatan, tanggal, dan nomor BAST "${selected.nomor}" berhasil diisi otomatis.`
        );
        return;
      }
    }

    if (type === "sp") {
      const selected = spOptions.find((s) => s.id === optionId);
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          namaKegiatan: cleanTitle(selected.nama) || prev.namaKegiatan,
          nomorReferensi: selected.nomor || prev.nomorReferensi,
          tanggalKegiatan: selected.tanggal
            ? selected.tanggal.split("T")[0]
            : prev.tanggalKegiatan,
          penandatangan1Nama: selected.pihak2Nama || prev.penandatangan1Nama,
          penandatangan1Jabatan: `Penyedia / ${selected.pihak2Nama || "Toko Rekanan"}`,
          penandatangan2Nama: selected.pihak1Nama || prev.penandatangan2Nama,
        }));
        swalSuccess(
          "Data Ditarik dari SP!",
          `Nama kegiatan, tanggal, dan nomor SP "${selected.nomor}" berhasil diisi otomatis.`
        );
        return;
      }
    }

    if (type === "receipt") {
      const selected = receiptOptions.find((r) => r.id === optionId);
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          namaKegiatan: cleanTitle(selected.nama) || prev.namaKegiatan,
          nomorReferensi: selected.nomor || prev.nomorReferensi,
          tanggalKegiatan: selected.tanggal
            ? selected.tanggal.split("T")[0]
            : prev.tanggalKegiatan,
          penandatangan1Nama: selected.pihak2Nama || prev.penandatangan1Nama,
          penandatangan1Jabatan: `Penyedia / ${selected.pihak2Nama || "Penerima Dana"}`,
          penandatangan2Nama: selected.pihak1Nama || prev.penandatangan2Nama,
        }));
        swalSuccess(
          "Data Ditarik dari Kwitansi!",
          `Uraian belanja, tanggal, dan nomor kwitansi "${selected.nomor}" berhasil diisi otomatis.`
        );
        return;
      }
    }
  };

  // Export PDF F4
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportDokumentasiPdf({
        containerId: "dokumentasiPrintArea",
        formData,
        profile,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col">
      {/* Top Command Action Bar */}
      <div
        id="topCommandBar"
        className="w-full bg-slate-900/95 border-b border-slate-800 px-4 sm:px-8 py-3.5 sticky top-0 z-40 backdrop-blur-md"
      >
        <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              href="/user"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition-colors shadow-xs"
              title="Kembali ke Dashboard Utama"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Lembar Dokumentasi Kegiatan</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-600/50 text-emerald-300 font-mono">
                    Kertas F4 Portrait
                  </span>
                  {/* Status Penyimpanan */}
                  <span
                    className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300"
                    title="Data otomatis tersimpan di memori browser dan dapat disimpan permanen ke Cloud & Database"
                  >
                    <HardDrive className="w-3 h-3 text-cyan-400" />
                    <span>Auto-Save Browser Aktif</span>
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400">
                  Foto serah terima &amp; kegiatan otomatis ditata rapi dalam lembar siap cetak/jilid LPJ
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            <button
              onClick={() => setIsKopModalOpen(true)}
              type="button"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Atur Kop</span>
            </button>

            {/* Tombol Simpan Permanen ke Cloudinary & Database */}
            <button
              onClick={handleSaveToCloud}
              disabled={isSavingCloud}
              type="button"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-950/40 disabled:opacity-50"
              title="Upload foto ke Cloudinary (teroptimasi hemat kapasitas) dan simpan ke database PostgreSQL"
            >
              {isSavingCloud ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-indigo-200" />
              )}
              <span>{isSavingCloud ? "Menyimpan Cloud..." : "Simpan ke Database"}</span>
            </button>

            <button
              onClick={() => window.print()}
              type="button"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cetak (Print)</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              type="button"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? "Memproses PDF..." : "Unduh PDF F4"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex border-b border-slate-800 bg-slate-900 px-4 pt-2">
        <button
          onClick={() => setMobileTab("form")}
          className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-colors ${
            mobileTab === "form"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Formulir &amp; Foto ({formData.photos.length})
        </button>
        <button
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-colors ${
            mobileTab === "preview"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Pratinjau Lembar F4
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-8 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls & Photo Manager */}
        <div
          id="formLedgerPanel"
          className={`lg:col-span-5 space-y-5 ${
            mobileTab === "preview" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Arsip Tersimpan & Otomasi */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <FolderArchive className="w-3.5 h-3.5 text-indigo-400" />
                <span>Arsip Dokumentasi &amp; Preset</span>
              </span>
              <div className="flex items-center gap-2">
                <a
                  href="#tabelArsipDokumentasi"
                  className="text-[11px] px-2.5 py-1 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 font-semibold hover:bg-indigo-900/80 transition-colors flex items-center gap-1"
                >
                  <FolderArchive className="w-3 h-3 text-indigo-400" />
                  <span>Lihat Tabel ↓</span>
                </a>
                {isDraftRestored && (
                  <button
                    onClick={handleResetDraft}
                    type="button"
                    className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors"
                    title="Hapus draft lokal dan reset formulir"
                  >
                    Reset Form
                  </button>
                )}
              </div>
            </div>

            {/* Arsip yang tersimpan di Database */}
            {savedList.length > 0 && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Buka Arsip yang Tersimpan di Database:
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {savedList.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => handleSelectSavedDocumentation(doc.id)}
                      className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        formData.id === doc.id
                          ? "bg-indigo-950/70 border-indigo-600 text-indigo-200"
                          : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="truncate mr-2">
                        <p className="font-semibold truncate">{doc.namaKegiatan}</p>
                        <p className="text-[10px] text-slate-500">
                          {doc.nomorReferensi ? `${doc.nomorReferensi} • ` : ""}
                          {doc.lokasiKegiatan}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSavedDoc(doc.id, e)}
                        className="p-1 text-slate-500 hover:text-rose-400 shrink-0"
                        title="Hapus Arsip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Activity Information Form */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3.5">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Informasi Kegiatan &amp; Dokumen</span>
            </h2>

            {/* Bilah Ringkas Tarik Berkas Sumber (Sangat Hemat Ruang & Tangguh untuk Data Banyak) */}
            {totalSourceOptions > 0 && (
              <div className="bg-emerald-950/40 border border-emerald-600/50 rounded-xl p-2.5 transition-all space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-emerald-900/60 border border-emerald-500/40 flex items-center justify-center text-amber-400 shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-bold text-emerald-300 block sm:inline">
                        Tarik dari Berkas LPJ
                      </span>
                      <span className="text-[10px] text-emerald-400/80 font-mono ml-0 sm:ml-1.5">
                        ({totalSourceOptions} berkas tersedia)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsSourceModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                      title="Buka jendela pencarian berkas (sangat cepat untuk data banyak)"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Cari &amp; Pilih Berkas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSourceBarExpanded(!isSourceBarExpanded)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 transition-colors flex items-center gap-1"
                      title={isSourceBarExpanded ? "Tutup dropdown cepat" : "Buka dropdown cepat"}
                    >
                      {isSourceBarExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-[11px]">Tutup</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-[11px]">Pilih Cepat</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Status Terhubung / Referensi Aktif */}
                {formData.nomorReferensi && (
                  <div className="flex items-center justify-between gap-1 text-[11px] bg-slate-950/60 border border-emerald-700/40 rounded-lg px-2.5 py-1 text-slate-300">
                    <span className="truncate">
                      ✓ Terhubung ke: <strong className="font-mono text-emerald-300">{formData.nomorReferensi}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, nomorReferensi: "" }))}
                      className="text-[10px] text-slate-400 hover:text-rose-400 shrink-0 ml-2"
                      title="Lepas keterhubungan nomor referensi"
                    >
                      Lepas
                    </button>
                  </div>
                )}

                {/* Dropdown Cepat Inline (Hanya tampil jika tombol 'Pilih Cepat' dibuka) */}
                {isSourceBarExpanded && (
                  <div className="pt-2 border-t border-emerald-700/30 space-y-2 animate-in fade-in duration-100">
                    <select
                      onChange={(e) => {
                        handleSelectSource(e.target.value);
                        setIsSourceBarExpanded(false);
                      }}
                      defaultValue=""
                      className="w-full bg-slate-950 border border-emerald-600/70 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-medium cursor-pointer"
                    >
                      <option value="">-- Pilih Berkas: BAST / Surat Pesanan / Kwitansi --</option>
                      {bastOptions.length > 0 && (
                        <optgroup label="📋 Berita Acara Serah Terima (BAST)">
                          {bastOptions.map((b) => (
                            <option key={`bast-${b.id}`} value={`bast:${b.id}`}>
                              BAST: {b.nomor} - {b.nama}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {spOptions.length > 0 && (
                        <optgroup label="📦 Surat Pesanan (SP)">
                          {spOptions.map((s) => (
                            <option key={`sp-${s.id}`} value={`sp:${s.id}`}>
                              SP: {s.nomor} - {s.nama}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {receiptOptions.length > 0 && (
                        <optgroup label="🧾 Kwitansi Belanja">
                          {receiptOptions.map((r) => (
                            <option key={`receipt-${r.id}`} value={`receipt:${r.id}`}>
                              Kwitansi: {r.nomor} - {r.nama}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <p className="text-[10px] text-slate-400 leading-snug">
                      💡 Tip: Jika data sangat banyak, gunakan tombol <strong>&quot;Cari &amp; Pilih Berkas&quot;</strong> di atas untuk mencari nama rekanan atau nomor dokumen seketika.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Judul & Subjudul Lembar Dokumentasi (Dapat diedit langsung) */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Judul Lembar Dokumentasi:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        judulDokumentasi: "LEMBAR DOKUMENTASI KEGIATAN & PENGADAAN SARANA",
                      }))
                    }
                    className="text-[10px] text-slate-400 hover:text-emerald-400 transition-colors"
                    title="Kembalikan ke judul default"
                  >
                    Reset Judul
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.judulDokumentasi || ""}
                  onChange={(e) => setFormData({ ...formData, judulDokumentasi: e.target.value })}
                  placeholder="LEMBAR DOKUMENTASI KEGIATAN & PENGADAAN SARANA"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white uppercase font-bold tracking-wide focus:outline-none focus:border-emerald-500"
                />
                {/* Preset Cepat Judul */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500">Pilihan Cepat:</span>
                  {[
                    "LEMBAR DOKUMENTASI KEGIATAN & PENGADAAN SARANA",
                    "LEMBAR DOKUMENTASI KEGIATAN FISIK",
                    "LEMBAR DOKUMENTASI SERAH TERIMA BARANG",
                    "DOKUMENTASI PENYERAHAN BARANG HIBAH",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData({ ...formData, judulDokumentasi: preset })}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        formData.judulDokumentasi === preset
                          ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                      }`}
                    >
                      {preset.replace("LEMBAR DOKUMENTASI ", "").replace("DOKUMENTASI ", "")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Subjudul / Program Anggaran:
                </label>
                <input
                  type="text"
                  value={formData.subJudul || ""}
                  onChange={(e) => setFormData({ ...formData, subJudul: e.target.value })}
                  placeholder="PROGRAM BANTUAN HIBAH DAERAH TAHUN ANGGARAN 2026"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Nama Kegiatan / Rincian Pengadaan:
              </label>
              <input
                type="text"
                value={formData.namaKegiatan}
                onChange={(e) => setFormData({ ...formData, namaKegiatan: e.target.value })}
                placeholder="cth: Pengadaan Alat Hadroh & Sarana Penunjang Organisasi"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Tanggal Kegiatan:
                </label>
                <input
                  type="date"
                  value={formData.tanggalKegiatan}
                  onChange={(e) => setFormData({ ...formData, tanggalKegiatan: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nomor Referensi (Opsional):
                </label>
                <input
                  type="text"
                  value={formData.nomorReferensi || ""}
                  onChange={(e) => setFormData({ ...formData, nomorReferensi: e.target.value })}
                  placeholder="cth: 014/BAST-HB/FTY/VII/2026"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Tempat / Lokasi Kegiatan:
              </label>
              <input
                type="text"
                value={formData.lokasiKegiatan}
                onChange={(e) => setFormData({ ...formData, lokasiKegiatan: e.target.value })}
                placeholder="cth: Sekretariat PR Fatayat NU Dawuhan Selatan"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Layout Grid Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Tata Letak Foto pada Kertas F4:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, layout: "2-per-page" })}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    formData.layout === "2-per-page"
                      ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <p className="text-xs font-bold">2 Foto / Lembar</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Besar &amp; Jelas (Standar LPJ)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, layout: "4-per-page" })}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    formData.layout === "4-per-page"
                      ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <p className="text-xs font-bold">4 Foto / Lembar</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Grid 2×2 (Hemat Lembar)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, layout: "1-per-page" })}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    formData.layout === "1-per-page"
                      ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <p className="text-xs font-bold">1 Foto / Lembar</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Ukuran Penuh (Banner/Utama)</p>
                </button>
              </div>
            </div>
          </div>

          {/* Photo Upload & Gallery Manager */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>Foto Kegiatan &amp; Serah Terima ({formData.photos.length})</span>
              </h2>
              {formData.photos.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearPhotos}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Kosongkan Semua</span>
                </button>
              )}
            </div>

            {/* Upload Area with Compression Indicator */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-5 text-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition-colors group relative overflow-hidden"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilesSelected}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-emerald-950 border border-slate-700 group-hover:border-emerald-600 flex items-center justify-center mx-auto text-slate-300 group-hover:text-emerald-400 mb-2 transition-colors">
                {isCompressing ? (
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                ) : (
                  <UploadCloud className="w-5 h-5" />
                )}
              </div>
              <p className="text-xs font-bold text-white group-hover:text-emerald-300">
                {isCompressing ? "Mengompresi Gambar Otomatis..." : "Klik atau Seret Foto ke Sini"}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Foto kamera HP otomatis dikompresi ke 1280px (menghemat ~85% kapasitas Cloudinary)
              </p>
            </div>

            {/* List of Photos with Captions */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {formData.photos.map((photo, index) => {
                const isCloudinaryUrl =
                  photo.url &&
                  (photo.url.startsWith("http://") || photo.url.startsWith("https://"));

                return (
                  <div
                    key={photo.id}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex gap-3 items-start"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-md bg-slate-900 border border-slate-700 overflow-hidden shrink-0 relative group">
                      <img
                        src={photo.url}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 bg-black/80 text-white font-mono text-[9px] px-1 rounded">
                        #{index + 1}
                      </span>
                      {isCloudinaryUrl && (
                        <span
                          className="absolute top-1 right-1 bg-indigo-600/90 text-white p-0.5 rounded shadow-xs"
                          title="Tersimpan di Cloudinary CDN"
                        >
                          <Cloud className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    {/* Caption & Controls */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <span>Foto ke-{index + 1}</span>
                          {isCloudinaryUrl && (
                            <span className="text-[9px] text-indigo-400 font-normal">
                              (Cloud CDN)
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => movePhoto(index, "up")}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                            title="Geser ke Atas"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === formData.photos.length - 1}
                            onClick={() => movePhoto(index, "down")}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                            title="Geser ke Bawah"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removePhoto(photo.id)}
                            className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 ml-1"
                            title="Hapus Foto"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={photo.caption}
                        onChange={(e) => updatePhotoCaption(photo.id, e.target.value)}
                        rows={2}
                        placeholder="Tuliskan keterangan foto serah terima / kegiatan ini..."
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pengesahan Tanda Tangan */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Pengesahan Tanda Tangan di Halaman Terakhir</span>
              </h2>
              <input
                type="checkbox"
                checked={formData.sertakanTandaTangan}
                onChange={(e) =>
                  setFormData({ ...formData, sertakanTandaTangan: e.target.checked })
                }
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {formData.sertakanTandaTangan && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-[10.5px] font-semibold text-slate-400 mb-1">
                    Pihak Penyerah (Toko / Rekanan):
                  </label>
                  <input
                    type="text"
                    value={formData.penandatangan1Nama}
                    onChange={(e) =>
                      setFormData({ ...formData, penandatangan1Nama: e.target.value })
                    }
                    placeholder="Nama Pemilik Toko"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    value={formData.penandatangan1Jabatan}
                    onChange={(e) =>
                      setFormData({ ...formData, penandatangan1Jabatan: e.target.value })
                    }
                    placeholder="Jabatan (cth: Penyedia / Toko Surya Mas)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 focus:outline-none focus:border-emerald-500 mt-1"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-semibold text-slate-400 mb-1">
                    Pihak Penerima (Ketua Lembaga):
                  </label>
                  <input
                    type="text"
                    value={formData.penandatangan2Nama}
                    onChange={(e) =>
                      setFormData({ ...formData, penandatangan2Nama: e.target.value })
                    }
                    placeholder="Nama Ketua"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    value={formData.penandatangan2Jabatan}
                    onChange={(e) =>
                      setFormData({ ...formData, penandatangan2Jabatan: e.target.value })
                    }
                    placeholder="Jabatan (cth: Ketua Pimpinan Ranting)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 focus:outline-none focus:border-emerald-500 mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Canvas Preview with Zoom */}
        <div
          className={`lg:col-span-7 flex flex-col items-center ${
            mobileTab === "form" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Canvas Toolbar Controls */}
          <div className="w-full max-w-[780px] flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-t-xl px-4 py-2 text-xs text-slate-300">
            <span className="font-semibold flex items-center gap-1.5 text-emerald-400">
              <span>Pratinjau Kertas F4 (215 × 330 mm)</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.max(50, prev - 10))}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                title="Perkecil Pratinjau"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] px-1 text-slate-400">{zoomScale}%</span>
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.min(130, prev + 10))}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                title="Perbesar Pratinjau"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(100)}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white ml-1"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Scalable Canvas Container */}
          <div className="w-full max-w-[780px] overflow-x-auto pb-12 bg-slate-950/60 border-x border-b border-slate-800 rounded-b-xl p-3 sm:p-6 flex justify-center">
            <div
              style={{
                transform: `scale(${zoomScale / 100})`,
                transformOrigin: "top center",
                transition: "transform 0.15s ease-out",
              }}
              className="origin-top"
            >
              <DokumentasiCanvas
                data={formData}
                profile={profile}
                onUpdateTitle={(newTitle) =>
                  setFormData((prev) => ({ ...prev, judulDokumentasi: newTitle }))
                }
                onUpdateSubJudul={(newSub) =>
                  setFormData((prev) => ({ ...prev, subJudul: newSub }))
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================= TABEL ARSIP DOKUMENTASI & PRESET ================= */}
      <div id="tabelArsipDokumentasi" className="max-w-[1720px] mx-auto w-full px-4 sm:px-8 pb-12 scroll-mt-6">
        <DokumentasiTable
          items={savedList}
          activeId={formData.id}
          onSelect={handleSelectSavedDocumentation}
          onDelete={handleDeleteSavedDocDirect}
          onNew={handleNewDocumentation}
          onLoadPreset={handleLoadSamplePreset}
        />
      </div>

      {/* Modal Pengaturan Kop Surat Lembaga */}
      <KopSuratModal
        isOpen={isKopModalOpen}
        onClose={() => setIsKopModalOpen(false)}
        initialProfile={profile}
        onProfileUpdated={(updated) => setProfile(updated)}
      />

      {/* Modal Pencarian Berkas Sumber Realisasi (BAST, SP, Kwitansi) */}
      <SourceDocumentModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        onSelect={handleSelectSource}
        bastOptions={bastOptions}
        spOptions={spOptions}
        receiptOptions={receiptOptions}
        currentNomorReferensi={formData.nomorReferensi}
      />
    </div>
  );
}
