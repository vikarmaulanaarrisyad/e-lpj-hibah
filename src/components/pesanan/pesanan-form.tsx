"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  FileCheck,
  Building2,
  Receipt as ReceiptIcon,
  Printer,
  Save,
  PlusCircle,
  Trash2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Calendar,
  Edit3,
  FileDown,
  Loader2,
  Layers,
  ArrowLeft,
  Settings,
} from "lucide-react";
import { exportPesananToPdf } from "@/lib/pesanan-pdf";
import { exportBundelPengadaanPdf } from "@/lib/bundel-pengadaan-pdf";
import { formatTanggalTerbilang } from "@/services/bast.service";
import { angkaKeTerbilang } from "@/lib/utils/terbilang";
import {
  formatDateIndo,
  calculateDurasiDanDeskripsi,
  addDaysToDate,
  calculateTanggalSpDariNota,
  syncNomorSpBulanTahun,
  syncNomorDokumenBulanTahun,
  buildFormattedDocumentNumber,
  deconstructDocumentNumber,
  extractNamaTempat,
} from "@/lib/utils/pesanan-date";
import { savePurchaseOrderAction, deletePurchaseOrderAction } from "@/app/actions/pesanan.action";
import { saveInstitutionProfileAction } from "@/app/actions/institution.action";
import { swalLoading, swalSuccess, swalError, swalConfirmDelete } from "@/lib/swal";
import { KopSuratModal } from "@/components/kop-surat/kop-surat-modal";
import { PesananCanvas } from "./pesanan-canvas";
import { BastCanvas } from "../bast/bast-canvas";
import type {
  PurchaseOrder,
  PesananFormData,
  PesananItem,
  InstitutionProfile,
  Receipt,
  BastDocument,
  BastFormData,
  BastItem,
} from "@/types";

interface PesananFormProps {
  initialPesananList?: PurchaseOrder[];
  initialBastList?: BastDocument[];
  initialReceipts?: Receipt[];
  initialProfile?: InstitutionProfile | null;
  userProfile?: {
    name: string;
    leaderName?: string | null;
    institution?: string | null;
  };
}

export function PesananForm({
  initialPesananList = [],
  initialBastList = [],
  initialReceipts = [],
  initialProfile,
  userProfile,
}: PesananFormProps) {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [pesananList, setPesananList] = useState<PurchaseOrder[]>(initialPesananList);
  const [bastList, setBastList] = useState<BastDocument[]>(initialBastList);
  const [profile, setProfile] = useState<InstitutionProfile | null>(initialProfile || null);
  const [isKopModalOpen, setIsKopModalOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [previewMode, setPreviewMode] = useState<"sp" | "bast" | "bundel">("sp");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingBundle, setIsExportingBundle] = useState(false);

  const defaultChairman = profile?.namaKetua || userProfile?.leaderName || "HENI FUJIATI";
  const defaultInstitution = profile?.subNama
    ? `${profile.namaLembaga} ${profile.subNama}`
    : userProfile?.institution || "PR Fatayat NU Dawuhan Selatan";

  const todayStr = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState<PesananFormData>(() => {
    if (initialPesananList.length > 0) {
      const p = initialPesananList[0];
      let parsedItems: PesananItem[] = [];
      try {
        parsedItems = JSON.parse(p.itemsJson) || [];
      } catch {
        parsedItems = [];
      }

      return {
        id: p.id,
        nomorSp: p.nomorSp,
        tanggal: p.tanggal ? new Date(p.tanggal).toISOString().split("T")[0] : todayStr,
        namaPaket: p.namaPaket,
        pihak1Nama: p.pihak1Nama,
        pihak1Jabatan: p.pihak1Jabatan,
        pihak1Alamat: p.pihak1Alamat || undefined,
        pihak2Toko: p.pihak2Toko,
        pihak2Nama: p.pihak2Nama,
        pihak2Alamat: p.pihak2Alamat || undefined,
        items: parsedItems.length > 0 ? parsedItems : [
          {
            id: "1",
            no: 1,
            jenisBarang: "Sound Aktif Portable Professional 15 Inch",
            spesifikasi: "Kelengkapan: Mic Wireless 2 buah, Bluetooth, Aki Kering",
            jumlah: 1,
            satuan: "unit",
            hargaSatuan: 3000000,
            totalHarga: 3000000,
          },
        ],
        subtotal: p.subtotal,
        pajak: p.pajak,
        pajakKeterangan: p.pajakKeterangan || "- (Sudah Termasuk)",
        totalHarga: p.totalHarga,
        terbilang: p.terbilang,
        batasWaktu: p.batasWaktu || todayStr,
        waktuPenyelesaian: p.waktuPenyelesaian || "1 (satu) hari kalender",
        alamatPengiriman: p.alamatPengiriman || "Tempat / Gudang Toko Surya Mas",
        alamatPemeriksaan: p.alamatPemeriksaan || "Sekretariat PR Fatayat NU Dawuhan Selatan",
        dendaKeterlambatan: p.dendaKeterlambatan || "Denda 1/500 dari nilai pekerjaan sebelum pajak per hari keterlambatan.",
        receiptId: p.receiptId,
      };
    }

    return {
      nomorSp: "02/A/PR.FNU/VIII/2026",
      tanggal: "2026-08-01",
      namaPaket: "Pembelian Alat Rebana",
      pihak1Nama: "HENI FUJIATI",
      pihak1Jabatan: "Ketua",
      pihak1Alamat: "Jl Kemuning 2016 Desa Dawuhan RT. 23 RW. 06 Kec. Talang Kab. Tegal",
      pihak2Toko: "ADHUFU",
      pihak2Nama: "ANSHORI",
      pihak2Alamat: "Jl. Sunan Amangkurat 1 Pesarean Kejeron",
      items: [
        {
          id: "1",
          no: 1,
          jenisBarang: "Alat Rebana",
          spesifikasi: "1 paket lengkap alat rebana hadroh / rebana Fatayat NU",
          jumlah: 1,
          satuan: "paket",
          hargaSatuan: 5800000,
          totalHarga: 5800000,
        },
      ],
      subtotal: 5800000,
      pajak: 0,
      pajakKeterangan: "*harga sudah termasuk pajak",
      totalHarga: 5800000,
      terbilang: "Lima Juta Delapan Ratus Ribu Rupiah",
      batasWaktu: "2026-08-04",
      waktuPenyelesaian: "4 (empat) hari kalender dan pekerjaan harus sudah selesai pada tanggal 04 Agustus 2026",
      alamatPengiriman: "Jl. Sunan Amangkurat 1 Pesarean Kejeron",
      alamatPemeriksaan: "Jl. Kemuning 2016 Desa Dawuhan RT. 23 RW. 06 Kec. Talang Kab. Tegal",
      dendaKeterlambatan: "Terhadap setiap hari keterlambatan penyelesaian pekerjaan Penyedia barang akan dikenakan Denda Keterlambatan sebesar 1/500 (satu per seribu) dari Nilai Pekerjaan atau bagian tertentu dari Nilai Pekerjaan sebelum PPN sesuai dengan persyaratan dan ketentuan yang berlaku",
      receiptId: null,
    };
  });

  const [durasiHari, setDurasiHari] = useState<number>(() => {
    if (formData.tanggal && formData.batasWaktu) {
      const { durasiHari: d } = calculateDurasiDanDeskripsi(formData.tanggal, formData.batasWaktu);
      return d;
    }
    return 4;
  });

  // Parameter Otomatisasi Format Penomoran SP (Contoh: /A/PR.FNU/)
  const initDecompSp = deconstructDocumentNumber(formData.nomorSp);
  const [formatPatternSp, setFormatPatternSp] = useState<string>(() => {
    if (profile?.formatNomorSp) return profile.formatNomorSp;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sp_format_pattern");
      if (saved) return saved;
    }
    return initDecompSp.formatPattern || "/A/PR.FNU/";
  });
  const [nomorUrutSp, setNomorUrutSp] = useState<string>(initDecompSp.nomorUrut || "02");
  const [isManualNomorSp, setIsManualNomorSp] = useState<boolean>(false);
  const [isSavingPattern, startSavePattern] = useTransition();

  // Sinkronisasi bila profile lembaga dari database berubah
  useEffect(() => {
    if (profile?.formatNomorSp && profile.formatNomorSp !== formatPatternSp) {
      setFormatPatternSp(profile.formatNomorSp);
      if (typeof window !== "undefined") {
        localStorage.setItem("sp_format_pattern", profile.formatNomorSp);
      }
      if (!isManualNomorSp) {
        const nextNomor = buildFormattedDocumentNumber(nomorUrutSp, profile.formatNomorSp, formData.tanggal);
        setFormData((prev) => ({ ...prev, nomorSp: nextNomor }));
      }
    }
  }, [profile?.formatNomorSp]);

  // Handler simpan format pola ke Database Akun
  const handleSavePatternToDatabase = () => {
    startSavePattern(async () => {
      swalLoading("Menyimpan ke Database...", "Memperbarui format penomoran akun Anda...");
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
        formatNomorSp: formatPatternSp,
      });

      if (res.success && res.data) {
        setProfile(res.data);
        if (typeof window !== "undefined") {
          localStorage.setItem("sp_format_pattern", formatPatternSp);
        }
        swalSuccess("Format Tersimpan!", "Pola penomoran akun berhasil disimpan ke database dan akan otomatis digunakan di setiap pembuatan surat.");
      } else {
        swalError("Gagal Menyimpan", res.message || "Gagal menyimpan format ke database.");
      }
    });
  };

  // Handler perubahan Format Kode Instansi (misal: /A/PR.FNU/)
  const handleFormatPatternChange = (newPattern: string) => {
    setFormatPatternSp(newPattern);
    if (typeof window !== "undefined") {
      localStorage.setItem("sp_format_pattern", newPattern);
    }
    if (!isManualNomorSp) {
      const nextNomor = buildFormattedDocumentNumber(nomorUrutSp, newPattern, formData.tanggal);
      setFormData((prev) => ({ ...prev, nomorSp: nextNomor }));
    }
  };

  // Handler perubahan Nomor Urut Dokumen (misal: 01, 02)
  const handleNomorUrutChange = (newUrut: string) => {
    setNomorUrutSp(newUrut);
    if (!isManualNomorSp) {
      const nextNomor = buildFormattedDocumentNumber(newUrut, formatPatternSp, formData.tanggal);
      setFormData((prev) => ({ ...prev, nomorSp: nextNomor }));
    }
  };

  // Handler perubahan Tanggal Surat Pesanan (Otomatis menyesuaikan batas waktu, waktu penyelesaian & nomor SP)
  const handleTanggalSpChange = (dateVal: string) => {
    const nextBatasWaktu = addDaysToDate(dateVal, durasiHari - 1);
    const { deskripsiWaktuPenyelesaian } = calculateDurasiDanDeskripsi(dateVal, nextBatasWaktu, durasiHari);
    const syncedNomorSp = isManualNomorSp
      ? syncNomorDokumenBulanTahun(formData.nomorSp, dateVal)
      : buildFormattedDocumentNumber(nomorUrutSp, formatPatternSp, dateVal);

    setFormData((prev) => ({
      ...prev,
      tanggal: dateVal,
      batasWaktu: nextBatasWaktu,
      waktuPenyelesaian: deskripsiWaktuPenyelesaian,
      nomorSp: syncedNomorSp,
    }));
  };

  // Handler perubahan Batas Waktu Penerimaan Barang / Tanggal Nota (Otomatis hitung mundur tanggal SP)
  const handleBatasWaktuChange = (batasVal: string) => {
    const nextTanggalSp = calculateTanggalSpDariNota(batasVal, durasiHari);
    const { deskripsiWaktuPenyelesaian } = calculateDurasiDanDeskripsi(
      nextTanggalSp,
      batasVal,
      durasiHari
    );
    const syncedNomorSp = isManualNomorSp
      ? syncNomorDokumenBulanTahun(formData.nomorSp, nextTanggalSp)
      : buildFormattedDocumentNumber(nomorUrutSp, formatPatternSp, nextTanggalSp);

    setFormData((prev) => ({
      ...prev,
      batasWaktu: batasVal,
      tanggal: nextTanggalSp,
      waktuPenyelesaian: deskripsiWaktuPenyelesaian,
      nomorSp: syncedNomorSp,
    }));
  };

  // Handler perubahan Durasi Hari Kalender (via input number atau tombol preset)
  // Menjaga tanggal batas waktu nota tetap & otomatis menghitung mundur tanggal SP
  const handleDurasiHariChange = (days: number) => {
    const safeDays = Math.max(1, days);
    setDurasiHari(safeDays);

    const nextTanggalSp = calculateTanggalSpDariNota(formData.batasWaktu, safeDays);
    const { deskripsiWaktuPenyelesaian } = calculateDurasiDanDeskripsi(
      nextTanggalSp,
      formData.batasWaktu,
      safeDays
    );
    const syncedNomorSp = isManualNomorSp
      ? syncNomorDokumenBulanTahun(formData.nomorSp, nextTanggalSp)
      : buildFormattedDocumentNumber(nomorUrutSp, formatPatternSp, nextTanggalSp);

    setFormData((prev) => ({
      ...prev,
      tanggal: nextTanggalSp,
      waktuPenyelesaian: deskripsiWaktuPenyelesaian,
      nomorSp: syncedNomorSp,
    }));
  };

  // Check URL query param ?no=..., ?spNo=..., or ?receiptNo=...
  useEffect(() => {
    const spNo = searchParams.get("no") || searchParams.get("spNo");
    if (spNo && pesananList.length > 0) {
      const p = pesananList.find((item) => item.nomorSp === spNo);
      if (p) {
        loadPesananIntoForm(p);
        return;
      }
    }

    const rNo = searchParams.get("receiptNo");
    if (rNo && initialReceipts.length > 0) {
      const r = initialReceipts.find((item) => item.nomorBukti === rNo);
      if (r) {
        handleSelectReceipt(r.id);
      }
    }
  }, [searchParams, pesananList, initialReceipts]);

  // Handler to load selected receipt into form
  const handleSelectReceipt = (rcId: string) => {
    if (!rcId) {
      setFormData((prev) => ({
        ...prev,
        receiptId: null,
      }));
      return;
    }

    const r = initialReceipts.find((item) => item.id === rcId);
    if (!r) return;

    const cleanUraian = (r.uraian || "").split(/\s+sebanyak\s+/i)[0].trim();
    const itemName = cleanUraian.replace(/^Belanja\s+/i, "") || "Pengadaan Sarana & Prasarana";
    const subtotal = r.nominal;
    const totalHarga = r.nominal;
    const terbilangText = r.terbilang || angkaKeTerbilang(totalHarga);

    // Otomatis sinkronisasi tanggal nota ke Batas Waktu & hitung mundur Tanggal SP
    const notaDate = r.tanggal
      ? new Date(r.tanggal).toISOString().split("T")[0]
      : formData.batasWaktu;
    const nextTanggalSp = calculateTanggalSpDariNota(notaDate, durasiHari);
    const { deskripsiWaktuPenyelesaian } = calculateDurasiDanDeskripsi(nextTanggalSp, notaDate, durasiHari);
    const syncedNomorSp = isManualNomorSp
      ? syncNomorDokumenBulanTahun(formData.nomorSp, nextTanggalSp)
      : buildFormattedDocumentNumber(nomorUrutSp, formatPatternSp, nextTanggalSp);

    setFormData((prev) => ({
      ...prev,
      receiptId: r.id,
      namaPaket: cleanUraian,
      pihak2Toko: r.penerima || prev.pihak2Toko,
      pihak2Nama: r.penerima || prev.pihak2Nama,
      subtotal,
      totalHarga,
      terbilang: terbilangText,
      batasWaktu: notaDate,
      tanggal: nextTanggalSp,
      waktuPenyelesaian: deskripsiWaktuPenyelesaian,
      nomorSp: syncedNomorSp,
      items: [
        {
          id: "1",
          no: 1,
          jenisBarang: itemName,
          spesifikasi: "Standar spesifikasi hibah sesuai proposal NPHD",
          jumlah: 1,
          satuan: "unit",
          hargaSatuan: subtotal,
          totalHarga,
        },
      ],
    }));
  };

  // Handler load existing SP into form
  const loadPesananIntoForm = (p: PurchaseOrder) => {
    let parsedItems: PesananItem[] = [];
    try {
      parsedItems = JSON.parse(p.itemsJson) || [];
    } catch {
      parsedItems = [];
    }

    const tglIso = p.tanggal ? new Date(p.tanggal).toISOString().split("T")[0] : todayStr;
    const batasIso = p.batasWaktu || todayStr;
    const { durasiHari: d, deskripsiWaktuPenyelesaian } = calculateDurasiDanDeskripsi(tglIso, batasIso);
    setDurasiHari(d);

    setFormData({
      id: p.id,
      nomorSp: p.nomorSp,
      tanggal: tglIso,
      namaPaket: p.namaPaket,
      pihak1Nama: p.pihak1Nama,
      pihak1Jabatan: p.pihak1Jabatan,
      pihak1Alamat: p.pihak1Alamat || undefined,
      pihak2Toko: p.pihak2Toko,
      pihak2Nama: p.pihak2Nama,
      pihak2Alamat: p.pihak2Alamat || undefined,
      items: parsedItems.length > 0 ? parsedItems : [
        {
          id: "1",
          no: 1,
          jenisBarang: "Barang Pengadaan Hibah",
          spesifikasi: "",
          jumlah: 1,
          satuan: "unit",
          hargaSatuan: p.totalHarga,
          totalHarga: p.totalHarga,
        },
      ],
      subtotal: p.subtotal,
      pajak: p.pajak,
      pajakKeterangan: p.pajakKeterangan || "- (Sudah Termasuk)",
      totalHarga: p.totalHarga,
      terbilang: p.terbilang,
      batasWaktu: batasIso,
      waktuPenyelesaian: p.waktuPenyelesaian || deskripsiWaktuPenyelesaian,
      alamatPengiriman: p.alamatPengiriman || "",
      alamatPemeriksaan: p.alamatPemeriksaan || "",
      dendaKeterlambatan: p.dendaKeterlambatan || "",
      receiptId: p.receiptId,
    });

    // Sinkronisasi komponen penomoran otomatis
    const decomp = deconstructDocumentNumber(p.nomorSp);
    setNomorUrutSp(decomp.nomorUrut);
    setFormatPatternSp(decomp.formatPattern);

    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
  };

  // Data pendamping Berita Acara (BAST) untuk Pratinjau Bundel 2 Halaman & Sinkronisasi
  const companionBastData: BastFormData = useMemo(() => {
    const matchedBast = bastList.find(
      (b) => b.nomorSpk === formData.nomorSp || (formData.receiptId && b.receiptId === formData.receiptId)
    );

    if (matchedBast) {
      let parsedItems: BastItem[] = [];
      try {
        parsedItems = JSON.parse(matchedBast.itemsJson) || [];
      } catch {
        parsedItems = [];
      }

      return {
        id: matchedBast.id,
        nomorBast: matchedBast.nomorBast,
        tanggal: matchedBast.tanggal ? new Date(matchedBast.tanggal).toISOString().split("T")[0] : (formData.batasWaktu || formData.tanggal),
        hariTanggal: matchedBast.hariTanggal,
        tanggalTerbilang: matchedBast.tanggalTerbilang,
        nomorSpk: matchedBast.nomorSpk || formData.nomorSp,
        tanggalSpk: matchedBast.tanggalSpk ? new Date(matchedBast.tanggalSpk).toISOString().split("T")[0] : formData.tanggal,
        namaKegiatan: matchedBast.namaKegiatan || formData.namaPaket,
        pihak1Nama: matchedBast.pihak1Nama || formData.pihak1Nama,
        pihak1Jabatan: matchedBast.pihak1Jabatan || formData.pihak1Jabatan,
        pihak2Nama: matchedBast.pihak2Nama || formData.pihak2Nama,
        pihak2Toko: matchedBast.pihak2Toko || formData.pihak2Toko,
        items: parsedItems.length > 0 ? parsedItems : formData.items.map((it, idx) => ({
          id: String(idx + 1),
          no: idx + 1,
          jenisBarang: it.jenisBarang,
          spesifikasi: it.spesifikasi || "Standar spesifikasi barang sesuai proposal NPHD",
          pesanan: `${it.jumlah} ${it.satuan || "unit"}`,
          realisasi: `${it.jumlah} ${it.satuan || "unit"}`,
          kondisi: "Baik",
        })),
        catatanUji: matchedBast.catatanUji || "Kondisi fisik utuh, kelengkapan aksesoris lengkap, fungsi operasional normal 100%.",
        statusUji: matchedBast.statusUji || "Lulus Uji Coba",
        fotoFisikNama: matchedBast.fotoFisikNama || "IMG_SERAHTERIMA_2026.jpg",
        geoTag: "Talang, Tegal (-6.9402, 109.1384)",
        receiptId: matchedBast.receiptId || formData.receiptId,
        linkedReceiptNominal: formData.totalHarga,
        linkedReceiptNomor: undefined,
      };
    }

    // Jika belum ada di database, susun BAST virtual langsung dari data SP yang sedang diedit
    const bastDate = formData.batasWaktu ? new Date(formData.batasWaktu) : (formData.tanggal ? new Date(formData.tanggal) : new Date());
    const { hariTanggal, terbilangResmi } = formatTanggalTerbilang(bastDate);

    // Derivasi nomor BAST dari nomor SP jika memungkinkan
    const derivedBastNo = formData.nomorSp.replace(/\/SP\//i, "/BAST-HB/").replace(/\/A\//i, "/BAST-HB/");

    return {
      nomorBast: derivedBastNo !== formData.nomorSp ? derivedBastNo : `01/BAST-HB/FTY/VII/2026`,
      tanggal: formData.batasWaktu || formData.tanggal || todayStr,
      hariTanggal,
      tanggalTerbilang: terbilangResmi,
      nomorSpk: formData.nomorSp,
      tanggalSpk: formData.tanggal,
      namaKegiatan: formData.namaPaket,
      pihak1Nama: formData.pihak1Nama,
      pihak1Jabatan: formData.pihak1Jabatan,
      pihak2Nama: formData.pihak2Nama,
      pihak2Toko: formData.pihak2Toko,
      items: formData.items.map((it, idx) => ({
        id: String(idx + 1),
        no: idx + 1,
        jenisBarang: it.jenisBarang,
        spesifikasi: it.spesifikasi || "Standar spesifikasi barang sesuai proposal NPHD",
        pesanan: `${it.jumlah} ${it.satuan || "unit"}`,
        realisasi: `${it.jumlah} ${it.satuan || "unit"}`,
        kondisi: "Baik",
      })),
      catatanUji: "Kondisi fisik utuh, kelengkapan aksesoris lengkap, fungsi operasional normal 100%.",
      statusUji: "Lulus Uji Coba",
      fotoFisikNama: "IMG_SERAHTERIMA_2026.jpg",
      geoTag: "Talang, Tegal (-6.9402, 109.1384)",
      receiptId: formData.receiptId,
      linkedReceiptNominal: formData.totalHarga,
    };
  }, [bastList, formData, todayStr]);

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
        nomorSp: formData.nomorSp,
        nomorBast: companionBastData.nomorBast,
      });
    } finally {
      setIsExportingBundle(false);
    }
  };

  // Handler ekspor langsung ke dokumen PDF Kertas F4 Portrait (215mm x 330mm) dengan Margin Jilid
  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    try {
      setIsExportingPdf(true);
      await exportPesananToPdf({
        elementId: "pesananPrintArea",
        nomorSp: formData.nomorSp,
        formData: formData,
        profile: profile,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handler cetak SP dengan judul dokumen otomatis untuk opsi Save as PDF
  const handlePrint = () => {
    const prevTitle = document.title;
    const cleanNo = (formData.nomorSp || "SP")
      .trim()
      .replace(/[/\\?%*:|"<>.]/g, "_")
      .replace(/\s+/g, "_");
    document.title = `Surat_Pesanan_${cleanNo}`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 2000);
  };

  // Add Item Row
  const handleAddItem = () => {
    const nextNo = formData.items.length + 1;
    const newItem: PesananItem = {
      id: String(Date.now()),
      no: nextNo,
      jenisBarang: "",
      spesifikasi: "",
      jumlah: 1,
      satuan: "unit",
      hargaSatuan: 0,
      totalHarga: 0,
    };
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  // Remove Item Row
  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) return;
    const updated = formData.items.filter((_, i) => i !== index).map((it, idx) => ({
      ...it,
      no: idx + 1,
    }));
    const newSubtotal = updated.reduce((s, it) => s + it.totalHarga, 0);
    const newTotal = newSubtotal + (formData.pajak || 0);
    setFormData((prev) => ({
      ...prev,
      items: updated,
      subtotal: newSubtotal,
      totalHarga: newTotal,
      terbilang: angkaKeTerbilang(newTotal),
    }));
  };

  // Update Item field
  const handleUpdateItem = (
    index: number,
    field: keyof PesananItem,
    value: string | number
  ) => {
    const updated = [...formData.items];
    const current = { ...updated[index], [field]: value };

    if (field === "jumlah" || field === "hargaSatuan") {
      const jml = field === "jumlah" ? Number(value) : current.jumlah;
      const hrg = field === "hargaSatuan" ? Number(value) : current.hargaSatuan;
      current.totalHarga = Math.max(0, jml) * Math.max(0, hrg);
    }

    updated[index] = current;
    const newSubtotal = updated.reduce((s, it) => s + it.totalHarga, 0);
    const newTotal = newSubtotal + (formData.pajak || 0);

    setFormData((prev) => ({
      ...prev,
      items: updated,
      subtotal: newSubtotal,
      totalHarga: newTotal,
      terbilang: angkaKeTerbilang(newTotal),
    }));
  };

  // Handle Save
  const handleSave = () => {
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    swalLoading("Menyimpan Surat Pesanan...", "Sedang menyimpan dokumen pengadaan barang...");
    startTransition(async () => {
      const res = await savePurchaseOrderAction(formData);
      if (res.success && res.data) {
        setSaveSuccessMsg(res.message);
        setFormData((prev) => ({ ...prev, id: res.data!.id }));
        setPesananList((prev) => {
          const idx = prev.findIndex((x) => x.id === res.data!.id || x.nomorSp === res.data!.nomorSp);
          if (idx >= 0) {
            const nextList = [...prev];
            nextList[idx] = res.data!;
            return nextList;
          }
          return [res.data!, ...prev];
        });
        swalSuccess("Surat Pesanan Disimpan!", res.message);
      } else {
        const err = res.message || "Gagal menyimpan Surat Pesanan.";
        setSaveErrorMsg(err);
        swalError("Gagal Menyimpan", err);
      }
    });
  };

  const handleDeletePesananById = async (targetId: string, targetNomorSp: string) => {
    const isConfirmed = await swalConfirmDelete({
      title: "Hapus Surat Pesanan?",
      text: `Apakah Anda yakin ingin menghapus Surat Pesanan "${targetNomorSp}" secara permanen? Realisasi belanja terkait akan dibebaskan kembali.`,
      confirmText: "Ya, Hapus!",
      cancelText: "Batal",
    });
    if (!isConfirmed) return;

    swalLoading("Menghapus...", "Sedang menghapus dokumen Surat Pesanan...");
    startTransition(async () => {
      const res = await deletePurchaseOrderAction(targetId);
      if (res.success) {
        setPesananList((prev) => prev.filter((p) => p.id !== targetId));
        if (formData.id === targetId) {
          handleCreateNew();
        }
        swalSuccess("Berhasil Dihapus!", res.message || "Surat Pesanan berhasil dihapus.");
      } else {
        swalError("Gagal Menghapus", res.message || "Gagal menghapus Surat Pesanan.");
      }
    });
  };

  const handleDeletePesanan = async () => {
    if (!formData.id) return;
    await handleDeletePesananById(formData.id, formData.nomorSp);
  };

  const handleEditPesanan = (p: PurchaseOrder) => {
    loadPesananIntoForm(p);
    setMobileTab("form");
    const el = document.getElementById("pesananInputForm");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCreateNew = () => {
    const nextUrut = String(pesananList.length + 1).padStart(2, "0");
    setNomorUrutSp(nextUrut);
    const nextNomor = buildFormattedDocumentNumber(nextUrut, formatPatternSp, todayStr);
    setIsManualNomorSp(false);

    setFormData({
      nomorSp: nextNomor,
      tanggal: todayStr,
      namaPaket: "Pengadaan Sarana Sound Aktif & Alat Hadroh",
      pihak1Nama: defaultChairman,
      pihak1Jabatan: `Ketua ${defaultInstitution}`,
      pihak1Alamat: profile?.alamat || "Jl. Kemuning 2016 Desa Dawuhan RT.23 RW.06",
      pihak2Toko: "SURYA MAS",
      pihak2Nama: "ANSHORI",
      pihak2Alamat: "Jl. Raya Selatan No. 23 Tembok Luwung",
      items: [
        {
          id: String(Date.now()),
          no: 1,
          jenisBarang: "Sound Aktif Portable Professional 15 Inch",
          spesifikasi: "Kelengkapan: Mic Wireless 2 buah, Bluetooth, Aki Kering",
          jumlah: 1,
          satuan: "unit",
          hargaSatuan: 3000000,
          totalHarga: 3000000,
        },
      ],
      subtotal: 3000000,
      pajak: 0,
      pajakKeterangan: "- (Sudah Termasuk)",
      totalHarga: 3000000,
      terbilang: "Tiga Juta Rupiah",
      batasWaktu: todayStr,
      waktuPenyelesaian: "1 (satu) hari kalender",
      alamatPengiriman: "Tempat / Gudang Toko Surya Mas",
      alamatPemeriksaan: "Sekretariat PR Fatayat NU Dawuhan Selatan",
      dendaKeterlambatan: "Denda 1/500 dari nilai pesanan sebelum pajak untuk setiap hari keterlambatan.",
      receiptId: null,
    });
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
  };

  const matchedBast = bastList.find(
    (b) => b.nomorSpk === formData.nomorSp || (formData.receiptId && b.receiptId === formData.receiptId)
  );

  return (
    <div className="w-full">
      {/* ================= TOP SUB-HEADER COMMAND RIBBON ================= */}
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
            <div className="flex items-center gap-2 font-mono text-slate-300">
              <span className="text-slate-400">SP No:</span>
              <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {formData.nomorSp}
              </span>
              <span className="px-2 py-0.5 bg-teal-950 border border-teal-700/60 text-teal-300 rounded font-semibold text-[11px]">
                Dokumen Kontrak Pengadaan
              </span>
            </div>
            <span className="text-slate-600">•</span>
            <Link
              href={matchedBast ? `/user/bast?no=${encodeURIComponent(matchedBast.nomorBast)}` : `/user/bast?spNo=${encodeURIComponent(formData.nomorSp)}`}
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              <FileCheck className="w-4 h-4" />
              <span>Berita Acara (BAST)</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setIsKopModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-[#004532]/80 hover:bg-[#004532] border border-[#006c4e] text-emerald-300 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm btn-press hover:shadow-emerald-950/40"
              title="Sesuaikan Kop Surat, Logo Cloudinary, dan Nomor Lembaga"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Atur Kop & Logo</span>
            </button>

            <button
              type="button"
              onClick={handleCreateNew}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 btn-press hover:text-white"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Surat Pesanan Baru (+)</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/50 text-white text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 btn-press hover:shadow-emerald-900/50"
              title="Ekspor Surat Pesanan langsung ke file PDF ukuran F4 Portrait (215mm x 330mm) dengan margin jilid"
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

      {/* ================= WORKSPACE (Left Form : Right A4 Preview) ================= */}
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
            <span>Formulir Input SP</span>
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
            <span>Pratinjau Lembar A4 (Live)</span>
          </button>
        </div>

        {/* ================= ALUR DOKUMEN PENGADAAN TERPADU ================= */}
        <div className="mb-6 w-full">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                1 Realisasi Pembelian Pengadaan Nyambung:
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                (Surat Pesanan &amp; Berita Acara Terhubung)
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-950 border border-teal-600/80 text-teal-300 font-bold shadow-[0_0_12px_rgba(20,184,166,0.25)]">
                <ShoppingBag className="w-3.5 h-3.5 text-teal-400" />
                <span>1. Surat Pesanan (SP)</span>
              </div>

              <span className="text-slate-600 font-bold">➔</span>

              <Link
                href={matchedBast ? `/user/bast?no=${encodeURIComponent(matchedBast.nomorBast)}` : `/user/bast?spNo=${encodeURIComponent(formData.nomorSp)}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all btn-press font-medium border border-slate-700/60 shadow-xs"
              >
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Berita Acara (BAST)</span>
                {matchedBast && (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-[10px] text-emerald-300 border border-emerald-700/50">
                    Ada
                  </span>
                )}
              </Link>

              <span className="text-slate-600 font-bold">➔</span>

              <Link
                href="/user/kwitansi"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all btn-press font-medium border border-slate-700/60 shadow-xs"
              >
                <ReceiptIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>3. Kwitansi Belanja</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* ================= LEFT COLUMN: FORM SETTINGS (5 Cols) ================= */}
          <div
            id="pesananInputForm"
            className={`xl:col-span-5 flex-col gap-6 scroll-mt-6 ${mobileTab === "preview" ? "hidden xl:flex" : "flex"}`}
          >
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 sm:p-6 flex flex-col gap-5">
              {/* Mode Edit vs Baru Banner */}
              {formData.id ? (
                <div className="p-3 bg-amber-950/40 border border-amber-600/50 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-300">Mode Edit Surat Pesanan</p>
                      <p className="text-[11px] text-amber-200/80 font-mono">
                        Sedang mengedit: <span className="font-bold">{formData.nomorSp}</span>
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
                    <span className="text-xs text-slate-300 font-medium">Mode Pembuatan SP Baru</span>
                  </div>
                </div>
              )}

              {/* Card Header & Database Picker */}
              <div className="flex flex-col gap-2 pb-4 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    Pilih Arsip Surat Pesanan ({pesananList.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>Baru (+)</span>
                  </button>
                </div>

                <select
                  value={formData.id || ""}
                  onChange={(e) => {
                    if (!e.target.value) {
                      handleCreateNew();
                      return;
                    }
                    const found = pesananList.find((p) => p.id === e.target.value);
                    if (found) loadPesananIntoForm(found);
                  }}
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Buat Baru / Pilih Arsip Tersimpan --</option>
                  {pesananList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nomorSp} • Rp {p.totalHarga.toLocaleString("id-ID")} • {p.pihak2Toko}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tautkan dari Kwitansi Picker */}
              <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <ReceiptIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tautkan dari Kwitansi Belanja:</span>
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
                  <option value="">-- Pilih Kwitansi Belanja (Otomatis Isi Data) --</option>
                  {initialReceipts.map((rc) => {
                    const linkedSP = pesananList.find(
                      (p) => p.receiptId === rc.id && p.id !== formData.id
                    );
                    const isAlreadyLinked = Boolean(linkedSP);

                    return (
                      <option
                        key={rc.id}
                        value={rc.id}
                        disabled={isAlreadyLinked}
                        className={isAlreadyLinked ? "text-slate-500 bg-slate-950" : "text-white bg-slate-900"}
                      >
                        {rc.nomorBukti} - Rp {rc.nominal.toLocaleString("id-ID")} ({rc.uraian?.substring(0, 35)}...)
                        {isAlreadyLinked ? ` ⚠️ (Sudah ada SP: ${linkedSP?.nomorSp})` : ""}
                      </option>
                    );
                  })}
                </select>
                {formData.receiptId && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Terkait dengan Kwitansi (
                      {initialReceipts.find((r) => r.id === formData.receiptId)?.nomorBukti || "Kwitansi"}
                      )
                    </span>
                  </div>
                )}
              </div>

              {/* Tautan Berita Acara (BAST) Terkait */}
              {matchedBast ? (
                <div className="bg-emerald-950/40 border border-emerald-700/60 p-3.5 rounded-xl flex flex-col gap-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Berita Acara (BAST) Terhubung:</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 text-[10px] font-bold border border-emerald-700/50">
                      1 Realisasi Lengkap
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-emerald-800/40">
                    <div>
                      <p className="font-mono text-xs font-bold text-white">{matchedBast.nomorBast}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Serah Terima: {matchedBast.tanggal ? formatDateIndo(matchedBast.tanggal) : "-"} • {matchedBast.statusUji || "Lulus Uji Coba"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewMode("bundel")}
                        className="px-2.5 py-1 rounded bg-teal-900/60 hover:bg-teal-800 text-teal-200 border border-teal-700/60 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Lihat Bundel
                      </button>
                      <Link
                        href={`/user/bast?no=${encodeURIComponent(matchedBast.nomorBast)}`}
                        className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <span>Buka BAST</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-teal-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Belum Ada BAST untuk SP Ini</p>
                      <p className="text-[11px] text-slate-400">Hubungkan surat pesanan dengan berita acara untuk 1 bundel pengadaan lengkap.</p>
                    </div>
                  </div>
                  <Link
                    href={`/user/bast?spNo=${encodeURIComponent(formData.nomorSp)}`}
                    className="px-3 py-1.5 rounded-lg bg-teal-950 hover:bg-teal-900 text-teal-300 border border-teal-700/60 text-xs font-semibold shrink-0 transition-colors flex items-center gap-1"
                  >
                    <span>+ Buat BAST</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* Section 1: Parameter Nomor & Tanggal */}
              <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>1. Nomor & Tanggal Surat Pesanan</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsManualNomorSp(!isManualNomorSp)}
                    className="text-[11px] text-slate-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isManualNomorSp ? "Beralih ke Mode Otomatis" : "Edit Teks Manual Bebas"}</span>
                  </button>
                </div>

                {!isManualNomorSp ? (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    {/* No. Urut */}
                    <div className="md:col-span-2">
                      <label className="text-[11px] text-slate-300 font-medium block mb-1">
                        No. Urut
                      </label>
                      <input
                        type="text"
                        value={nomorUrutSp}
                        onChange={(e) => handleNomorUrutChange(e.target.value)}
                        placeholder="02"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-mono text-xs text-white text-center font-bold focus:outline-none focus:border-emerald-500"
                        title="Nomor urut surat (contoh: 01, 02, 03)"
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
                          value={formatPatternSp}
                          onChange={(e) => handleFormatPatternChange(e.target.value)}
                          placeholder="/A/PR.FNU/"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-mono text-xs text-amber-300 font-bold focus:outline-none focus:border-emerald-500"
                          title="Format penomoran instansi (contoh: /A/PR.FNU/)"
                        />
                        {formatPatternSp !== profile?.formatNomorSp && (
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

                    {/* Tanggal Surat Pesanan */}
                    <div className="md:col-span-5">
                      <label className="text-[11px] text-slate-300 font-medium block mb-1">
                        Tanggal Surat Pesanan
                      </label>
                      <input
                        type="date"
                        value={formData.tanggal}
                        onChange={(e) => handleTanggalSpChange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]"
                      />
                    </div>

                    {/* Banner Hasil Penomoran Otomatis */}
                    <div className="md:col-span-12 bg-slate-900/90 border border-emerald-700/40 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Nomor SP Otomatis:</span>
                        <span className="font-mono text-xs sm:text-sm font-bold text-emerald-300 tracking-wide">
                          {formData.nomorSp}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 font-semibold">
                          Bulan: {deconstructDocumentNumber(formData.nomorSp).romanMonth}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 font-semibold">
                          Tahun: {deconstructDocumentNumber(formData.nomorSp).year}
                        </span>
                        <span className="text-slate-500 hidden sm:inline">(Otomatis dari tanggal)</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 font-medium block mb-1">
                        Nomor Surat Pesanan (SP) - Edit Manual Bebas
                      </label>
                      <input
                        type="text"
                        value={formData.nomorSp}
                        onChange={(e) =>
                          setFormData({ ...formData, nomorSp: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-mono text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 font-medium block mb-1">
                        Tanggal Surat Pesanan
                      </label>
                      <input
                        type="date"
                        value={formData.tanggal}
                        onChange={(e) => handleTanggalSpChange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>Titimangsa TTD: {extractNamaTempat(profile, "Dawuhan")}, {formatDateIndo(formData.tanggal)}</span>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Paket Pekerjaan / Rincian Pengadaan
                  </label>
                  <input
                    type="text"
                    value={formData.namaPaket}
                    onChange={(e) =>
                      setFormData({ ...formData, namaPaket: e.target.value })
                    }
                    placeholder="Contoh: Pengadaan Sarana Sound Aktif & Alat Hadroh"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Section 2: Pihak Kedua (Penyedia Rekanan) */}
              <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  2. Pihak Kedua (Penyedia / Toko Rekanan)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">
                      Nama Toko / Perusahaan
                    </label>
                    <input
                      type="text"
                      value={formData.pihak2Toko}
                      onChange={(e) =>
                        setFormData({ ...formData, pihak2Toko: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">
                      Nama Pimpinan / Pemilik Toko
                    </label>
                    <input
                      type="text"
                      value={formData.pihak2Nama}
                      onChange={(e) =>
                        setFormData({ ...formData, pihak2Nama: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Alamat Toko Penyedia
                  </label>
                  <input
                    type="text"
                    value={formData.pihak2Alamat || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, pihak2Alamat: e.target.value })
                    }
                    placeholder="Contoh: Jl. Raya Selatan No. 23 Tembok Luwung"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Section 3: Rincian Barang & Kalkulasi Harga Otomatis */}
              <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    3. Rincian Item Barang & Harga
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>+ Tambah Baris</span>
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
                          Item #{item.no}
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
                          Nama Barang
                        </label>
                        <input
                          type="text"
                          value={item.jenisBarang}
                          onChange={(e) =>
                            handleUpdateItem(idx, "jenisBarang", e.target.value)
                          }
                          placeholder="Contoh: Sound Aktif Portable 15 Inch"
                          className="w-full text-xs font-medium bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Spesifikasi / Kelengkapan
                        </label>
                        <input
                          type="text"
                          value={item.spesifikasi || ""}
                          onChange={(e) =>
                            handleUpdateItem(idx, "spesifikasi", e.target.value)
                          }
                          placeholder="Mic wireless 2 buah, aki kering, bluetooth..."
                          className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">
                            Jumlah
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.jumlah}
                            onChange={(e) =>
                              handleUpdateItem(idx, "jumlah", Number(e.target.value))
                            }
                            className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">
                            Satuan
                          </label>
                          <input
                            type="text"
                            value={item.satuan}
                            onChange={(e) =>
                              handleUpdateItem(idx, "satuan", e.target.value)
                            }
                            placeholder="unit"
                            className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">
                            Harga Satuan (Rp)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.hargaSatuan}
                            onChange={(e) =>
                              handleUpdateItem(idx, "hargaSatuan", Number(e.target.value))
                            }
                            className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="text-right text-xs text-slate-400 pt-1 border-t border-slate-800">
                        Subtotal Item:{" "}
                        <strong className="text-emerald-400 font-mono">
                          Rp {item.totalHarga.toLocaleString("id-ID")}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Summary */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Total Anggaran Surat Pesanan:
                  </span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    Rp {formData.totalHarga.toLocaleString("id-ID")},-
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 italic">
                  Terbilang: <strong className="text-emerald-300">"{formData.terbilang}"</strong>
                </div>
              </div>

              {/* Section 4: Ketentuan & Klausul Pengiriman */}
              <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>4. Klausul Batas Waktu & Waktu Penyelesaian</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-teal-950/80 border border-teal-700/60 text-teal-300 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Deskripsi Otomatis</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">
                      Batas Waktu Penerimaan (Klausul 2)
                    </label>
                    <input
                      type="date"
                      value={formData.batasWaktu}
                      onChange={(e) => handleBatasWaktuChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]"
                    />
                    <span className="text-[11px] text-slate-400 block mt-1">
                      Diterima: <strong className="text-emerald-300">{formatDateIndo(formData.batasWaktu)}</strong>
                    </span>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">
                      Durasi Penyelesaian (Hari Kalender)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={durasiHari}
                        onChange={(e) => handleDurasiHariChange(Number(e.target.value))}
                        className="w-20 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                      <span className="text-xs text-slate-400">Hari</span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {[1, 3, 4, 7, 14].map((dPreset) => (
                          <button
                            key={dPreset}
                            type="button"
                            onClick={() => handleDurasiHariChange(dPreset)}
                            className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all ${
                              durasiHari === dPreset
                                ? "bg-teal-600 border-teal-500 text-white shadow-sm"
                                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                            }`}
                          >
                            {dPreset} Hari
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Indikator Panduan Otomatisasi Perhitungan Tanggal SP dari Nota */}
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between text-emerald-300 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Perhitungan Otomatis Tanggal SP
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-700/50">
                      Hitung Mundur Kalender
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Nota Selesai: <strong className="text-white">{formatDateIndo(formData.batasWaktu)}</strong> • Durasi: <strong className="text-white">{durasiHari} Hari Kalender</strong> • Tanggal SP Otomatis: <strong className="text-emerald-300 underline underline-offset-2">{formatDateIndo(formData.tanggal)}</strong>
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-300 font-medium flex items-center gap-1">
                      <span>Deskripsi Klausul 3 (Waktu Penyelesaian)</span>
                      <span className="text-[10px] text-teal-400 font-mono">(Mengikuti Tanggal)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const { deskripsiWaktuPenyelesaian } = calculateDurasiDanDeskripsi(
                          formData.tanggal,
                          formData.batasWaktu
                        );
                        setFormData((prev) => ({
                          ...prev,
                          waktuPenyelesaian: deskripsiWaktuPenyelesaian,
                        }));
                      }}
                      className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
                      title="Generate ulang deskripsi dari tanggal SP dan tanggal batas waktu"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate Ulang Deskripsi</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={formData.waktuPenyelesaian}
                    onChange={(e) =>
                      setFormData({ ...formData, waktuPenyelesaian: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-teal-800/60 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Tempat Pemeriksaan & Uji Fisik
                  </label>
                  <input
                    type="text"
                    value={formData.alamatPemeriksaan}
                    onChange={(e) =>
                      setFormData({ ...formData, alamatPemeriksaan: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
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

              {/* Action Buttons Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleSave}
                    className="px-4 py-2.5 bg-[#006c4e] hover:bg-[#004532] text-white text-xs font-semibold rounded-xl transition-all shadow-md hover:shadow-emerald-900/40 flex items-center gap-2 disabled:opacity-50 btn-press cursor-pointer"
                  >
                    {isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{formData.id ? "Simpan Perubahan SP" : "Simpan Surat Pesanan"}</span>
                  </button>

                  {formData.id && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleDeletePesanan}
                      className="px-3.5 py-2.5 bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 text-xs font-semibold rounded-xl transition-all btn-press flex items-center gap-1.5 cursor-pointer"
                      title="Hapus Dokumen Surat Pesanan Ini"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                      <span>Hapus</span>
                    </button>
                  )}

                  <Link
                    href={matchedBast ? `/user/bast?no=${encodeURIComponent(matchedBast.nomorBast)}` : `/user/bast?spNo=${encodeURIComponent(formData.nomorSp)}`}
                    className="px-3.5 py-2.5 bg-teal-950/80 hover:bg-teal-900 border border-teal-700/60 text-teal-300 text-xs font-semibold rounded-xl transition-all btn-press flex items-center gap-1.5 shadow-sm"
                  >
                    <FileCheck className="w-4 h-4 text-teal-400" />
                    <span>{matchedBast ? "Buka BAST Terkait ➔" : "Buat BAST dari SP ➔"}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleExportBundlePdf}
                    disabled={isExportingBundle}
                    className="px-3.5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md hover:shadow-teal-900/40 flex items-center gap-1.5 disabled:opacity-50 btn-press cursor-pointer"
                    title="Unduh 2 Halaman Lengkap (SP + BAST) Sekaligus dalam 1 Dokumen PDF F4"
                  >
                    {isExportingBundle ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Layers className="w-4 h-4" />
                    )}
                    <span>Unduh Bundel (SP + BAST)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={isExportingPdf}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/50 text-white text-xs font-semibold rounded-xl transition-all shadow-sm hover:shadow-emerald-900/40 flex items-center gap-2 disabled:opacity-50 btn-press cursor-pointer"
                    title="Unduh langsung PDF F4 Portrait dengan Margin Jilid Kiri"
                  >
                    {isExportingPdf ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileDown className="w-4 h-4" />
                    )}
                    <span>Ekspor SP (F4)</span>
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
          </div>

          {/* ================= RIGHT COLUMN: Exact A4/F4 Physical Printed Document Preview (7 Cols) ================= */}
          <div className={`xl:col-span-7 flex-col gap-4 items-center w-full ${mobileTab === "form" ? "hidden xl:flex" : "flex"}`}>
            {/* Live Document Control Header Bar */}
            <div className="w-full max-w-[780px] bg-slate-900 border border-slate-800 rounded-xl px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-sm">
              {/* TABS PREVIEW SWITCHER */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewMode("sp")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all btn-press cursor-pointer ${
                    previewMode === "sp"
                      ? "bg-teal-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Surat Pesanan (SP)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("bast")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all btn-press cursor-pointer ${
                    previewMode === "bast"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Berita Acara (BAST)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("bundel")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all btn-press flex items-center gap-1.5 cursor-pointer ${
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
                  onClick={handleExportBundlePdf}
                  disabled={isExportingBundle}
                  className="ml-1 sm:ml-2 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all border border-emerald-400/40 disabled:opacity-50 btn-press cursor-pointer"
                  title="Unduh Bundel 2 Halaman (SP + BAST) Sekaligus dalam 1 Dokumen PDF F4"
                >
                  {isExportingBundle ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Layers className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">Unduh Bundel (F4)</span>
                  <span className="sm:hidden">Bundel</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all border border-emerald-500/40 disabled:opacity-50 btn-press cursor-pointer"
                  title="Ekspor PDF F4 Portrait Surat Pesanan"
                >
                  {isExportingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">Ekspor SP</span>
                  <span className="sm:hidden">SP</span>
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

            {/* Canvas Container with dynamic zoom and multi-mode view */}
            <div className="w-full overflow-x-auto pb-6 flex flex-col items-center">
              <div
                className="transition-transform origin-top shrink-0 flex flex-col items-center gap-6"
                style={{
                  transform: `scale(${zoomScale / 100})`,
                  transformOrigin: "top center",
                }}
              >
                {/* MODE 1: HANYA SURAT PESANAN */}
                {previewMode === "sp" && (
                  <>
                    <PesananCanvas
                      data={formData}
                      profile={profile}
                      institutionName={userProfile?.institution || undefined}
                    />
                    {/* Companion off-screen element for PDF bundle capture */}
                    <div style={{ position: "absolute", left: "-9999px", top: 0 }} aria-hidden="true">
                      <BastCanvas
                        data={companionBastData}
                        profile={profile}
                        institutionName={userProfile?.institution || undefined}
                      />
                    </div>
                  </>
                )}

                {/* MODE 2: HANYA BAST */}
                {previewMode === "bast" && (
                  <>
                    <div className="w-full max-w-[780px] text-center py-2 text-xs text-emerald-300 font-semibold bg-slate-900 border border-emerald-800/60 rounded-xl">
                      Berita Acara Terkait: <strong>{companionBastData.nomorBast}</strong> (Hasil Realisasi Pesanan Ini)
                    </div>
                    <BastCanvas
                      data={companionBastData}
                      profile={profile}
                      institutionName={userProfile?.institution || undefined}
                    />
                    {/* Companion off-screen element for PDF bundle capture */}
                    <div style={{ position: "absolute", left: "-9999px", top: 0 }} aria-hidden="true">
                      <PesananCanvas
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
                      data={formData}
                      profile={profile}
                      institutionName={userProfile?.institution || undefined}
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
                      data={companionBastData}
                      profile={profile}
                      institutionName={userProfile?.institution || undefined}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================= DAFTAR ARSIP SURAT PESANAN (TABEL REKAP & MANAJEMEN) ================= */}
        <div className="w-full mt-10 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Daftar Arsip Surat Pesanan (SP)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 text-xs font-mono font-semibold">
                    {pesananList.length} Dokumen
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kelola, edit rincian item/toko, cetak berkas, atau hapus surat pesanan belanja hibah.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCreateNew}
              className="px-3.5 py-2 rounded-xl bg-[#006c4e] hover:bg-[#004532] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Surat Pesanan Baru</span>
            </button>
          </div>

          {pesananList.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center text-slate-500">
              <ShoppingBag className="w-12 h-12 text-slate-600 mb-3 stroke-[1.5]" />
              <p className="text-sm font-semibold text-slate-300">Belum Ada Arsip Surat Pesanan</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                Silakan isi formulir di atas dan klik &quot;Simpan Surat Pesanan&quot; untuk mengarsipkan dokumen pesanan resmi.
              </p>
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/60">
                    <th className="py-3 px-4">No. SP & Tanggal</th>
                    <th className="py-3 px-4">Paket Pekerjaan</th>
                    <th className="py-3 px-4">Rekanan / Toko</th>
                    <th className="py-3 px-4 text-right">Nilai Pesanan</th>
                    <th className="py-3 px-4 text-center">Tautan Realisasi</th>
                    <th className="py-3 px-4 text-center">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {pesananList.map((p) => {
                    const isEditing = formData.id === p.id;
                    const linkedRc = initialReceipts.find((r) => r.id === p.receiptId);

                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors hover:bg-slate-800/40 ${
                          isEditing ? "bg-amber-950/20 border-l-4 border-amber-500" : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-white flex items-center gap-1.5">
                            <span>{p.nomorSp}</span>
                            {isEditing && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/30 text-amber-300 rounded border border-amber-500/50">
                                Aktif di Form
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{p.tanggal ? formatDateIndo(p.tanggal) : "-"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-200 font-medium line-clamp-1">
                            {p.namaPaket}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Pihak Kesatu: {p.pihak1Nama}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-200 font-medium block">
                            {p.pihak2Toko}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Penerima: {p.pihak2Nama}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-mono font-bold text-emerald-400">
                            Rp {p.totalHarga.toLocaleString("id-ID")}
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
                              onClick={() => handleEditPesanan(p)}
                              className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/60 text-blue-300 hover:text-blue-100 text-xs font-medium transition-colors flex items-center gap-1"
                              title="Edit Surat Pesanan Ini"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                loadPesananIntoForm(p);
                                setTimeout(() => handleExportPdf(), 250);
                              }}
                              className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 hover:text-white text-xs transition-colors flex items-center gap-1"
                              title="Ekspor PDF F4 Surat Pesanan Ini"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                loadPesananIntoForm(p);
                                setTimeout(() => handlePrint(), 200);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs transition-colors flex items-center gap-1"
                              title="Cetak Surat Pesanan Ini"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">Cetak</span>
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleDeletePesananById(p.id, p.nomorSp)}
                              className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 hover:text-red-100 text-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                              title="Hapus Surat Pesanan Ini"
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
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Kembali ke Formulir</span>
          </button>
        )}
      </div>

      {/* Modal Pengaturan Kop Surat & Logo Cloudinary */}
      <KopSuratModal
        isOpen={isKopModalOpen}
        onClose={() => setIsKopModalOpen(false)}
        initialProfile={profile}
        onProfileUpdated={(updated) => {
          setProfile(updated);
          if (updated.formatNomorSp) {
            setFormatPatternSp(updated.formatNomorSp);
            if (typeof window !== "undefined") {
              localStorage.setItem("sp_format_pattern", updated.formatNomorSp);
            }
            if (!isManualNomorSp) {
              const nextNomor = buildFormattedDocumentNumber(nomorUrutSp, updated.formatNomorSp, formData.tanggal);
              setFormData((prev) => ({
                ...prev,
                nomorSp: nextNomor,
                pihak1Nama: updated.namaKetua || prev.pihak1Nama,
                pihak1Jabatan: updated.jabatanKetua || prev.pihak1Jabatan,
                pihak1Alamat: updated.alamat || prev.pihak1Alamat,
              }));
              return;
            }
          }
          setFormData((prev) => ({
            ...prev,
            pihak1Nama: updated.namaKetua || prev.pihak1Nama,
            pihak1Jabatan: updated.jabatanKetua || prev.pihak1Jabatan,
            pihak1Alamat: updated.alamat || prev.pihak1Alamat,
          }));
        }}
      />
    </div>
  );
}
