import { toPng } from "html-to-image";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { swalClose, swalError, swalLoading, swalSuccess } from "./swal";
import type { DokumentasiFormData, InstitutionProfile } from "@/types";

export interface ExportDokumentasiOptions {
  containerId?: string;
  formData: DokumentasiFormData;
  profile?: InstitutionProfile | null;
}

/**
 * Capture an HTMLElement into high-res PNG data URL (~300 DPI scale)
 */
async function capturePageImage(pageEl: HTMLElement): Promise<string> {
  // Method 1: html-to-image
  try {
    const dataUrl = await toPng(pageEl, {
      pixelRatio: 3,
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
  } catch (err) {
    console.warn("html-to-image gagal, menggunakan html2canvas:", err);
  }

  // Method 2: html2canvas fallback
  const canvas = await html2canvas(pageEl, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    imageTimeout: 15000,
  });

  return canvas.toDataURL("image/png");
}

/**
 * Export lembar dokumentasi kegiatan ke berkas PDF F4 Portrait (215mm x 330mm)
 * Mendukung multi-halaman jika foto terbagi ke beberapa lembar.
 */
export async function exportDokumentasiPdf(options: ExportDokumentasiOptions): Promise<boolean> {
  const containerId = options.containerId || "dokumentasiPrintArea";
  const container = document.getElementById(containerId);

  if (!container) {
    swalError(
      "Elemen Tidak Ditemukan",
      "Area lembar dokumentasi tidak dapat ditemukan untuk diproses menjadi PDF."
    );
    return false;
  }

  const pages = container.querySelectorAll<HTMLElement>(".dokumentasi-page");
  if (!pages || pages.length === 0) {
    swalError(
      "Halaman Kosong",
      "Tidak ada lembar dokumentasi yang siap diekspor."
    );
    return false;
  }

  try {
    swalLoading(
      "Menyiapkan Dokumen PDF...",
      `Mengonversi ${pages.length} lembar dokumentasi ke PDF F4 Portrait (215 × 330 mm)...`
    );

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [215, 330],
      compress: true,
    });

    const pageWidth = 215;
    const pageHeight = 330;

    for (let i = 0; i < pages.length; i++) {
      const pageEl = pages[i];
      const imgData = await capturePageImage(pageEl);

      if (i > 0) {
        pdf.addPage([pageWidth, pageHeight], "portrait");
      }

      const rect = pageEl.getBoundingClientRect();
      const ratio = rect.height / rect.width;
      const calcHeight = Math.min(pageHeight, pageWidth * ratio);

      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, calcHeight, undefined, "FAST");
    }

    // Penamaan file yang rapi sesuai realisasi kegiatan & tanggal
    const cleanKegiatan = (options.formData.namaKegiatan || "Kegiatan")
      .trim()
      .replace(/[/\\?%*:|"<>.]/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 45);

    const cleanTanggal = (options.formData.tanggalKegiatan || "2026")
      .split("T")[0]
      .replace(/-/g, "");

    const filename = `DOKUMENTASI_${cleanKegiatan}_${cleanTanggal}.pdf`;

    pdf.save(filename);

    swalSuccess(
      "Dokumentasi Siap!",
      `Berhasil mengunduh ${pages.length} lembar dokumentasi ke dalam file "${filename}".`
    );
    return true;
  } catch (error: any) {
    console.error("[exportDokumentasiPdf] Error:", error);
    swalError(
      "Gagal Mengunduh PDF",
      error?.message || "Terjadi kesalahan teknis saat membuat file PDF dokumentasi."
    );
    return false;
  }
}
