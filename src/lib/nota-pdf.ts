import { toPng } from "html-to-image";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import Swal, { swalClose, swalError, swalLoading } from "./swal";
import type { NotaFormData, InstitutionProfile } from "@/types";

export interface ExportNotaOptions {
  elementId?: string;
  nomorBukti?: string;
  formData?: NotaFormData;
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

  if (target.id !== "notaPrintArea") {
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
 * Menangkap elemen Lembar Penempelan Nota menjadi gambar PNG resolusi tinggi (~300 DPI)
 * dengan penguncian ukuran presisi 780px x 1198px (Rasio Kertas F4 Folio 215mm x 330mm)
 * dan penghapusan margin/border kartu agar tidak terjadi pergeseran layout atau garis tepi di PDF.
 */
async function captureNotaImage(
  element: HTMLElement,
  options: ExportNotaOptions
): Promise<string> {
  const targetWidth = 780;
  const targetHeight = 1198;

  // Method 1: html-to-image (Presisi Tinggi & Native Vector Engine)
  try {
    const dataUrl = await toPng(element, {
      pixelRatio: 3, // Skala 3x menghasilkan ketajaman setara ~300 DPI cetak
      backgroundColor: "#ffffff",
      cacheBust: true,
      width: targetWidth,
      height: targetHeight,
      canvasWidth: targetWidth * 3,
      canvasHeight: targetHeight * 3,
      style: {
        margin: "0px",
        marginLeft: "0px",
        marginRight: "0px",
        marginTop: "0px",
        marginBottom: "0px",
        border: "none",
        outline: "none",
        boxShadow: "none",
        borderRadius: "0px",
        transform: "none",
        width: `${targetWidth}px`,
        minWidth: `${targetWidth}px`,
        maxWidth: `${targetWidth}px`,
        height: `${targetHeight}px`,
        minHeight: `${targetHeight}px`,
        maxHeight: `${targetHeight}px`,
        paddingLeft: "28mm",
        paddingRight: "15mm",
        paddingTop: "9mm",
        paddingBottom: "12mm",
        boxSizing: "border-box",
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
  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    imageTimeout: 15000,
    width: targetWidth,
    height: targetHeight,
    windowWidth: targetWidth,
    windowHeight: targetHeight,
    x: 0,
    y: 0,
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc) => {
      const clonedCanvas = clonedDoc.getElementById(element.id);
      if (clonedCanvas) {
        clonedCanvas.style.margin = "0px";
        clonedCanvas.style.marginLeft = "0px";
        clonedCanvas.style.marginRight = "0px";
        clonedCanvas.style.marginTop = "0px";
        clonedCanvas.style.marginBottom = "0px";
        clonedCanvas.style.border = "none";
        clonedCanvas.style.outline = "none";
        clonedCanvas.style.boxShadow = "none";
        clonedCanvas.style.borderRadius = "0px";
        clonedCanvas.style.transform = "none";
        clonedCanvas.style.width = `${targetWidth}px`;
        clonedCanvas.style.height = `${targetHeight}px`;
        clonedCanvas.style.minWidth = `${targetWidth}px`;
        clonedCanvas.style.minHeight = `${targetHeight}px`;
        clonedCanvas.style.maxWidth = `${targetWidth}px`;
        clonedCanvas.style.maxHeight = `${targetHeight}px`;
        clonedCanvas.style.paddingLeft = "28mm";
        clonedCanvas.style.paddingRight = "15mm";
        clonedCanvas.style.paddingTop = "9mm";
        clonedCanvas.style.paddingBottom = "12mm";
        clonedCanvas.style.boxSizing = "border-box";

        if (clonedCanvas.parentElement) {
          clonedCanvas.parentElement.style.display = "block";
          clonedCanvas.parentElement.style.margin = "0px";
          clonedCanvas.parentElement.style.padding = "0px";
          clonedCanvas.parentElement.style.transform = "none";
        }

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
 * Ekspor Lembar Penempelan Nota Asli ke format PDF Kertas F4 Portrait (215mm x 330mm)
 * Presisi tinggi 1:1 tanpa pergeseran margin atau pemotongan konten di sisi kanan,
 * lengkap dengan margin penjilidan 28mm dan modal interaktif Buka / Cetak PDF.
 */
export async function exportNotaToPdf(options: ExportNotaOptions = {}): Promise<boolean> {
  const elementId = options.elementId || "notaPrintArea";
  const element = document.getElementById(elementId);

  if (!element) {
    swalError("Elemen Tidak Ditemukan", "Format lembar penempelan nota belum siap untuk diekspor.");
    return false;
  }

  const pageWidth = 215;
  const pageHeight = 330;
  const paperLabel = "F4 Portrait (215 × 330 mm)";

  try {
    swalLoading(
      "Menyiapkan Dokumen PDF...",
      `Merender Lembar Penempelan Nota presisi ${paperLabel} dengan Margin Jilid...`
    );

    // Pastikan seluruh gambar dan logo telah selesai dimuat
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

    const imgData = await captureNotaImage(element as HTMLElement, options);

    // Kertas F4 Portrait (Folio): Lebar 215 mm, Tinggi 330 mm (Sesuai Standar Surat Pesanan)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [pageWidth, pageHeight],
      compress: true,
    });

    // Menempatkan dokumen 1 halaman penuh tanpa distorsi atau garis tepi
    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");

    const pdfBlob = pdf.output("blob");
    const fileBlob = new Blob([pdfBlob], { type: "application/pdf" });

    // Sanitasi nama file output
    let cleanNo = (options.nomorBukti || options.formData?.nomorBukti || "Nota")
      .trim()
      .replace(/[/\\?%*:|"<>.]/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_");

    if (cleanNo.toLowerCase().endsWith("_pdf")) {
      cleanNo = cleanNo.slice(0, -4);
    }
    if (cleanNo.toLowerCase().endsWith(".pdf")) {
      cleanNo = cleanNo.slice(0, -4);
    }

    const rawUraian = options.formData?.uraian || options.formData?.namaToko || "";
    const cleanUraian = rawUraian
      ? rawUraian
          .split(/\s+sebanyak\s+/i)[0]
          .trim()
          .replace(/[/\\?%*:|"<>.]/g, "_")
          .replace(/\s+/g, "_")
          .replace(/_+/g, "_")
          .slice(0, 45)
      : "";

    const filename = cleanUraian
      ? `Nota_${cleanNo}_${cleanUraian}_F4.pdf`
      : `Lembar_Nota_${cleanNo}_F4.pdf`;

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

    // Notifikasi sukses interaktif dengan tombol "Buka / Cetak PDF" persis seperti Surat Pesanan
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
              <span class="font-semibold text-white bg-slate-800 px-2 py-0.5 rounded">Lembar Penempelan Nota (.pdf)</span>
            </div>
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-slate-400">Ukuran Kertas:</span>
              <span class="font-semibold text-emerald-300">${paperLabel}</span>
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
    console.error("Gagal mengekspor PDF Lembar Nota:", error);
    swalClose();
    swalError(
      "Gagal Ekspor PDF",
      error?.message || "Terjadi kesalahan saat memproses Lembar Nota menjadi PDF."
    );
    return false;
  }
}
