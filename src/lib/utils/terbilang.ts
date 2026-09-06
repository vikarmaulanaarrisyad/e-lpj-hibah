/**
 * Konversi angka numerik menjadi teks terbilang Bahasa Indonesia baku.
 * Contoh: 3000000 -> "Tiga Juta Rupiah"
 */
export function angkaKeTerbilang(nilai: number | string): string {
  const angka = Math.abs(typeof nilai === "string" ? parseInt(nilai.replace(/\D/g, ""), 10) : Math.floor(nilai));
  if (isNaN(angka) || angka === 0) return "Nol Rupiah";

  const huruf = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];

  function hitung(n: number): string {
    if (n < 12) {
      return huruf[n];
    } else if (n < 20) {
      return hitung(n - 10) + " Belas";
    } else if (n < 100) {
      return hitung(Math.floor(n / 10)) + " Puluh " + hitung(n % 10);
    } else if (n < 200) {
      return "Seratus " + hitung(n - 100);
    } else if (n < 1000) {
      return hitung(Math.floor(n / 100)) + " Ratus " + hitung(n % 100);
    } else if (n < 2000) {
      return "Seribu " + hitung(n - 1000);
    } else if (n < 1000000) {
      return hitung(Math.floor(n / 1000)) + " Ribu " + hitung(n % 1000);
    } else if (n < 1000000000) {
      return hitung(Math.floor(n / 1000000)) + " Juta " + hitung(n % 1000000);
    } else if (n < 1000000000000) {
      return hitung(Math.floor(n / 1000000000)) + " Miliar " + hitung(n % 1000000000);
    } else if (n < 1000000000000000) {
      return hitung(Math.floor(n / 1000000000000)) + " Triliun " + hitung(n % 1000000000000);
    }
    return "";
  }

  const hasil = hitung(angka).replace(/\s+/g, " ").trim();
  return `${hasil} Rupiah`;
}

/**
 * Format angka numerik ke format mata uang Rupiah tanpa desimal sen (contoh: 3000000 -> "3.000.000")
 */
export function formatRupiahNumber(nilai: number | string): string {
  const clean = typeof nilai === "string" ? nilai.replace(/\D/g, "") : Math.floor(nilai).toString();
  if (!clean || clean === "0") return "0";
  const num = parseInt(clean, 10);
  return num.toLocaleString("id-ID");
}

/**
 * Parse string format rupiah ke integer murni
 */
export function parseRupiahToNumber(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/\D/g, "");
  return parseInt(clean, 10) || 0;
}
