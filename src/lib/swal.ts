import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

/**
 * SweetAlert Helper Utility
 * Sesuai instruksi:
 * 1. Swal Loading: Menampilkan proses / loading tanpa tombol, backdrop blur
 * 2. Swal Konfirmasi Hapus dll: Dialog konfirmasi dengan tombol 'Ya, Hapus' & 'Batal'
 * 3. Swal Sukses: Otomatis hilang beberapa detik TANPA tombol OK / Yes
 * 4. Swal Error: Notifikasi kegagalan
 */

// 1. SWAL LOADING
export const swalLoading = (title = "Memproses...", text = "Mohon tunggu sebentar...") => {
  return Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
    background: "#0f172a",
    color: "#f8fafc",
    customClass: {
      popup: "rounded-3xl border border-slate-800 shadow-2xl",
      title: "text-base sm:text-lg font-bold text-white",
      htmlContainer: "text-xs sm:text-sm text-slate-400",
    },
  });
};

// Tutup Swal yang sedang aktif
export const swalClose = () => {
  Swal.close();
};

// 2. SWAL SUKSES (Auto dismiss TANPA tombol OK / Yes)
export const swalSuccess = (title: string, text?: string, timerMs = 1800) => {
  return Swal.fire({
    icon: "success",
    title,
    text,
    showConfirmButton: false, // Tidak ada tombol OK atau YES
    showCancelButton: false,
    timer: timerMs, // Otomatis menutup setelah beberapa detik
    timerProgressBar: true,
    background: "#0f172a",
    color: "#f8fafc",
    iconColor: "#10b981",
    customClass: {
      popup: "rounded-3xl border border-slate-800 shadow-2xl",
      title: "text-base sm:text-lg font-bold text-white",
      htmlContainer: "text-xs sm:text-sm text-slate-300",
      timerProgressBar: "bg-emerald-500",
    },
  });
};

// 3. SWAL ERROR
export const swalError = (title = "Terjadi Kesalahan", text?: string) => {
  return Swal.fire({
    icon: "error",
    title,
    text,
    showConfirmButton: true,
    confirmButtonText: "Tutup",
    confirmButtonColor: "#ef4444",
    background: "#0f172a",
    color: "#f8fafc",
    iconColor: "#ef4444",
    customClass: {
      popup: "rounded-3xl border border-slate-800 shadow-2xl",
      title: "text-base sm:text-lg font-bold text-white",
      htmlContainer: "text-xs sm:text-sm text-slate-300",
      confirmButton: "px-5 py-2.5 rounded-xl font-semibold text-xs shadow-md",
    },
  });
};

// 4. SWAL KONFIRMASI HAPUS
export const swalConfirmDelete = async (options?: {
  title?: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
}): Promise<boolean> => {
  const result = await Swal.fire({
    icon: "warning",
    title: options?.title || "Konfirmasi Hapus",
    text: options?.text || "Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.",
    showCancelButton: true,
    confirmButtonText: options?.confirmText || "Ya, Hapus!",
    cancelButtonText: options?.cancelText || "Batal",
    confirmButtonColor: "#dc2626", // Merah
    cancelButtonColor: "#334155", // Slate
    reverseButtons: true,
    focusCancel: true,
    background: "#0f172a",
    color: "#f8fafc",
    iconColor: "#f59e0b",
    customClass: {
      popup: "rounded-3xl border border-slate-800 shadow-2xl",
      title: "text-base sm:text-lg font-bold text-white",
      htmlContainer: "text-xs sm:text-sm text-slate-300",
      confirmButton: "px-5 py-2.5 rounded-xl font-semibold text-xs shadow-md bg-red-600 hover:bg-red-700 text-white",
      cancelButton: "px-5 py-2.5 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300",
    },
  });

  return result.isConfirmed;
};

// 5. SWAL KONFIRMASI UMUM
export const swalConfirm = async (options: {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: "question" | "warning" | "info";
}): Promise<boolean> => {
  const result = await Swal.fire({
    icon: options.icon || "question",
    title: options.title,
    text: options.text,
    showCancelButton: true,
    confirmButtonText: options.confirmText || "Lanjutkan",
    cancelButtonText: options.cancelText || "Batal",
    confirmButtonColor: "#059669",
    cancelButtonColor: "#334155",
    reverseButtons: true,
    background: "#0f172a",
    color: "#f8fafc",
    customClass: {
      popup: "rounded-3xl border border-slate-800 shadow-2xl",
      title: "text-base sm:text-lg font-bold text-white",
      htmlContainer: "text-xs sm:text-sm text-slate-300",
      confirmButton: "px-5 py-2.5 rounded-xl font-semibold text-xs shadow-md bg-emerald-600 hover:bg-emerald-700 text-white",
      cancelButton: "px-5 py-2.5 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300",
    },
  });

  return result.isConfirmed;
};

// 6. SWAL SUKSES DENGAN OPSI AKSI LANGSUNG (e.g. Buka BKU)
export const swalSuccessWithAction = async (options: {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
}): Promise<boolean> => {
  const result = await Swal.fire({
    icon: "success",
    title: options.title,
    text: options.text,
    showCancelButton: true,
    confirmButtonText: options.confirmText || "Lihat di Buku Kas Umum (BKU) →",
    cancelButtonText: options.cancelText || "Tetap di Generator",
    confirmButtonColor: "#059669",
    cancelButtonColor: "#334155",
    reverseButtons: false,
    background: "#0f172a",
    color: "#f8fafc",
    iconColor: "#10b981",
    customClass: {
      popup: "rounded-3xl border border-slate-800 shadow-2xl",
      title: "text-base sm:text-lg font-bold text-white",
      htmlContainer: "text-xs sm:text-sm text-slate-300",
      confirmButton: "px-5 py-2.5 rounded-xl font-semibold text-xs shadow-md bg-emerald-600 hover:bg-emerald-700 text-white",
      cancelButton: "px-5 py-2.5 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300",
    },
  });

  return result.isConfirmed;
};

// 7. SWAL ALUR PENGADAAN TERPADU (Multi-Step Workflow Prompt)
export const swalWorkflowPrompt = async (options: {
  title: string;
  html?: string;
  text?: string;
  confirmText?: string;
  denyText?: string;
  cancelText?: string;
}): Promise<"confirm" | "deny" | "cancel"> => {
  const result = await Swal.fire({
    icon: "success",
    title: options.title,
    html: options.html,
    text: options.text,
    showConfirmButton: true,
    showDenyButton: Boolean(options.denyText),
    showCancelButton: true,
    confirmButtonText: options.confirmText || "Lanjutkan",
    denyButtonText: options.denyText,
    cancelButtonText: options.cancelText || "Tetap di Halaman Ini",
    confirmButtonColor: "#059669",
    denyButtonColor: "#0284c7",
    cancelButtonColor: "#334155",
    reverseButtons: false,
    background: "#0f172a",
    color: "#f8fafc",
    iconColor: "#10b981",
    customClass: {
      popup: "rounded-3xl border border-slate-800 shadow-2xl p-6",
      title: "text-base sm:text-lg font-bold text-white",
      htmlContainer: "text-xs sm:text-sm text-slate-300 leading-relaxed text-left",
      actions: "flex flex-wrap gap-2 justify-center mt-4",
      confirmButton: "px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5",
      denyButton: "px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md bg-sky-600 hover:bg-sky-500 text-white transition-all flex items-center gap-1.5",
      cancelButton: "px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all",
    },
  });

  if (result.isConfirmed) return "confirm";
  if (result.isDenied) return "deny";
  return "cancel";
};

// 8. SWAL ALUR PENGADAAN TERPADU DENGAN DOKUMENTASI (4 Opsi: SP, BAST, Dokumentasi, atau Tetap)
export const swalProcurementWorkflowPrompt = async (options: {
  nomorBukti: string;
  nominal: number;
  hasPhotos?: boolean;
}): Promise<"sp" | "bast" | "dokumentasi" | "stay"> => {
  return new Promise((resolve) => {
    Swal.fire({
      icon: "success",
      title: "Kwitansi Berhasil Disimpan ke BKU!",
      html: `
        <div class="space-y-3 text-left">
          <p class="text-xs sm:text-sm text-slate-200">
            Transaksi bukti kas <strong>${options.nomorBukti}</strong> senilai <strong>Rp ${options.nominal.toLocaleString("id-ID")}</strong> telah resmi tercatat di Buku Kas Umum (BKU).
          </p>
          <div class="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
            <strong class="text-emerald-400 block font-semibold text-xs">
              Langkah Selanjutnya dalam Alur Pengadaan Terpadu:
            </strong>
            <p class="text-[11px] text-slate-400 leading-snug">
              Pilih tindakan lanjutan untuk melengkapi berkas pengadaan atau menyusun lembar foto fisik LPJ:
            </p>
            <div class="grid grid-cols-1 gap-2 pt-1">
              <button id="swalBtnSp" type="button" class="w-full text-left p-2.5 rounded-xl bg-slate-800 hover:bg-sky-950 border border-slate-700 hover:border-sky-500 text-slate-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer shadow-xs">
                <div>
                  <span class="text-xs font-bold text-sky-400 block">📝 Step 3: Buat Surat Pesanan (SP)</span>
                  <span class="text-[10.5px] text-slate-400">Pemesanan resmi spesifikasi barang ke toko / rekanan</span>
                </div>
                <span class="text-xs text-sky-400 font-bold group-hover:translate-x-1 transition-transform ml-2">➔</span>
              </button>
              <button id="swalBtnBast" type="button" class="w-full text-left p-2.5 rounded-xl bg-slate-800 hover:bg-emerald-950 border border-slate-700 hover:border-emerald-500 text-slate-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer shadow-xs">
                <div>
                  <span class="text-xs font-bold text-emerald-400 block">📦 Step 4: Berita Acara Serah Terima (BAST)</span>
                  <span class="text-[10.5px] text-slate-400">Pemeriksaan &amp; serah terima fisik barang dari penyedia</span>
                </div>
                <span class="text-xs text-emerald-400 font-bold group-hover:translate-x-1 transition-transform ml-2">➔</span>
              </button>
              <button id="swalBtnDokumentasi" type="button" class="w-full text-left p-2.5 rounded-xl bg-slate-800 hover:bg-amber-950 border border-slate-700 hover:border-amber-500 text-slate-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer shadow-xs">
                <div>
                  <span class="text-xs font-bold text-amber-400 block">📸 Step 5: Lembar Dokumentasi Foto F4</span>
                  <span class="text-[10.5px] text-slate-400">Susun foto nota &amp; bukti fisik kegiatan ke lembar siap cetak F4</span>
                </div>
                <span class="text-xs text-amber-400 font-bold group-hover:translate-x-1 transition-transform ml-2">➔</span>
              </button>
            </div>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: "Selesai (Tetap di Kwitansi)",
      cancelButtonColor: "#334155",
      background: "#0f172a",
      color: "#f8fafc",
      iconColor: "#10b981",
      customClass: {
        popup: "rounded-3xl border border-slate-800 shadow-2xl p-5 sm:p-6 max-w-lg",
        title: "text-base sm:text-lg font-bold text-white",
        cancelButton: "px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all",
      },
      didOpen: () => {
        document.getElementById("swalBtnSp")?.addEventListener("click", () => {
          Swal.close();
          resolve("sp");
        });
        document.getElementById("swalBtnBast")?.addEventListener("click", () => {
          Swal.close();
          resolve("bast");
        });
        document.getElementById("swalBtnDokumentasi")?.addEventListener("click", () => {
          Swal.close();
          resolve("dokumentasi");
        });
      },
    }).then((res) => {
      if (res.dismiss) {
        resolve("stay");
      }
    });
  });
};

export default Swal;

