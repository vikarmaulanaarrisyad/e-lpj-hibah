import { toPng } from "html-to-image";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import Swal, { swalClose, swalError, swalLoading } from "./swal";
import type { PesananFormData, InstitutionProfile } from "@/types";

export interface ExportPesananOptions {
  elementId?: string;
  nomorSp?: string;
  formData?: PesananFormData;
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

  if (target.id !== "pesananPrintArea") {
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
 * Menangkap elemen Surat Pesanan menjadi gambar PNG resolusi tinggi (~300 DPI)
 */
async function capturePesananImage(
  element: HTMLElement,
  options: ExportPesananOptions
): Promise<string> {
  // Method 1: html-to-image (Presisi Tinggi & Native Browser Vector Engine)
  try {
    const dataUrl = await toPng(element, {
      pixelRatio: 3, // Skala 3x menghasilkan ketajaman setara ~300 DPI cetak
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
 * Ekspor Surat Pesanan ke format PDF Kertas F4 / Folio Portrait (215mm x 330mm)
 * Dilengkapi margin kiri ekstra (~28mm) untuk kebutuhan penjilidan / jilid dokumen LPJ
 */
export async function exportPesananToPdf(options: ExportPesananOptions = {}): Promise<boolean> {
  const elementId = options.elementId || "pesananPrintArea";
  const element = document.getElementById(elementId);

  if (!element) {
    swalError("Elemen Tidak Ditemukan", "Format dokumen Surat Pesanan belum siap untuk diekspor.");
    return false;
  }

  try {
    swalLoading(
      "Menyiapkan Dokumen PDF...",
      "Merender Surat Pesanan presisi F4 Portrait (215mm × 330mm) dengan Margin Jilid..."
    );

    // Pastikan font dan gambar selesai dimuat sebelum capture
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

    const imgData = await capturePesananImage(element as HTMLElement, options);

    // Kertas F4 Portrait (Folio): Lebar 215 mm, Tinggi 330 mm
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [215, 330],
      compress: true,
    });

    const pageWidth = 215;
    const pageHeight = 330;
    const rect = element.getBoundingClientRect();
    const elementRatio = rect.height / rect.width;
    const imgWidth = pageWidth;
    const imgHeight = imgWidth * elementRatio;

    if (imgHeight <= pageHeight) {
      // Masuk dalam 1 halaman F4 penuh
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight, undefined, "FAST");
    } else {
      // Penanganan multi-halaman jika rincian barang sangat panjang
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage([pageWidth, pageHeight], "portrait");
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }
    }

    const pdfBlob = pdf.output("blob");
    const fileBlob = new Blob([pdfBlob], { type: "application/pdf" });

    // Sanitasi nama file output
    let cleanNoSp = (options.nomorSp || options.formData?.nomorSp || "SP")
      .trim()
      .replace(/[/\\?%*:|"<>.]/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_");

    if (cleanNoSp.toLowerCase().endsWith("_pdf")) {
      cleanNoSp = cleanNoSp.slice(0, -4);
    }
    if (cleanNoSp.toLowerCase().endsWith(".pdf")) {
      cleanNoSp = cleanNoSp.slice(0, -4);
    }

    const filename = `Surat_Pesanan_${cleanNoSp}_F4.pdf`;
    const blobUrl = window.URL.createObjectURL(fileBlob);

    // Download otomatis via link anchor
    const downloadLink = document.createElement("a");
    downloadLink.href = blobUrl;
    downloadLink.download = filename;
    downloadLink.setAttribute("download", filename);
    downloadLink.setAttribute("target", "_blank");
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();

    setTimeout(() => {
      if (document.body.contains(downloadLink)) {
        document.body.removeChild(downloadLink);
      }
      window.URL.revokeObjectURL(blobUrl);
    }, 60000);

    swalClose();

    // Notifikasi sukses interaktif dengan tombol "Buka / Cetak PDF"
    await Swal.fire({
      icon: "success",
      title: "PDF Berhasil Diekspor!",
      html: `
        <div class="text-left space-y-2 mt-2 text-xs text-slate-300">
          <div class="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div>
              <span class="text-slate-400 text-[11px] block">Nama File:</span>
              <span class="font-mono text-emerald-400 font-bold text-xs break-all">${filename}</span>
            </div>
            <div class="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span class="text-slate-400">Tipe Dokumen:</span>
              <span class="font-semibold text-white bg-slate-800 px-2 py-0.5 rounded">Surat Pesanan (.pdf)</span>
            </div>
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-slate-400">Ukuran Kertas:</span>
              <span class="font-semibold text-emerald-300">F4 Portrait (215 × 330 mm)</span>
            </div>
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-slate-400">Margin Penjilidan:</span>
              <span class="font-semibold text-emerald-300">Kiri 28 mm (Aman untuk Dijilid)</span>
            </div>
          </div>
          <p class="text-slate-400 text-[11px] pt-1">
            File otomatis terunduh. Jika ingin langsung membuka dan mencetak dari peramban, klik tombol <strong>Buka PDF</strong>.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Buka / Cetak PDF",
      cancelButtonText: "Tutup",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#334155",
      background: "#0f172a",
      color: "#f8fafc",
      customClass: {
        popup: "rounded-3xl border border-slate-800 shadow-2xl",
        title: "text-base font-bold text-white",
        confirmButton:
          "px-5 py-2.5 rounded-xl font-semibold text-xs shadow-md bg-emerald-600 hover:bg-emerald-700 text-white",
        cancelButton:
          "px-5 py-2.5 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        window.open(blobUrl, "_blank");
      }
    });

    return true;
  } catch (error: any) {
    console.error("Gagal mengekspor PDF Surat Pesanan:", error);
    swalClose();
    swalError(
      "Gagal Ekspor PDF",
      error?.message || "Terjadi kesalahan saat memproses Surat Pesanan menjadi PDF."
    );
    return false;
  }
}
