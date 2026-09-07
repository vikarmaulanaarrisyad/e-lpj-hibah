"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Calendar,
  Shield,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Trash2,
  Save,
  Printer,
  FileCheck,
  UserCheck,
  Store,
  Camera,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  ArrowLeft,
  Receipt as ReceiptIcon,
  Building2,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { BastCanvas } from "./bast-canvas";
import { KopSuratModal } from "@/components/kop-surat/kop-surat-modal";
import { saveBastAction, deleteBastAction } from "@/app/actions/bast.action";
import { swalLoading, swalSuccess, swalError, swalConfirmDelete } from "@/lib/swal";
import { formatTanggalTerbilang } from "@/services/bast.service";
import type {
  BastDocument,
  BastFormData,
  BastItem,
  CreateBastInput,
  Receipt,
  InstitutionProfile,
} from "@/types";

function toDateInputValue(val?: string | Date | null): string {
  if (!val) return new Date().toISOString().split("T")[0];
  if (val instanceof Date) return val.toISOString().split("T")[0];
  if (typeof val === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.substring(0, 10);
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  }
  return new Date().toISOString().split("T")[0];
}

interface BastFormProps {
  initialBastList?: BastDocument[];
  initialReceipts?: Receipt[];
  initialProfile?: InstitutionProfile | null;
  userProfile?: {
    name: string;
    leaderName?: string | null;
    institution?: string | null;
  };
}

export function BastForm({
  initialBastList = [],
  initialReceipts = [],
  initialProfile,
  userProfile,
}: BastFormProps) {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [bastList, setBastList] = useState<BastDocument[]>(initialBastList);
  const [profile, setProfile] = useState<InstitutionProfile | null>(initialProfile || null);
  const [isKopModalOpen, setIsKopModalOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");

  const defaultChairman = profile?.namaKetua || userProfile?.leaderName || "HENI FUJIATI";
  const defaultInstitution = profile?.subNama
    ? `${profile.namaLembaga} ${profile.subNama}`
    : userProfile?.institution || "PR Fatayat NU Dawuhan Selatan";

  // Today Date & Terbilang Calculation
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const { hariTanggal: initHariTanggal, terbilangResmi: initTerbilang } = formatTanggalTerbilang(today);

  const [formData, setFormData] = useState<BastFormData>(() => {
    if (initialBastList.length > 0) {
      const b = initialBastList[0];
      const d = b.tanggal ? new Date(b.tanggal) : today;
      let parsedItems: BastItem[] = [];
      try {
        parsedItems = JSON.parse(b.itemsJson) || [];
      } catch {
        parsedItems = [];
      }

      return {
        id: b.id,
        nomorBast: b.nomorBast,
        tanggal: d.toISOString().split("T")[0],
        hariTanggal: b.hariTanggal,
        tanggalTerbilang: b.tanggalTerbilang,
        nomorSpk: b.nomorSpk,
        tanggalSpk: toDateInputValue(b.tanggalSpk),
        namaKegiatan: b.namaKegiatan,
        pihak1Nama: b.pihak1Nama,
        pihak1Jabatan: b.pihak1Jabatan,
        pihak2Nama: b.pihak2Nama,
        pihak2Toko: b.pihak2Toko,
        items: parsedItems.length > 0 ? parsedItems : [
          {
            id: "1",
            no: 1,
            jenisBarang: "Sound Aktif Portable 15 Inch + 2 Wireless Microphone & Stand",
            pesanan: "1 unit",
            realisasi: "1 unit",
            kondisi: "Baik",
          },
        ],
        catatanUji: b.catatanUji || "Barang telah dihidupkan, dites keluaran audio, baterai & mic nirkabel berfungsi normal 100%.",
        statusUji: b.statusUji || "Lulus Uji Coba",
        fotoFisikNama: b.fotoFisikNama || "IMG_BAST_014_2026.jpg",
        geoTag: "Talang, Tegal (-6.9402, 109.1384)",
        receiptId: b.receiptId || null,
        linkedReceiptNominal: 3000000,
        linkedReceiptNomor: "014/KWT-HB/2026",
      };
    }

    return {
      nomorBast: "014/BAST-HB/FTY/VII/2026",
      tanggal: todayStr,
      hariTanggal: initHariTanggal,
      tanggalTerbilang: initTerbilang,
      nomorSpk: "Wk.5c.74.II/MI.bhd.01/370/7/2026",
      tanggalSpk: "2026-07-17",
      namaKegiatan: "Pengadaan Sarana Sound Aktif & Alat Hadroh Fatayat NU",
      pihak1Nama: defaultChairman,
      pihak1Jabatan: `Ketua ${defaultInstitution}`,
      pihak2Nama: "ANSHORI",
      pihak2Toko: "SURYA MAS (Pemilik / Rekanan)",
      items: [
        {
          id: "1",
          no: 1,
          jenisBarang: "Sound Aktif Portable 15 Inch + 2 Wireless Microphone & Stand",
          pesanan: "1 unit",
          realisasi: "1 unit",
          kondisi: "Baik",
        },
      ],
      catatanUji: "Barang telah dihidupkan, dites keluaran audio, baterai & mic nirkabel berfungsi normal 100%.",
      statusUji: "Lulus Uji Coba",
      fotoFisikNama: "IMG_BAST_014_2026.jpg",
      geoTag: "Talang, Tegal (-6.9402, 109.1384)",
      receiptId: null,
      linkedReceiptNominal: 3000000,
      linkedReceiptNomor: "014/KWT-HB/2026",
    };
  });

  // Handle URL query parameters for ?receiptNo=... or ?no=...
  useEffect(() => {
    const receiptNoParam = searchParams.get("receiptNo");
    const noParam = searchParams.get("no");

    if (noParam) {
      const match = bastList.find((b) => b.nomorBast === noParam);
      if (match) {
        loadBastIntoForm(match);
        return;
      }
    }

    if (receiptNoParam && initialReceipts.length > 0) {
      const r = initialReceipts.find((item) => item.nomorBukti === receiptNoParam);
      if (r) {
        const itemName = r.uraian?.replace(/^Belanja\s+/i, "") || "Pengadaan Sarana & Prasarana";
        setFormData((prev) => ({
          ...prev,
          receiptId: r.id,
          linkedReceiptNomor: r.nomorBukti,
          linkedReceiptNominal: r.nominal,
          namaKegiatan: r.uraian,
          pihak2Nama: r.penerima || prev.pihak2Nama,
          pihak2Toko: `${r.penerima || "Penyedia"} (Penyedia Barang)`,
          items: [
            {
              id: "1",
              no: 1,
              jenisBarang: itemName,
              pesanan: "1 unit",
              realisasi: "1 unit",
              kondisi: "Baik",
            },
          ],
        }));
      }
    }
  }, [searchParams, bastList, initialReceipts]);

  // Handler to load selected BAST
  const loadBastIntoForm = (b: BastDocument) => {
    const d = b.tanggal ? new Date(b.tanggal) : today;
    let parsedItems: BastItem[] = [];
    try {
      parsedItems = JSON.parse(b.itemsJson) || [];
    } catch {
      parsedItems = [];
    }

    setFormData({
      id: b.id,
      nomorBast: b.nomorBast,
      tanggal: d.toISOString().split("T")[0],
      hariTanggal: b.hariTanggal,
      tanggalTerbilang: b.tanggalTerbilang,
      nomorSpk: b.nomorSpk,
      tanggalSpk: toDateInputValue(b.tanggalSpk),
      namaKegiatan: b.namaKegiatan,
      pihak1Nama: b.pihak1Nama,
      pihak1Jabatan: b.pihak1Jabatan,
      pihak2Nama: b.pihak2Nama,
      pihak2Toko: b.pihak2Toko,
      items: parsedItems.length > 0 ? parsedItems : [
        {
          id: "1",
          no: 1,
          jenisBarang: "Barang Pengadaan Hibah",
          pesanan: "1 unit",
          realisasi: "1 unit",
          kondisi: "Baik",
        },
      ],
      catatanUji: b.catatanUji || "",
      statusUji: b.statusUji || "Lulus Uji Coba",
      fotoFisikNama: b.fotoFisikNama || "IMG_SERAHTERIMA.jpg",
      geoTag: "Talang, Tegal (-6.9402, 109.1384)",
      receiptId: b.receiptId || null,
      linkedReceiptNominal: 3000000,
      linkedReceiptNomor: undefined,
    });
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
  };

  // Handle Date change with auto-terbilang
  const handleDateChange = (dateVal: string) => {
    const d = new Date(dateVal);
    const { hariTanggal, terbilangResmi } = formatTanggalTerbilang(isNaN(d.getTime()) ? new Date() : d);

    setFormData((prev) => ({
      ...prev,
      tanggal: dateVal,
      hariTanggal,
      tanggalTerbilang: terbilangResmi,
    }));
  };

  // Dynamic Items Handlers
  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: String(prev.items.length + 1),
          no: prev.items.length + 1,
          jenisBarang: "",
          pesanan: "1 unit",
          realisasi: "1 unit",
          kondisi: "Baik",
        },
      ],
    }));
  };

  const handleUpdateItem = (index: number, field: keyof BastItem, value: string | number) => {
    setFormData((prev) => {
      const nextItems = [...prev.items];
      nextItems[index] = {
        ...nextItems[index],
        [field]: value,
      };
      return {
        ...prev,
        items: nextItems,
      };
    });
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => {
      const filtered = prev.items.filter((_, i) => i !== index);
      const renumbered = filtered.map((it, idx) => ({ ...it, no: idx + 1, id: String(idx + 1) }));
      return {
        ...prev,
        items: renumbered,
      };
    });
  };

  // Handle Receipt linking
  const handleSelectReceipt = (receiptId: string) => {
    if (!receiptId) {
      setFormData((prev) => ({
        ...prev,
        receiptId: null,
        linkedReceiptNomor: undefined,
        linkedReceiptNominal: undefined,
      }));
      return;
    }

    const r = initialReceipts.find((it) => it.id === receiptId);
    if (r) {
      const cleanItem = r.uraian?.replace(/^Belanja\s+/i, "") || "Pengadaan Barang";
      setFormData((prev) => ({
        ...prev,
        receiptId: r.id,
        linkedReceiptNomor: r.nomorBukti,
        linkedReceiptNominal: r.nominal,
        namaKegiatan: r.uraian,
        pihak2Nama: r.penerima || prev.pihak2Nama,
        pihak2Toko: `${r.penerima || "Penyedia"} (Penyedia Barang)`,
        items:
          prev.items.length === 1 && !prev.items[0].jenisBarang
            ? [
                {
                  id: "1",
                  no: 1,
                  jenisBarang: cleanItem,
                  pesanan: "1 unit",
                  realisasi: "1 unit",
                  kondisi: "Baik",
                },
              ]
            : prev.items,
      }));
    }
  };

  // Save action handler
  const handleSaveBast = () => {
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    swalLoading("Menyimpan BAST...", "Sedang menyimpan Berita Acara Serah Terima ke database...");
    startTransition(async () => {
      const payload: CreateBastInput = {
        nomorBast: formData.nomorBast,
        tanggal: formData.tanggal,
        hariTanggal: formData.hariTanggal,
        tanggalTerbilang: formData.tanggalTerbilang,
        nomorSpk: formData.nomorSpk,
        tanggalSpk: formData.tanggalSpk,
        namaKegiatan: formData.namaKegiatan,
        pihak1Nama: formData.pihak1Nama,
        pihak1Jabatan: formData.pihak1Jabatan,
        pihak2Nama: formData.pihak2Nama,
        pihak2Toko: formData.pihak2Toko,
        items: formData.items,
        catatanUji: formData.catatanUji,
        statusUji: formData.statusUji,
        fotoFisikNama: formData.fotoFisikNama,
        receiptId: formData.receiptId,
      };

      const res = await saveBastAction(payload);
      if (res.success && res.data) {
        setSaveSuccessMsg(`Berita Acara ${res.data.nomorBast} berhasil disimpan ke database otentik!`);
        setBastList((prev) => {
          const exists = prev.some((b) => b.id === res.data!.id);
          if (exists) {
            return prev.map((b) => (b.id === res.data!.id ? res.data! : b));
          }
          return [res.data!, ...prev];
        });
        setFormData((prev) => ({ ...prev, id: res.data!.id }));
        swalSuccess("BAST Disimpan!", `Berita Acara ${res.data.nomorBast} berhasil tersimpan.`);
      } else {
        const err = res.message || "Gagal menyimpan BAST";
        setSaveErrorMsg(err);
        swalError("Gagal Menyimpan BAST", err);
      }
    });
  };

  const handleDeleteBast = async () => {
    if (!formData.id) return;
    const isConfirmed = await swalConfirmDelete({
      title: "Hapus Dokumen BAST?",
      text: `Apakah Anda yakin ingin menghapus Berita Acara "${formData.nomorBast}" secara permanen?`,
      confirmText: "Ya, Hapus!",
      cancelText: "Batal",
    });
    if (!isConfirmed) return;

    swalLoading("Menghapus...", "Sedang menghapus dokumen BAST...");
    startTransition(async () => {
      const res = await deleteBastAction(formData.id!);
      if (res.success) {
        setBastList((prev) => prev.filter((b) => b.id !== formData.id));
        handleCreateNew();
        swalSuccess("Berhasil Dihapus!", res.message);
      } else {
        swalError("Gagal Menghapus", res.message);
      }
    });
  };

  // Create new blank BAST
  const handleCreateNew = () => {
    const nextIdx = bastList.length + 1;
    const nextNo = `0${nextIdx + 13}/BAST-HB/FTY/VII/2026`;
    const { hariTanggal, terbilangResmi } = formatTanggalTerbilang(new Date());

    setFormData({
      nomorBast: nextNo,
      tanggal: todayStr,
      hariTanggal,
      tanggalTerbilang: terbilangResmi,
      nomorSpk: `Wk.5c.74.II/MI.bhd.01/${370 + nextIdx}/7/2026`,
      tanggalSpk: "17 Juli 2026",
      namaKegiatan: "Pengadaan Sarana & Prasarana Fatayat NU",
      pihak1Nama: defaultChairman,
      pihak1Jabatan: `Ketua ${defaultInstitution}`,
      pihak2Nama: "SURYA MAS",
      pihak2Toko: "SURYA MAS (Pemilik / Rekanan)",
      items: [
        {
          id: "1",
          no: 1,
          jenisBarang: "Sound Aktif Portable 15 Inch & Perlengkapan",
          pesanan: "1 unit",
          realisasi: "1 unit",
          kondisi: "Baik",
        },
      ],
      catatanUji: "Kondisi fisik utuh, kelengkapan aksesoris lengkap, fungsi operasional normal 100%.",
      statusUji: "Lulus Uji Coba",
      fotoFisikNama: "IMG_SERAHTERIMA_2026.jpg",
      geoTag: "Talang, Tegal (-6.9402, 109.1384)",
      receiptId: null,
      linkedReceiptNominal: 3000000,
      linkedReceiptNomor: undefined,
    });
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
  };

  return (
    <div className="w-full flex flex-col">
      {/* Sub-Header Status Bar */}
      <div className="w-full bg-slate-900 border-b border-slate-800 py-2.5 px-4 sm:px-8 mb-6 shadow-sm">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/user/kwitansi"
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kwitansi</span>
            </Link>
            <span className="text-slate-600">•</span>
            <Link
              href="/user/pesanan"
              className="flex items-center gap-1.5 text-teal-400 hover:text-teal-300 transition-colors font-medium"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Surat Pesanan</span>
            </Link>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-2 font-mono text-slate-300">
              <span className="text-slate-400">BAST No:</span>
              <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {formData.nomorBast}
              </span>
              <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-700/60 text-emerald-300 rounded font-semibold text-[11px]">
                Akun 5.2.1 Belanja Hibah Barang
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {bastList.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Pilih Arsip:</span>
                <select
                  value={formData.id || ""}
                  onChange={(e) => {
                    const found = bastList.find((b) => b.id === e.target.value);
                    if (found) loadBastIntoForm(found);
                  }}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Arsip BAST Tersimpan ({bastList.length}) --</option>
                  {bastList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nomorBast} - {b.namaKegiatan.substring(0, 30)}...
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>
                Status Berkas:{" "}
                <strong className="text-emerald-300 font-semibold">
                  Tervalidasi Bendahara & Pihak Kedua
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsKopModalOpen(true)}
              className="px-2.5 py-1 rounded bg-[#004532]/80 hover:bg-[#004532] border border-[#006c4e] text-emerald-300 text-xs transition-colors flex items-center gap-1.5 shadow-sm"
              title="Sesuaikan Kop Surat, Logo Cloudinary, dan Nomor Lembaga"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Atur Kop & Logo</span>
            </button>

            <button
              type="button"
              onClick={handleCreateNew}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>BAST Baru (+)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split Workspace (Form Left : Paper Preview Right) */}
      <div className="max-w-[1720px] w-full mx-auto px-3 sm:px-8 pb-12">
        {/* Responsive Mobile / Tablet View Switcher Tab (< xl screens) */}
        <div className="xl:hidden mb-6 flex items-center bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shadow-lg">
          <button
            type="button"
            onClick={() => setMobileTab("form")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mobileTab === "form"
                ? "bg-brand-primary text-white shadow-md border border-emerald-600/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Formulir Input BAST</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mobileTab === "preview"
                ? "bg-brand-primary text-white shadow-md border border-emerald-600/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Pratinjau Lembar A4 (Live)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* ================= LEFT COLUMN: Generator & Administrasi BAST Form (5 Cols) ================= */}
          <div className={`xl:col-span-5 flex-col gap-6 ${mobileTab === "preview" ? "hidden xl:flex" : "flex"}`}>
            {/* Panel Card: Form Input BAST */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 flex flex-col gap-6">
              {/* Card Header */}
              <div className="flex flex-col gap-1.5 pb-4 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-6 h-6 text-emerald-400" />
                    <h1 className="text-lg font-bold text-white tracking-tight">
                      Administrasi BAST
                    </h1>
                    <button
                      type="button"
                      onClick={() => setIsKopModalOpen(true)}
                      className="ml-2 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[11px] text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                      title="Ubah Kop Surat Lembaga & Logo Cloudinary"
                    >
                      <Building2 className="w-3 h-3 text-emerald-400" />
                      <span>Kop & Logo</span>
                    </button>
                  </div>
                  {formData.linkedReceiptNomor ? (
                    <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-700/60 text-emerald-300 text-xs rounded-full font-medium flex items-center gap-1">
                      <ReceiptIcon className="w-3 h-3" />
                      Kwitansi #{formData.linkedReceiptNomor} Terhubung
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-slate-800 text-slate-400 text-xs rounded-full font-medium">
                      Pengadaan Bebas / Belum Ditautkan
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Formulir Berita Acara Serah Terima Hasil Pengadaan Sarana & Prasarana Hibah Fatayat NU Dawuhan Selatan.
                </p>
              </div>

              {/* Tautkan Kwitansi Picker */}
              <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <ReceiptIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tautkan dari Kwitansi Belanja Barang:</span>
                  </label>
                  {formData.receiptId && (
                    <button
                      type="button"
                      onClick={() => handleSelectReceipt("")}
                      className="text-[11px] text-slate-400 hover:text-red-400 transition-colors"
                    >
                      Lepas Tautan
                    </button>
                  )}
                </div>
                <select
                  value={formData.receiptId || ""}
                  onChange={(e) => handleSelectReceipt(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Pilih Kwitansi Barang (Otomatis Isi Data) --</option>
                  {initialReceipts.map((rc) => (
                    <option key={rc.id} value={rc.id}>
                      {rc.nomorBukti} - Rp {rc.nominal.toLocaleString("id-ID")} ({rc.uraian?.substring(0, 40)}...)
                    </option>
                  ))}
                </select>
              </div>

              {/* Section 1: Nomor & Tanggal Berita Acara */}
              <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-4">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  1. Identitas & Tanggal BAST
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-300 font-medium">
                      Nomor Register BAST
                    </label>
                    <input
                      type="text"
                      value={formData.nomorBast}
                      onChange={(e) =>
                        setFormData({ ...formData, nomorBast: e.target.value })
                      }
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-mono text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-300 font-medium">
                      Tanggal Pelaksanaan BAST
                    </label>
                    <input
                      type="date"
                      value={formData.tanggal}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-300 font-medium">
                    Pernyataan Tanggal Tertulis (Terbilang Resmi BAST)
                  </label>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-emerald-300 italic leading-relaxed">
                    "Pada hari ini, {formData.tanggalTerbilang}"
                  </div>
                </div>
              </div>

              {/* Section 2: Dasar Surat Pesanan / SPK Rekanan */}
              <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-4">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  2. Rujukan Surat Pesanan (SPK)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-300 font-medium">
                      Nomor Surat Pesanan (SPK)
                    </label>
                    <input
                      type="text"
                      value={formData.nomorSpk}
                      onChange={(e) =>
                        setFormData({ ...formData, nomorSpk: e.target.value })
                      }
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-mono text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-300 font-medium">
                      Tanggal Surat Pesanan (SPK)
                    </label>
                    <input
                      type="date"
                      value={formData.tanggalSpk}
                      onChange={(e) =>
                        setFormData({ ...formData, tanggalSpk: e.target.value })
                      }
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-300 font-medium">
                    Program / Rincian Kegiatan Anggaran
                  </label>
                  <input
                    type="text"
                    value={formData.namaKegiatan}
                    onChange={(e) =>
                      setFormData({ ...formData, namaKegiatan: e.target.value })
                    }
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Section 3: Pihak Terlibat */}
              <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-4">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  3. Pihak Penandatangan Berita Acara
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Pihak Kesatu */}
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col gap-2.5">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                      <UserCheck className="w-4 h-4" />
                      <span>PIHAK KESATU (Penerima)</span>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Nama Ketua Organisasi
                      </label>
                      <input
                        type="text"
                        value={formData.pihak1Nama}
                        onChange={(e) =>
                          setFormData({ ...formData, pihak1Nama: e.target.value })
                        }
                        className="w-full text-xs font-bold uppercase bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Jabatan
                      </label>
                      <input
                        type="text"
                        value={formData.pihak1Jabatan}
                        onChange={(e) =>
                          setFormData({ ...formData, pihak1Jabatan: e.target.value })
                        }
                        className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Pihak Kedua */}
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col gap-2.5">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                      <Store className="w-4 h-4" />
                      <span>PIHAK KEDUA (Penyedia)</span>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Nama Pemilik / Rekanan
                      </label>
                      <input
                        type="text"
                        value={formData.pihak2Nama}
                        onChange={(e) =>
                          setFormData({ ...formData, pihak2Nama: e.target.value })
                        }
                        className="w-full text-xs font-bold uppercase bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Nama Toko & Status
                      </label>
                      <input
                        type="text"
                        value={formData.pihak2Toko}
                        onChange={(e) =>
                          setFormData({ ...formData, pihak2Toko: e.target.value })
                        }
                        className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Tabel Item Pekerjaan / Barang */}
              <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    4. Item Pekerjaan / Barang
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">
                          Barang #{item.no}
                        </span>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Hapus baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Nama & Spesifikasi Barang
                        </label>
                        <input
                          type="text"
                          value={item.jenisBarang}
                          onChange={(e) =>
                            handleUpdateItem(idx, "jenisBarang", e.target.value)
                          }
                          placeholder="cth: Sound Aktif Portable 15 Inch + Wireless Mic"
                          className="w-full text-xs font-medium bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">
                            Pesanan
                          </label>
                          <input
                            type="text"
                            value={item.pesanan}
                            onChange={(e) =>
                              handleUpdateItem(idx, "pesanan", e.target.value)
                            }
                            placeholder="1 unit"
                            className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">
                            Realisasi
                          </label>
                          <input
                            type="text"
                            value={item.realisasi}
                            onChange={(e) =>
                              handleUpdateItem(idx, "realisasi", e.target.value)
                            }
                            placeholder="1 unit"
                            className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">
                            Kondisi
                          </label>
                          <select
                            value={item.kondisi}
                            onChange={(e) =>
                              handleUpdateItem(idx, "kondisi", e.target.value as "Baik" | "Tidak Baik")
                            }
                            className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-emerald-300 font-semibold"
                          >
                            <option value="Baik">Baik</option>
                            <option value="Tidak Baik">Tidak Baik</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: Uji Kelayakan & Unggah Bukti */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-200">
                      Pemeriksaan Uji Fungsi
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <textarea
                    rows={2}
                    value={formData.catatanUji}
                    onChange={(e) =>
                      setFormData({ ...formData, catatanUji: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-900 border border-emerald-700 text-emerald-200 text-[11px] rounded font-semibold w-max">
                      Status: {formData.statusUji}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2 justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">
                      Dokumentasi Fisik & Geo
                    </span>
                    <Camera className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-white truncate">
                        {formData.fotoFisikNama}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 truncate">
                        {formData.geoTag}
                      </span>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={formData.geoTag}
                    onChange={(e) =>
                      setFormData({ ...formData, geoTag: e.target.value })
                    }
                    placeholder="Koordinat GPS / Lokasi"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 font-mono"
                  />
                </div>
              </div>

              {/* Feedback messages */}
              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}
              {saveErrorMsg && (
                <div className="p-3 bg-red-950/80 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{saveErrorMsg}</span>
                </div>
              )}

              {/* Action Buttons Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleSaveBast}
                    className="px-4 py-2.5 bg-[#006c4e] hover:bg-[#004532] text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    {isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Simpan BAST</span>
                  </button>

                  {formData.id && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleDeleteBast}
                      className="px-3.5 py-2.5 bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                      title="Hapus Dokumen BAST Ini"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                      <span>Hapus</span>
                    </button>
                  )}

                  <Link
                    href="/user/bku"
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                    <span>Sinkronisasi BKU</span>
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Export PDF</span>
                </button>
              </div>
            </div>

            {/* Mini Card: Sinkronisasi Nilai Keuangan SPJ */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                  <ReceiptIcon className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">
                    Nilai Total Kwitansi Terkait
                  </span>
                  <span className="text-lg font-bold font-mono text-emerald-400">
                    Rp {(formData.linkedReceiptNominal || 3000000).toLocaleString("id-ID")},-
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs px-2.5 py-1 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-semibold">
                  Terbayar Lunas
                </span>
                <div className="font-mono text-[11px] text-slate-400 mt-1">
                  Tgl: {formData.hariTanggal || "31 Juli 2026"}
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: Exact A4 Physical Printed Document Preview (7 Cols) ================= */}
          <div className={`xl:col-span-7 flex-col gap-4 items-center w-full ${mobileTab === "form" ? "hidden xl:flex" : "flex"}`}>
            {/* Live Document Control Header Bar */}
            <div className="w-full max-w-[780px] bg-slate-900 border border-slate-800 rounded-xl px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="text-xs text-slate-200 font-semibold line-clamp-1">
                  Pratinjau Cetak Lembar Asli BAST (Format A4 Standar LPJ)
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setZoomScale((prev) => Math.max(60, prev - 10))}
                  className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
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
                  className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                  title="Perbesar"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="ml-1 sm:ml-2 px-2.5 sm:px-3 py-1.5 bg-[#006c4e] hover:bg-[#004532] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cetak Sekarang</span>
                  <span className="sm:hidden">Cetak</span>
                </button>
              </div>
            </div>

            {/* Canvas Container with dynamic zoom and horizontal scroll protection */}
            <div className="w-full overflow-x-auto pb-6 flex justify-start sm:justify-center">
              <div
                className="transition-transform origin-top shrink-0"
                style={{
                  transform: `scale(${zoomScale / 100})`,
                  transformOrigin: "top center",
                }}
              >
                <BastCanvas
                  data={formData}
                  profile={profile}
                  institutionName={userProfile?.institution || undefined}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Floating Quick Action Pill for Mobile */}
        {mobileTab === "form" && (
          <button
            type="button"
            onClick={() => {
              setMobileTab("preview");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="xl:hidden fixed bottom-6 right-5 z-40 px-4 py-3 bg-[#006c4e] hover:bg-[#004532] text-white rounded-full shadow-2xl flex items-center gap-2 border border-[#97f5cc]/30 text-xs font-bold transition-transform active:scale-95"
          >
            <Printer className="w-4 h-4 text-emerald-300" />
            <span>Lihat Lembar A4</span>
          </button>
        )}
        {mobileTab === "preview" && (
          <button
            type="button"
            onClick={() => {
              setMobileTab("form");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="xl:hidden fixed bottom-6 left-5 z-40 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-2xl flex items-center gap-2 border border-slate-700 text-xs font-bold transition-transform active:scale-95"
          >
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>Kembali ke Formulir</span>
          </button>
        )}

        {/* ================= BOTTOM AUDIT SECTION: 4 Pilar Lampiran Kesbangpol & BPKAD ================= */}
        <div className="w-full mt-10 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                <Shield className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-base font-bold text-white">
                  Kelengkapan Berkas Audit (BPKAD & Kesbangpol Kab. Tegal)
                </h2>
                <p className="text-xs text-slate-400">
                  Checklist berkas otentik wajib yang harus dilampirkan bersama BAST pada bundel LPJ Final.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-emerald-950 border border-emerald-700/60 text-emerald-300 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>4 dari 4 Berkas Lengkap (100% Siap Audit)</span>
              </span>
            </div>
          </div>

          {/* 4 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
            {/* Pillar 1 */}
            <div className="bg-slate-950/70 border border-slate-800/90 p-4 rounded-xl flex flex-col justify-between gap-3 hover:border-emerald-700/50 transition-colors">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    PILAR 1
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm font-bold text-white">
                  Surat Pesanan / SPK
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Surat pemesanan resmi kepada rekanan toko nomor:{" "}
                  <strong className="text-slate-200">{formData.nomorSpk}</strong>.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="font-mono text-slate-500">
                  {formData.tanggalSpk}
                </span>
                <span className="text-emerald-400 font-semibold cursor-pointer hover:underline">
                  Tersedia
                </span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-slate-950/70 border border-slate-800/90 p-4 rounded-xl flex flex-col justify-between gap-3 hover:border-emerald-700/50 transition-colors">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    PILAR 2
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm font-bold text-white">
                  Faktur / Nota Asli
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nota resmi bermaterai bercap basah toko rekanan senilai{" "}
                  <strong className="text-slate-200">
                    Rp {(formData.linkedReceiptNominal || 3000000).toLocaleString("id-ID")},-
                  </strong>{" "}
                  lunas bayar.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="font-mono text-slate-500">Nota Terlampir</span>
                <span className="text-emerald-400 font-semibold cursor-pointer hover:underline">
                  Tersedia
                </span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-slate-950/70 border border-slate-800/90 p-4 rounded-xl flex flex-col justify-between gap-3 hover:border-emerald-700/50 transition-colors">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    PILAR 3
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm font-bold text-white">
                  Kwitansi Kas Hibah
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Kwitansi kas pengeluaran bertandatangan Ketua & Bendahara{" "}
                  <strong className="text-slate-200">
                    {formData.linkedReceiptNomor || "014/KWT-HB/2026"}
                  </strong>
                  .
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="font-mono text-slate-500">
                  {formData.linkedReceiptNomor ? `Kwt #${formData.linkedReceiptNomor}` : "Otomatis BKU"}
                </span>
                <Link
                  href={formData.linkedReceiptNomor ? `/user/kwitansi?no=${formData.linkedReceiptNomor}` : "/user/kwitansi"}
                  className="text-emerald-400 font-semibold hover:underline"
                >
                  Lihat Kwitansi
                </Link>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="bg-slate-950/70 border border-slate-800/90 p-4 rounded-xl flex flex-col justify-between gap-3 hover:border-emerald-700/50 transition-colors">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    PILAR 4
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm font-bold text-white">
                  Foto Serah Terima Fisik
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dokumentasi penyerahan barang bersama Pihak Kesatu & Rekanan Toko dengan GPS koordinat valid.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="font-mono text-slate-500">GPS Valid</span>
                <span className="text-emerald-400 font-semibold cursor-pointer hover:underline">
                  {formData.fotoFisikNama}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Pengaturan Kop Surat, Logo Cloudinary, dan Nomor Lembaga */}
      <KopSuratModal
        isOpen={isKopModalOpen}
        onClose={() => setIsKopModalOpen(false)}
        initialProfile={profile}
        onProfileUpdated={(updated) => {
          setProfile(updated);
          if (updated.namaKetua) {
            setFormData((prev) => ({
              ...prev,
              pihak1Nama: updated.namaKetua!,
              pihak1Jabatan: updated.jabatanKetua || prev.pihak1Jabatan,
            }));
          }
        }}
      />
    </div>
  );
}
