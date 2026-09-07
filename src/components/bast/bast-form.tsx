"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
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
  Edit3,
  FileDown,
  Loader2,
  Layers,
  ExternalLink,
  Link as LinkIcon,
  ArrowRight,
  FolderSync,
  Settings,
} from "lucide-react";
import { exportBastToPdf } from "@/lib/bast-pdf";
import { BastCanvas } from "./bast-canvas";
import { PesananCanvas } from "@/components/pesanan/pesanan-canvas";
import { exportBundelPengadaanPdf } from "@/lib/bundel-pengadaan-pdf";
import { KopSuratModal } from "@/components/kop-surat/kop-surat-modal";
import { saveBastAction, deleteBastAction } from "@/app/actions/bast.action";
import { saveInstitutionProfileAction } from "@/app/actions/institution.action";
import { swalLoading, swalSuccess, swalError, swalConfirmDelete } from "@/lib/swal";
import { formatTanggalTerbilang } from "@/services/bast.service";
import {
  buildFormattedDocumentNumber,
  deconstructDocumentNumber,
  syncNomorDokumenBulanTahun,
} from "@/lib/utils/pesanan-date";
import type {
  BastDocument,
  BastFormData,
  BastItem,
  CreateBastInput,
  Receipt,
  InstitutionProfile,
  PurchaseOrder,
  PesananFormData,
  PesananItem,
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
  initialPesananList?: PurchaseOrder[];
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
  initialPesananList = [],
  initialReceipts = [],
  initialProfile,
  userProfile,
}: BastFormProps) {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [bastList, setBastList] = useState<BastDocument[]>(initialBastList);
  const [pesananList, setPesananList] = useState<PurchaseOrder[]>(initialPesananList);
  const [profile, setProfile] = useState<InstitutionProfile | null>(initialProfile || null);
  const [isKopModalOpen, setIsKopModalOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [previewMode, setPreviewMode] = useState<"bast" | "sp" | "bundel">("bast");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingBundle, setIsExportingBundle] = useState(false);

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
            jenisBarang: "Sound Aktif Portable Professional 15 Inch",
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

  // Sinkronisasi data dari Surat Pesanan (SP) terpilih ke dalam Berita Acara (BAST)
  const syncFromPesanan = (po: PurchaseOrder) => {
    let parsedItems: PesananItem[] = [];
    try {
      parsedItems = JSON.parse(po.itemsJson) || [];
    } catch {
      parsedItems = [];
    }

    const tglIso = po.tanggal ? new Date(po.tanggal).toISOString().split("T")[0] : todayStr;
    const mappedItems: BastItem[] = parsedItems.map((it, idx) => ({
      id: String(idx + 1),
      no: idx + 1,
      jenisBarang: it.jenisBarang,
      spesifikasi: it.spesifikasi || "Standar spesifikasi barang sesuai proposal NPHD",
      pesanan: `${it.jumlah} ${it.satuan || "unit"}`,
      realisasi: `${it.jumlah} ${it.satuan || "unit"}`,
      kondisi: "Baik",
    }));

    setFormData((prev) => ({
      ...prev,
      nomorSpk: po.nomorSp,
      tanggalSpk: tglIso,
      namaKegiatan: po.namaPaket || prev.namaKegiatan,
      pihak1Nama: po.pihak1Nama || prev.pihak1Nama,
      pihak1Jabatan: po.pihak1Jabatan || prev.pihak1Jabatan,
      pihak2Nama: po.pihak2Nama || prev.pihak2Nama,
      pihak2Toko: po.pihak2Toko || prev.pihak2Toko,
      receiptId: po.receiptId || prev.receiptId,
      items: mappedItems.length > 0 ? mappedItems : prev.items,
    }));
  };

  // Data pendamping Surat Pesanan untuk Pratinjau Bundel 2 Halaman
  const companionPesananData: PesananFormData = useMemo(() => {
    const matchedPo = pesananList.find((p) => p.nomorSp === formData.nomorSpk);
    if (matchedPo) {
      let parsedItems: PesananItem[] = [];
      try {
        parsedItems = JSON.parse(matchedPo.itemsJson) || [];
      } catch {
        parsedItems = [];
      }
      return {
        id: matchedPo.id,
        nomorSp: matchedPo.nomorSp,
        tanggal: matchedPo.tanggal ? new Date(matchedPo.tanggal).toISOString().split("T")[0] : formData.tanggalSpk,
        namaPaket: matchedPo.namaPaket,
        pihak1Nama: matchedPo.pihak1Nama,
        pihak1Jabatan: matchedPo.pihak1Jabatan,
        pihak1Alamat: matchedPo.pihak1Alamat || undefined,
        pihak2Toko: matchedPo.pihak2Toko,
        pihak2Nama: matchedPo.pihak2Nama,
        pihak2Alamat: matchedPo.pihak2Alamat || undefined,
        items: parsedItems.length > 0 ? parsedItems : formData.items.map((it, idx) => ({
          id: String(idx + 1),
          no: idx + 1,
          jenisBarang: it.jenisBarang,
          spesifikasi: it.spesifikasi || "",
          jumlah: 1,
          satuan: it.pesanan?.replace(/^\d+\s*/, "") || "unit",
          hargaSatuan: 0,
          totalHarga: 0,
        })),
        subtotal: matchedPo.subtotal,
        pajak: matchedPo.pajak,
        pajakKeterangan: matchedPo.pajakKeterangan || "- (Sudah Termasuk)",
        totalHarga: matchedPo.totalHarga,
        terbilang: matchedPo.terbilang,
        batasWaktu: matchedPo.batasWaktu || formData.tanggal,
        waktuPenyelesaian: matchedPo.waktuPenyelesaian || "1 (satu) hari kalender",
        alamatPengiriman: matchedPo.alamatPengiriman || "Tempat / Lokasi Penerimaan",
        alamatPemeriksaan: matchedPo.alamatPemeriksaan || `Sekretariat ${defaultInstitution}`,
        dendaKeterlambatan: matchedPo.dendaKeterlambatan || "Denda 1/500 dari nilai pesanan per hari keterlambatan.",
        receiptId: matchedPo.receiptId || formData.receiptId,
      };
    }

    return {
      nomorSp: formData.nomorSpk || "01/SP/2026",
      tanggal: formData.tanggalSpk || todayStr,
      namaPaket: formData.namaKegiatan,
      pihak1Nama: formData.pihak1Nama,
      pihak1Jabatan: formData.pihak1Jabatan,
      pihak2Toko: formData.pihak2Toko,
      pihak2Nama: formData.pihak2Nama,
      items: formData.items.map((it, idx) => {
        const matchQty = it.pesanan?.match(/^(\d+)/);
        const qty = matchQty ? parseInt(matchQty[1], 10) : 1;
        const satuan = it.pesanan?.replace(/^\d+\s*/, "") || "unit";
        return {
          id: String(idx + 1),
          no: idx + 1,
          jenisBarang: it.jenisBarang,
          spesifikasi: it.spesifikasi || "",
          jumlah: qty,
          satuan: satuan,
          hargaSatuan: 0,
          totalHarga: 0,
        };
      }),
      subtotal: 0,
      pajak: 0,
      totalHarga: 0,
      terbilang: "-",
      batasWaktu: formData.tanggal || todayStr,
      waktuPenyelesaian: "1 (satu) hari kalender",
      alamatPengiriman: "Tempat / Lokasi Rekanan Toko",
      alamatPemeriksaan: `Sekretariat ${defaultInstitution}`,
      dendaKeterlambatan: "Denda 1/500 per hari keterlambatan.",
      receiptId: formData.receiptId,
    };
  }, [pesananList, formData, defaultInstitution, todayStr]);

  // Ekspor Dokumen Bundel Pengadaan (SP + BAST) 2 Halaman PDF
  const handleExportBundlePdf = async () => {
    const spEl = document.getElementById("pesananPrintArea");
    const bastEl = document.getElementById("bastPrintArea");
    if (!spEl || !bastEl) {
      swalError("Dokumen Belum Siap", "Format dokumen Surat Pesanan dan Berita Acara belum siap untuk disatukan.");
      return;
    }
    setIsExportingBundle(true);
    try {
      await exportBundelPengadaanPdf({
        pesananElement: spEl,
        bastElement: bastEl,
        nomorSp: formData.nomorSpk,
        nomorBast: formData.nomorBast,
      });
    } finally {
      setIsExportingBundle(false);
    }
  };

  // Handle URL query parameters for ?spNo=..., ?spId=..., ?receiptNo=... or ?no=...
  useEffect(() => {
    const spNoParam = searchParams.get("spNo");
    const spIdParam = searchParams.get("spId");
    const receiptNoParam = searchParams.get("receiptNo");
    const noParam = searchParams.get("no");

    if (noParam) {
      const match = bastList.find((b) => b.nomorBast === noParam);
      if (match) {
        loadBastIntoForm(match);
        return;
      }
    }

    if ((spNoParam || spIdParam) && pesananList.length > 0) {
      const matchSp = pesananList.find((p) => p.nomorSp === spNoParam || p.id === spIdParam);
      if (matchSp) {
        syncFromPesanan(matchSp);
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
  }, [searchParams, bastList, pesananList, initialReceipts]);

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

    // Sinkronisasi komponen nomor urut dan format penomoran BAST
    const decomp = deconstructDocumentNumber(b.nomorBast);
    setNomorUrutBast(decomp.nomorUrut);
    setFormatPatternBast(decomp.formatPattern);

    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
  };

  // Parameter Otomatisasi Format Penomoran BAST (Contoh: /A/PR.FNU/ atau /BAST-HB/FTY/)
  const initBastDecomp = deconstructDocumentNumber(formData.nomorBast);
  const [formatPatternBast, setFormatPatternBast] = useState<string>(() => {
    if (profile?.formatNomorBast) return profile.formatNomorBast;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bast_format_pattern");
      if (saved) return saved;
    }
    return initBastDecomp.formatPattern || "/A/PR.FNU/";
  });
  const [nomorUrutBast, setNomorUrutBast] = useState<string>(initBastDecomp.nomorUrut || "01");
  const [isManualNomorBast, setIsManualNomorBast] = useState<boolean>(false);
  const [isSavingPattern, startSavePattern] = useTransition();

  // Sinkronisasi bila profile lembaga dari database berubah
  useEffect(() => {
    if (profile?.formatNomorBast && profile.formatNomorBast !== formatPatternBast) {
      setFormatPatternBast(profile.formatNomorBast);
      if (typeof window !== "undefined") {
        localStorage.setItem("bast_format_pattern", profile.formatNomorBast);
      }
      if (!isManualNomorBast) {
        const nextNomor = buildFormattedDocumentNumber(nomorUrutBast, profile.formatNomorBast, formData.tanggal);
        setFormData((prev) => ({ ...prev, nomorBast: nextNomor }));
      }
    }
  }, [profile?.formatNomorBast]);

  // Handler simpan format pola ke Database Akun
  const handleSavePatternToDatabase = () => {
    startSavePattern(async () => {
      swalLoading("Menyimpan ke Database...", "Memperbarui format penomoran BAST akun Anda...");
      const res = await saveInstitutionProfileAction({
        namaLembaga: profile?.namaLembaga || "PIMPINAN RANTING FATAYAT NU",
        subNama: profile?.subNama || "DAWUHAN SELATAN",
        instansiInduk: profile?.instansiInduk || "KECAMATAN TALANG KABUPATEN TEGAL",
        alamat: profile?.alamat || "Jl. Kemuning 2016 Desa Dawuhan RT.23 RW.06 Talang – Tegal 52193",
        email: profile?.email || "prfnudawuhanselatan@gmail.com",
        noHp: profile?.noHp || "085642719869",
        noRegistrasi: profile?.noRegistrasi || "HBH-2026-NU-0428",
        namaKetua: profile?.namaKetua || "HENI FUJIATI",
        jabatanKetua: profile?.jabatanKetua || "Ketua Pimpinan Ranting Fatayat NU Dawuhan Selatan",
        namaBendahara: profile?.namaBendahara || "NUR ALIMAH",
        formatNomorBast: formatPatternBast,
      });

      if (res.success && res.data) {
        setProfile(res.data);
        if (typeof window !== "undefined") {
          localStorage.setItem("bast_format_pattern", formatPatternBast);
        }
        swalSuccess("Format Tersimpan!", "Pola penomoran Berita Acara (BAST) berhasil disimpan ke database akun Anda.");
      } else {
        swalError("Gagal Menyimpan", res.message || "Gagal menyimpan format ke database.");
      }
    });
  };

  // Handler perubahan Format Kode Instansi BAST (misal: /A/PR.FNU/)
  const handleFormatPatternChange = (newPattern: string) => {
    setFormatPatternBast(newPattern);
    if (typeof window !== "undefined") {
      localStorage.setItem("bast_format_pattern", newPattern);
    }
    if (!isManualNomorBast) {
      const nextNomor = buildFormattedDocumentNumber(nomorUrutBast, newPattern, formData.tanggal);
      setFormData((prev) => ({ ...prev, nomorBast: nextNomor }));
    }
  };

  // Handler perubahan Nomor Urut Dokumen BAST (misal: 01, 02)
  const handleNomorUrutChange = (newUrut: string) => {
    setNomorUrutBast(newUrut);
    if (!isManualNomorBast) {
      const nextNomor = buildFormattedDocumentNumber(newUrut, formatPatternBast, formData.tanggal);
      setFormData((prev) => ({ ...prev, nomorBast: nextNomor }));
    }
  };

  // Handle Date change with auto-terbilang & nomor BAST sync
  const handleDateChange = (dateVal: string) => {
    const d = new Date(dateVal);
    const { hariTanggal, terbilangResmi } = formatTanggalTerbilang(isNaN(d.getTime()) ? new Date() : d);
    const syncedNomorBast = isManualNomorBast
      ? syncNomorDokumenBulanTahun(formData.nomorBast, dateVal)
      : buildFormattedDocumentNumber(nomorUrutBast, formatPatternBast, dateVal);

    setFormData((prev) => ({
      ...prev,
      tanggal: dateVal,
      hariTanggal,
      tanggalTerbilang: terbilangResmi,
      nomorBast: syncedNomorBast,
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

  // Handler ekspor langsung ke dokumen PDF Kertas F4 Portrait (215mm x 330mm) dengan Margin Jilid
  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    try {
      setIsExportingPdf(true);
      await exportBastToPdf({
        elementId: "bastPrintArea",
        nomorBast: formData.nomorBast,
        formData: formData,
        profile: profile,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handler cetak BAST dengan judul dokumen otomatis untuk opsi Save as PDF
  const handlePrint = () => {
    const prevTitle = document.title;
    const cleanNo = (formData.nomorBast || "BAST")
      .trim()
      .replace(/[/\\?%*:|"<>.]/g, "_")
      .replace(/\s+/g, "_");
    document.title = `BAST_${cleanNo}`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 2000);
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

  const handleDeleteBastById = async (targetId: string, targetNomorBast: string) => {
    const isConfirmed = await swalConfirmDelete({
      title: "Hapus Dokumen BAST?",
      text: `Apakah Anda yakin ingin menghapus Berita Acara "${targetNomorBast}" secara permanen? Realisasi belanja terkait akan dibebaskan kembali.`,
      confirmText: "Ya, Hapus!",
      cancelText: "Batal",
    });
    if (!isConfirmed) return;

    swalLoading("Menghapus...", "Sedang menghapus dokumen BAST...");
    startTransition(async () => {
      const res = await deleteBastAction(targetId);
      if (res.success) {
        setBastList((prev) => prev.filter((b) => b.id !== targetId));
        if (formData.id === targetId) {
          handleCreateNew();
        }
        swalSuccess("Berhasil Dihapus!", res.message);
      } else {
        swalError("Gagal Menghapus", res.message);
      }
    });
  };

  const handleDeleteBast = async () => {
    if (!formData.id) return;
    await handleDeleteBastById(formData.id, formData.nomorBast);
  };

  const handleEditBast = (b: BastDocument) => {
    loadBastIntoForm(b);
    setMobileTab("form");
    const el = document.getElementById("bastInputForm");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Create new blank BAST
  const handleCreateNew = () => {
    const nextIdx = bastList.length + 1;
    const nextUrut = String(nextIdx).padStart(2, "0");
    setNomorUrutBast(nextUrut);
    const nextNo = buildFormattedDocumentNumber(nextUrut, formatPatternBast, todayStr);
    setIsManualNomorBast(false);
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

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/50 text-white text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
              title="Ekspor Berita Acara langsung ke file PDF ukuran F4 Portrait (215mm x 330mm) dengan margin jilid"
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

        {/* ================= ALUR DOKUMEN PENGADAAN TERPADU ================= */}
        <div className="mb-6 w-full">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                1 Realisasi Pembelian Pengadaan Nyambung:
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                (Surat Pesanan &amp; Berita Acara Terhubung)
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <Link
                href={`/user/pesanan?no=${encodeURIComponent(formData.nomorSpk || "")}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors font-medium border border-slate-700/60 shadow-xs"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-teal-400" />
                <span>1. Surat Pesanan (SP)</span>
              </Link>

              <span className="text-slate-600 font-bold">➔</span>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-600/80 text-emerald-300 font-bold shadow-xs">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Berita Acara (BAST)</span>
              </div>

              <span className="text-slate-600 font-bold">➔</span>

              <Link
                href="/user/kwitansi"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors font-medium border border-slate-700/60 shadow-xs"
              >
                <ReceiptIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>3. Kwitansi Belanja</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* ================= LEFT COLUMN: Generator & Administrasi BAST Form (5 Cols) ================= */}
          <div
            id="bastInputForm"
            className={`xl:col-span-5 flex-col gap-6 scroll-mt-6 ${mobileTab === "preview" ? "hidden xl:flex" : "flex"}`}
          >
            {/* Panel Card: Form Input BAST */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 flex flex-col gap-6">
              {/* Mode Edit vs Baru Banner */}
              {formData.id ? (
                <div className="p-3 bg-amber-950/40 border border-amber-600/50 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-300">Mode Edit Berita Acara (BAST)</p>
                      <p className="text-[11px] text-amber-200/80 font-mono">
                        Sedang mengedit: <span className="font-bold">{formData.nomorBast}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>Batal / Buat Baru</span>
                  </button>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="text-xs text-slate-300 font-medium">Mode Pembuatan BAST Baru</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition-colors flex items-center gap-1"
                    title="Mulai form baru BAST"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Buat Baru</span>
                  </button>
                </div>
              )}

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
                  Formulir bukti penerimaan dan pemeriksaan spesifikasi fisik barang hasil pengadaan hibah.
                </p>
              </div>

              {/* Tautkan Kwitansi Picker with anti-duplicate validation */}
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
                  {initialReceipts.map((rc) => {
                    const linkedBast = bastList.find(
                      (b) => b.receiptId === rc.id && b.id !== formData.id
                    );
                    const isAlreadyLinked = Boolean(linkedBast);

                    return (
                      <option
                        key={rc.id}
                        value={rc.id}
                        disabled={isAlreadyLinked}
                        className={isAlreadyLinked ? "text-slate-500 bg-slate-950" : "text-white bg-slate-900"}
                      >
                        {rc.nomorBukti} - Rp {rc.nominal.toLocaleString("id-ID")} ({rc.uraian?.substring(0, 35)}...)
                        {isAlreadyLinked ? ` ⚠️ (Sudah ada BAST: ${linkedBast?.nomorBast})` : ""}
                      </option>
                    );
                  })}
                </select>
                {formData.receiptId && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Terkait dengan Kwitansi ({initialReceipts.find((r) => r.id === formData.receiptId)?.nomorBukti || "Kwitansi"})
                    </span>
                  </div>
                )}
              </div>

              {/* Section 1: Nomor & Tanggal Berita Acara */}
              <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>1. Waktu & Nomor Berita Acara (BAST)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsManualNomorBast(!isManualNomorBast)}
                    className="text-[11px] text-slate-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isManualNomorBast ? "Beralih ke Mode Otomatis" : "Edit Teks Manual Bebas"}</span>
                  </button>
                </div>

                {!isManualNomorBast ? (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    {/* No. Urut */}
                    <div className="md:col-span-2">
                      <label className="text-[11px] text-slate-300 font-medium block mb-1">
                        No. Urut
                      </label>
                      <input
                        type="text"
                        value={nomorUrutBast}
                        onChange={(e) => handleNomorUrutChange(e.target.value)}
                        placeholder="01"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-mono text-xs text-white text-center font-bold focus:outline-none focus:border-emerald-500"
                        title="Nomor urut berita acara (contoh: 01, 02, 014)"
                      />
                    </div>

                    {/* Format Penomoran Instansi */}
                    <div className="md:col-span-5">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-slate-300 font-medium">
                          Format Penomoran
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsKopModalOpen(true)}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold transition-colors"
                          title="Buka pengaturan kop surat & format penomoran akun"
                        >
                          <Settings className="w-3 h-3" />
                          <span>Atur Format Akun</span>
                        </button>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={formatPatternBast}
                          onChange={(e) => handleFormatPatternChange(e.target.value)}
                          placeholder="/A/PR.FNU/"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-mono text-xs text-amber-300 font-bold focus:outline-none focus:border-emerald-500"
                          title="Format penomoran instansi (contoh: /A/PR.FNU/)"
                        />
                        {formatPatternBast !== profile?.formatNomorBast && (
                          <button
                            type="button"
                            onClick={handleSavePatternToDatabase}
                            disabled={isSavingPattern}
                            className="mt-1.5 px-2 py-1 rounded bg-amber-950/80 hover:bg-amber-900/90 border border-amber-700/60 text-amber-300 text-[10px] font-semibold flex items-center gap-1 transition-all"
                            title="Simpan pola ini ke database akun Anda sebagai default"
                          >
                            <Save className="w-2.5 h-2.5" />
                            <span>Simpan Format ke Akun Database</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tanggal Pelaksanaan BAST */}
                    <div className="md:col-span-5">
                      <label className="text-[11px] text-slate-300 font-medium block mb-1">
                        Tanggal Pelaksanaan BAST
                      </label>
                      <input
                        type="date"
                        value={formData.tanggal}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]"
                      />
                    </div>

                    {/* Banner Hasil Penomoran Otomatis */}
                    <div className="md:col-span-12 bg-slate-900/90 border border-emerald-700/40 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Nomor BAST Otomatis:</span>
                        <span className="font-mono text-xs sm:text-sm font-bold text-emerald-300 tracking-wide">
                          {formData.nomorBast}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 font-semibold">
                          Bulan: {deconstructDocumentNumber(formData.nomorBast).romanMonth}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 font-semibold">
                          Tahun: {deconstructDocumentNumber(formData.nomorBast).year}
                        </span>
                        <span className="text-slate-500 hidden sm:inline">(Otomatis dari tanggal)</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-300 font-medium">
                        Nomor Register BAST - Edit Manual Bebas
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
                )}

                <div className="flex flex-col gap-1.5 mt-1">
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

                {/* Selector Rujukan SP untuk Sinkronisasi Otomatis 1 Realisasi Pembelian */}
                <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-teal-400" />
                      <span>Hubungkan dengan Surat Pesanan (SP)</span>
                    </label>
                    <span className="text-[10px] text-emerald-400 font-medium font-mono">
                      1 Pembelian Nyambung
                    </span>
                  </div>
                  <select
                    value={
                      pesananList.find((p) => p.nomorSp === formData.nomorSpk)?.id || ""
                    }
                    onChange={(e) => {
                      const selected = pesananList.find((p) => p.id === e.target.value);
                      if (selected) {
                        syncFromPesanan(selected);
                        swalSuccess(
                          "Data Tersinkronisasi!",
                          `Berita Acara telah dihubungkan dengan Surat Pesanan "${selected.nomorSp}". Rincian barang, rekanan, dan tanggal telah disinkronkan.`
                        );
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="">-- Pilih dari Surat Pesanan yang Ada ({pesananList.length}) --</option>
                    {pesananList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nomorSp} • {p.namaPaket} • {p.pihak2Toko} (Rp {p.totalHarga.toLocaleString("id-ID")})
                      </option>
                    ))}
                  </select>

                  {/* Connection Status Banner */}
                  {pesananList.some((p) => p.nomorSp === formData.nomorSpk) ? (
                    <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1.5 rounded-lg">
                      <span className="flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        Terhubung dengan SP: <strong>{formData.nomorSpk}</strong>
                      </span>
                      <Link
                        href={`/user/pesanan?no=${encodeURIComponent(formData.nomorSpk)}`}
                        className="text-emerald-400 hover:text-emerald-200 underline font-semibold flex items-center gap-0.5"
                      >
                        <span>Lihat SP</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">
                      Pilih Surat Pesanan di atas untuk mengisi nomor SP, tanggal, toko rekanan, dan rincian barang secara otomatis.
                    </p>
                  )}
                </div>

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
                    <span>{formData.id ? "Simpan Perubahan BAST" : "Simpan BAST"}</span>
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

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleExportBundlePdf}
                    disabled={isExportingBundle}
                    className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 border border-emerald-400/40 disabled:opacity-50 cursor-pointer"
                    title="Unduh Surat Pesanan (Hal. 1) dan Berita Acara (Hal. 2) dalam satu file PDF F4 siap jilid"
                  >
                    {isExportingBundle ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Layers className="w-4 h-4 text-emerald-200" />
                    )}
                    <span>Unduh Bundel (SP + BAST) PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={isExportingPdf}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/50 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                    title="Unduh langsung PDF F4 Portrait dengan Margin Jilid Kiri"
                  >
                    {isExportingPdf ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileDown className="w-4 h-4" />
                    )}
                    <span>Ekspor BAST (F4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Printer</span>
                  </button>
                </div>
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
            {/* Live Document Control Header Bar with View Switcher */}
            <div className="w-full max-w-[780px] bg-slate-900 border border-slate-800 rounded-xl px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-sm">
              {/* Tab Selector Dokumen: BAST / SP / Bundel */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewMode("bast")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    previewMode === "bast"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Berita Acara (BAST)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("sp")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    previewMode === "sp"
                      ? "bg-teal-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Surat Pesanan (SP)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("bundel")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    previewMode === "bundel"
                      ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Bundel 2 Halaman</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setZoomScale((prev) => Math.max(60, prev - 10))}
                  className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
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
                  className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                  title="Perbesar"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleExportBundlePdf}
                  disabled={isExportingBundle}
                  className="ml-1 sm:ml-2 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all border border-emerald-400/40 disabled:opacity-50 cursor-pointer"
                  title="Unduh Bundel 2 Halaman (SP + BAST)"
                >
                  {isExportingBundle ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Layers className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">Unduh Bundel (F4)</span>
                  <span className="sm:hidden">Bundel</span>
                </button>
              </div>
            </div>

            {/* Canvas Container with dynamic zoom and multi-mode view */}
            <div className="w-full overflow-x-auto pb-6 flex flex-col items-center">
              <div
                className="transition-transform origin-top shrink-0 flex flex-col items-center gap-6"
                style={{
                  transform: `scale(${zoomScale / 100})`,
                  transformOrigin: "top center",
                }}
              >
                {/* MODE 1: HANYA BAST */}
                {previewMode === "bast" && (
                  <>
                    <BastCanvas
                      data={formData}
                      profile={profile}
                      institutionName={userProfile?.institution || undefined}
                    />
                    {/* Companion off-screen element for PDF bundle capture */}
                    <div style={{ position: "absolute", left: "-9999px", top: 0 }} aria-hidden="true">
                      <PesananCanvas
                        data={companionPesananData}
                        profile={profile}
                      />
                    </div>
                  </>
                )}

                {/* MODE 2: HANYA SURAT PESANAN */}
                {previewMode === "sp" && (
                  <>
                    <div className="w-full max-w-[780px] text-center py-2 text-xs text-teal-300 font-semibold bg-slate-900 border border-teal-800/60 rounded-xl">
                      Surat Pesanan Terkait: <strong>{formData.nomorSpk}</strong> (Rujukan Berita Acara)
                    </div>
                    <PesananCanvas
                      data={companionPesananData}
                      profile={profile}
                    />
                    {/* Companion off-screen element for PDF bundle capture */}
                    <div style={{ position: "absolute", left: "-9999px", top: 0 }} aria-hidden="true">
                      <BastCanvas
                        data={formData}
                        profile={profile}
                        institutionName={userProfile?.institution || undefined}
                      />
                    </div>
                  </>
                )}

                {/* MODE 3: BUNDEL 2 HALAMAN (SP + BAST BERURUTAN) */}
                {previewMode === "bundel" && (
                  <>
                    <div className="w-full max-w-[780px] bg-slate-900 border border-teal-800/80 rounded-xl p-2.5 text-center flex items-center justify-between text-xs text-teal-300 font-semibold shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-teal-950 border border-teal-700 text-[10px] font-bold">
                          HALAMAN 1
                        </span>
                        <span>Surat Pesanan Pengadaan (SP)</span>
                      </div>
                      <span className="text-[11px] text-slate-400">Ukuran F4 Portrait • Margin Jilid 28mm</span>
                    </div>

                    <PesananCanvas
                      data={companionPesananData}
                      profile={profile}
                    />

                    {/* Pemisah Antar-Halaman */}
                    <div className="no-print w-full max-w-[780px] my-2 py-2 px-4 rounded-xl bg-slate-900 border border-dashed border-slate-700 text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-2 select-none">
                      <span>✂ BATAS HALAMAN 1 (SURAT PESANAN) &amp; HALAMAN 2 (BERITA ACARA)</span>
                    </div>

                    <div className="w-full max-w-[780px] bg-slate-900 border border-emerald-800/80 rounded-xl p-2.5 text-center flex items-center justify-between text-xs text-emerald-300 font-semibold shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-[10px] font-bold">
                          HALAMAN 2
                        </span>
                        <span>Berita Acara Serah Terima (BAST)</span>
                      </div>
                      <span className="text-[11px] text-slate-400">Ukuran F4 Portrait • Margin Jilid 28mm</span>
                    </div>

                    <BastCanvas
                      data={formData}
                      profile={profile}
                      institutionName={userProfile?.institution || undefined}
                    />
                  </>
                )}
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

        {/* ================= DAFTAR ARSIP BERITA ACARA (TABEL REKAP & MANAJEMEN) ================= */}
        <div className="w-full mt-10 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0">
                <FileCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Daftar Arsip Berita Acara Serah Terima (BAST)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 text-xs font-mono font-semibold">
                    {bastList.length} Dokumen
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kelola, edit berkas BAST, cetak dokumen fisik A4, atau hapus arsip berita acara.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCreateNew}
              className="px-3.5 py-2 rounded-xl bg-[#006c4e] hover:bg-[#004532] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat BAST Baru</span>
            </button>
          </div>

          {bastList.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center text-slate-500">
              <FileCheck className="w-12 h-12 text-slate-600 mb-3 stroke-[1.5]" />
              <p className="text-sm font-semibold text-slate-300">Belum Ada Arsip Berita Acara</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                Silakan isi formulir di atas dan klik &quot;Simpan BAST&quot; untuk mengarsipkan dokumen serah terima resmi.
              </p>
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/60">
                    <th className="py-3 px-4">No. BAST & Hari/Tanggal</th>
                    <th className="py-3 px-4">Nama Kegiatan / Pengadaan</th>
                    <th className="py-3 px-4">Pihak Kedua (Toko)</th>
                    <th className="py-3 px-4 text-center">Status Uji Fisik</th>
                    <th className="py-3 px-4 text-center">Tautan Kwitansi</th>
                    <th className="py-3 px-4 text-center">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {bastList.map((b) => {
                    const isEditing = formData.id === b.id;
                    const linkedRc = initialReceipts.find((r) => r.id === b.receiptId);

                    return (
                      <tr
                        key={b.id}
                        className={`transition-colors hover:bg-slate-800/40 ${
                          isEditing ? "bg-amber-950/20 border-l-4 border-amber-500" : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-white flex items-center gap-1.5">
                            <span>{b.nomorBast}</span>
                            {isEditing && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/30 text-amber-300 rounded border border-amber-500/50">
                                Aktif di Form
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{b.hariTanggal || (b.tanggal ? toDateInputValue(b.tanggal) : "-")}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-200 font-medium line-clamp-1">
                            {b.namaKegiatan}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Nomor SPK: {b.nomorSpk}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-200 font-medium block">
                            {b.pihak2Toko}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Penerima: {b.pihak2Nama}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-300 text-[11px] font-medium">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>{b.statusUji || "Lulus Uji"}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {linkedRc ? (
                            <span
                              title={`Terkait Kwitansi: ${linkedRc.nomorBukti}`}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 rounded-md text-[11px] font-medium"
                            >
                              <ReceiptIcon className="w-3 h-3" />
                              <span>{linkedRc.nomorBukti}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 bg-slate-800 text-slate-400 rounded-md text-[11px]">
                              Mandiri
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEditBast(b)}
                              className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/60 text-blue-300 hover:text-blue-100 text-xs font-medium transition-colors flex items-center gap-1"
                              title="Edit BAST Ini"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                loadBastIntoForm(b);
                                setTimeout(() => handleExportPdf(), 250);
                              }}
                              className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 hover:text-white text-xs transition-colors flex items-center gap-1"
                              title="Ekspor PDF F4 BAST Ini"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                loadBastIntoForm(b);
                                setTimeout(() => handlePrint(), 200);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs transition-colors flex items-center gap-1"
                              title="Cetak BAST Ini"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">Cetak</span>
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleDeleteBastById(b.id, b.nomorBast)}
                              className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 hover:text-red-100 text-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                              title="Hapus BAST Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">Hapus</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Pengaturan Kop Surat, Logo Cloudinary, dan Nomor Lembaga */}
      <KopSuratModal
        isOpen={isKopModalOpen}
        onClose={() => setIsKopModalOpen(false)}
        initialProfile={profile}
        onProfileUpdated={(updated) => {
          setProfile(updated);
          if (updated.formatNomorBast) {
            setFormatPatternBast(updated.formatNomorBast);
            if (typeof window !== "undefined") {
              localStorage.setItem("bast_format_pattern", updated.formatNomorBast);
            }
            if (!isManualNomorBast) {
              const nextNomor = buildFormattedDocumentNumber(nomorUrutBast, updated.formatNomorBast, formData.tanggal);
              setFormData((prev) => ({
                ...prev,
                nomorBast: nextNomor,
                pihak1Nama: updated.namaKetua || prev.pihak1Nama,
                pihak1Jabatan: updated.jabatanKetua || prev.pihak1Jabatan,
              }));
              return;
            }
          }
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
