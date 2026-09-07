import { toPng } from "html-to-image";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import Swal, { swalClose, swalError, swalLoading } from "./swal";
import type { RabSummary, InstitutionProfile } from "@/types";

export interface ExportRabOptions {
  elementId?: string;
  summary?: RabSummary;
  profile?: InstitutionProfile | null;
  institutionName?: string;
  leaderName?: string;
  treasurerName?: string;
  tahunAnggaran?: string;
}

/**
 * Rekursif menyalin computed typography dan menonaktifkan overflow:hidden
 * agar html2canvas/html-to-image tidak memotong huruf atau border
 */
function sanitizeClonedTypography(source: Element, target: HTMLElement) {
  const sourceComputed = window.getComputedStyle(source);

  if (sourceComputed.fontSize) {
    target.style.fontSize = sourceComputed.fontSize;
  }
  if (sourceComputed.lineHeight && sourceComputed.lineHeight !== "normal") {
    target.style.lineHeight = sourceComputed.lineHeight;
  }
  if (sourceComputed.letterSpacing && sourceComputed.letterSpacing !== "normal") {
    target.style.letterSpacing = sourceComputed.letterSpacing;
  }
  if (sourceComputed.fontWeight) {
    target.style.fontWeight = sourceComputed.fontWeight;
  }

  target.style.overflow = "visible";
  target.style.maxHeight = "none";

  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);
  for (let i = 0; i < Math.min(sourceChildren.length, targetChildren.length); i++) {
    sanitizeClonedTypography(sourceChildren[i], targetChildren[i] as HTMLElement);
  }
}

/**
 * Menangkap elemen RAB Canvas menjadi gambar PNG resolusi tinggi (~300 DPI)
 */
async function captureRabImage(
  element: HTMLElement,
  options: ExportRabOptions
): Promise<string> {
  // Method 1: html-to-image (Presisi Tinggi & Native Vector Engine)
  try {
    const dataUrl = await toPng(element, {
      pixelRatio: 2.5, // ~300 DPI untuk kertas F4 landscape (330mm)
      backgroundColor: "#ffffff",
      cacheBust: true,
      style: {
        boxShadow: "none",
        borderRadius: "0px",
      },
      filter: (node: HTMLElement) => {
        if (node.classList && node.classList.contains("no-print")) {
          return false;
        }
        return true;
      },
    });

    if (dataUrl && dataUrl.startsWith("data:image/png") && dataUrl.length > 1000) {
      return dataUrl;
    }
  } catch (primaryErr) {
    console.warn("html-to-image gagal, beralih ke fallback html2canvas:", primaryErr);
  }

  // Method 2: Fallback ke html2canvas
  const rect = element.getBoundingClientRect();
  const canvas = await html2canvas(element, {
    scale: 2.5,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    imageTimeout: 15000,
    onclone: (clonedDoc) => {
      const clonedCanvas = clonedDoc.getElementById(element.id);
      if (clonedCanvas) {
        clonedCanvas.style.boxShadow = "none";
        clonedCanvas.style.borderRadius = "0px";
        clonedCanvas.style.width = `${rect.width}px`;
        clonedCanvas.style.height = `${rect.height}px`;
        clonedCanvas.style.minWidth = `${rect.width}px`;
        clonedCanvas.style.minHeight = `${rect.height}px`;

        sanitizeClonedTypography(element, clonedCanvas);
      }

      const noPrintElements = clonedDoc.querySelectorAll(".no-print");
      noPrintElements.forEach((el) => {
        (el as HTMLElement).style.display = "none";
      });
    },
  });

  return canvas.toDataURL("image/png");
}

/**
 * Ekspor Dokumen Rencana Anggaran Biaya (RAB) ke format PDF Kertas F4 Landscape (330mm x 215mm)
 */
export async function exportRabToPdf(options: ExportRabOptions = {}): Promise<boolean> {
  const elementId = options.elementId || "rabPrintCanvas";
  const element = document.getElementById(elementId);

  if (!element) {
    swalError(
      "Elemen Tidak Ditemukan",
      "Format lembar dokumen RAB belum siap untuk diekspor. Pastikan tampilan dokumen telah dimuat."
    );
    return false;
  }

  try {
    swalLoading(
      "Menyiapkan Dokumen PDF...",
      "Merender Dokumen RAB Format F4 Landscape (330 mm × 215 mm) resolusi tinggi..."
    );

    // Pastikan font dan gambar termuat sempurna
    const images = element.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));

    const imgData = await captureRabImage(element as HTMLElement, options);

    // Kertas F4 Landscape (Folio): Lebar 330 mm, Tinggi 215 mm
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [330, 215],
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 330 mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 215 mm

    const rect = element.getBoundingClientRect();
    const elementRatio = rect.height / rect.width;
    const imgWidth = pageWidth;
    const imgHeight = imgWidth * elementRatio;

    if (imgHeight <= pageHeight) {
      // Masuk dalam 1 halaman F4 Landscape penuh
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight, undefined, "FAST");
    } else {
      // Penanganan multi-halaman jika kelompok dan rincian item banyak
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage([330, 215], "landscape");
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }
    }

    const namaLembaga =
      options.institutionName ||
      options.profile?.namaLembaga ||
      "PIMPINAN_RANTING_FATAYAT_NU";
    const cleanLembaga = namaLembaga.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
    const tahun = options.tahunAnggaran || "2026";
    const fileName = `RAB_NPHD_${cleanLembaga}_TA_${tahun}.pdf`;

    pdf.save(fileName);
    swalClose();

    await Swal.fire({
      icon: "success",
      title: "PDF RAB Berhasil Diunduh!",
      html: `
        <div class="text-left text-xs space-y-1.5 font-sans">
          <p>Nama File: <strong class="text-emerald-500 font-mono">${fileName}</strong></p>
          <p>Ukuran Kertas: <strong>F4 / Folio (330 mm × 215 mm)</strong></p>
          <p>Orientasi: <strong>Landscape</strong> (Format Resmi NPHD Multi-Koefisien)</p>
          <p>Kualitas: <strong>Presisi Tinggi ~300 DPI</strong> (Tabel & Tanda Tangan Tajam Siap Jilid)</p>
        </div>
      `,
      confirmButtonText: "Selesai",
      confirmButtonColor: "#059669",
    });

    return true;
  } catch (error) {
    console.error("[exportRabToPdf] Error:", error);
    swalClose();
    swalError(
      "Gagal Ekspor PDF",
      "Terjadi kesalahan saat memproses ekspor PDF RAB. Silakan coba kembali."
    );
    return false;
  }
}
