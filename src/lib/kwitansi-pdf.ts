import { toPng } from "html-to-image";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import Swal, { swalClose, swalError, swalLoading } from "./swal";
import type { ReceiptFormData, InstitutionProfile } from "@/types";

export interface ExportKwitansiOptions {
  elementId?: string;
  nomorBukti?: string;
  penerima?: string;
  showCutGuides?: boolean;
  formData?: ReceiptFormData;
  profile?: InstitutionProfile | null;
}

/**
 * Rekursif menyalin computed typography dan menonaktifkan overflow:hidden
 * agar html2canvas tidak memotong (clip) huruf kapital di atas maupun huruf di bawah
 */
function sanitizeClonedTypography(source: Element, target: HTMLElement) {
  const sourceComputed = window.getComputedStyle(source);

  // Salin font-size dan line-height pasti (dalam px)
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

  // Pastikan SELURUH elemen di dalam kanvas (selain kanvas terluar) memiliki overflow visible
  // dan hilangkan batas maxHeight agar html2canvas tidak pernah membuat clipping mask
  // yang memotong huruf, desender, maupun baris teks
  if (target.id !== "kwitansiCanvas") {
    target.style.overflow = "visible";
    target.style.maxHeight = "none";
  }

  // Rekursi untuk child elements
  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);
  for (let i = 0; i < Math.min(sourceChildren.length, targetChildren.length); i++) {
    sanitizeClonedTypography(sourceChildren[i], targetChildren[i] as HTMLElement);
  }
}

/**
 * Menangkap elemen kwitansi menjadi gambar PNG resolusi tinggi.
 * Menggunakan html-to-image (berbasis native browser SVG foreignObject) sebagai perender utama
 * yang menjamin 100% presisi tipografi, container queries (cqw), teks utuh tanpa clipping,
 * serta fallback ke html2canvas yang telah disanitasi jika peramban membatasi foreignObject.
 */
async function captureKwitansiImage(
  element: HTMLElement,
  options: ExportKwitansiOptions
): Promise<string> {
  // Method 1: html-to-image (Presisi Tinggi & Native Browser Vector Engine)
  try {
    const dataUrl = await toPng(element, {
      pixelRatio: 3, // Skala 3x menghasilkan resolusi tajam setara ~300 DPI
      backgroundColor: "#fafaf5",
      cacheBust: true,
      style: {
        boxShadow: "none",
        borderRadius: "0px",
      },
      filter: (node: HTMLElement) => {
        // Hilangkan elemen no-print kecuali panduan potong jika diaktifkan
        if (node.classList && node.classList.contains("no-print")) {
          if (options.showCutGuides && node.id === "guideCutLine") {
            return true;
          }
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

  // Method 2: Fallback ke html2canvas dengan penguncian ukuran piksel riil
  const rect = element.getBoundingClientRect();
  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#fafaf5",
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
        if (options.showCutGuides && el.id === "guideCutLine") {
          (el as HTMLElement).style.display = "flex";
          return;
        }
        (el as HTMLElement).style.display = "none";
      });
    },
  });

  return canvas.toDataURL("image/png");
}

/**
 * Ekspor Kwitansi ke format PDF Kertas F4 / Folio Landscape (330mm x 215mm)
 * Presisi tinggi 1:1 sesuai ukuran fisik blanko resmi (27.99 cm x 9.6 cm)
 */
export async function exportKwitansiToPdf(options: ExportKwitansiOptions = {}): Promise<boolean> {
  const elementId = options.elementId || "kwitansiCanvas";
  const element = document.getElementById(elementId);

  if (!element && !options.formData) {
    swalError("Elemen Tidak Ditemukan", "Format kanvas kwitansi belum siap untuk diekspor.");
    return false;
  }

  try {
    swalLoading(
      "Menyiapkan Dokumen PDF...",
      "Merender kwitansi vektor presisi F4 Landscape (330mm × 215mm)..."
    );

    let fileBlob: Blob;

    // METODE 1: Render Vektor Asli dengan @react-pdf/renderer jika formData tersedia
    if (options.formData) {
      try {
        const [reactPdfModule, kwitansiDocModule, ReactModule] = await Promise.all([
          import("@react-pdf/renderer"),
          import("@/components/kwitansi/kwitansi-pdf-document"),
          import("react"),
        ]);
        const React = ReactModule.default || ReactModule;
        const pdf = reactPdfModule.pdf || reactPdfModule.default?.pdf;
        const KwitansiPdfDocument =
          kwitansiDocModule.KwitansiPdfDocument || kwitansiDocModule.default;

        if (typeof KwitansiPdfDocument !== "function" || typeof pdf !== "function") {
          throw new Error("Gagal menginisialisasi modul @react-pdf/renderer atau KwitansiPdfDocument.");
        }

        let templateImageUrl = "/templates/kwitansi-blank-template.png";
        if (typeof window !== "undefined") {
          const domImg = element?.querySelector<HTMLImageElement>("img");
          if (domImg && domImg.src) {
            templateImageUrl = domImg.src;
          } else {
            templateImageUrl = `${window.location.origin}/templates/kwitansi-blank-template.png`;
          }
        }

        const docElement = React.createElement(KwitansiPdfDocument, {
          data: options.formData,
          profile: options.profile,
          templateImageUrl,
          showCutGuides: options.showCutGuides,
        });

        const rawBlob = await pdf(docElement as any).toBlob();
        fileBlob = new Blob([rawBlob], { type: "application/pdf" });
      } catch (reactPdfErr) {
        console.warn("@react-pdf/renderer gagal, beralih ke engine image:", reactPdfErr);
        // Fallback jika @react-pdf/renderer gagal di browser tertentu
        if (!element) throw reactPdfErr;
        const imgData = await captureKwitansiImage(element as HTMLElement, options);
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: [215, 330],
          compress: true,
        });
        const kwitansiWidth = 279.9;
        const kwitansiHeight = 96.0;
        const posX = (330 - kwitansiWidth) / 2;
        const posY = (215 - kwitansiHeight) / 2;
        pdf.addImage(imgData, "PNG", posX, posY, kwitansiWidth, kwitansiHeight, undefined, "FAST");
        if (options.showCutGuides) {
          pdf.setDrawColor(160, 174, 192);
          pdf.setLineWidth(0.25);
          const markLen = 5;
          const offset = 2;
          pdf.line(posX - offset - markLen, posY, posX - offset, posY);
          pdf.line(posX, posY - offset - markLen, posX, posY - offset);
          pdf.line(posX + kwitansiWidth + offset, posY, posX + kwitansiWidth + offset + markLen, posY);
          pdf.line(posX + kwitansiWidth, posY - offset - markLen, posX + kwitansiWidth, posY - offset);
          pdf.line(posX - offset - markLen, posY + kwitansiHeight, posX - offset, posY + kwitansiHeight);
          pdf.line(posX, posY + kwitansiHeight + offset, posX, posY + kwitansiHeight + offset + markLen);
          pdf.line(posX + kwitansiWidth + offset, posY + kwitansiHeight, posX + kwitansiWidth + offset + markLen, posY + kwitansiHeight);
          pdf.line(posX + kwitansiWidth, posY + kwitansiHeight + offset, posX + kwitansiWidth, posY + kwitansiHeight + offset + markLen);
        }
        const pdfBlob = pdf.output("blob");
        fileBlob = new Blob([pdfBlob], { type: "application/pdf" });
      }
    } else {
      // METODE 2: Fallback Image Capture jika formData tidak tersedia
      if (element) {
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
      }
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => setTimeout(resolve, 150));

      const imgData = await captureKwitansiImage(element as HTMLElement, options);
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [215, 330],
        compress: true,
      });
      const kwitansiWidth = 279.9;
      const kwitansiHeight = 96.0;
      const posX = (330 - kwitansiWidth) / 2;
      const posY = (215 - kwitansiHeight) / 2;
      pdf.addImage(imgData, "PNG", posX, posY, kwitansiWidth, kwitansiHeight, undefined, "FAST");
      if (options.showCutGuides) {
        pdf.setDrawColor(160, 174, 192);
        pdf.setLineWidth(0.25);
        const markLen = 5;
        const offset = 2;
        pdf.line(posX - offset - markLen, posY, posX - offset, posY);
        pdf.line(posX, posY - offset - markLen, posX, posY - offset);
        pdf.line(posX + kwitansiWidth + offset, posY, posX + kwitansiWidth + offset + markLen, posY);
        pdf.line(posX + kwitansiWidth, posY - offset - markLen, posX + kwitansiWidth, posY - offset);
        pdf.line(posX - offset - markLen, posY + kwitansiHeight, posX - offset, posY + kwitansiHeight);
        pdf.line(posX, posY + kwitansiHeight + offset, posX, posY + kwitansiHeight + offset + markLen);
        pdf.line(posX + kwitansiWidth + offset, posY + kwitansiHeight, posX + kwitansiWidth + offset + markLen, posY + kwitansiHeight);
        pdf.line(posX + kwitansiWidth, posY + kwitansiHeight + offset, posX + kwitansiWidth, posY + kwitansiHeight + offset + markLen);
      }
      const pdfBlob = pdf.output("blob");
      fileBlob = new Blob([pdfBlob], { type: "application/pdf" });
    }

    // Sanitasi nama file output: hilangkan titik, garis miring, dan karakter ilegal
    let cleanNoBukti = (options.nomorBukti || options.formData?.nomorBukti || "BKU")
      .trim()
      .replace(/[/\\?%*:|"<>.]/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_");

    if (cleanNoBukti.toLowerCase().endsWith("_pdf")) {
      cleanNoBukti = cleanNoBukti.slice(0, -4);
    }
    if (cleanNoBukti.toLowerCase().endsWith(".pdf")) {
      cleanNoBukti = cleanNoBukti.slice(0, -4);
    }

    const filename = `Kwitansi_${cleanNoBukti}_F4.pdf`;
    const blobUrl = window.URL.createObjectURL(fileBlob);

    // Download otomatis via elemen anchor
    const downloadLink = document.createElement("a");
    downloadLink.href = blobUrl;
    downloadLink.download = filename;
    downloadLink.setAttribute("download", filename);
    downloadLink.setAttribute("target", "_blank");
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();

    // Pertahankan Blob URL selama 60 detik agar jika browser memunculkan dialog 'Save As',
    // data blob tidak terhapus sebelum pengguna selesai memilih lokasi simpan di Windows
    setTimeout(() => {
      if (document.body.contains(downloadLink)) {
        document.body.removeChild(downloadLink);
      }
      window.URL.revokeObjectURL(blobUrl);
    }, 60000);

    swalClose();

    // Tampilkan notifikasi sukses interaktif dengan tombol "Buka / Pratinjau PDF"
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
              <span class="font-semibold text-white bg-slate-800 px-2 py-0.5 rounded">Adobe / PDF Document (.pdf)</span>
            </div>
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-slate-400">Ukuran Kertas:</span>
              <span class="font-semibold text-emerald-300">F4 Landscape (330 × 215 mm)</span>
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
        confirmButton: "px-5 py-2.5 rounded-xl font-semibold text-xs shadow-md bg-emerald-600 hover:bg-emerald-700 text-white",
        cancelButton: "px-5 py-2.5 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        window.open(blobUrl, "_blank");
      }
    });

    return true;
  } catch (error: any) {
    console.error("Gagal mengekspor PDF Kwitansi:", error);
    swalClose();
    swalError(
      "Gagal Ekspor PDF",
      error?.message || "Terjadi kesalahan saat memproses gambar kwitansi menjadi PDF."
    );
    return false;
  }
}
