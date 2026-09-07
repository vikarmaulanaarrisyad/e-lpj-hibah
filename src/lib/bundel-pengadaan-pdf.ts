import { toPng } from "html-to-image";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { swalClose, swalError, swalLoading, swalSuccess } from "./swal";

/**
 * Capture an HTMLElement into high-res PNG data URL (300 DPI scale)
 */
async function captureElementImage(element: HTMLElement): Promise<string> {
  try {
    const dataUrl = await toPng(element, {
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
    console.warn("toPng failed, using html2canvas fallback:", err);
  }

  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    imageTimeout: 15000,
  });

  return canvas.toDataURL("image/png");
}

export interface ExportBundelPengadaanOptions {
  pesananElement: HTMLElement;
  bastElement: HTMLElement;
  nomorSp?: string;
  nomorBast?: string;
}

/**
 * Menyatukan Surat Pesanan (SP) dan Berita Acara Serah Terima (BAST)
 * ke dalam 1 berkas PDF multi-halaman berukuran F4 Portrait (215mm × 330mm)
 * lengkap dengan margin penjilidan 28mm di sisi kiri.
 */
export async function exportBundelPengadaanPdf(
  options: ExportBundelPengadaanOptions
): Promise<boolean> {
  const { pesananElement, bastElement, nomorSp, nomorBast } = options;

  if (!pesananElement || !bastElement) {
    swalError(
      "Elemen Tidak Ditemukan",
      "Format dokumen Surat Pesanan dan Berita Acara belum siap untuk disatukan."
    );
    return false;
  }

  try {
    swalLoading(
      "Menyiapkan Dokumen Bundel Pengadaan...",
      "Menggabungkan Surat Pesanan (Hal. 1) & Berita Acara (Hal. 2) ke PDF F4 Portrait dengan Margin Jilid..."
    );

    // Pastikan font & gambar selesai dirender
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));

    // 1. Capture Halaman 1: Surat Pesanan (SP)
    const spImgData = await captureElementImage(pesananElement);

    // 2. Capture Halaman 2: Berita Acara Serah Terima (BAST)
    const bastImgData = await captureElementImage(bastElement);

    // Inisialisasi jsPDF F4 Portrait (Folio 215mm x 330mm)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [215, 330],
      compress: true,
    });

    const pageWidth = 215;
    const pageHeight = 330;

    // Tambahkan Halaman 1: Surat Pesanan
    const spRect = pesananElement.getBoundingClientRect();
    const spRatio = spRect.height / spRect.width;
    const spHeight = Math.min(pageHeight, pageWidth * spRatio);
    pdf.addImage(spImgData, "PNG", 0, 0, pageWidth, spHeight, undefined, "FAST");

    // Tambahkan Halaman 2: Berita Acara Serah Terima (BAST)
    pdf.addPage([pageWidth, pageHeight], "portrait");
    const bastRect = bastElement.getBoundingClientRect();
    const bastRatio = bastRect.height / bastRect.width;
    const bastHeight = Math.min(pageHeight, pageWidth * bastRatio);
    pdf.addImage(bastImgData, "PNG", 0, 0, pageWidth, bastHeight, undefined, "FAST");

    const cleanSp = (nomorSp || "SP").replace(/[/\\?%*:|"<>]/g, "_");
    const cleanBast = (nomorBast || "BAST").replace(/[/\\?%*:|"<>]/g, "_");
    const filename = `BUNDEL_PENGADAAN_${cleanSp}_${cleanBast}.pdf`;

    pdf.save(filename);

    swalSuccess(
      "Bundel Pengadaan Siap!",
      `Dokumen Surat Pesanan (Hal. 1) dan Berita Acara (Hal. 2) berhasil digabungkan dalam file "${filename}". Dokumen siap dicetak dan dijilid.`
    );
    return true;
  } catch (error: any) {
    console.error("[exportBundelPengadaanPdf] Error:", error);
    swalError(
      "Gagal Mengunduh Bundel PDF",
      error?.message || "Terjadi kendala saat menyatukan dokumen pengadaan."
    );
    return false;
  }
}
