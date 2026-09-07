"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FileText,
  FileCheck,
  Calendar,
  Shield,
  Tag,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  PlusCircle,
  Save,
  Printer,
  FileDown,
  Sparkles,
  Scissors,
  Check,
  Building2,
  Info,
  Loader2,
  Database,
  Calculator,
  Percent,
  TrendingDown,
  Coins,
  Receipt as ReceiptIcon,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Trash2,
  RotateCw,
  Settings,
  Store,
  BookmarkPlus,
} from "lucide-react";
import { KopSuratModal } from "@/components/kop-surat/kop-surat-modal";
import { MasterTokoModal } from "@/components/vendor/master-toko-modal";
import { angkaKeTerbilang, formatRupiahNumber, parseRupiahToNumber } from "@/lib/utils/terbilang";
import { calculateTaxBreakdown } from "@/lib/utils/tax";
import { getRomanMonth, syncNomorDokumenBulanTahun } from "@/lib/utils/pesanan-date";
import {
  saveReceiptAction,
  getNextNomorBuktiAction,
  getReceiptByNomorBuktiAction,
  deleteReceiptAction,
} from "@/app/actions/receipt.action";
import { getRabStatusAction } from "@/app/actions/rab.action";
import { getVendorsAction, quickSaveVendorAction } from "@/app/actions/vendor.action";
import { swalLoading, swalSuccess, swalError, swalConfirmDelete, swalSuccessWithAction } from "@/lib/swal";
import { exportKwitansiToPdf } from "@/lib/kwitansi-pdf";
import { KwitansiCanvas } from "./kwitansi-canvas";
import type {
  Receipt,
  ReceiptFormData,
  ReceiptTemplateMode,
  RabSummary,
  RabStatusItem,
  InstitutionProfile,
  Vendor,
} from "@/types";

function toDateInputValue(val?: string | Date | null): string {
  if (!val) return new Date().toISOString().split("T")[0];
  if (val instanceof Date) return val.toISOString().split("T")[0];
  if (typeof val === "string") {
    if (val.includes("T")) return val.split("T")[0];
    return val;
  }
  return new Date().toISOString().split("T")[0];
}

export interface KwitansiFormProps {
  initialInstitution?: string;
  initialUserName?: string;
  initialLeaderName?: string;
  initialProfile?: InstitutionProfile | null;
  savedReceipts?: Receipt[];
  initialRabSummary?: RabSummary;
  initialNextNomorBukti?: string;
}

export function KwitansiForm({
  initialInstitution,
  initialUserName,
  initialLeaderName,
  initialProfile,
  savedReceipts = [],
  initialRabSummary,
  initialNextNomorBukti,
}: KwitansiFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showCutGuides, setShowCutGuides] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [receiptsList, setReceiptsList] = useState<Receipt[]>(savedReceipts);

  const isPrefillFromRab = Boolean(
    searchParams.get("uraian") ||
    searchParams.get("nominal") ||
    searchParams.get("kategori") ||
    searchParams.get("mode") === "new"
  );

  const [selectedReceiptNo, setSelectedReceiptNo] = useState<string>(() => {
    if (isPrefillFromRab) return "NEW";
    return savedReceipts.length > 0 ? savedReceipts[0].nomorBukti : "NEW";
  });

  // RAB Summary State for Live Budget Tracking
  const [rabSummary, setRabSummary] = useState<RabSummary | undefined>(initialRabSummary);
  const [allowDeficitOverride, setAllowDeficitOverride] = useState(false);
  const [showTaxCalculator, setShowTaxCalculator] = useState(true);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");

  const [profile, setProfile] = useState<InstitutionProfile | null>(initialProfile || null);
  const [isKopModalOpen, setIsKopModalOpen] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

  // Load vendors list on mount
  useEffect(() => {
    startTransition(async () => {
      const res = await getVendorsAction();
      if (res.success && res.data) {
        setVendors(res.data);
      }
    });
  }, []);

  const handleSelectVendor = (v: Vendor) => {
    setFormData((prev) => ({
      ...prev,
      penerima: v.namaToko,
    }));
  };

  const handleQuickSaveCurrentToko = async () => {
    if (!formData.penerima?.trim()) {
      swalError("Nama Penerima Kosong", "Isi nama toko/penerima terlebih dahulu sebelum menyimpan ke master data.");
      return;
    }

    swalLoading("Menyimpan Toko...", "Menyimpan rekanan ke daftar langganan...");
    const res = await quickSaveVendorAction({
      namaToko: formData.penerima,
      kategori: "Penyedia Pengadaan",
    });

    if (res.success && res.data) {
      const saved = res.data;
      setVendors((prev) => {
        const exists = prev.some((x) => x.id === saved.id);
        if (exists) return prev.map((x) => (x.id === saved.id ? saved : x));
        return [saved, ...prev];
      });
      swalSuccess("Tersimpan!", `Toko "${saved.namaToko}" berhasil disimpan ke Master Data Toko.`);
    } else {
      swalError("Gagal", res.message || "Gagal menyimpan toko.");
    }
  };

  const defaultChairman = profile?.namaKetua || initialLeaderName || "HENI FUJIATI";
  const defaultTreasurer = profile?.namaBendahara || initialUserName || "NUR ALIMAH";
  const defaultInstitution = profile?.subNama
    ? `${profile.namaLembaga} ${profile.subNama}`
    : initialInstitution || "PR Fatayat NU Dawuhan Selatan";

  // Form State initialized from database if available
  const [formData, setFormData] = useState<ReceiptFormData>(() => {
    if (isPrefillFromRab) {
      const uraianParam = searchParams.get("uraian") || "";
      const nominalParam = searchParams.get("nominal");
      const kategoriParam = searchParams.get("kategori") || "5.2.1";
      const num = nominalParam ? parseFloat(nominalParam) : 0;
      const validNum = isNaN(num) ? 0 : num;
      const formatted = formatRupiahNumber(validNum);
      const terbilangText = angkaKeTerbilang(validNum);
      const autoMaterai = validNum >= 5000000;

      const taxCalc = calculateTaxBreakdown({
        nominal: validNum,
        isPpn: false,
        isPpnIncluded: true,
        ppnRate: 0.11,
        isPph21: false,
        pph21Rate: 0.05,
        isPph22: false,
        pph22Rate: 0.015,
        isPph23: false,
        pph23Rate: 0.02,
      });

      return {
        id: undefined,
        nomorBukti: initialNextNomorBukti || "01/A/PR.FNU/IX/2026",
        tanggal: toDateInputValue(),
        pemberi: defaultInstitution,
        nominal: formatted,
        nominalValue: validNum,
        terbilang: terbilangText,
        uraian: uraianParam,
        ketua: defaultChairman,
        bendahara: defaultTreasurer,
        penerima: "",
        denganMaterai: autoMaterai,
        template: "bank",
        kategoriRab: kategoriParam,
        isPpn: false,
        isPpnIncluded: true,
        ppnRate: 0.11,
        ppnNominal: taxCalc.ppnNominal,
        isPph21: false,
        pph21Rate: 0.05,
        pph21Nominal: taxCalc.pph21Nominal,
        isPph22: false,
        pph22Rate: 0.015,
        pph22Nominal: taxCalc.pph22Nominal,
        isPph23: false,
        pph23Rate: 0.02,
        pph23Nominal: taxCalc.pph23Nominal,
        dpp: taxCalc.dpp,
        totalPajak: taxCalc.totalPajak,
        nominalBersih: taxCalc.nominalBersih,
        keteranganPajak: taxCalc.keteranganPajak,
        namaLembaga: initialProfile?.namaLembaga,
        subNama: initialProfile?.subNama,
        jabatanKetua: initialProfile?.jabatanKetua,
      };
    }

    if (savedReceipts && savedReceipts.length > 0) {
      const first = savedReceipts[0];
      const initialNominal = first.nominal;
      const isPpn = Boolean(first.isPpn);
      const isPpnIncluded = true; // default include
      const ppnRate = first.ppnRate || 0.11;
      const isPph21 = Boolean(first.isPph21);
      const pph21Rate = first.pph21Rate || 0.05;
      const isPph22 = Boolean(first.isPph22);
      const pph22Rate = first.pph22Rate || 0.015;
      const isPph23 = Boolean(first.isPph23);
      const pph23Rate = first.pph23Rate || 0.02;

      const taxCalc = calculateTaxBreakdown({
        nominal: initialNominal,
        isPpn,
        isPpnIncluded,
        ppnRate,
        isPph21,
        pph21Rate,
        isPph22,
        pph22Rate,
        isPph23,
        pph23Rate,
      });

      return {
        id: first.id,
        nomorBukti: first.nomorBukti,
        tanggal: toDateInputValue(first.tanggal),
        pemberi: first.pemberi,
        nominal: formatRupiahNumber(first.nominal),
        nominalValue: first.nominal,
        terbilang: first.terbilang,
        uraian: first.uraian,
        ketua: first.ketua,
        bendahara: first.bendahara,
        penerima: first.penerima,
        denganMaterai: first.denganMaterai,
        template: (first.template as ReceiptTemplateMode) || "bank",
        kategoriRab: first.kategoriRab || "5.2.1",
        isPpn,
        isPpnIncluded,
        ppnRate,
        ppnNominal: first.ppnNominal || taxCalc.ppnNominal,
        isPph21,
        pph21Rate,
        pph21Nominal: first.pph21Nominal || taxCalc.pph21Nominal,
        isPph22,
        pph22Rate,
        pph22Nominal: first.pph22Nominal || taxCalc.pph22Nominal,
        isPph23,
        pph23Rate,
        pph23Nominal: first.pph23Nominal || taxCalc.pph23Nominal,
        dpp: first.dpp || taxCalc.dpp,
        totalPajak: first.totalPajak || taxCalc.totalPajak,
        nominalBersih: first.nominalBersih || taxCalc.nominalBersih,
        keteranganPajak: first.keteranganPajak || taxCalc.keteranganPajak,
        namaLembaga: initialProfile?.namaLembaga,
        subNama: initialProfile?.subNama,
        jabatanKetua: initialProfile?.jabatanKetua,
      };
    }

    return {
      id: undefined,
      nomorBukti: initialNextNomorBukti || "01/A/PR.FNU/IX/2026",
      tanggal: toDateInputValue(),
      pemberi: defaultInstitution,
      nominal: "0",
      nominalValue: 0,
      terbilang: "Nol Rupiah",
      uraian: "",
      ketua: defaultChairman,
      bendahara: defaultTreasurer,
      penerima: "",
      denganMaterai: false,
      template: "bank",
      kategoriRab: "5.2.1",
      isPpn: false,
      isPpnIncluded: true,
      ppnRate: 0.11,
      ppnNominal: 0,
      isPph21: false,
      pph21Rate: 0.05,
      pph21Nominal: 0,
      isPph22: false,
      pph22Rate: 0.015,
      pph22Nominal: 0,
      isPph23: false,
      pph23Rate: 0.02,
      pph23Nominal: 0,
      dpp: 0,
      totalPajak: 0,
      nominalBersih: 0,
      keteranganPajak: "",
      namaLembaga: initialProfile?.namaLembaga,
      subNama: initialProfile?.subNama,
      jabatanKetua: initialProfile?.jabatanKetua,
    };
  });

  // Re-fetch RAB summary on mount if not provided
  useEffect(() => {
    if (!rabSummary) {
      getRabStatusAction().then((res) => {
        if (res.success && res.data) {
          setRabSummary(res.data);
        }
      });
    }
  }, [rabSummary]);

  // Recalculate taxes helper
  const updateFormWithTax = (prev: ReceiptFormData, overrides: Partial<ReceiptFormData>): ReceiptFormData => {
    const updated = { ...prev, ...overrides };
    const taxCalc = calculateTaxBreakdown({
      nominal: updated.nominalValue,
      isPpn: updated.isPpn,
      isPpnIncluded: updated.isPpnIncluded,
      ppnRate: updated.ppnRate,
      isPph21: updated.isPph21,
      pph21Rate: updated.pph21Rate,
      isPph22: updated.isPph22,
      pph22Rate: updated.pph22Rate,
      isPph23: updated.isPph23,
      pph23Rate: updated.pph23Rate,
    });

    return {
      ...updated,
      dpp: taxCalc.dpp,
      ppnNominal: taxCalc.ppnNominal,
      pph21Nominal: taxCalc.pph21Nominal,
      pph22Nominal: taxCalc.pph22Nominal,
      pph23Nominal: taxCalc.pph23Nominal,
      totalPajak: taxCalc.totalPajak,
      nominalBersih: taxCalc.nominalBersih,
      keteranganPajak: taxCalc.keteranganPajak,
    };
  };

  // Helper to populate form with existing database receipt
  const loadReceiptIntoForm = (r: Receipt) => {
    const taxCalc = calculateTaxBreakdown({
      nominal: r.nominal,
      isPpn: Boolean(r.isPpn),
      isPpnIncluded: true,
      ppnRate: r.ppnRate || 0.11,
      isPph21: Boolean(r.isPph21),
      pph21Rate: r.pph21Rate || 0.05,
      isPph22: Boolean(r.isPph22),
      pph22Rate: r.pph22Rate || 0.015,
      isPph23: Boolean(r.isPph23),
      pph23Rate: r.pph23Rate || 0.02,
    });

    setFormData({
      id: r.id,
      nomorBukti: r.nomorBukti,
      tanggal: toDateInputValue(r.tanggal),
      pemberi: r.pemberi,
      nominal: formatRupiahNumber(r.nominal),
      nominalValue: r.nominal,
      terbilang: r.terbilang,
      uraian: r.uraian,
      ketua: r.ketua,
      bendahara: r.bendahara,
      penerima: r.penerima,
      denganMaterai: r.denganMaterai,
      template: (r.template as ReceiptTemplateMode) || "bank",
      kategoriRab: r.kategoriRab || "5.2.1",
      isPpn: Boolean(r.isPpn),
      isPpnIncluded: true,
      ppnRate: r.ppnRate || 0.11,
      ppnNominal: r.ppnNominal || taxCalc.ppnNominal,
      isPph21: Boolean(r.isPph21),
      pph21Rate: r.pph21Rate || 0.05,
      pph21Nominal: r.pph21Nominal || taxCalc.pph21Nominal,
      isPph22: Boolean(r.isPph22),
      pph22Rate: r.pph22Rate || 0.015,
      pph22Nominal: r.pph22Nominal || taxCalc.pph22Nominal,
      isPph23: Boolean(r.isPph23),
      pph23Rate: r.pph23Rate || 0.02,
      pph23Nominal: r.pph23Nominal || taxCalc.pph23Nominal,
      dpp: r.dpp || taxCalc.dpp,
      totalPajak: r.totalPajak || taxCalc.totalPajak,
      nominalBersih: r.nominalBersih || taxCalc.nominalBersih,
      keteranganPajak: r.keteranganPajak || taxCalc.keteranganPajak,
    });
    setSelectedReceiptNo(r.nomorBukti);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
    setAllowDeficitOverride(false);
  };

  // Real-time detection if current nomorBukti is already taken by another receipt
  const isDuplicateNoBukti = useMemo(() => {
    if (!formData.nomorBukti) return false;
    const clean = formData.nomorBukti.trim().toLowerCase();
    return receiptsList.some((r) => {
      // If editing existing receipt, ignore itself
      if (formData.id && r.id === formData.id) return false;
      if (selectedReceiptNo !== "NEW" && r.nomorBukti.trim().toLowerCase() === selectedReceiptNo.trim().toLowerCase()) return false;
      return r.nomorBukti.trim().toLowerCase() === clean;
    });
  }, [formData.nomorBukti, formData.id, selectedReceiptNo, receiptsList]);

  // Handler to generate and set the next guaranteed unique nomor bukti
  const handleGenerateNewNomorBukti = () => {
    startTransition(async () => {
      const res = await getNextNomorBuktiAction(formData.tanggal);
      if (res.success && res.data) {
        const nextNo = res.data;
        setFormData((prev) => ({ ...prev, nomorBukti: nextNo }));
      }
    });
  };

  // Handle transaction date change with auto-sync of roman month and year for new receipts
  const handleDateChange = (newDateStr: string) => {
    let updatedNomor = formData.nomorBukti;
    if (selectedReceiptNo === "NEW" && updatedNomor) {
      updatedNomor = syncNomorDokumenBulanTahun(updatedNomor, newDateStr);
    }
    setFormData((prev) => ({
      ...prev,
      tanggal: newDateStr,
      nomorBukti: updatedNomor,
    }));
  };

  // Check URL query param ?no=... (e.g. clicked from BKU table or "Realisasikan" from RAB Table)
  useEffect(() => {
    const noParam = searchParams.get("no");
    if (noParam) {
      const match = receiptsList.find((r) => r.nomorBukti === noParam);
      if (match) {
        loadReceiptIntoForm(match);
      } else {
        getReceiptByNomorBuktiAction(noParam).then((res) => {
          if (res.success && res.data) {
            loadReceiptIntoForm(res.data);
            setReceiptsList((prev) => [res.data!, ...prev.filter((p) => p.nomorBukti !== noParam)]);
          }
        });
      }
      return;
    }

    // Check prefill from RAB item realization
    const uraianParam = searchParams.get("uraian");
    const nominalParam = searchParams.get("nominal");
    const kategoriParam = searchParams.get("kategori");
    const modeParam = searchParams.get("mode");

    if (uraianParam || nominalParam || kategoriParam || modeParam === "new") {
      const num = nominalParam ? parseFloat(nominalParam) : 0;
      const validNum = isNaN(num) ? 0 : num;
      const formatted = formatRupiahNumber(validNum);
      const terbilangText = angkaKeTerbilang(validNum);
      const autoMaterai = validNum >= 5000000;

      // Pastikan mode terpilih adalah Mode Buat Kwitansi Baru (+)
      setSelectedReceiptNo("NEW");

      const activeDate = toDateInputValue();
      getNextNomorBuktiAction(activeDate).then((res) => {
        const nextNo = res.success && res.data ? res.data : initialNextNomorBukti || "01/A/PR.FNU/IX/2026";
        setFormData((prev) =>
          updateFormWithTax(
            {
              ...prev,
              id: undefined, // Penting: kosongkan ID agar tidak menimpa kwitansi tersimpan
              nomorBukti: nextNo,
              tanggal: activeDate,
              penerima: prev.id ? "" : prev.penerima,
              pemberi: defaultInstitution,
              ketua: defaultChairman,
              bendahara: defaultTreasurer,
              template: "bank",
            },
            {
              uraian: uraianParam || prev.uraian,
              nominal: formatted,
              nominalValue: validNum,
              terbilang: terbilangText,
              denganMaterai: autoMaterai,
              kategoriRab: kategoriParam || prev.kategoriRab,
            }
          )
        );
      });
    }
  }, [searchParams, receiptsList]);

  // Handle Nominal Input with Auto-Terbilang, Auto-Materai detection, and Tax Re-calculation
  const handleNominalChange = (rawValue: string) => {
    const numeric = parseRupiahToNumber(rawValue);
    const formatted = formatRupiahNumber(numeric);
    const terbilangText = angkaKeTerbilang(numeric);
    const autoMaterai = numeric >= 5000000 ? true : formData.denganMaterai;

    setFormData((prev) =>
      updateFormWithTax(prev, {
        nominal: formatted,
        nominalValue: numeric,
        terbilang: terbilangText,
        denganMaterai: autoMaterai,
      })
    );
  };

  // Quick fill preset templates
  const quickFillPreset = (
    uraian: string,
    nominalNum: number,
    kategori: string,
    taxPreset?: Partial<ReceiptFormData>
  ) => {
    const formatted = formatRupiahNumber(nominalNum);
    const terbilangText = angkaKeTerbilang(nominalNum);
    const autoMaterai = nominalNum >= 5000000;

    setFormData((prev) =>
      updateFormWithTax(prev, {
        uraian,
        nominal: formatted,
        nominalValue: nominalNum,
        terbilang: terbilangText,
        denganMaterai: autoMaterai,
        kategoriRab: kategori,
        ...(taxPreset || {}),
      })
    );
  };

  // Handle Delete current loaded receipt
  const handleDeleteCurrentReceipt = async () => {
    if (selectedReceiptNo === "NEW") return;
    const currentReceipt = receiptsList.find((r) => r.nomorBukti === selectedReceiptNo);
    if (!currentReceipt) return;

    const isConfirmed = await swalConfirmDelete({
      title: "Hapus Kwitansi Belanja?",
      text: `Apakah Anda yakin ingin menghapus kwitansi "${selectedReceiptNo}" senilai Rp ${formatRupiahNumber(currentReceipt.nominal)}? Pengeluaran pada Buku Kas Umum (BKU) dan serapan RAB juga akan disesuaikan kembali.`,
      confirmText: "Ya, Hapus Kwitansi!",
      cancelText: "Batal",
    });

    if (!isConfirmed) return;

    swalLoading("Menghapus Kwitansi...", "Menyesuaikan kembali saldo kas BKU dan alokasi RAB...");
    startTransition(async () => {
      const res = await deleteReceiptAction(currentReceipt.id);
      if (res.success) {
        setReceiptsList((prev) => prev.filter((r) => r.id !== currentReceipt.id));
        handleResetForm();
        const rabRes = await getRabStatusAction();
        if (rabRes.success && rabRes.data) {
          setRabSummary(rabRes.data);
        }
        swalSuccess("Kwitansi Dihapus!", res.message);
      } else {
        swalError("Gagal Menghapus Kwitansi", res.message);
      }
    });
  };

  // Quick select / change receipt template mode
  const handleTemplateSelect = (template: ReceiptTemplateMode) => {
    setFormData((prev) => ({ ...prev, template }));
  };

  // Reset / Kwitansi Baru
  const handleResetForm = (targetDateStr?: unknown) => {
    startTransition(async () => {
      const activeDate = typeof targetDateStr === "string" ? targetDateStr : toDateInputValue();
      const res = await getNextNomorBuktiAction(activeDate);
      const nextNo = res.data || initialNextNomorBukti || "01/A/PR.FNU/IX/2026";
      setFormData({
        id: undefined,
        nomorBukti: nextNo,
        tanggal: activeDate,
        pemberi: defaultInstitution,
        nominal: "0",
        nominalValue: 0,
        terbilang: "Nol Rupiah",
        uraian: "",
        ketua: defaultChairman,
        bendahara: defaultTreasurer,
        penerima: "",
        denganMaterai: false,
        template: "bank",
        kategoriRab: "5.2.1",
        isPpn: false,
        isPpnIncluded: true,
        ppnRate: 0.11,
        ppnNominal: 0,
        isPph21: false,
        pph21Rate: 0.05,
        pph21Nominal: 0,
        isPph22: false,
        pph22Rate: 0.015,
        pph22Nominal: 0,
        isPph23: false,
        pph23Rate: 0.02,
        pph23Nominal: 0,
        dpp: 0,
        totalPajak: 0,
        nominalBersih: 0,
        keteranganPajak: "",
      });
      setSelectedReceiptNo("NEW");
      setSaveSuccessMsg(null);
      setSaveErrorMsg(null);
      setAllowDeficitOverride(false);
    });
  };

  // Handler ekspor langsung ke dokumen PDF Kertas F4 Landscape (330mm x 215mm)
  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    try {
      setIsExportingPdf(true);
      await exportKwitansiToPdf({
        elementId: "kwitansiCanvas",
        nomorBukti: formData.nomorBukti,
        penerima: formData.penerima,
        showCutGuides: showCutGuides,
        formData: formData,
        profile: profile,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handler cetak ke printer fisik dengan penguncian orientasi F4 Landscape khusus Kwitansi
  const handlePrint = () => {
    const prevTitle = document.title;
    let cleanNoBukti = (formData.nomorBukti || "BKU")
      .trim()
      .replace(/[/\\?%*:|"<>]/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_");
    if (cleanNoBukti.toLowerCase().endsWith(".pdf")) {
      cleanNoBukti = cleanNoBukti.slice(0, -4);
    }
    document.title = `Kwitansi_${cleanNoBukti}_F4`;

    // Pastikan orientasi cetak browser terkunci khusus Kwitansi pada F4 Landscape (330mm x 215mm)
    const printStyle = document.createElement("style");
    printStyle.id = "kwitansi-landscape-print-rule";
    printStyle.innerHTML = `
      @media print {
        @page {
          size: 330mm 215mm landscape !important;
          margin: 0mm !important;
        }
      }
    `;
    document.head.appendChild(printStyle);

    window.print();

    setTimeout(() => {
      document.title = prevTitle;
      const el = document.getElementById("kwitansi-landscape-print-rule");
      if (el) el.remove();
    }, 2000);
  };

  // Real-time RAB Ceiling & Deficit Calculations
  const currentRabStatus = useMemo(() => {
    if (!rabSummary || !rabSummary.items || !formData.kategoriRab) return null;

    const rawKategori = formData.kategoriRab.trim();
    if (!rawKategori) return null;
    const cleanKategori = rawKategori.toLowerCase();

    // 1. Exact match on kode or nama or "kode - nama"
    let foundItem = rabSummary.items.find((item) => {
      const ik = item.kode.trim().toLowerCase();
      const iname = item.nama.trim().toLowerCase();
      return (
        cleanKategori === ik ||
        cleanKategori === iname ||
        cleanKategori === `${ik} - ${iname}`
      );
    });

    // 2. Exact match on first token before delimiter (e.g. "II" matching "II - SOUND AKTIF")
    if (!foundItem) {
      const firstToken = rawKategori.split(/[\s\-.:]+/)[0]?.toLowerCase();
      if (firstToken) {
        foundItem = rabSummary.items.find((item) => {
          const ik = item.kode.trim().toLowerCase();
          const itemToken = ik.split(/[\s\-.:]+/)[0];
          return ik === firstToken || itemToken === firstToken;
        });
      }
    }

    // 3. Safe delimited prefix match (only with delimiters: space, dash, dot, colon)
    if (!foundItem) {
      foundItem = rabSummary.items.find((item) => {
        const ik = item.kode.trim().toLowerCase();
        return (
          cleanKategori.startsWith(ik + " ") ||
          cleanKategori.startsWith(ik + "-") ||
          cleanKategori.startsWith(ik + " -") ||
          cleanKategori.startsWith(ik + ".") ||
          cleanKategori.startsWith(ik + ":") ||
          ik.startsWith(cleanKategori + " ") ||
          ik.startsWith(cleanKategori + "-") ||
          ik.startsWith(cleanKategori + " -")
        );
      });
    }

    // 4. Fallback if user selected by item name contains
    if (!foundItem) {
      foundItem = rabSummary.items.find((item) => {
        const iname = item.nama.trim().toLowerCase();
        return cleanKategori.includes(iname) || iname.includes(cleanKategori);
      });
    }

    if (!foundItem) return null;

    // Calculate existing realisasi excluding the currently selected receipt (if updating)
    const currentNominalInDb = receiptsList.find(
      (r) => r.nomorBukti === formData.nomorBukti
    )?.nominal || 0;

    const baseRealisasi = Math.max(0, foundItem.realisasi - currentNominalInDb);
    const sisaPaguSebelum = Math.max(0, foundItem.anggaran - baseRealisasi);
    const proyeksiRealisasi = baseRealisasi + formData.nominalValue;
    const proyeksiSisaPagu = foundItem.anggaran - proyeksiRealisasi;
    const isDeficit = proyeksiSisaPagu < 0;
    const defisitNominal = isDeficit ? Math.abs(proyeksiSisaPagu) : 0;
    const persentaseSerapan =
      foundItem.anggaran > 0 ? Math.round((proyeksiRealisasi / foundItem.anggaran) * 1000) / 10 : 0;

    return {
      ...foundItem,
      sisaPaguSebelum,
      proyeksiRealisasi,
      proyeksiSisaPagu,
      isDeficit,
      defisitNominal,
      persentaseSerapan,
    };
  }, [rabSummary, formData.kategoriRab, formData.nominalValue, formData.nomorBukti, receiptsList]);

  // Save to Database (BKU)
  const handleSaveToBKU = () => {
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    const effectiveNominal =
      formData.nominalValue > 0
        ? formData.nominalValue
        : parseRupiahToNumber(formData.nominal);

    if (effectiveNominal < 1000) {
      const msg = "Nominal kwitansi minimal Rp 1.000. Silakan isi jumlah uang belanja.";
      setSaveErrorMsg(msg);
      swalError("Nominal Belum Diisi", msg);
      return;
    }

    // Deficit Guardrail: Block if over-budget without explicit override
    if (currentRabStatus?.isDeficit && !allowDeficitOverride) {
      const msg = `Defisit Anggaran Terdeteksi: Nominal transaksi melebihi sisa pagu rekening ${currentRabStatus.kode} sebesar Rp ${currentRabStatus.sisaPaguSebelum.toLocaleString("id-ID")}. Silakan sesuaikan nominal atau centang 'Otorisasi Khusus Defisit' jika mendesak.`;
      setSaveErrorMsg(msg);
      swalError("Peringatan Defisit Anggaran", msg);
      return;
    }

    swalLoading("Menyimpan Kwitansi...", "Mencatat bukti transaksi belanja ke Buku Kas Umum...");
    startTransition(async () => {
      const response = await saveReceiptAction({
        id: selectedReceiptNo === "NEW" ? undefined : formData.id,
        nomorBukti: formData.nomorBukti.trim(),
        tanggal: formData.tanggal,
        pemberi: formData.pemberi,
        nominal: effectiveNominal,
        terbilang: formData.terbilang || angkaKeTerbilang(effectiveNominal),
        uraian: formData.uraian,
        ketua: formData.ketua,
        bendahara: formData.bendahara,
        penerima: formData.penerima,
        denganMaterai: formData.denganMaterai,
        template: formData.template,
        kategoriRab: formData.kategoriRab,
        isPpn: formData.isPpn,
        ppnRate: formData.ppnRate,
        ppnNominal: formData.ppnNominal,
        isPph21: formData.isPph21,
        pph21Rate: formData.pph21Rate,
        pph21Nominal: formData.pph21Nominal,
        isPph22: formData.isPph22,
        pph22Rate: formData.pph22Rate,
        pph22Nominal: formData.pph22Nominal,
        isPph23: formData.isPph23,
        pph23Rate: formData.pph23Rate,
        pph23Nominal: formData.pph23Nominal,
        dpp: formData.dpp || effectiveNominal,
        totalPajak: formData.totalPajak,
        nominalBersih: formData.nominalBersih || effectiveNominal,
        keteranganPajak: formData.keteranganPajak,
      });

      if (!response.success) {
        setSaveErrorMsg(response.message);
        swalError("Gagal Menyimpan Kwitansi", response.message);
        return;
      }

      // Update receipts list and form state with newly confirmed data
      if (response.data) {
        const saved = response.data;
        setFormData((prev) => ({
          ...prev,
          id: saved.id,
          nomorBukti: saved.nomorBukti,
        }));
        setReceiptsList((prev) => {
          const idx = prev.findIndex((x) => x.id === saved.id || x.nomorBukti === saved.nomorBukti);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = saved;
            return updated;
          }
          return [saved, ...prev];
        });
        setSelectedReceiptNo(saved.nomorBukti);
      }

      // Refresh RAB Status in background
      getRabStatusAction().then((rabRes) => {
        if (rabRes.success && rabRes.data) {
          setRabSummary(rabRes.data);
        }
      });

      setSaveSuccessMsg(response.message);

      const goToBku = await swalSuccessWithAction({
        title: "Kwitansi Berhasil Disimpan!",
        text: `${response.message} Transaksi ${formData.nomorBukti} senilai Rp ${effectiveNominal.toLocaleString("id-ID")} telah otomatis tercatat di Buku Kas Umum (BKU).`,
        confirmText: "Lihat di Buku Kas Umum (BKU) →",
        cancelText: "Tetap di Generator",
      });

      if (goToBku) {
        router.push("/user/bku");
        router.refresh();
      }

      setTimeout(() => setSaveSuccessMsg(null), 5000);
    });
  };

  return (
    <div className="w-full">
      {/* ================= TOP COMMAND BAR ================= */}
      <div
        id="topCommandBar"
        className="w-full bg-slate-900/90 border-b border-slate-800 px-4 sm:px-8 py-4 mb-6 shadow-md backdrop-blur-md"
      >
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand-primary/30 border border-brand-primary/50 text-emerald-400 flex items-center justify-center shadow-glow">
              <FileText className="w-6 h-6 text-[#047857]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Modul Generator Kwitansi & Kontrol Pagu RAB
                </h2>
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-semibold">
                  OTENTIK BKU-2026
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Penyusunan Bukti Pengeluaran Riil, Proteksi Defisit Anggaran, dan Kalkulator Pajak Otomatis (PPh & PPN)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Link
              href="/user/pesanan"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5 shadow-sm"
              title="Buat Surat Pesanan (SP) Pengadaan Barang"
            >
              <ShoppingBag className="w-4 h-4 text-teal-400" />
              <span className="hidden sm:inline">Surat Pesanan</span>
            </Link>
            <Link
              href="/user/bast"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5 shadow-sm"
              title="Buat Berita Acara Serah Terima (BAST)"
            >
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">BAST Barang</span>
            </Link>
            <div className="hidden lg:flex items-center bg-slate-950 px-3 py-1.5 rounded-lg gap-2 border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-400">
                Kontrol Pagu: <strong className="text-emerald-400 font-semibold">Anti-Defisit</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md hover:shadow-emerald-900/50 flex items-center gap-2 border border-emerald-500/50 disabled:opacity-50 btn-press cursor-pointer"
              title="Ekspor Kwitansi langsung ke file PDF ukuran F4 Landscape (330mm x 215mm)"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>Ekspor PDF (F4)</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all shadow-md flex items-center gap-2 border border-slate-700 btn-press cursor-pointer"
              title="Cetak langsung ke mesin printer fisik"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Cetak Printer</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= WORKSPACE LAYOUT ================= */}
      <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-8">
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
            <span>Formulir Kwitansi & RAB</span>
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
            <span>Pratinjau Kertas F4</span>
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT COLUMN: FORM LEDGER & CONTROLS (~40%) ================= */}
          <div id="formLedgerPanel" className={`xl:col-span-5 flex-col gap-5 ${mobileTab === "preview" ? "hidden xl:flex" : "flex"}`}>
            {/* Database Saved Receipts Picker */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  Pilih Kwitansi Tersimpan ({receiptsList.length})
                </span>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                >
                  <PlusCircle className="w-3 h-3" />
                  + Buat Baru
                </button>
              </div>

              <select
                value={selectedReceiptNo}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "NEW") {
                    handleResetForm();
                  } else {
                    const found = receiptsList.find((r) => r.nomorBukti === val);
                    if (found) loadReceiptIntoForm(found);
                  }
                }}
                className="w-full text-xs font-medium bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="NEW">-- Mode Buat Kwitansi Baru (+) --</option>
                {receiptsList.map((r) => (
                  <option key={r.id} value={r.nomorBukti}>
                    {r.nomorBukti} • Rp {r.nominal.toLocaleString("id-ID")} • {r.penerima || "Tanpa Nama Toko"} • {r.kategoriRab || "RAB"}
                  </option>
                ))}
              </select>
            </div>

            {/* Header Identitas Transaksi */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  <span>Nomor Registrasi & Tanggal Kas</span>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs font-semibold">
                  KODE: KWT-0428
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Nomor Bukti Kas (BKU)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsKopModalOpen(true)}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold transition-colors"
                        title="Buka pengaturan format penomoran akun database"
                      >
                        <Settings className="w-3 h-3" />
                        <span>Atur Format Akun</span>
                      </button>
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Sparkles className="w-2.5 h-2.5" />
                        Otomatis • Anti-Double
                      </span>
                    </div>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={formData.nomorBukti}
                      onChange={(e) =>
                        setFormData({ ...formData, nomorBukti: e.target.value })
                      }
                      placeholder="Contoh: 01/A/PR.FNU/IX/2026"
                      className={`w-full font-mono text-xs bg-slate-950 border rounded-xl pl-3 pr-24 py-2.5 text-white focus:outline-none focus:ring-1 transition-all ${
                        isDuplicateNoBukti
                          ? "border-amber-500/80 focus:ring-amber-500 text-amber-200"
                          : "border-slate-800 focus:ring-brand-primary focus:border-emerald-600"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleGenerateNewNomorBukti}
                      disabled={isPending}
                      title="Buat / hitung nomor urut berikutnya secara otomatis bebas bentrok"
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-2.5 text-[11px] font-medium bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 hover:text-white rounded-lg border border-emerald-600/40 transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
                    >
                      <RotateCw className={`w-3 h-3 ${isPending ? "animate-spin" : ""}`} />
                      <span>Auto-Baru</span>
                    </button>
                  </div>
                  {isDuplicateNoBukti ? (
                    <p className="text-[11px] text-amber-400 mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Nomor sudah ada di daftar! Klik <b>Auto-Baru</b> agar tidak ganda.</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Nomor kas urut unik & terhindar dari nomor ganda (anti-double).</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tanggal Transaksi
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.tanggal}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-emerald-600 [color-scheme:dark]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    Format bulan romawi & tahun pada nomor bukti kas akan otomatis sinkron.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Rincian Pembayaran & Pagu RAB */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-sm font-semibold text-white">
                  Entri Pembayaran Belanja LPJ
                </span>
                <span className="text-xs text-emerald-400 font-medium">
                  Format Baku Hibah NU / Daerah
                </span>
              </div>

              {/* Entitas Pembayar */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Telah Diterima Dari (Entitas Pemberi Uang)
                </label>
                <textarea
                  rows={2}
                  value={formData.pemberi}
                  onChange={(e) =>
                    setFormData({ ...formData, pemberi: e.target.value })
                  }
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-emerald-600 font-semibold uppercase resize-none"
                />
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Shield className="w-3 h-3 text-emerald-500" />
                  <span>Ketetapan NPHD No: 900/442.B/Kesbangpol/2026</span>
                </div>
              </div>

              {/* Pos Anggaran RAB Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Pos Anggaran Rekening RAB
                  </label>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    Kode Akun LPJ
                  </span>
                </div>
                <select
                  value={formData.kategoriRab}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, kategoriRab: e.target.value }))
                  }
                  className="w-full text-xs font-semibold bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-600"
                >
                  {rabSummary?.items && rabSummary.items.length > 0 ? (
                    <>
                      {/* Pastikan kategori yang dipilih saat ini tetap ada jika merupakan custom/query */}
                      {formData.kategoriRab &&
                        !rabSummary.items.some((it) => it.kode === formData.kategoriRab) && (
                          <option value={formData.kategoriRab}>
                            {formData.kategoriRab}
                          </option>
                        )}
                      {rabSummary.items.map((it) => (
                        <option key={it.id} value={it.kode}>
                          {it.kode} - {it.nama} (Pagu: Rp {Math.round(it.anggaran).toLocaleString("id-ID")})
                        </option>
                      ))}
                    </>
                  ) : (
                    <>
                      <option value="5.2.1">5.2.1 - Belanja Peralatan & Perlengkapan (Pagu: Rp 10.000.000)</option>
                      <option value="5.2.2">5.2.2 - Belanja Makanan & Minuman / Konsumsi (Pagu: Rp 5.000.000)</option>
                      <option value="5.2.3">5.2.3 - Belanja Sewa Sarana & Prasarana (Pagu: Rp 7.000.000)</option>
                      <option value="5.2.4">5.2.4 - Belanja Transportasi & Seragam (Pagu: Rp 3.000.000)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Nominal Input & Auto-Terbilang */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Jumlah Uang (Nominal Bruto Rp)
                </label>
                <div className="flex rounded-xl overflow-hidden border border-slate-800 bg-slate-950 focus-within:ring-1 focus-within:ring-brand-primary focus-within:border-emerald-600">
                  <span className="bg-brand-primary text-white px-3.5 py-2 text-xs font-bold flex items-center">
                    Rp.
                  </span>
                  <input
                    type="text"
                    value={formData.nominal}
                    onChange={(e) => handleNominalChange(e.target.value)}
                    className="w-full font-mono text-base font-bold text-emerald-300 px-3 py-2 bg-transparent focus:outline-none"
                  />
                </div>

                {/* Auto-Terbilang Pill Badge */}
                <div className="mt-2 p-2.5 bg-emerald-950/50 border border-emerald-800/40 rounded-xl flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                      Teks Terbilang Otomatis:
                    </span>
                    <span className="text-xs font-semibold text-emerald-200 italic">
                      {formData.terbilang}
                    </span>
                  </div>
                </div>
              </div>

              {/* ================= LIVE RAB CEILING & DEFICIT TRACKER CARD ================= */}
              {currentRabStatus && (
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    currentRabStatus.isDeficit
                      ? "bg-red-950/40 border-red-700/70"
                      : currentRabStatus.persentaseSerapan >= 80
                      ? "bg-amber-950/40 border-amber-700/60"
                      : "bg-slate-950/80 border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-emerald-400" />
                      Kontrol Pagu: {currentRabStatus.kode} - {currentRabStatus.nama}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        currentRabStatus.isDeficit
                          ? "bg-red-900/80 text-red-200 border border-red-600 animate-pulse"
                          : currentRabStatus.persentaseSerapan >= 80
                          ? "bg-amber-900/80 text-amber-200 border border-amber-600"
                          : "bg-emerald-900/80 text-emerald-200 border border-emerald-600"
                      }`}
                    >
                      {currentRabStatus.isDeficit
                        ? "DEFISIT / OVER-BUDGET"
                        : `${currentRabStatus.persentaseSerapan}% TERPAKAI`}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs py-1.5 bg-slate-900/60 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Pagu NPHD</span>
                      <span className="font-mono font-bold text-slate-200">
                        Rp {currentRabStatus.anggaran.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Sisa Sebelumnya</span>
                      <span className="font-mono font-semibold text-slate-300">
                        Rp {currentRabStatus.sisaPaguSebelum.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Proyeksi Sisa Pagu</span>
                      <span
                        className={`font-mono font-bold ${
                          currentRabStatus.isDeficit
                            ? "text-red-400"
                            : currentRabStatus.proyeksiSisaPagu === 0
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {currentRabStatus.isDeficit ? "-" : ""}Rp{" "}
                        {Math.abs(currentRabStatus.proyeksiSisaPagu).toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Serapan */}
                  <div className="w-full bg-slate-800 rounded-full h-2 mt-2.5 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentRabStatus.isDeficit
                          ? "bg-red-500 w-full"
                          : currentRabStatus.persentaseSerapan >= 80
                          ? "bg-amber-400"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: currentRabStatus.isDeficit
                          ? "100%"
                          : `${Math.min(100, currentRabStatus.persentaseSerapan)}%`,
                      }}
                    />
                  </div>

                  {/* High-Visibility Deficit Warning Alert */}
                  {currentRabStatus.isDeficit && (
                    <div className="mt-3 p-3 bg-red-950/80 border border-red-700 rounded-xl text-red-200 flex flex-col gap-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <strong className="block text-red-100 font-bold">
                            PERINGATAN AUDIT: PENGELUARAN MELEBIHI PAGU RAB!
                          </strong>
                          <p className="mt-0.5 text-red-300 text-[11px] leading-relaxed">
                            Transaksi senilai <strong>Rp {formData.nominalValue.toLocaleString("id-ID")}</strong> ini melebihi sisa pagu rekening <strong>{currentRabStatus.kode}</strong> (Sisa: Rp {currentRabStatus.sisaPaguSebelum.toLocaleString("id-ID")}). Terjadi defisit sebesar <strong className="text-white bg-red-800 px-1 rounded">-Rp {currentRabStatus.defisitNominal.toLocaleString("id-ID")}</strong> yang berisiko ditolak dalam verifikasi LPJ Inspektorat Daerah.
                          </p>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 mt-1 cursor-pointer select-none bg-red-900/40 p-2 rounded-lg border border-red-800 text-[11px] text-red-200">
                        <input
                          type="checkbox"
                          checked={allowDeficitOverride}
                          onChange={(e) => setAllowDeficitOverride(e.target.checked)}
                          className="w-4 h-4 text-red-600 rounded accent-red-600 shrink-0"
                        />
                        <span>
                          <strong>Otorisasi Khusus Defisit:</strong> Saya memahami risiko audit anggaran dan tetap ingin mencatat transaksi ini.
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* ================= KALKULATOR PAJAK OTOMATIS (PPh & PPN) ================= */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden">
                <div
                  onClick={() => setShowTaxCalculator(!showTaxCalculator)}
                  className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-900/60 transition-colors select-none"
                >
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">
                      Kalkulator Pajak Otomatis (PPh 21, PPh 22, PPh 23, PPN 11%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.totalPajak > 0 && (
                      <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300 font-mono text-[11px] font-bold">
                        Pot. Pajak: Rp {formData.totalPajak.toLocaleString("id-ID")}
                      </span>
                    )}
                    {showTaxCalculator ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {showTaxCalculator && (
                  <div className="p-4 pt-0 border-t border-slate-800/80 space-y-3.5 text-xs">
                    {/* Rekomendasi Pajak Belanja > Rp 2 Juta */}
                    {formData.nominalValue >= 2000000 && !formData.isPpn && !formData.isPph21 && !formData.isPph22 && !formData.isPph23 && (
                      <div className="p-2.5 bg-cyan-950/40 border border-cyan-800/50 rounded-lg text-cyan-200 flex items-center gap-2 text-[11px]">
                        <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>
                          <strong>Saran Pajak LPJ:</strong> Transaksi di atas Rp 2.000.000 umumnya dipungut <strong>PPN 11%</strong> dan <strong>PPh 22 (1.5%)</strong> untuk barang modal, atau <strong>PPh 23 (2%)</strong> untuk sewa/katering.
                        </span>
                      </div>
                    )}

                    {/* Tax Options Checkboxes Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {/* PPN 11% Option */}
                      <div
                        className={`p-2.5 rounded-lg border transition-all ${
                          formData.isPpn
                            ? "bg-cyan-950/40 border-cyan-600/70"
                            : "bg-slate-900 border-slate-800"
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={formData.isPpn}
                            onChange={(e) =>
                              setFormData((prev) =>
                                updateFormWithTax(prev, { isPpn: e.target.checked })
                              )
                            }
                            className="w-4 h-4 text-cyan-500 rounded accent-cyan-600"
                          />
                          <span className="font-semibold text-white">PPN 11% (Barang/Jasa)</span>
                        </label>

                        {formData.isPpn && (
                          <div className="mt-2 pl-6 space-y-1.5 text-[11px]">
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1 cursor-pointer text-slate-300">
                                <input
                                  type="radio"
                                  name="ppnMode"
                                  checked={formData.isPpnIncluded}
                                  onChange={() =>
                                    setFormData((prev) =>
                                      updateFormWithTax(prev, { isPpnIncluded: true })
                                    )
                                  }
                                  className="accent-cyan-600"
                                />
                                <span>Include PPN</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer text-slate-300">
                                <input
                                  type="radio"
                                  name="ppnMode"
                                  checked={!formData.isPpnIncluded}
                                  onChange={() =>
                                    setFormData((prev) =>
                                      updateFormWithTax(prev, { isPpnIncluded: false })
                                    )
                                  }
                                  className="accent-cyan-600"
                                />
                                <span>Exclude PPN</span>
                              </label>
                            </div>
                            <span className="text-cyan-300 font-mono block">
                              Pot. PPN: Rp {formData.ppnNominal.toLocaleString("id-ID")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* PPh 21 Option */}
                      <div
                        className={`p-2.5 rounded-lg border transition-all ${
                          formData.isPph21
                            ? "bg-cyan-950/40 border-cyan-600/70"
                            : "bg-slate-900 border-slate-800"
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={formData.isPph21}
                            onChange={(e) =>
                              setFormData((prev) =>
                                updateFormWithTax(prev, { isPph21: e.target.checked })
                              )
                            }
                            className="w-4 h-4 text-cyan-500 rounded accent-cyan-600"
                          />
                          <span className="font-semibold text-white">PPh 21 (Honor/Narasumber)</span>
                        </label>

                        {formData.isPph21 && (
                          <div className="mt-2 pl-6 space-y-1 text-[11px]">
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) =>
                                    updateFormWithTax(prev, { pph21Rate: 0.05 })
                                  )
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  formData.pph21Rate === 0.05
                                    ? "bg-cyan-600 text-white"
                                    : "bg-slate-800 text-slate-300"
                                }`}
                              >
                                5% (NPWP)
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) =>
                                    updateFormWithTax(prev, { pph21Rate: 0.06 })
                                  )
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  formData.pph21Rate === 0.06
                                    ? "bg-cyan-600 text-white"
                                    : "bg-slate-800 text-slate-300"
                                }`}
                              >
                                6% (Non-NPWP)
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) =>
                                    updateFormWithTax(prev, { pph21Rate: 0.15 })
                                  )
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  formData.pph21Rate === 0.15
                                    ? "bg-cyan-600 text-white"
                                    : "bg-slate-800 text-slate-300"
                                }`}
                              >
                                15% (Gol IV)
                              </button>
                            </div>
                            <span className="text-cyan-300 font-mono block">
                              Pot. PPh 21: Rp {formData.pph21Nominal.toLocaleString("id-ID")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* PPh 22 Option */}
                      <div
                        className={`p-2.5 rounded-lg border transition-all ${
                          formData.isPph22
                            ? "bg-cyan-950/40 border-cyan-600/70"
                            : "bg-slate-900 border-slate-800"
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={formData.isPph22}
                            onChange={(e) =>
                              setFormData((prev) =>
                                updateFormWithTax(prev, { isPph22: e.target.checked })
                              )
                            }
                            className="w-4 h-4 text-cyan-500 rounded accent-cyan-600"
                          />
                          <span className="font-semibold text-white">PPh 22 (Barang &gt; 2 Jt - 1.5%)</span>
                        </label>

                        {formData.isPph22 && (
                          <div className="mt-2 pl-6 space-y-1 text-[11px]">
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) =>
                                    updateFormWithTax(prev, { pph22Rate: 0.015 })
                                  )
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  formData.pph22Rate === 0.015
                                    ? "bg-cyan-600 text-white"
                                    : "bg-slate-800 text-slate-300"
                                }`}
                              >
                                1.5% (NPWP)
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) =>
                                    updateFormWithTax(prev, { pph22Rate: 0.03 })
                                  )
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  formData.pph22Rate === 0.03
                                    ? "bg-cyan-600 text-white"
                                    : "bg-slate-800 text-slate-300"
                                }`}
                              >
                                3% (Non-NPWP)
                              </button>
                            </div>
                            <span className="text-cyan-300 font-mono block">
                              Pot. PPh 22: Rp {formData.pph22Nominal.toLocaleString("id-ID")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* PPh 23 Option */}
                      <div
                        className={`p-2.5 rounded-lg border transition-all ${
                          formData.isPph23
                            ? "bg-cyan-950/40 border-cyan-600/70"
                            : "bg-slate-900 border-slate-800"
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={formData.isPph23}
                            onChange={(e) =>
                              setFormData((prev) =>
                                updateFormWithTax(prev, { isPph23: e.target.checked })
                              )
                            }
                            className="w-4 h-4 text-cyan-500 rounded accent-cyan-600"
                          />
                          <span className="font-semibold text-white">PPh 23 (Sewa/Katering - 2%)</span>
                        </label>

                        {formData.isPph23 && (
                          <div className="mt-2 pl-6 space-y-1 text-[11px]">
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) =>
                                    updateFormWithTax(prev, { pph23Rate: 0.02 })
                                  )
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  formData.pph23Rate === 0.02
                                    ? "bg-cyan-600 text-white"
                                    : "bg-slate-800 text-slate-300"
                                }`}
                              >
                                2% (NPWP)
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) =>
                                    updateFormWithTax(prev, { pph23Rate: 0.04 })
                                  )
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  formData.pph23Rate === 0.04
                                    ? "bg-cyan-600 text-white"
                                    : "bg-slate-800 text-slate-300"
                                }`}
                              >
                                4% (Non-NPWP)
                              </button>
                            </div>
                            <span className="text-cyan-300 font-mono block">
                              Pot. PPh 23: Rp {formData.pph23Nominal.toLocaleString("id-ID")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tax Breakdown Strip */}
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Dasar Pengenaan Pajak (DPP)</span>
                        <span className="font-mono font-bold text-slate-200">
                          Rp {formData.dpp.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-400 block">Total Potongan Pajak</span>
                        <span className="font-mono font-bold text-amber-300">
                          Rp {formData.totalPajak.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-400 block">Uang Diterima Rekanan (Netto)</span>
                        <span className="font-mono font-bold text-emerald-300 text-sm">
                          Rp {formData.nominalBersih.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Guna Membayar (Rincian Belanja) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Guna Membayar (Rincian Barang / Jasa)
                  </label>
                  <span className="text-[11px] text-brand-tertiary font-medium">
                    Link RAB: {formData.kategoriRab || "5.2.1"}
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={formData.uraian}
                  onChange={(e) =>
                    setFormData({ ...formData, uraian: e.target.value })
                  }
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-emerald-600 resize-none"
                />

                {/* Quick Fill Chips with Tax & RAB Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      quickFillPreset(
                        "Belanja Konsumsi Rapat Anggota & Pengajian 85 Kotak x @ Rp 25.000 = Rp 2.125.000",
                        2125000,
                        "5.2.2",
                        { isPpn: false, isPph23: true, pph23Rate: 0.02 }
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-900/60 hover:text-emerald-200 text-slate-300 text-[11px] transition-all btn-press border border-transparent hover:border-emerald-700/40 cursor-pointer"
                  >
                    + Konsumsi Rapat (+PPh 23)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      quickFillPreset(
                        "Sewa Terop dan Panggung Pengajian Akbar Milad Fatayat NU = Rp 1.750.000",
                        1750000,
                        "5.2.3",
                        { isPpn: false, isPph23: true, pph23Rate: 0.02 }
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-900/60 hover:text-emerald-200 text-slate-300 text-[11px] transition-all btn-press border border-transparent hover:border-emerald-700/40 cursor-pointer"
                  >
                    + Sewa Terop (PPh 23)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      quickFillPreset(
                        "Belanja Sound Aktif sebanyak 1 unit x @ Rp. 3.000.000 = Rp. 3.000.000",
                        3000000,
                        "5.2.1",
                        { isPpn: true, isPph22: true, pph22Rate: 0.015 }
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-900/60 hover:text-emerald-200 text-slate-300 text-[11px] transition-all btn-press border border-transparent hover:border-emerald-700/40 cursor-pointer"
                  >
                    + Sound Portable (+PPN & PPh22)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      quickFillPreset(
                        "Honorarium Narasumber Pelatihan Administrasi 2 Sesi x @ Rp 750.000 = Rp 1.500.000",
                        1500000,
                        "5.2.4",
                        { isPph21: true, pph21Rate: 0.05, isPpn: false }
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-900/60 hover:text-emerald-200 text-slate-300 text-[11px] transition-all btn-press border border-transparent hover:border-emerald-700/40 cursor-pointer"
                  >
                    + Honor Narasumber (PPh 21)
                  </button>
                </div>
              </div>

              {/* Pejabat Otorisasi & Penerima */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl flex flex-col gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Struktur Verifikasi & Tanda Tangan
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Ketua (Setuju Dibayar)
                    </label>
                    <input
                      type="text"
                      value={formData.ketua}
                      onChange={(e) =>
                        setFormData({ ...formData, ketua: e.target.value })
                      }
                      className="w-full text-xs font-semibold bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-emerald-600 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Bendahara (Lunas Dibayar)
                    </label>
                    <input
                      type="text"
                      value={formData.bendahara}
                      onChange={(e) =>
                        setFormData({ ...formData, bendahara: e.target.value })
                      }
                      className="w-full text-xs font-semibold bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-emerald-600 uppercase"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] text-slate-400">
                      Penerima Uang / Toko Rekanan
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsVendorModalOpen(true)}
                        className="px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Store className="w-3 h-3" />
                        <span>Kelola Toko</span>
                      </button>
                      {formData.penerima && (
                        <button
                          type="button"
                          onClick={handleQuickSaveCurrentToko}
                          title="Simpan nama toko/penerima ini ke Master Data Toko Langganan"
                          className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <BookmarkPlus className="w-3 h-3 text-amber-400" />
                          <span>Simpan ke Master</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dropdown Auto-Fill Toko Rekanan Langganan */}
                  <div className="mb-2 bg-slate-900/90 border border-amber-500/30 p-2 rounded-lg flex flex-col gap-1 shadow-xs">
                    <label className="text-[10px] text-amber-300 font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Pilih dari Master Toko:</span>
                      </span>
                      <span className="text-[9px] text-slate-400 font-normal">
                        Otomatis isi nama toko / penerima
                      </span>
                    </label>
                    <select
                      value={
                        vendors.find(
                          (v) =>
                            v.namaToko.toLowerCase() === (formData.penerima || "").toLowerCase()
                        )?.id || ""
                      }
                      onChange={(e) => {
                        const selected = vendors.find((v) => v.id === e.target.value);
                        if (selected) {
                          handleSelectVendor(selected);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                    >
                      <option value="">-- Pilih Toko Langganan ({vendors.length} Toko) --</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.namaToko} {v.namaPemilik ? `(Pemilik: ${v.namaPemilik})` : ""} {v.kategori ? `• ${v.kategori}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.penerima}
                      onChange={(e) =>
                        setFormData({ ...formData, penerima: e.target.value })
                      }
                      placeholder="Nama Toko Rekanan / Penerima"
                      className="flex-1 text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-emerald-600"
                    />
                    <label className="flex items-center gap-1.5 cursor-pointer select-none bg-slate-900 px-2.5 py-2 rounded-lg border border-slate-800 shrink-0">
                      <input
                        type="checkbox"
                        checked={formData.denganMaterai}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            denganMaterai: e.target.checked,
                          })
                        }
                        className="w-3.5 h-3.5 text-brand-primary rounded accent-emerald-600"
                      />
                      <span className="text-[11px] font-medium text-slate-300">
                        Materai 10.000
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Opsi Layout Kertas */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Format & Tipe Cetak Blanko
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTemplateSelect("bank")}
                    className={`px-3 py-2 rounded-xl text-xs font-medium text-center transition-all ${
                      formData.template === "bank"
                        ? "bg-brand-primary text-white border border-emerald-600 shadow-md font-semibold btn-press"
                        : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white btn-press"
                    }`}
                  >
                    Standar Kas Negara
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTemplateSelect("folio")}
                    className={`px-3 py-2 rounded-xl text-xs font-medium text-center transition-all btn-press ${
                      formData.template === "folio"
                        ? "bg-brand-primary text-white border border-emerald-600 shadow-md font-semibold"
                        : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                    }`}
                  >
                    1/2 Folio HVS
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTemplateSelect("triple")}
                    className={`px-3 py-2 rounded-xl text-xs font-medium text-center transition-all btn-press ${
                      formData.template === "triple"
                        ? "bg-brand-primary text-white border border-emerald-600 shadow-md font-semibold"
                        : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                    }`}
                  >
                    3 Rangkap / A4
                  </button>
                </div>
              </div>

              {/* Server Response Feedback */}
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

              {/* Action Buttons */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  disabled={isPending || (Boolean(currentRabStatus?.isDeficit) && !allowDeficitOverride)}
                  onClick={handleSaveToBKU}
                  className="w-full px-3 py-3 rounded-xl bg-brand-primary hover:bg-brand-secondary text-white text-xs font-semibold shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all border border-emerald-600/40 disabled:opacity-50 disabled:cursor-not-allowed btn-press cursor-pointer hover:shadow-emerald-900/40"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span className="truncate">
                    {currentRabStatus?.isDeficit && !allowDeficitOverride
                      ? "Tertahan Defisit"
                      : "Simpan ke BKU"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full px-3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-slate-700 btn-press cursor-pointer hover:text-white"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  <span>Kwitansi Baru (+)</span>
                </button>

                <Link
                  href={`/user/bast?receiptNo=${formData.nomorBukti}`}
                  className="w-full px-3 py-3 rounded-xl bg-[#006c4e] hover:bg-[#004532] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md text-center btn-press hover:shadow-emerald-950/40"
                  title="Buat Berita Acara Serah Terima Barang untuk Kwitansi ini"
                >
                  <FileCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span className="truncate">Buat BAST</span>
                </Link>
              </div>

              {/* Tombol Hapus Kwitansi (Muncul jika sedang membuka kwitansi tersimpan) */}
              {selectedReceiptNo !== "NEW" && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleDeleteCurrentReceipt}
                  className="w-full mt-2 px-3 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all btn-press cursor-pointer"
                  title="Hapus kwitansi ini secara permanen dari database dan BKU"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>Hapus Kwitansi Ini ({selectedReceiptNo})</span>
                </button>
              )}
            </div>

            {/* Mini Alert Audit Notice */}
            <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-[#065F46] flex items-center justify-center text-white shrink-0">
                <Info className="w-4 h-4 text-emerald-200" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block">
                  Kepatuhan Audit & UU Bea Meterai No. 10/2020
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Transaksi belanja di atas <strong>Rp 5.000.000</strong> wajib membubuhkan Bea Meterai Rp 10.000 di atas tanda tangan penerima sebelum diajukan ke Verifikator.
                </p>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: LIVE CANVAS PREVIEW (~60%) ================= */}
          <div className={`xl:col-span-7 flex-col gap-4 w-full ${mobileTab === "form" ? "hidden xl:flex" : "flex"}`}>
            {/* Canvas Action Bar */}
            <div
              id="actionToolbar"
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-950 px-3 py-1.5 rounded-lg gap-2 border border-slate-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-mono font-semibold text-emerald-300">
                    Kertas F4 Landscape (330mm × 215mm) • Posisi: Tengah Kertas
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCutGuides(!showCutGuides)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    showCutGuides
                      ? "bg-slate-800 text-emerald-300 border border-emerald-700/40"
                      : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                  }`}
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Garis Potong</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all border border-emerald-500/40 disabled:opacity-50"
                  title="Unduh langsung file PDF F4 Landscape (330mm x 215mm)"
                >
                  {isExportingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5" />
                  )}
                  <span>Ekspor PDF (F4)</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all border border-slate-700"
                  title="Cetak kwitansi ke mesin printer fisik"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-300" />
                  <span>Cetak</span>
                </button>
              </div>
            </div>

            {/* Print-Ready Canvas */}
            <KwitansiCanvas data={formData} profile={profile} showCutGuides={showCutGuides} />

            {/* Quick Detail & Verification Checklist Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm no-print">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Lembar Verifikasi Kelengkapan SPJ & Status Pajak</span>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-800/50 text-emerald-300 font-mono text-xs font-semibold">
                  Tervalidasi BKU & RAB
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3.5 text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200 block">Kesesuaian Kode RAB</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Dialokasikan pada rekening <strong>{formData.kategoriRab}</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200 block">Potongan Pajak Resmi</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {formData.totalPajak > 0
                        ? `Dikenakan pajak Rp ${formData.totalPajak.toLocaleString("id-ID")}`
                        : "Tidak ada potongan pajak (di bawah batas fiskal)."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200 block">Sisa Saldo Kas & Netto</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Netto diterima rekanan: <strong>Rp {formData.nominalBersih.toLocaleString("id-ID")}</strong>.
                    </p>
                  </div>
                </div>
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
            <span>Lihat Blanko F4</span>
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
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Kembali ke Formulir</span>
          </button>
        )}
        {/* Modal Kop Surat & Format Penomoran Akun */}
        <KopSuratModal
          isOpen={isKopModalOpen}
          onClose={() => setIsKopModalOpen(false)}
          initialProfile={profile}
          onProfileUpdated={(updated) => {
            setProfile(updated);
            handleGenerateNewNomorBukti();
          }}
        />

        {/* Modal Master Data Toko / Rekanan Langganan */}
        <MasterTokoModal
          isOpen={isVendorModalOpen}
          onClose={() => setIsVendorModalOpen(false)}
          onSelectVendor={handleSelectVendor}
          onVendorsUpdated={setVendors}
          initialVendors={vendors}
        />
      </div>
    </div>
  );
}
