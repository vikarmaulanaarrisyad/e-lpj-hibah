import { jsPDF } from "jspdf";
import type { BkuLedgerEntry, BkuSummary, InstitutionProfile } from "@/types";

export interface GenerateBkuPdfOptions {
  entries: BkuLedgerEntry[];
  summary: BkuSummary;
  profile?: InstitutionProfile | null;
  institutionName?: string;
  leaderName?: string;
  treasurerName?: string;
  tahunAnggaran?: string;
  tanggalCetak?: string;
}

/**
 * Menghasilkan berkas PDF Buku Kas Umum (BKU) berstandar pelaporan kas negara.
 * Menggunakan format kertas F4 Landscape (330mm x 215mm) untuk mengakomodasi seluruh kolom pembukuan.
 */
export function generateBkuPdf(options: GenerateBkuPdfOptions): jsPDF {
  const {
    entries = [],
    summary,
    profile,
    institutionName = profile?.namaLembaga || "PR FATAYAT NU DAWUHAN SELATAN",
    leaderName = profile?.namaKetua || "HENI FUJIATI",
    treasurerName = profile?.namaBendahara || "NUR ALIMAH",
    tahunAnggaran = "2026",
    tanggalCetak = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  } = options;

  // Ukuran F4 Landscape: 330mm x 215mm
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [330, 215],
  });

  const pageWidth = 330;
  const pageHeight = 215;
  const margin = 15;
  const printableWidth = pageWidth - margin * 2;

  let currentY = 15;

  const renderHeader = (pageNumber: number, totalPages: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(
      (profile?.namaLembaga || institutionName).toUpperCase(),
      pageWidth / 2,
      currentY,
      { align: "center" }
    );
    currentY += 5;

    if (profile?.subNama) {
      doc.setFontSize(11);
      doc.text(profile.subNama.toUpperCase(), pageWidth / 2, currentY, { align: "center" });
      currentY += 5;
    }

    if (profile?.instansiInduk) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(profile.instansiInduk.toUpperCase(), pageWidth / 2, currentY, { align: "center" });
      currentY += 4;
    }

    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    const alamat = profile?.alamat || "Kecamatan Talang, Kabupaten Tegal";
    doc.text(alamat, pageWidth / 2, currentY, { align: "center" });
    currentY += 3;

    // Garis Kop Ganda
    doc.setLineWidth(0.7);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 0.8;
    doc.setLineWidth(0.2);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 5;

    // Judul BKU
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("BUKU KAS UMUM (BKU)", pageWidth / 2, currentY, { align: "center" });
    currentY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `PROGRAM BANTUAN HIBAH DAERAH TAHUN ANGGARAN ${tahunAnggaran.toUpperCase()}`,
      pageWidth / 2,
      currentY,
      { align: "center" }
    );
    currentY += 6;
  };

  renderHeader(1, 1);

  // Column definitions (total width: 300mm)
  // No(10), Tanggal(25), No Bukti(45), Uraian(90), Pos RAB(35), Debet(30), Kredit(30), Saldo(35) = 300mm
  const cols = [
    { name: "No", width: 10, align: "center" },
    { name: "Tanggal", width: 25, align: "center" },
    { name: "No. Bukti Kas", width: 45, align: "left" },
    { name: "Uraian Pembukuan Kas", width: 90, align: "left" },
    { name: "Pos Belanja RAB", width: 35, align: "left" },
    { name: "Penerimaan / Debet (Rp)", width: 31, align: "right" },
    { name: "Pengeluaran / Kredit (Rp)", width: 31, align: "right" },
    { name: "Sisa Saldo Kas (Rp)", width: 33, align: "right" },
  ];

  const renderTableHeader = () => {
    doc.setFillColor(240, 243, 246);
    doc.rect(margin, currentY, printableWidth, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    let x = margin;
    cols.forEach((col) => {
      const textX =
        col.align === "center"
          ? x + col.width / 2
          : col.align === "right"
          ? x + col.width - 2
          : x + 2;
      doc.text(col.name, textX, currentY + 5.5, { align: col.align as any });
      doc.rect(x, currentY, col.width, 8); // border cell
      x += col.width;
    });

    currentY += 8;
  };

  renderTableHeader();

  // Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);

  const formatRupiah = (num: number) => {
    return num.toLocaleString("id-ID");
  };

  entries.forEach((item, idx) => {
    // Check if new page needed
    if (currentY > pageHeight - 35) {
      doc.addPage([330, 215], "landscape");
      currentY = 15;
      renderHeader(2, 2);
      renderTableHeader();
    }

    const rowHeight = 7;
    let x = margin;

    const tglStr = item.tanggal
      ? new Date(item.tanggal).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "-";

    const rowData = [
      String(idx + 1),
      tglStr,
      item.nomorBukti || "-",
      item.uraian.length > 55 ? item.uraian.substring(0, 52) + "..." : item.uraian,
      item.kategoriRab ? (item.kategoriRab.length > 20 ? item.kategoriRab.substring(0, 18) + ".." : item.kategoriRab) : "-",
      item.debet > 0 ? formatRupiah(item.debet) : "-",
      item.kredit > 0 ? formatRupiah(item.kredit) : "-",
      formatRupiah(item.saldoBerjalan),
    ];

    // Background zebra
    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, currentY, printableWidth, rowHeight, "F");
    }

    cols.forEach((col, colIdx) => {
      const val = rowData[colIdx];
      const textX =
        col.align === "center"
          ? x + col.width / 2
          : col.align === "right"
          ? x + col.width - 2
          : x + 2;

      doc.text(val, textX, currentY + 4.8, { align: col.align as any });
      doc.rect(x, currentY, col.width, rowHeight);
      x += col.width;
    });

    currentY += rowHeight;
  });

  // Total Summary Row
  if (currentY > pageHeight - 40) {
    doc.addPage([330, 215], "landscape");
    currentY = 15;
    renderHeader(2, 2);
    renderTableHeader();
  }

  doc.setFillColor(235, 245, 238);
  doc.rect(margin, currentY, printableWidth, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  let xSummary = margin;
  const labelWidth = cols[0].width + cols[1].width + cols[2].width + cols[3].width + cols[4].width;
  doc.rect(xSummary, currentY, labelWidth, 8);
  doc.text("JUMLAH TOTAL TRANSAKSI KAS", xSummary + labelWidth - 3, currentY + 5.5, { align: "right" });
  xSummary += labelWidth;

  // Debet total
  doc.rect(xSummary, currentY, cols[5].width, 8);
  doc.text(formatRupiah(summary.totalPenerimaan), xSummary + cols[5].width - 2, currentY + 5.5, { align: "right" });
  xSummary += cols[5].width;

  // Kredit total
  doc.rect(xSummary, currentY, cols[6].width, 8);
  doc.text(formatRupiah(summary.totalPengeluaran), xSummary + cols[6].width - 2, currentY + 5.5, { align: "right" });
  xSummary += cols[6].width;

  // Saldo Akhir
  doc.rect(xSummary, currentY, cols[7].width, 8);
  doc.text(formatRupiah(summary.saldoAkhir), xSummary + cols[7].width - 2, currentY + 5.5, { align: "right" });

  currentY += 12;

  // Check signature space
  if (currentY > pageHeight - 35) {
    doc.addPage([330, 215], "landscape");
    currentY = 20;
  }

  // Tanda Tangan Pengesahan (Ketua & Bendahara)
  const signY = currentY;
  const leftColX = margin + 30;
  const rightColX = pageWidth - margin - 80;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  // Kolom Kiri: Setuju Dibayar (Ketua)
  doc.text("Setuju Dibayar / Mengetahui,", leftColX, signY, { align: "center" });
  doc.text(profile?.jabatanKetua || "Ketua Lembaga", leftColX, signY + 4, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.text(leaderName.toUpperCase(), leftColX, signY + 22, { align: "center" });
  doc.setLineWidth(0.3);
  doc.line(leftColX - 25, signY + 23, leftColX + 25, signY + 23);

  // Kolom Kanan: Lunas Dibayar (Bendahara)
  doc.setFont("helvetica", "normal");
  doc.text(`Dawuhan Selatan, ${tanggalCetak}`, rightColX, signY, { align: "center" });
  doc.text("Bendahara Pengeluaran,", rightColX, signY + 4, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.text(treasurerName.toUpperCase(), rightColX, signY + 22, { align: "center" });
  doc.setLineWidth(0.3);
  doc.line(rightColX - 25, signY + 23, rightColX + 25, signY + 23);

  return doc;
}
