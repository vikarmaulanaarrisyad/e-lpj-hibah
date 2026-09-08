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

export default Swal;

