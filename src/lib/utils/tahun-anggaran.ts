/**
 * Utility Multi-Tahun Anggaran untuk E-LPJ Hibah
 */

export const AVAILABLE_TAHUN_ANGGARAN = ["2024", "2025", "2026", "2027", "2028"] as const;
export type TahunAnggaran = (typeof AVAILABLE_TAHUN_ANGGARAN)[number] | "ALL";

export const DEFAULT_TAHUN_ANGGARAN = "2026";
export const COOKIE_TAHUN_ANGGARAN = "app_tahun_anggaran";

/**
 * Validasi dan normalisasi tahun anggaran
 */
export function normalizeTahunAnggaran(val?: string | null): string {
  if (!val) return DEFAULT_TAHUN_ANGGARAN;
  if (val === "ALL") return "ALL";
  if (AVAILABLE_TAHUN_ANGGARAN.includes(val as any)) {
    return val;
  }
  // If it's a 4-digit year, allow it
  if (/^\d{4}$/.test(val)) {
    return val;
  }
  return DEFAULT_TAHUN_ANGGARAN;
}

/**
 * Menghasilkan batas tanggal awal dan akhir (UTC) untuk filter database
 */
export function getYearDateRange(tahun?: string | null): {
  startDate?: Date;
  endDate?: Date;
} {
  const norm = normalizeTahunAnggaran(tahun);
  if (norm === "ALL") {
    return {};
  }

  const yearNum = parseInt(norm, 10);
  if (isNaN(yearNum)) {
    return {};
  }

  return {
    startDate: new Date(`${yearNum}-01-01T00:00:00.000Z`),
    endDate: new Date(`${yearNum}-12-31T23:59:59.999Z`),
  };
}

/**
 * Memeriksa apakah suatu tanggal berada dalam tahun anggaran terpilih
 */
export function matchesTahunAnggaran(
  dateVal?: string | Date | null,
  tahun?: string | null
): boolean {
  const norm = normalizeTahunAnggaran(tahun);
  if (norm === "ALL") return true;
  if (!dateVal) return false;

  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return false;

  return d.getFullYear().toString() === norm;
}

/**
 * Mendapatkan label tampilan tahun anggaran
 */
export function formatTahunAnggaranLabel(tahun?: string | null): string {
  const norm = normalizeTahunAnggaran(tahun);
  if (norm === "ALL") return "Semua Tahun";
  return `TA ${norm}`;
}
