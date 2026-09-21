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

/**
 * Pemetaan gelar akademik & kehormatan baku (PUEBI/EYD).
 * Memastikan gelar seperti S.Pd.I tidak menjadi kapital penuh (S.PD.I).
 */
const GELAR_STANDAR_MAP: Record<string, string> = {
  "S.PD.I": "S.Pd.I",
  "S.PDI": "S.Pd.I",
  "S.PD": "S.Pd",
  "S.AG": "S.Ag",
  "S.AG.I": "S.Ag.I",
  "S.E": "S.E",
  "S.EI": "S.E.I",
  "S.E.I": "S.E.I",
  "S.KOM": "S.Kom",
  "S.SOS": "S.Sos",
  "S.SOS.I": "S.Sos.I",
  "S.KED": "S.Ked",
  "S.H": "S.H",
  "S.HI": "S.H.I",
  "S.H.I": "S.H.I",
  "S.T": "S.T",
  "S.SI": "S.Si",
  "S.PSI": "S.Psi",
  "S.HUM": "S.Hum",
  "S.FARM": "S.Farm",
  "S.STAT": "S.Stat",
  "S.MAT": "S.Mat",
  "S.GZ": "S.Gz",
  "S.IP": "S.IP",
  "S.IP.": "S.IP",
  "S.KEL": "S.Kel",
  "S.PI": "S.Pi",
  "S.PT": "S.Pt",
  "S.P": "S.P",
  "S.SN": "S.Sn",
  "S.TH": "S.Th",
  "S.TH.I": "S.Th.I",
  "S.TR.T": "S.Tr.T",
  "S.TR.KOM": "S.Tr.Kom",
  "S.TR.SOS": "S.Tr.Sos",
  "S.TR.KEB": "S.Tr.Keb",
  "S.TR.KES": "S.Tr.Kes",
  "S.TR": "S.Tr",
  "M.PD.I": "M.Pd.I",
  "M.PDI": "M.Pd.I",
  "M.PD": "M.Pd",
  "M.AG": "M.Ag",
  "M.E": "M.E",
  "M.EI": "M.E.I",
  "M.E.I": "M.E.I",
  "M.KOM": "M.Kom",
  "M.M": "M.M",
  "M.SI": "M.Si",
  "M.SC": "M.Sc",
  "M.H": "M.H",
  "M.T": "M.T",
  "M.KES": "M.Kes",
  "M.HUM": "M.Hum",
  "M.KN": "M.Kn",
  "M.SOS": "M.Sos",
  "M.FARM": "M.Farm",
  "M.STAT": "M.Stat",
  "A.MD": "A.Md",
  "A.MD.KEB": "A.Md.Keb",
  "A.MD.KEP": "A.Md.Kep",
  "A.MD.KOM": "A.Md.Kom",
  "A.MD.FARM": "A.Md.Farm",
  "A.MD.RMIK": "A.Md.RMIK",
  "A.MD.AK": "A.Md.Ak",
  "A.MD.P": "A.Md.P",
  "A.MA.PD": "A.Ma.Pd",
  "A.MA": "A.Ma",
  "PH.D": "Ph.D",
  "LL.M": "LL.M",
  "MBA": "MBA",
  "M.B.A": "M.B.A",
};

/**
 * Format satu fragmen gelar akademik
 */
function formatSingleGelar(g: string): string {
  const clean = g.trim();
  if (!clean) return "";

  const upper = clean.toUpperCase();
  const upperNoDot = upper.endsWith(".") ? upper.slice(0, -1) : upper;
  const upperWithDot = upper.endsWith(".") ? upper : upper + ".";

  if (GELAR_STANDAR_MAP[upper]) return GELAR_STANDAR_MAP[upper];
  if (GELAR_STANDAR_MAP[upperNoDot]) return GELAR_STANDAR_MAP[upperNoDot];
  if (GELAR_STANDAR_MAP[upperWithDot]) return GELAR_STANDAR_MAP[upperWithDot];

  // Pola umum sarjana/magister: S.Xxx / M.Xxx / A.Md.Xxx
  const pattern = /^([SMA])\.([A-Za-z]+)(?:\.([A-Za-z]+))?\.?$/;
  const match = clean.match(pattern);
  if (match) {
    const prefix = match[1].toUpperCase();
    const mid =
      match[2].length === 1
        ? match[2].toUpperCase()
        : match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase();
    const suffix = match[3]
      ? match[3].toUpperCase() === "I"
        ? ".I"
        : "." + match[3].charAt(0).toUpperCase() + match[3].slice(1).toLowerCase()
      : "";
    return `${prefix}.${mid}${suffix}`;
  }

  // Jika pengguna menulis dengan mixed-case (ada huruf kecil), pertahankan
  if (clean !== clean.toUpperCase() && clean !== clean.toLowerCase()) {
    return clean;
  }

  return clean;
}

/**
 * Format nama orang & penandatangan dokumen dinas/LPJ:
 * - Nama lengkap orang: HURUF KAPITAL (Contoh: "HENI FUJIATI")
 * - Gelar akademik / kehormatan: Casing baku EYD/PUEBI (Contoh: "S.Pd.I", bukan "S.PD.I")
 *
 * Contoh:
 * - "HENI FUJIATI, S.Pd.I" -> "HENI FUJIATI, S.Pd.I"
 * - "HENI FUJIATI, S.PD.I" -> "HENI FUJIATI, S.Pd.I"
 * - "heni fujiati, s.pd.i" -> "HENI FUJIATI, S.Pd.I"
 * - "Heni Fujiati, S.Pd.I" -> "HENI FUJIATI, S.Pd.I"
 * - "HENI FUJIATI S.PD.I" -> "HENI FUJIATI, S.Pd.I"
 * - "NUR ALIMAH" -> "NUR ALIMAH"
 * - "Drs. Ahmad Fauzi, M.Pd.I" -> "Drs. AHMAD FAUZI, M.Pd.I"
 */
export function formatPersonName(name?: string | null): string {
  if (!name) return "";
  const trimmed = name.trim();
  if (!trimmed) return "";

  // Pisahkan bagian nama utama dan bagian gelar (berdasarkan tanda koma)
  let mainPart = trimmed;
  let gelarParts: string[] = [];

  if (trimmed.includes(",")) {
    const parts = trimmed.split(",");
    mainPart = parts[0].trim();
    gelarParts = parts.slice(1).map((s) => s.trim()).filter(Boolean);
  } else {
    // Jika tidak ada koma tapi berakhiran pola gelar umum (misal: "HENI FUJIATI S.PD.I")
    const match = trimmed.match(
      /^(.*?)(?:,\s*|\s+)((?:[SMA]\.[A-Za-z]+(?:\.[A-Za-z]+)?\.?|S\.Kom|M\.Kom|S\.Sos|M\.M|Ph\.D|LL\.M|MBA)(?:,\s*.*)?)$/i
    );
    if (match) {
      mainPart = match[1].trim();
      gelarParts = match[2].split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  // Tangani gelar kehormatan / gelar depan (Drs., Dra., Dr., dr., Prof., H., Hj., K.H., dll.)
  const PREFIX_TITLES = [
    "Drs.",
    "Dra.",
    "Dr.",
    "dr.",
    "drg.",
    "drh.",
    "Prof.",
    "H.",
    "Hj.",
    "K.H.",
    "K.",
    "Ust.",
    "Ir.",
    "Ns.",
    "Apt.",
  ];

  let currentMain = mainPart;
  const foundPrefixes: string[] = [];
  let prefixFound = true;

  while (prefixFound) {
    prefixFound = false;
    for (const p of PREFIX_TITLES) {
      const pRegex = new RegExp("^" + p.replace(".", "\\.") + "\\s*", "i");
      const m = currentMain.match(pRegex);
      if (m) {
        foundPrefixes.push(p);
        currentMain = currentMain.slice(m[0].length).trim();
        prefixFound = true;
        break;
      }
    }
  }

  // Nama orang utama dikonversi ke HURUF KAPITAL
  const formattedName = currentMain.toUpperCase();
  const fullMain =
    foundPrefixes.length > 0
      ? `${foundPrefixes.join(" ")} ${formattedName}`
      : formattedName;

  if (gelarParts.length === 0) {
    return fullMain;
  }

  const formattedGelars = gelarParts
    .map((g) => formatSingleGelar(g))
    .filter(Boolean);

  return `${fullMain}, ${formattedGelars.join(", ")}`;
}

