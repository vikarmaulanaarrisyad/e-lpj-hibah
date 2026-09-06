import { angkaKeTerbilang } from "./terbilang";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const ROMAN_MONTHS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

/**
 * Format tanggal ISO (YYYY-MM-DD) atau Date menjadi format formal Indonesia:
 * Contoh: "2026-08-01" -> "01 Agustus 2026"
 */
export function formatDateIndo(dateStr?: string | Date | null): string {
  if (!dateStr) return "01 Agustus 2026";
  try {
    const d = typeof dateStr === "string" ? new Date(dateStr.split("T")[0]) : new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);

    const day = String(d.getDate()).padStart(2, "0");
    const month = MONTH_NAMES[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return String(dateStr);
  }
}

/**
 * Mendapatkan angka romawi bulan (1-12)
 */
export function getRomanMonth(monthIndex: number): string {
  return ROMAN_MONTHS[monthIndex] || "I";
}

/**
 * Menambahkan sejumlah hari kalender ke tanggal ISO (YYYY-MM-DD)
 */
export function addDaysToDate(dateStr: string, days: number): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  } catch {
    return dateStr;
  }
}

/**
 * Menghitung selisih hari kalender dan menghasilkan deskripsi waktu penyelesaian resmi:
 * Contoh: "3 (tiga) hari kalender dan pekerjaan harus sudah selesai pada tanggal 04 Agustus 2026"
 */
export function calculateDurasiDanDeskripsi(
  tanggalSpStr: string,
  batasWaktuStr: string
): {
  durasiHari: number;
  durasiTerbilang: string;
  formattedBatasWaktu: string;
  formattedTanggalSp: string;
  deskripsiWaktuPenyelesaian: string;
} {
  const dStart = new Date(tanggalSpStr);
  const dEnd = new Date(batasWaktuStr);

  dStart.setHours(0, 0, 0, 0);
  dEnd.setHours(0, 0, 0, 0);

  const diffMs = dEnd.getTime() - dStart.getTime();
  let diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (isNaN(diffDays) || diffDays < 0) {
    diffDays = 1;
  }
  if (diffDays === 0) {
    diffDays = 1; // Minimal 1 hari kalender
  }

  // Konversi angka durasi ke terbilang kata bahasa Indonesia
  const terbilangKata = angkaKeTerbilang(diffDays)
    .replace(/\s*rupiah/i, "")
    .toLowerCase()
    .trim();

  const formattedBatasWaktu = formatDateIndo(batasWaktuStr);
  const formattedTanggalSp = formatDateIndo(tanggalSpStr);

  const deskripsiWaktuPenyelesaian = `${diffDays} (${terbilangKata}) hari kalender dan pekerjaan harus sudah selesai pada tanggal ${formattedBatasWaktu}`;

  return {
    durasiHari: diffDays,
    durasiTerbilang: terbilangKata,
    formattedBatasWaktu,
    formattedTanggalSp,
    deskripsiWaktuPenyelesaian,
  };
}

/**
 * Menyesuaikan nomor SP secara otomatis jika mengandung pola bulan romawi & tahun:
 * Contoh: "02/A/PR.FNU/VIII/2026" jika tanggalnya diubah ke Juli 2026 -> "02/A/PR.FNU/VII/2026"
 */
export function syncNomorSpBulanTahun(currentNomor: string, dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return currentNomor;

    const romanMonth = getRomanMonth(d.getMonth());
    const year = String(d.getFullYear());

    // Regex mencocokkan pola romawi di segmen kedua terakhir dan tahun di segmen terakhir
    // misal: 02/A/PR.FNU/VIII/2026 atau 014/SP/SPK-FTY/VII/2026
    const parts = currentNomor.split("/");
    if (parts.length >= 4) {
      parts[parts.length - 2] = romanMonth;
      parts[parts.length - 1] = year;
      return parts.join("/");
    }
    return currentNomor;
  } catch {
    return currentNomor;
  }
}
