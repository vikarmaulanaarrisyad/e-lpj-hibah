import { toPng } from "html-to-image";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import Swal, { swalClose, swalError, swalLoading } from "./swal";
import type { SuratPengantarFormData, InstitutionProfile } from "@/types";

export interface ExportSuratPengantarOptions {
  elementId?: string;
  formData?: SuratPengantarFormData;
  profile?: InstitutionProfile | null;
}

/**
 * Rekursif menyalin computed typography dan menonaktifkan overflow:hidden
 * agar html2canvas tidak memotong huruf atau border
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

  if (target.id !== "suratPengantarPrintArea") {
    target.style.overflow = "visible";
    target.style.maxHeight = "none";
  }

  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);
  for (let i = 0; i < Math.min(sourceChildren.length, targetChildren.length); i++) {
    sanitizeClonedTypography(sourceChildren[i], targetChildren[i] as HTMLElement);
  }
}

/**
 * Menangkap elemen Surat Pengantar LPJ menjadi gambar PNG resolusi tinggi (~300 DPI)
 */
async function captureSuratPengantarImage(
  element: HTMLElement,
  options: ExportSuratPengantarOptions
): Promise<string> {
  // Method 1: html-to-image (Presisi Tinggi & Native Vector Engine)
  try {
    const dataUrl = await toPng(element, {
      pixelRatio: 3, // Setara ~300 DPI cetak
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
    console.warn("html-to-image beralih ke fallback html2canvas:", primaryErr);
  }

  // Method 2: Fallback ke html2canvas
  const rect = element.getBoundingClientRect();
  const canvas = await html2canvas(element, {
    scale: 3,
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
        clonedCanvas.style.maxWidth = `${rect.width}px`;
        clonedCanvas.style.maxHeight = `${rect.height}px`;

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
 * Ekspor Surat Pengantar LPJ ke format PDF Kertas F4 (215mm x 330mm) atau A4 (210mm x 297mm)
 */
export async function exportSuratPengantarToPdf(
  options: ExportSuratPengantarOptions = {}
): Promise<boolean> {
  const elementId = options.elementId || "suratPengantarPrintArea";
  const element = document.getElementById(elementId);

  if (!element) {
    swalError("Elemen Tidak Ditemukan", "Format lembar surat pengantar belum siap untuk diekspor.");
    return false;
  }

  const isA4 = options.formData?.paperSize === "A4";
  const pageWidth = isA4 ? 210 : 215;
  const pageHeight = isA4 ? 297 : 330;
  const paperLabel = isA4 ? "A4 (210 mm × 297 mm)" : "F4 / Folio (215 mm × 330 mm)";

  try {
    swalLoading(
      "Menyiapkan Dokumen PDF...",
      `Merender Surat Pengantar LPJ presisi ${paperLabel} resolusi cetak tinggi...`
    );

    // Pastikan font dan gambar termuat
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

    const imgData = await captureSuratPengantarImage(element as HTMLElement, options);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [pageWidth, pageHeight],
      compress: true,
    });

    const rect = element.getBoundingClientRect();
    const elementRatio = rect.height / rect.width;
    const imgWidth = pageWidth;
    const imgHeight = imgWidth * elementRatio;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, Math.min(imgHeight, pageHeight), undefined, "FAST");

    const namaLembaga = options.profile?.namaLembaga || "Lembaga";
    const cleanLembaga = namaLembaga.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 25);
    const fileName = `Surat_Pengantar_LPJ_${cleanLembaga}_TA_${options.formData?.tahunAnggaran || "2026"}.pdf`;

    pdf.save(fileName);
    swalClose();

    await Swal.fire({
      icon: "success",
      title: "PDF Surat Pengantar Berhasil Diunduh!",
      html: `
        <div class="text-left text-xs space-y-1.5 font-sans">
          <p>File: <strong class="text-emerald-400 font-mono">${fileName}</strong></p>
          <p>Format Kertas: <strong>${paperLabel}</strong></p>
          <p>Resolusi: <strong>Presisi Tinggi ~300 DPI</strong> (Kop resmi & teks tajam siap cetak)</p>
        </div>
      `,
      confirmButtonText: "Tutup",
      confirmButtonColor: "#059669",
    });

    return true;
  } catch (error) {
    console.error("Gagal mengekspor PDF Surat Pengantar:", error);
    swalError(
      "Gagal Ekspor PDF",
      error instanceof Error ? error.message : "Terjadi kesalahan saat memproses dokumen PDF."
    );
    return false;
  }
}
