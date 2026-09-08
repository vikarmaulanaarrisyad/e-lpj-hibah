/**
 * Utilitas pemformatan teks LPJ: Proper Case / Title Case
 * Menangani teks belanja seperti "Belanja ALAT HADROH" -> "Belanja Alat Hadroh"
 * dengan menjaga akronim umum organisasi, administrasi, dan perpajakan tetap kapital (ATK, LCD, NU, LPJ, dll).
 */

// Akronim resmi & istilah teknis umum LPJ yang harus selalu huruf kapital penuh
const LPJ_ACRONYMS = new Set([
  "NU",
  "PR",
  "PAC",
  "PC",
  "PW",
  "PP",
  "IPNU",
  "IPPNU",
  "GP",
  "ANSOR",
  "RI",
  "RT",
  "RW",
  "DPRD",
  "DPR",
  "LPJ",
  "NPHD",
  "BKU",
  "RAB",
  "SP",
  "SPK",
  "BAST",
  "ATK",
  "HVS",
  "LCD",
  "LED",
  "PC",
  "AC",
  "USB",
  "TV",
  "CCTV",
  "MIC",
  "KTP",
  "NPWP",
  "PPN",
  "BUMDES",
  "SK",
  "APBD",
  "APBN",
  "SD",
  "MI",
  "SMP",
  "MTS",
  "SMA",
  "SMK",
  "MA",
  "PAUD",
  "TK",
  "RA",
  "TPQ",
  "MDTA",
  "MARS",
  "ID",
  "PDF",
  "PNG",
  "JPG",
  "DOC",
  "XLS",
]);

// Pola angka Romawi umum (I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII, dst)
const ROMAN_NUMERAL_REGEX = /^(?:M{0,4}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3}))$/i;

// Kata penghubung & preposisi bahasa Indonesia yang ditulis huruf kecil jika berada di tengah kalimat
const LOWERCASE_WORDS = new Set([
  "dan",
  "atau",
  "ke",
  "di",
  "dari",
  "pada",
  "untuk",
  "dengan",
  "oleh",
  "terhadap",
  "dalam",
  "atas",
  "per",
  "tentang",
  "sebagai",
  "x",
]);

/**
 * Mengubah teks ke format Proper Case (Title Case)
 * Contoh:
 * - "BELANJA ALAT HADROH" -> "Belanja Alat Hadroh"
 * - "Belanja ALAT HADROH" -> "Belanja Alat Hadroh"
 * - "PENGADAAN SARANA SOUND AKTIF & ALAT HADROH" -> "Pengadaan Sarana Sound Aktif & Alat Hadroh"
 * - "Belanja ATK & Kertas HVS" -> "Belanja ATK & Kertas HVS"
 * - "Pelatihan MARS Fatayat NU" -> "Pelatihan MARS Fatayat NU"
 */
export function formatProperCase(str?: string | null): string {
  if (!str) return "";
  const trimmed = str.trim();
  if (!trimmed) return "";

  let wordIndex = 0;

  // Ekstrak dan ganti setiap token kata dengan tetap menjaga spasi, tanda kurung, garis miring, dsb.
  return trimmed.replace(/\b([a-zA-Z0-9]+)\b/g, (_match, word) => {
    // Jika token hanya angka (contoh: "15", "2026", "1"), biarkan apa adanya
    if (/^\d+$/.test(word)) {
      return word;
    }

    const upper = word.toUpperCase();
    const lower = word.toLowerCase();
    const isFirstWord = wordIndex === 0;
    wordIndex++;

    // Pengecualian kata dengan format khusus
    if (upper === "FATAYAT") return "Fatayat";
    if (upper === "MUSLIMAT") return "Muslimat";
    if (upper === "PPH") return "PPh";
    if (upper === "RP") return "Rp";

    // Cek apakah termasuk akronim tetap (ATK, LCD, NU, LPJ, dll.)
    if (LPJ_ACRONYMS.has(upper)) {
      return upper;
    }

    // Cek angka romawi (misal "I", "II", "VI", "VIII")
    if (upper.length > 0 && /^[IVXLCDM]+$/.test(upper) && ROMAN_NUMERAL_REGEX.test(upper)) {
      if (upper !== "D") {
        return upper;
      }
    }

    // Kata hubung / preposisi tetap kecil jika bukan kata pertama
    if (!isFirstWord && LOWERCASE_WORDS.has(lower)) {
      return lower;
    }

    // Format Proper Case biasa
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

/**
 * Format teks uraian "Guna Membayar" pada Kwitansi.
 * Memisahkan deskripsi kegiatan/barang dari ekor perhitungan formula
 * (contoh: "sebanyak 1 unit x @ Rp. 5.800.000 = Rp. 5.800.000"),
 * memformat deskripsinya ke Proper Case, lalu menyatukan kembali dengan formulanya.
 *
 * Contoh:
 * - "Belanja ALAT HADROH sebanyak 1 unit x @ Rp. 5.800.000 = Rp. 5.800.000"
 *   -> "Belanja Alat Hadroh sebanyak 1 unit x @ Rp. 5.800.000 = Rp. 5.800.000"
 * - "BELANJA ALAT HADROH"
 *   -> "Belanja Alat Hadroh"
 */
export function formatUraianBelanja(uraian?: string | null): string {
  if (!uraian) return "";
  const trimmed = uraian.trim();
  if (!trimmed) return "";

  // Deteksi dimulainya rincian kuantitas/harga (ekor perhitungan)
  const tailMatch = trimmed.match(
    /(\s+(?:sebanyak|sebesar|sejumlah|senilai)\b.*|\s+\d+\s*(?:kotak|unit|buah|paket|orang|rim|pcs|dus|lembar|set|stel|meter|hari)\s*x\s*@.*|\s*x\s*@\s*Rp.*|\s*=\s*Rp.*)/i
  );

  if (tailMatch && tailMatch.index !== undefined && tailMatch.index > 0) {
    const head = trimmed.slice(0, tailMatch.index);
    const tail = trimmed.slice(tailMatch.index);
    return `${formatProperCase(head)}${tail}`;
  }

  return formatProperCase(trimmed);
}

/**
 * Membersihkan dan memformat judul paket pekerjaan atau jenis barang
 * untuk Surat Pesanan (SP) dan Berita Acara (BAST).
 * Menghilangkan ekor "sebanyak..." / perkalian, serta mengonversi ke Proper Case.
 *
 * Contoh:
 * - "Belanja ALAT HADROH sebanyak 1 unit x @ Rp..." -> "Belanja Alat Hadroh"
 * - "ALAT HADROH" -> "Alat Hadroh"
 */
export function cleanAndFormatTitle(text?: string | null): string {
  if (!text) return "";
  let clean = text.trim();
  clean = clean.split(/\s+(?:sebanyak|sebesar|sejumlah|senilai)\s+/i)[0].trim();
  clean = clean.split(/\s+\d+\s*(?:kotak|unit|buah|paket|orang|rim|pcs|dus|lembar|set|stel|meter|hari)\s*x\s*@/i)[0].trim();
  clean = clean.split(/\s*x\s*@\s*Rp/i)[0].trim();
  clean = clean.split(/\s*=\s*Rp/i)[0].trim();
  return formatProperCase(clean);
}
