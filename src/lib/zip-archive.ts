import JSZip from "jszip";
import { jsPDF } from "jspdf";
import { generateBkuPdf } from "./bku-pdf";
import { angkaKeTerbilang } from "./utils/terbilang";
import { formatUraianBelanja, cleanAndFormatTitle } from "./utils/title-case";
import { cleanPihakJabatan, formatPihak2Jabatan } from "./utils/pesanan-date";
import type { LpjArchiveData } from "@/app/actions/archive.action";
import type { Receipt, PurchaseOrder, BastDocument, BastItem, PesananItem } from "@/types";

export interface ZipArchiveProgress {
  step: string;
  percent: number;
}

/**
 * Helper untuk format Rupiah
 */
function fmtRupiah(num: number): string {
  return "Rp " + Math.round(num).toLocaleString("id-ID");
}

/**
 * 1. Generator PDF Sampul Cover LPJ (F4 Portrait: 215mm x 330mm)
 */
function createCoverPdf(data: LpjArchiveData): Blob {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [215, 330],
  });

  const pageWidth = 215;
  const pageHeight = 330;
  const margin = 20;

  // Bingkai Ganda Luar & Dalam
  doc.setLineWidth(1.2);
  doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);
  doc.setLineWidth(0.4);
  doc.rect(margin + 2.5, margin + 2.5, pageWidth - (margin + 2.5) * 2, pageHeight - (margin + 2.5) * 2);

  let y = margin + 35;

  // Judul Besar Laporan
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("LAPORAN PERTANGGUNGJAWABAN (LPJ)", pageWidth / 2, y, { align: "center" });
  y += 7;

  doc.setFontSize(13);
  doc.text("PENGGUNAAN DANA BANTUAN HIBAH DAERAH", pageWidth / 2, y, { align: "center" });
  y += 7;

  doc.setFontSize(14);
  doc.text(`TAHUN ANGGARAN ${data.tahun}`, pageWidth / 2, y, { align: "center" });
  y += 25;

  // Logo Placeholder / Emblem
  doc.setFillColor(240, 243, 246);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(pageWidth / 2 - 25, y, 50, 50, 4, 4, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(16, 185, 129);
  doc.text("LPJ", pageWidth / 2, y + 27, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("HIBAH DAERAH", pageWidth / 2, y + 36, { align: "center" });
  doc.setTextColor(0, 0, 0);
  y += 65;

  // Identitas Lembaga Penerima
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Diajukan dan Dipertanggungjawabkan Oleh:", pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const lembaga = data.profile?.namaLembaga || data.user.institution || "PR FATAYAT NU DAWUHAN SELATAN";
  doc.text(lembaga.toUpperCase(), pageWidth / 2, y, { align: "center" });
  y += 6;

  if (data.profile?.subNama) {
    doc.setFontSize(12);
    doc.text(data.profile.subNama.toUpperCase(), pageWidth / 2, y, { align: "center" });
    y += 6;
  }

  if (data.profile?.instansiInduk) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(data.profile.instansiInduk.toUpperCase(), pageWidth / 2, y, { align: "center" });
    y += 8;
  }

  // Alamat & Registrasi
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "italic");
  const alamat = data.profile?.alamat || "Kecamatan Talang, Kabupaten Tegal";
  doc.text(alamat, pageWidth / 2, y, { align: "center" });
  y += 4;

  const noReg = data.profile?.noRegistrasi || `HBH-${data.tahun}-REG`;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Nomor Registrasi: ${noReg}`, pageWidth / 2, y, { align: "center" });

  // Bagian Bawah: Lokasi & Tahun
  y = pageHeight - margin - 25;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("KABUPATEN TEGAL", pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.text(`TAHUN ${data.tahun}`, pageWidth / 2, y, { align: "center" });

  return doc.output("blob");
}

/**
 * 2. Generator PDF Surat Pengantar LPJ (F4 Portrait)
 */
function createSuratPengantarPdf(data: LpjArchiveData): Blob {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [215, 330],
  });

  const pageWidth = 215;
  const margin = 20;
  let y = margin;

  // Kop Lembaga
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  const lembaga = data.profile?.namaLembaga || data.user.institution || "PR FATAYAT NU";
  doc.text(lembaga.toUpperCase(), pageWidth / 2, y, { align: "center" });
  y += 5;

  if (data.profile?.subNama) {
    doc.setFontSize(10.5);
    doc.text(data.profile.subNama.toUpperCase(), pageWidth / 2, y, { align: "center" });
    y += 5;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(data.profile?.alamat || "Kecamatan Talang Kabupaten Tegal", pageWidth / 2, y, { align: "center" });
  y += 4;

  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 0.8;
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Tanggal & Nomor Surat
  doc.setFontSize(9.5);
  const tglSurat = `Talang, 31 Desember ${data.tahun}`;
  doc.text(tglSurat, pageWidth - margin, y, { align: "right" });
  y += 6;

  const noSurat = `01/LPJ-HB/${data.profile?.subNama || "FNU"}/${data.tahun}`;
  doc.text(`Nomor     : ${noSurat}`, margin, y);
  y += 5;
  doc.text("Lampiran : 1 (satu) Berkas Dokumen Lengkap", margin, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text(`Perihal    : Laporan Pertanggungjawaban (LPJ) Hibah TA ${data.tahun}`, margin, y);
  doc.setFont("helvetica", "normal");
  y += 10;

  // Tujuan Surat
  doc.text("Kepada Yth.", margin, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Bupati Tegal", margin, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.text("c.q. Kepala Badan Kesatuan Bangsa dan Politik / Bagian Kesra", margin, y);
  y += 4;
  doc.text("di - Slawi", margin, y);
  y += 10;

  // Salam & Pembuka
  doc.setFont("helvetica", "italic");
  doc.text("Assalamu'alaikum Warahmatullahi Wabarakatuh,", margin, y);
  doc.setFont("helvetica", "normal");
  y += 7;

  const p1 = `Bersama ini kami sampaikan Laporan Pertanggungjawaban (LPJ) Penggunaan Belanja Bantuan Hibah Daerah Pemerintah Kabupaten Tegal Tahun Anggaran ${data.tahun} yang telah kami terima dan laksanakan sesuai dengan Naskah Perjanjian Hibah Daerah (NPHD) serta Rencana Anggaran Biaya (RAB).`;
  const splitP1 = doc.splitTextToSize(p1, pageWidth - margin * 2);
  doc.text(splitP1, margin, y);
  y += splitP1.length * 5 + 3;

  const totalRealisasi = data.rabSummary?.totalRealisasi || data.bkuLedger?.summary.totalPengeluaran || 0;
  const p2 = `Adapun realisasi penyerapan anggaran belanja hibah sebesar ${fmtRupiah(totalRealisasi)} dengan rincian berkas terlampir:`;
  doc.text(p2, margin, y);
  y += 7;

  // Checklist Dokumen Terlampir
  const docsList = [
    "1. Surat Pengantar & Sampul LPJ Resmi",
    "2. Laporan Rekapitulasi Realisasi Pagu Anggaran (RAB)",
    "3. Buku Kas Umum (BKU) Penerimaan & Pengeluaran Kas",
    "4. Bukti-bukti Pengeluaran Kas (Kwitansi Bermaterai & Faktur)",
    "5. Dokumen Pengadaan: Surat Pesanan (SP) & Berita Acara Serah Terima (BAST)",
    "6. Lembar Dokumentasi Fisik Kegiatan & Barang Sarana Prasarana",
  ];
  docsList.forEach((d) => {
    doc.text(d, margin + 5, y);
    y += 5;
  });
  y += 4;

  const p3 = "Demikian laporan pertanggungjawaban ini kami sampaikan dengan sebenar-benarnya untuk dipergunakan sebagai bahan evaluasi dan pemeriksaan pertanggungjawaban keuangan daerah.";
  const splitP3 = doc.splitTextToSize(p3, pageWidth - margin * 2);
  doc.text(splitP3, margin, y);
  y += splitP3.length * 5 + 4;

  doc.setFont("helvetica", "italic");
  doc.text("Wassalamu'alaikum Warahmatullahi Wabarakatuh.", margin, y);
  doc.setFont("helvetica", "normal");
  y += 15;

  // Tanda Tangan
  const leftX = margin + 30;
  const rightX = pageWidth - margin - 35;

  doc.text("PIMPINAN LEMBAGA / ORGANISASI", pageWidth / 2, y, { align: "center" });
  y += 6;

  doc.text(data.profile?.jabatanKetua || "Ketua Lembaga,", leftX, y, { align: "center" });
  doc.text("Bendahara Pengeluaran,", rightX, y, { align: "center" });
  y += 24;

  doc.setFont("helvetica", "bold");
  const ketua = data.profile?.namaKetua || data.user.leaderName || "HENI FUJIATI";
  doc.text(ketua.toUpperCase(), leftX, y, { align: "center" });
  doc.setLineWidth(0.3);
  doc.line(leftX - 22, y + 1, leftX + 22, y + 1);

  const bendahara = data.profile?.namaBendahara || data.user.name || "NUR ALIMAH";
  doc.text(bendahara.toUpperCase(), rightX, y, { align: "center" });
  doc.line(rightX - 22, y + 1, rightX + 22, y + 1);

  return doc.output("blob");
}

/**
 * 3. Generator PDF Kontrol Pagu RAB (F4 Landscape)
 */
function createRabPdf(data: LpjArchiveData): Blob {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [330, 215],
  });

  const pageWidth = 330;
  const margin = 15;
  const printableWidth = pageWidth - margin * 2;
  let y = 15;

  // Kop Lembaga
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  const lembaga = data.profile?.namaLembaga || data.user.institution || "PR FATAYAT NU";
  doc.text(lembaga.toUpperCase(), pageWidth / 2, y, { align: "center" });
  y += 5;

  doc.setFontSize(11);
  doc.text("REKAPITULASI REALISASI RENCANA ANGGARAN BIAYA (RAB)", pageWidth / 2, y, { align: "center" });
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`PROGRAM HIBAH DAERAH TAHUN ANGGARAN ${data.tahun}`, pageWidth / 2, y, { align: "center" });
  y += 4;

  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Tabel RAB
  const cols = [
    { name: "No", width: 12, align: "center" },
    { name: "Kode Rekening", width: 30, align: "center" },
    { name: "Uraian Pos Anggaran Belanja", width: 110, align: "left" },
    { name: "Pagu Anggaran NPHD (Rp)", width: 45, align: "right" },
    { name: "Realisasi Belanja (Rp)", width: 45, align: "right" },
    { name: "Sisa Pagu Saldo (Rp)", width: 40, align: "right" },
    { name: "Serapan", width: 18, align: "center" },
  ];

  // Header Table
  doc.setFillColor(240, 243, 246);
  doc.rect(margin, y, printableWidth, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  let x = margin;
  cols.forEach((c) => {
    const tx = c.align === "center" ? x + c.width / 2 : c.align === "right" ? x + c.width - 2 : x + 2;
    doc.text(c.name, tx, y + 5.5, { align: c.align as any });
    doc.rect(x, y, c.width, 8);
    x += c.width;
  });
  y += 8;

  // Items
  const rabItems = data.rabSummary?.items || [];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  rabItems.forEach((it, idx) => {
    const rowH = 7;
    let rx = margin;
    const sisa = it.anggaran - it.realisasi;
    const pct = it.anggaran > 0 ? Math.round((it.realisasi / it.anggaran) * 100) + "%" : "0%";

    const rowVals = [
      String(idx + 1),
      it.kode,
      it.nama,
      fmtRupiah(it.anggaran),
      fmtRupiah(it.realisasi),
      fmtRupiah(sisa),
      pct,
    ];

    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, printableWidth, rowH, "F");
    }

    cols.forEach((c, cIdx) => {
      const tx = c.align === "center" ? rx + c.width / 2 : c.align === "right" ? rx + c.width - 2 : rx + 2;
      doc.text(rowVals[cIdx], tx, y + 4.8, { align: c.align as any });
      doc.rect(rx, y, c.width, rowH);
      rx += c.width;
    });

    y += rowH;
  });

  // Summary Row
  doc.setFillColor(235, 245, 238);
  doc.rect(margin, y, printableWidth, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  let sx = margin;
  const labelW = cols[0].width + cols[1].width + cols[2].width;
  doc.rect(sx, y, labelW, 8);
  doc.text("TOTAL KESELURUHAN ANGGARAN", sx + labelW - 3, y + 5.5, { align: "right" });
  sx += labelW;

  const totalAng = data.rabSummary?.totalAnggaran || 0;
  const totalReal = data.rabSummary?.totalRealisasi || 0;
  const totalSisa = totalAng - totalReal;
  const totalPct = totalAng > 0 ? Math.round((totalReal / totalAng) * 100) + "%" : "0%";

  doc.rect(sx, y, cols[3].width, 8);
  doc.text(fmtRupiah(totalAng), sx + cols[3].width - 2, y + 5.5, { align: "right" });
  sx += cols[3].width;

  doc.rect(sx, y, cols[4].width, 8);
  doc.text(fmtRupiah(totalReal), sx + cols[4].width - 2, y + 5.5, { align: "right" });
  sx += cols[4].width;

  doc.rect(sx, y, cols[5].width, 8);
  doc.text(fmtRupiah(totalSisa), sx + cols[5].width - 2, y + 5.5, { align: "right" });
  sx += cols[5].width;

  doc.rect(sx, y, cols[6].width, 8);
  doc.text(totalPct, sx + cols[6].width / 2, y + 5.5, { align: "center" });

  y += 15;

  // Tanda Tangan
  const leftX = margin + 40;
  const rightX = pageWidth - margin - 40;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Mengetahui,", leftX, y, { align: "center" });
  doc.text(data.profile?.jabatanKetua || "Ketua Lembaga", leftX, y + 4, { align: "center" });

  doc.text(`Talang, 31 Desember ${data.tahun}`, rightX, y, { align: "center" });
  doc.text("Bendahara Pengeluaran,", rightX, y + 4, { align: "center" });

  y += 22;
  doc.setFont("helvetica", "bold");
  const ketua = data.profile?.namaKetua || data.user.leaderName || "HENI FUJIATI";
  doc.text(ketua.toUpperCase(), leftX, y, { align: "center" });
  doc.setLineWidth(0.3);
  doc.line(leftX - 22, y + 1, leftX + 22, y + 1);

  const bendahara = data.profile?.namaBendahara || data.user.name || "NUR ALIMAH";
  doc.text(bendahara.toUpperCase(), rightX, y, { align: "center" });
  doc.line(rightX - 22, y + 1, rightX + 22, y + 1);

  return doc.output("blob");
}

/**
 * 4. Generator PDF Kwitansi Kas Individual (F4 Portrait: 215mm x 330mm)
 */
function createSingleReceiptPdf(receipt: Receipt, data: LpjArchiveData): Blob {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [215, 330],
  });

  const pageWidth = 215;
  const margin = 15;
  let y = 15;

  // Bingkai Luar
  doc.setLineWidth(0.5);
  doc.rect(margin, margin, pageWidth - margin * 2, 140);

  // Kop Surat
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const lembaga = data.profile?.namaLembaga || data.user.institution || "PR FATAYAT NU";
  doc.text(lembaga.toUpperCase(), pageWidth / 2, y + 7, { align: "center" });

  doc.setFontSize(9);
  if (data.profile?.subNama) {
    doc.text(data.profile.subNama.toUpperCase(), pageWidth / 2, y + 12, { align: "center" });
  }

  doc.setLineWidth(0.3);
  doc.line(margin + 5, y + 15, pageWidth - margin - 5, y + 15);
  y += 22;

  // Header Bukti Kas
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("KWITANSI / BUKTI KAS PENGELUARAN", pageWidth / 2, y, { align: "center" });
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Nomor Bukti : ${receipt.nomorBukti}`, pageWidth / 2, y, { align: "center" });
  y += 8;

  // Kolom Data Kwitansi
  const row = (label: string, value: string, isBoldVal = false) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(label, margin + 8, y);
    doc.text(":", margin + 42, y);

    if (isBoldVal) doc.setFont("helvetica", "bold");
    const splitVal = doc.splitTextToSize(value, pageWidth - margin * 2 - 50);
    doc.text(splitVal, margin + 45, y);
    y += Math.max(splitVal.length * 4.5, 6);
  };

  const tglStr = receipt.tanggal
    ? new Date(receipt.tanggal).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  row("Telah Terima Dari", receipt.pemberi);
  row("Uang Sejumlah", `${fmtRupiah(receipt.nominal)} (${angkaKeTerbilang(receipt.nominal)})`, true);
  row("Untuk Pembayaran", formatUraianBelanja(receipt.uraian));
  row("Penerima / Toko", receipt.penerima, true);
  if (receipt.kategoriRab) {
    row("Pos Anggaran RAB", receipt.kategoriRab);
  }

  y += 3;

  // Kotak Nominal Rupiah
  doc.setFillColor(240, 243, 246);
  doc.rect(margin + 8, y, 65, 10, "F");
  doc.setLineWidth(0.4);
  doc.rect(margin + 8, y, 65, 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(fmtRupiah(receipt.nominal), margin + 12, y + 6.8);

  // Tanggal & Tempat
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Dawuhan Selatan, ${tglStr}`, pageWidth - margin - 60, y + 6.8);
  y += 16;

  // Tanda Tangan 3 Pihak: Ketua, Bendahara, Penerima
  const col1X = margin + 25;
  const col2X = margin + 85;
  const col3X = pageWidth - margin - 30;

  doc.setFontSize(7.5);
  doc.text("Setuju Dibayar,", col1X, y, { align: "center" });
  doc.text("Ketua Lembaga", col1X, y + 3.5, { align: "center" });

  doc.text("Lunas Dibayar,", col2X, y, { align: "center" });
  doc.text("Bendahara Pengeluaran", col2X, y + 3.5, { align: "center" });

  doc.text("Yang Menerima,", col3X, y, { align: "center" });
  doc.text("Toko / Rekanan", col3X, y + 3.5, { align: "center" });

  y += 18;

  doc.setFont("helvetica", "bold");
  doc.text(receipt.ketua.toUpperCase(), col1X, y, { align: "center" });
  doc.text(receipt.bendahara.toUpperCase(), col2X, y, { align: "center" });
  doc.text(receipt.penerima.toUpperCase(), col3X, y, { align: "center" });

  return doc.output("blob");
}

/**
 * 5. Generator PDF Surat Pesanan (SP)
 */
function createSingleSpPdf(sp: PurchaseOrder, data: LpjArchiveData): Blob {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [215, 330],
  });

  const pageWidth = 215;
  const margin = 15;
  let y = 15;

  // Kop
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const lembaga = data.profile?.namaLembaga || data.user.institution || "PR FATAYAT NU";
  doc.text(lembaga.toUpperCase(), pageWidth / 2, y + 5, { align: "center" });
  y += 10;

  doc.setFontSize(11);
  doc.text("SURAT PESANAN (SP)", pageWidth / 2, y, { align: "center" });
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Nomor: ${sp.nomorSp}`, pageWidth / 2, y, { align: "center" });
  y += 8;

  // Pihak Kesatu & Pihak Kedua
  doc.setFont("helvetica", "bold");
  doc.text("PIHAK KESATU (Pemesan):", margin, y);
  doc.text("PIHAK KEDUA (Penyedia / Rekanan):", pageWidth / 2 + 5, y);
  y += 4.5;

  doc.setFont("helvetica", "normal");
  doc.text(`Nama    : ${sp.pihak1Nama}`, margin, y);
  doc.text(`Toko     : ${sp.pihak2Toko}`, pageWidth / 2 + 5, y);
  y += 4;
  doc.text(`Jabatan : ${sp.pihak1Jabatan}`, margin, y);
  doc.text(`Pemilik : ${sp.pihak2Nama}`, pageWidth / 2 + 5, y);
  y += 4;
  if (sp.pihak2Alamat) {
    doc.text(`Alamat  : ${sp.pihak2Alamat.substring(0, 35)}`, pageWidth / 2 + 5, y);
  }
  y += 7;

  // Paket Pekerjaan
  doc.setFont("helvetica", "bold");
  doc.text(`Paket Pengadaan: ${cleanAndFormatTitle(sp.namaPaket)}`, margin, y);
  y += 6;

  // Tabel Barang
  let items: PesananItem[] = [];
  try {
    items = JSON.parse(sp.itemsJson) || [];
  } catch {
    items = [];
  }

  const cols = [
    { name: "No", w: 10, a: "center" },
    { name: "Jenis Barang / Jasa", w: 75, a: "left" },
    { name: "Spesifikasi", w: 45, a: "left" },
    { name: "Qty", w: 15, a: "center" },
    { name: "Harga Satuan (Rp)", w: 35, a: "right" },
    { name: "Total (Rp)", w: 35, a: "right" },
  ];

  doc.setFillColor(240, 243, 246);
  doc.rect(margin, y, pageWidth - margin * 2, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  let x = margin;
  cols.forEach((c) => {
    const tx = c.a === "center" ? x + c.w / 2 : c.a === "right" ? x + c.w - 2 : x + 2;
    doc.text(c.name, tx, y + 4.8, { align: c.a as any });
    doc.rect(x, y, c.w, 7);
    x += c.w;
  });
  y += 7;

  doc.setFont("helvetica", "normal");
  items.forEach((it, idx) => {
    const rowH = 6.5;
    let rx = margin;
    const rowVals = [
      String(idx + 1),
      cleanAndFormatTitle(it.jenisBarang),
      it.spesifikasi || "-",
      `${it.jumlah} ${it.satuan || "unit"}`,
      fmtRupiah(it.hargaSatuan),
      fmtRupiah(it.totalHarga),
    ];

    cols.forEach((c, cIdx) => {
      const tx = c.a === "center" ? rx + c.w / 2 : c.a === "right" ? rx + c.w - 2 : rx + 2;
      doc.text(String(rowVals[cIdx]), tx, y + 4.5, { align: c.a as any });
      doc.rect(rx, y, c.w, rowH);
      rx += c.w;
    });

    y += rowH;
  });

  // Total Row
  doc.setFillColor(235, 245, 238);
  doc.rect(margin, y, pageWidth - margin * 2, 7, "F");
  doc.setFont("helvetica", "bold");
  const totalW = cols[0].w + cols[1].w + cols[2].w + cols[3].w + cols[4].w;
  doc.rect(margin, y, totalW, 7);
  doc.text("TOTAL NILAI PESANAN", margin + totalW - 3, y + 5, { align: "right" });
  doc.rect(margin + totalW, y, cols[5].w, 7);
  doc.text(fmtRupiah(sp.totalHarga), margin + totalW + cols[5].w - 2, y + 5, { align: "right" });
  y += 12;

  // Terbilang
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text(`Terbilang: ${sp.terbilang || angkaKeTerbilang(sp.totalHarga)}`, margin, y);
  y += 6;

  // Ketentuan & Klausul Pengadaan
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("INSTRUKSI KEPADA PENYEDIA / KETENTUAN PENGADAAN:", margin, y);
  y += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  const tglDiterima = sp.batasWaktu || "-";
  doc.text(`2) Tanggal barang harus sudah diterima : ${tglDiterima}`, margin, y);
  y += 4;

  const waktuSelesai = sp.waktuPenyelesaian || "Pekerjaan diselesaikan sesuai jadwal yang telah disepakati.";
  doc.text(`3) Waktu Penyelesaian selama : ${waktuSelesai}`, margin, y);
  y += 4;

  const alamatPeriksa = sp.alamatPemeriksaan || data.profile?.alamat || "Sekretariat Lembaga Penerima Hibah";
  doc.text(`4) Alamat Pemeriksaan barang : ${alamatPeriksa}`, margin, y);
  y += 4;

  const alamatKirim = sp.alamatPengiriman || sp.pihak2Alamat || "Tempat / Gudang Rekanan Toko";
  doc.text(`5) Alamat pengiriman barang : ${alamatKirim}`, margin, y);
  y += 4;

  const dendaClause =
    sp.dendaKeterlambatan && !sp.dendaKeterlambatan.includes("Denda 1/500 dari nilai")
      ? sp.dendaKeterlambatan.replace(/^6\s*[\)\.]\s*/i, "").replace(/^Denda\s*:\s*/i, "").replace(/^Denda\s+/i, "")
      : "Terhadap setiap hari keterlambatan penyelesaian pekerjaan Penyedia barang akan dikenakan Denda Keterlambatan sebesar 1/500 (satu per seribu) dari Nilai Pekerjaan atau bagian tertentu dari Nilai Pekerjaan sebelum PPN sesuai dengan persyaratan dan ketentuan yang berlaku";

  const fullDendaText = `6) Denda ${dendaClause}`;
  const splitDenda = doc.splitTextToSize(fullDendaText, pageWidth - margin * 2);
  doc.text(splitDenda, margin, y);
  y += splitDenda.length * 3.5 + 8;

  // Tanda Tangan SP
  const col1X = margin + 35;
  const col2X = pageWidth - margin - 35;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("PIHAK KESATU (Pemesan)", col1X, y, { align: "center" });
  doc.text("PIHAK KEDUA (Penyedia)", col2X, y, { align: "center" });
  y += 20;

  doc.setFont("helvetica", "bold");
  doc.text(sp.pihak1Nama.toUpperCase(), col1X, y, { align: "center" });
  doc.text(sp.pihak2Nama.toUpperCase(), col2X, y, { align: "center" });

  return doc.output("blob");
}

/**
 * 6. Generator PDF Berita Acara Serah Terima (BAST)
 */
function createSingleBastPdf(bast: BastDocument, data: LpjArchiveData): Blob {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [215, 330],
  });

  const pageWidth = 215;
  const margin = 15;
  let y = 15;

  // Kop
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const lembaga = data.profile?.namaLembaga || data.user.institution || "PR FATAYAT NU";
  doc.text(lembaga.toUpperCase(), pageWidth / 2, y + 5, { align: "center" });
  y += 10;

  doc.setFontSize(11);
  doc.text("BERITA ACARA SERAH TERIMA (BAST)", pageWidth / 2, y, { align: "center" });
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Nomor: ${bast.nomorBast}`, pageWidth / 2, y, { align: "center" });
  y += 8;

  // Paragraf Pembuka Hari / Tanggal Terbilang
  doc.setFontSize(8);
  const pOpening = bast.tanggalTerbilang || `Pada hari ini, ${bast.hariTanggal}, telah dilakukan serah terima hasil pekerjaan/pengadaan barang bantuan hibah:`;
  const splitOpening = doc.splitTextToSize(pOpening, pageWidth - margin * 2);
  doc.text(splitOpening, margin, y);
  y += splitOpening.length * 4 + 4;

  // Pihak 1 dan 2
  doc.setFont("helvetica", "bold");
  doc.text("1. PIHAK KESATU (Penerima):", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${bast.pihak1Nama} (${cleanPihakJabatan(bast.pihak1Jabatan)})`, margin + 55, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.text("2. PIHAK KEDUA (Penyedia):", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${bast.pihak2Nama} (${formatPihak2Jabatan(bast.pihak2Jabatan, bast.pihak2Toko)})`, margin + 55, y);
  y += 7;

  // Rujukan SPK & Nama Kegiatan
  doc.text(`Dasar Surat Pesanan : ${bast.nomorSpk || "-"}`, margin, y);
  y += 4.5;
  doc.text(`Kegiatan / Paket         : ${cleanAndFormatTitle(bast.namaKegiatan)}`, margin, y);
  y += 7;

  // Tabel Barang Serah Terima
  let items: BastItem[] = [];
  try {
    items = JSON.parse(bast.itemsJson) || [];
  } catch {
    items = [];
  }

  const cols = [
    { name: "No", w: 10, a: "center" },
    { name: "Nama Barang / Pengadaan", w: 85, a: "left" },
    { name: "Spesifikasi", w: 45, a: "left" },
    { name: "Pesanan", w: 22, a: "center" },
    { name: "Realisasi", w: 23, a: "center" },
    { name: "Kondisi", w: 20, a: "center" },
  ];

  doc.setFillColor(240, 243, 246);
  doc.rect(margin, y, pageWidth - margin * 2, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  let x = margin;
  cols.forEach((c) => {
    const tx = c.a === "center" ? x + c.w / 2 : x + 2;
    doc.text(c.name, tx, y + 4.8, { align: c.a as any });
    doc.rect(x, y, c.w, 7);
    x += c.w;
  });
  y += 7;

  doc.setFont("helvetica", "normal");
  items.forEach((it, idx) => {
    const rowH = 6.5;
    let rx = margin;
    const rowVals = [
      String(idx + 1),
      cleanAndFormatTitle(it.jenisBarang),
      it.spesifikasi || "-",
      it.pesanan,
      it.realisasi,
      it.kondisi || "Baik",
    ];

    cols.forEach((c, cIdx) => {
      const tx = c.a === "center" ? rx + c.w / 2 : rx + 2;
      doc.text(String(rowVals[cIdx]), tx, y + 4.5, { align: c.a as any });
      doc.rect(rx, y, c.w, rowH);
      rx += c.w;
    });

    y += rowH;
  });

  y += 6;

  // Status & Catatan Uji Coba
  doc.setFont("helvetica", "bold");
  doc.text(`Status Pemeriksaan: ${bast.statusUji || "Lulus Uji Coba (100% Baik)"}`, margin, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  if (bast.catatanUji) {
    doc.text(`Catatan Uji Coba: ${bast.catatanUji}`, margin, y);
    y += 5;
  }

  y += 12;

  // Tanda Tangan BAST
  const col1X = margin + 35;
  const col2X = pageWidth - margin - 35;

  doc.setFontSize(8);
  doc.text("Yang Menyerahkan (Penyedia),", col2X, y, { align: "center" });
  doc.text("Yang Menerima (Ketua Lembaga),", col1X, y, { align: "center" });
  y += 20;

  doc.setFont("helvetica", "bold");
  doc.text(bast.pihak2Nama.toUpperCase(), col2X, y, { align: "center" });
  doc.text(bast.pihak1Nama.toUpperCase(), col1X, y, { align: "center" });
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Penyedia Barang", col2X, y, { align: "center" });
  doc.text(cleanPihakJabatan(bast.pihak1Jabatan), col1X, y, { align: "center" });

  return doc.output("blob");
}

/**
 * 7. Generator Berkas Indeks & Ringkasan Teks
 */
function createIndexSummaryText(data: LpjArchiveData): string {
  const lembaga = data.profile?.namaLembaga || data.user.institution || "PR FATAYAT NU DAWUHAN SELATAN";
  const ketua = data.profile?.namaKetua || data.user.leaderName || "HENI FUJIATI";
  const bendahara = data.profile?.namaBendahara || data.user.name || "NUR ALIMAH";
  const totalAnggaran = data.rabSummary?.totalAnggaran || 0;
  const totalRealisasi = data.rabSummary?.totalRealisasi || data.bkuLedger?.summary.totalPengeluaran || 0;
  const sisa = totalAnggaran - totalRealisasi;

  const nowStr = new Date().toLocaleString("id-ID", {
    dateStyle: "full",
    timeStyle: "medium",
  });

  return `========================================================================
ARSIP BERKAS LAPORAN PERTANGGUNGJAWABAN (LPJ) HIBAH DAERAH
TAHUN ANGGARAN: ${data.tahun}
========================================================================

LEMBAGA PENERIMA : ${lembaga.toUpperCase()}
KODE REGISTRASI  : ${data.profile?.noRegistrasi || "-"}
ALAMAT           : ${data.profile?.alamat || "-"}
KETUA LEMBAGA    : ${ketua.toUpperCase()}
BENDAHARA        : ${bendahara.toUpperCase()}
WAKTU PENGARSIPAN: ${nowStr}

------------------------------------------------------------------------
RINGKASAN KEUANGAN HIBAH:
------------------------------------------------------------------------
1. Pagu Anggaran Hibah NPHD   : ${fmtRupiah(totalAnggaran)}
2. Total Realisasi Belanja    : ${fmtRupiah(totalRealisasi)}
3. Sisa Saldo Kas Hibah       : ${fmtRupiah(sisa)}
4. Persentase Serapan Dana    : ${totalAnggaran > 0 ? ((totalRealisasi / totalAnggaran) * 100).toFixed(2) + "%" : "0%"}

------------------------------------------------------------------------
DAFTAR BERKAS DOKUMEN DALAM ARSIP INI:
------------------------------------------------------------------------
[✓] 01_COVER_LPJ_${data.tahun}.pdf
    - Sampul resmi laporan pertanggungjawaban hibah.

[✓] 02_SURAT_PENGANTAR_${data.tahun}.pdf
    - Surat pengantar resmi ke Bakesbangpol / Bagian Kesra.

[✓] 03_KONTROL_PAGU_RAB_${data.tahun}.pdf
    - Rekapitulasi realisasi belanja per pos rekening anggaran.

[✓] 04_BUKU_KAS_UMUM_BKU_${data.tahun}.pdf
    - Buku Kas Umum (${data.counts.bkuTransactions} transaksi kas).

[✓] Folder 05_KWITANSI_KAS/
    - Total: ${data.counts.receipts} berkas kwitansi / bukti kas keluar.
    ${data.receipts.map((r, i) => `  ${i + 1}. [${r.nomorBukti}] ${fmtRupiah(r.nominal)} - ${r.penerima}`).join("\n    ")}

[✓] Folder 06_SURAT_PESANAN_SP/
    - Total: ${data.counts.purchaseOrders} berkas Surat Pesanan (SP).
    ${data.purchaseOrders.map((p, i) => `  ${i + 1}. [${p.nomorSp}] ${cleanAndFormatTitle(p.namaPaket)} (${p.pihak2Toko})`).join("\n    ")}

[✓] Folder 07_BERITA_ACARA_BAST/
    - Total: ${data.counts.bastDocuments} berkas Berita Acara Serah Terima (BAST).
    ${data.bastDocuments.map((b, i) => `  ${i + 1}. [${b.nomorBast}] ${cleanAndFormatTitle(b.namaKegiatan)} (${b.pihak2Toko})`).join("\n    ")}

[✓] Folder 08_DOKUMENTASI_KEGIATAN/
    - Total: ${data.counts.documentations} lembar dokumentasi kegiatan fisik.

========================================================================
Dokumen ini disusun dan dihasilkan secara otomatis melalui Sistem E-LPJ Hibah.
Arsip ini sah untuk keperluan audit, verifikasi inspektorat, dan dokumentasi organisasi.
========================================================================
`;
}

/**
 * Main Function: Mengemas seluruh dokumen LPJ ke dalam satu berkas .ZIP
 */
export async function downloadFullLpjZipArchive(
  data: LpjArchiveData,
  onProgress?: (p: ZipArchiveProgress) => void
): Promise<boolean> {
  try {
    const zip = new JSZip();

    onProgress?.({ step: "Menyiapkan berkas Sampul & Surat Pengantar...", percent: 10 });
    const coverBlob = createCoverPdf(data);
    zip.file(`01_COVER_LPJ_${data.tahun}.pdf`, coverBlob);

    const pengantarBlob = createSuratPengantarPdf(data);
    zip.file(`02_SURAT_PENGANTAR_${data.tahun}.pdf`, pengantarBlob);

    onProgress?.({ step: "Menyiapkan Kontrol Pagu RAB & BKU...", percent: 25 });
    const rabBlob = createRabPdf(data);
    zip.file(`03_KONTROL_PAGU_RAB_${data.tahun}.pdf`, rabBlob);

    if (data.bkuLedger) {
      const bkuDoc = generateBkuPdf({
        entries: data.bkuLedger.entries,
        summary: data.bkuLedger.summary,
        profile: data.profile,
        tahunAnggaran: data.tahun,
      });
      zip.file(`04_BUKU_KAS_UMUM_BKU_${data.tahun}.pdf`, bkuDoc.output("blob"));
    }

    onProgress?.({ step: `Menghasilkan ${data.receipts.length} PDF Kwitansi Kas...`, percent: 45 });
    const kwtFolder = zip.folder("05_KWITANSI_KAS");
    data.receipts.forEach((r, idx) => {
      const safeNo = r.nomorBukti.replace(/[/\\?%*:|"<>]/g, "_");
      const kwtBlob = createSingleReceiptPdf(r, data);
      kwtFolder?.file(`KWT_${String(idx + 1).padStart(2, "0")}_${safeNo}.pdf`, kwtBlob);
    });

    onProgress?.({ step: `Menghasilkan ${data.purchaseOrders.length} Surat Pesanan (SP)...`, percent: 65 });
    const spFolder = zip.folder("06_SURAT_PESANAN_SP");
    data.purchaseOrders.forEach((sp, idx) => {
      const safeNo = sp.nomorSp.replace(/[/\\?%*:|"<>]/g, "_");
      const spBlob = createSingleSpPdf(sp, data);
      spFolder?.file(`SP_${String(idx + 1).padStart(2, "0")}_${safeNo}.pdf`, spBlob);
    });

    onProgress?.({ step: `Menghasilkan ${data.bastDocuments.length} Berita Acara (BAST)...`, percent: 80 });
    const bastFolder = zip.folder("07_BERITA_ACARA_BAST");
    data.bastDocuments.forEach((b, idx) => {
      const safeNo = b.nomorBast.replace(/[/\\?%*:|"<>]/g, "_");
      const bastBlob = createSingleBastPdf(b, data);
      bastFolder?.file(`BAST_${String(idx + 1).padStart(2, "0")}_${safeNo}.pdf`, bastBlob);
    });

    onProgress?.({ step: "Menyusun ringkasan berkas arsip...", percent: 90 });
    const summaryText = createIndexSummaryText(data);
    zip.file(`RINGKASAN_ARSIP_LPJ_${data.tahun}.txt`, summaryText);

    onProgress?.({ step: "Mengompresi arsip ZIP...", percent: 95 });
    const zipBlob = await zip.generateAsync(
      {
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      },
      (metadata) => {
        onProgress?.({
          step: `Mengompresi arsip ZIP (${metadata.percent.toFixed(0)}%)...`,
          percent: 90 + Math.round(metadata.percent * 0.09),
        });
      }
    );

    // Memicu unduhan otomatis
    const safeInstitution = (data.profile?.namaLembaga || data.user.institution || "LEMBAGA")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toUpperCase();
    const fileName = `ARSIP_LPJ_HIBAH_TA${data.tahun}_${safeInstitution}.zip`;

    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onProgress?.({ step: "Unduhan selesai!", percent: 100 });
    return true;
  } catch (error) {
    console.error("[downloadFullLpjZipArchive] Error:", error);
    throw error;
  }
}
