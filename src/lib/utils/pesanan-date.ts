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
  if (!dateStr) return "-";
  if (typeof dateStr === "string") {
    const clean = dateStr.split("T")[0].trim();
    const parts = clean.split("-");
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parts[2].padStart(2, "0");
      const month = MONTH_NAMES[monthIdx];
      if (month && year) {
        return `${day} ${month} ${year}`;
      }
    }
  }
  try {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
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
 * Mendapatkan angka romawi bulan (0-11 atau 1-12)
 */
export function getRomanMonth(monthIndex: number): string {
  return ROMAN_MONTHS[monthIndex] || "I";
}

/**
 * Menambahkan sejumlah hari kalender ke tanggal ISO (YYYY-MM-DD)
 */
export function addDaysToDate(dateStr: string, days: number): string {
  try {
    const clean = dateStr.split("T")[0].trim();
    const parts = clean.split("-").map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setDate(d.getDate() + days);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
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
 * Mendukung perhitungan inklusif (tanggal SP s/d Batas Waktu) atau override durasi eksplisit.
 * Contoh:
 *   SP 01 Agustus 2026 s/d Batas 04 Agustus 2026 -> 4 (empat) hari kalender (1, 2, 3, 4 Agustus)
 *   SP 04 Agustus 2026 s/d Batas 04 Agustus 2026 -> 1 (satu) hari kalender
 */
export function calculateDurasiDanDeskripsi(
  tanggalSpStr: string,
  batasWaktuStr: string,
  explicitDurasi?: number
): {
  durasiHari: number;
  durasiTerbilang: string;
  formattedBatasWaktu: string;
  formattedTanggalSp: string;
  deskripsiWaktuPenyelesaian: string;
} {
  let diffDays = 1;

  if (explicitDurasi && explicitDurasi > 0) {
    diffDays = explicitDurasi;
  } else {
    const p1 = (tanggalSpStr || "").split("T")[0].split("-").map(Number);
    const p2 = (batasWaktuStr || "").split("T")[0].split("-").map(Number);

    if (p1.length === 3 && p2.length === 3 && !p1.some(isNaN) && !p2.some(isNaN)) {
      const d1 = new Date(p1[0], p1[1] - 1, p1[2]);
      const d2 = new Date(p2[0], p2[1] - 1, p2[2]);
      const diffMs = d2.getTime() - d1.getTime();
      const rawDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));
      diffDays = rawDiff >= 0 ? rawDiff + 1 : 1;
    } else {
      const dStart = new Date(tanggalSpStr);
      const dEnd = new Date(batasWaktuStr);
      dStart.setHours(0, 0, 0, 0);
      dEnd.setHours(0, 0, 0, 0);
      const diffMs = dEnd.getTime() - dStart.getTime();
      const rawDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));
      diffDays = rawDiff >= 0 ? rawDiff + 1 : 1;
    }
  }

  if (isNaN(diffDays) || diffDays < 1) {
    diffDays = 1;
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
 * Menghitung mundur tanggal Surat Pesanan (SP) dari tanggal Nota/Batas Waktu:
 * Contoh:
 *   Nota: "2026-08-04", Durasi: 4 hari -> "2026-08-01" (1 s/d 4 Agustus = 4 hari)
 *   Nota: "2026-08-04", Durasi: 1 hari -> "2026-08-04" (Belanja langsung hari yang sama)
 */
export function calculateTanggalSpDariNota(batasWaktuStr: string, durasiHari: number): string {
  const safeDays = Math.max(1, durasiHari);
  return addDaysToDate(batasWaktuStr, -(safeDays - 1));
}

/**
 * Memastikan pola format penomoran memuat kode jenis dokumen resmi (KW / SP / BA).
 * Contoh:
 *   ensureDocumentPrefix("/A/PR.FNU/", "KW") -> "/KW/A/PR.FNU/"
 *   ensureDocumentPrefix("/SP/A/PR.FNU/", "SP") -> "/SP/A/PR.FNU/"
 *   ensureDocumentPrefix("/BA/A/PR.FNU/", "BA") -> "/BA/A/PR.FNU/"
 */
export function ensureDocumentPrefix(
  formatPattern: string | undefined | null,
  docType: "KW" | "SP" | "BA"
): string {
  if (!formatPattern || !formatPattern.trim()) {
    return `/${docType}/A/PR.FNU/`;
  }

  const clean = formatPattern.trim();
  const trimmed = clean.replace(/^\/+|\/+$/g, "");

  // Cek apakah sudah diawali KW, SP, BA, atau BAST
  const match = trimmed.match(/^(KW|SP|BA|BAST)(?:[\/\.]|$)/i);
  if (match) {
    const after = trimmed.slice(match[0].length).replace(/^\/+/, "");
    return `/${docType}/${after}/`;
  }

  return `/${docType}/${trimmed}/`;
}

/**
 * Ekstrak nomor urut dari nomor dokumen (contoh: "001/SP/..." -> "001", "02/A/..." -> "002")
 */
export function extractDocumentSequence(fullNomor?: string | null): string {
  if (!fullNomor) return "001";
  const trimmed = fullNomor.trim();
  const match = trimmed.match(/^(\d+)/);
  if (match) {
    const val = parseInt(match[1], 10);
    return isNaN(val) ? "001" : String(val).padStart(3, "0");
  }
  return "001";
}

/**
 * Membangun nomor surat / dokumen resmi (Kwitansi / SP / BAST) secara otomatis:
 * Menggabungkan: [Nomor Urut 3 Digit] + [Format Kode Instansi] + [Bulan Romawi dari Tanggal] + [Tahun dari Tanggal]
 * Contoh:
 *   buildFormattedDocumentNumber("1", "/KW/A/PR.FNU/", "2026-08-01") -> "001/KW/A/PR.FNU/VIII/2026"
 *   buildFormattedDocumentNumber("001", "/SP/A/PR.FNU/", "2026-08-06") -> "001/SP/A/PR.FNU/VIII/2026"
 *   buildFormattedDocumentNumber("001", "/BA/A/PR.FNU/", "2026-08-06") -> "001/BA/A/PR.FNU/VIII/2026"
 */
export function buildFormattedDocumentNumber(
  nomorUrut: string | number,
  formatPattern: string,
  dateStr: string | Date
): string {
  try {
    let romanMonth = "I";
    let year = "2026";

    if (typeof dateStr === "string") {
      const cleanDate = dateStr.split("T")[0].trim();
      const parts = cleanDate.split("-").map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        romanMonth = getRomanMonth(parts[1] - 1);
        year = String(parts[0]);
      } else {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          romanMonth = getRomanMonth(d.getMonth());
          year = String(d.getFullYear());
        }
      }
    } else if (dateStr instanceof Date && !isNaN(dateStr.getTime())) {
      romanMonth = getRomanMonth(dateStr.getMonth());
      year = String(dateStr.getFullYear());
    }

    // Bersihkan formatPattern dari slash di awal dan akhir
    const cleanPattern = (formatPattern || "A/PR.FNU")
      .trim()
      .replace(/^\/+|\/+$/g, "");

    // Format nomor urut minimal 3 digit (contoh: 1 -> "001", 2 -> "002", dst)
    let paddedUrut = String(nomorUrut ?? "001").trim();
    if (/^\d+$/.test(paddedUrut)) {
      paddedUrut = paddedUrut.padStart(3, "0");
    } else if (!paddedUrut) {
      paddedUrut = "001";
    }

    return `${paddedUrut}/${cleanPattern}/${romanMonth}/${year}`;
  } catch {
    return String(nomorUrut || "001");
  }
}

/**
 * Memecah nomor surat yang sudah ada menjadi komponen:
 * [nomorUrut, formatPattern, romanMonth, year]
 * Contoh: "02/A/PR.FNU/VIII/2026" -> { nomorUrut: "02", formatPattern: "/A/PR.FNU/", romanMonth: "VIII", year: "2026" }
 */
export function deconstructDocumentNumber(fullNomor: string): {
  nomorUrut: string;
  formatPattern: string;
  romanMonth: string;
  year: string;
} {
  try {
    const raw = (fullNomor || "").trim();
    const parts = raw.split("/").filter((p) => p.length > 0);

    if (parts.length >= 4) {
      const nomorUrut = parts[0];
      const year = parts[parts.length - 1];
      const romanMonth = parts[parts.length - 2];
      const middleTokens = parts.slice(1, parts.length - 2);
      const formatPattern = `/${middleTokens.join("/")}/`;

      return {
        nomorUrut,
        formatPattern,
        romanMonth,
        year,
      };
    }

    if (parts.length === 3) {
      return {
        nomorUrut: parts[0] || "001",
        formatPattern: `/${parts[1]}/`,
        romanMonth: "VIII",
        year: parts[2] || "2026",
      };
    }

    return {
      nomorUrut: parts[0] || "001",
      formatPattern: "/A/PR.FNU/",
      romanMonth: "VIII",
      year: "2026",
    };
  } catch {
    return {
      nomorUrut: "001",
      formatPattern: "/A/PR.FNU/",
      romanMonth: "VIII",
      year: "2026",
    };
  }
}

/**
 * Menyesuaikan nomor dokumen surat / pesanan / berita acara secara otomatis
 * ketika tanggal dokumen berubah:
 * Contoh: "02/A/PR.FNU/VIII/2026" jika tanggalnya diubah ke September 2026 -> "02/A/PR.FNU/IX/2026"
 */
export function syncNomorDokumenBulanTahun(currentNomor: string, dateStr: string): string {
  try {
    const clean = (dateStr || "").split("T")[0].trim();
    const partsDate = clean.split("-").map(Number);
    let romanMonth = "I";
    let year = "2026";

    if (partsDate.length === 3 && !partsDate.some(isNaN)) {
      romanMonth = getRomanMonth(partsDate[1] - 1);
      year = String(partsDate[0]);
    } else {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return currentNomor;
      romanMonth = getRomanMonth(d.getMonth());
      year = String(d.getFullYear());
    }

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

// Backward compatibility alias
export const syncNomorSpBulanTahun = syncNomorDokumenBulanTahun;

/**
 * Ekstrak nama desa / kota untuk titimangsa dokumen dari database profil lembaga
 * 1. Mengambil nama Desa/Kelurahan dari alamat profil lembaga di database
 * 2. Fallback ke nama depan subNama lembaga di database
 * 3. Fallback ke default (contoh: "Dawuhan")
 */
export function extractNamaTempat(
  profile?: { alamat?: string | null; subNama?: string | null } | null,
  fallback = "Dawuhan"
): string {
  if (!profile) return fallback;

  // 1. Coba cari nama Desa / Kelurahan dari alamat profil lembaga di database
  // Contoh alamat: "Jl. Kemuning 2016 Desa Dawuhan RT.23 RW.06 Talang – Tegal 52193"
  if (profile.alamat) {
    const matchDesa = profile.alamat.match(
      /(?:Desa|Kelurahan|Kel\.|Ds\.)\s+([A-Za-z\s]+?)(?=\s+(?:RT|RW|Kec|Kecamatan|Kab|Kabupaten|–|-|\d)|$)/i
    );
    if (matchDesa && matchDesa[1]?.trim()) {
      const words = matchDesa[1].trim().split(/\s+/);
      return words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    }
  }

  // 2. Coba ekstrak dari subNama profil lembaga di database (contoh: "DAWUHAN SELATAN" -> "Dawuhan")
  if (profile.subNama) {
    const cleanSub = profile.subNama.trim();
    const words = cleanSub.split(/\s+/);
    if (words.length > 0 && words[0]) {
      const firstWord = words[0].trim();
      return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
    }
  }

  return fallback;
}

/**
 * Membersihkan jabatan penandatangan agar tidak tercampur nama lembaga yang panjang.
 * Contoh:
 * - "Ketua PIMPINAN RANTING FATAYAT NU DAWUHAN SELATAN" -> "Ketua"
 * - "Kepala Madrasah" -> "Kepala Madrasah"
 * - "Ketua Yayasan" -> "Ketua Yayasan"
 */
export function cleanPihakJabatan(
  jabatan?: string | null,
  institutionName?: string | null,
  fallback = "Ketua"
): string {
  if (!jabatan || !jabatan.trim()) return fallback;
  let clean = jabatan.trim();

  // 1. Jika jabatan diawali kata "Ketua"
  // User menginginkan jabatan ketua bersih "Ketua" tanpa embel-embel nama lembaga, desa, atau ranting
  // (contoh: "Ketua Dawuhan Selatan", "Ketua Pimpinan Ranting Fatayat NU Dawuhan Selatan", "Ketua PR Fatayat..." -> "Ketua")
  // Kecuali jika jabatan spesifik kepanitiaan/yayasan seperti "Ketua Yayasan" atau "Ketua Panitia"
  if (/^Ketua\b/i.test(clean)) {
    if (/^Ketua\s+(?:Yayasan|Panitia)\b/i.test(clean)) {
      return clean;
    }
    return "Ketua";
  }

  // 2. Jika jabatan memuat nama lembaga
  if (institutionName && institutionName.trim()) {
    const inst = institutionName.trim();
    const escapedInst = inst.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    clean = clean.replace(new RegExp(escapedInst, "gi"), "").trim();
  }

  // 3. Bersihkan nama desa / sub-nama seperti Dawuhan, Selatan, dsb
  clean = clean.replace(/\s*(?:Desa|Kelurahan|Kecamatan|Kabupaten)?\s*Dawuhan(?:\s+Selatan)?/gi, "").trim();

  // 4. Bersihkan tanda baca aneh di ujung
  clean = clean.replace(/^[-\s,.:/]+|[-\s,.:/]+$/g, "").trim();

  return clean || fallback;
}

/**
 * Memformat jabatan pihak kedua (penyedia / rekanan) agar otomatis menyertakan nama toko / perusahaan:
 * Contoh:
 * - formatPihak2Jabatan("Pemilik", "Surya Mas") -> "Pemilik Surya Mas"
 * - formatPihak2Jabatan("Karyawan", "Surya Mas") -> "Karyawan Surya Mas"
 * - formatPihak2Jabatan("Pemilik Surya Mas", "Surya Mas") -> "Pemilik Surya Mas" (tidak duplikasi)
 * - formatPihak2Jabatan(null, "Surya Mas") -> "Pemilik Surya Mas"
 */
export function formatPihak2Jabatan(
  jabatan?: string | null,
  toko?: string | null,
  fallbackRole = "Pemilik"
): string {
  const role = (jabatan || "").trim() || fallbackRole;
  const shop = (toko || "").trim();
  if (!shop) return role;

  // Jika jabatan sudah memuat nama toko, jangan duplikasi
  if (role.toLowerCase().includes(shop.toLowerCase())) {
    return role;
  }

  return `${role} ${shop}`;
}

