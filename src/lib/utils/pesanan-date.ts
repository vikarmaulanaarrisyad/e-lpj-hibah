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

/**
 * Menentukan judul lembar dokumentasi resmi yang pas berdasarkan uraian belanja dan kategori pos RAB.
 * Contoh:
 * - Konsumsi / Snack / Makan / Minum -> "LEMBAR DOKUMENTASI KONSUMSI & SNACK"
 * - Hadroh / Sound / Alat / Laptop / Barang / Sarana / Kafan -> "LEMBAR DOKUMENTASI PENGADAAN BARANG"
 * - Banner / Spanduk / ATK / Modul / Penggandaan / Percetakan -> "LEMBAR DOKUMENTASI ATK & PUBLIKASI"
 * - Pelatihan / Rapat / Kader / Sosialisasi / Transport / Honor / Kegiatan -> "LEMBAR DOKUMENTASI PELAKSANAAN KEGIATAN"
 * - Sewa Gedung / Sewa Sound / Sewa LCD -> "LEMBAR DOKUMENTASI SEWA & OPERASIONAL"
 * - Default -> "LEMBAR DOKUMENTASI REALISASI BELANJA"
 */
export function determineDokumentasiTitle(
  uraian?: string | null,
  kategoriRab?: string | null
): string {
  const combined = `${uraian || ""} ${kategoriRab || ""}`.toLowerCase();

  // 1. Konsumsi / Snack / Makan Minum
  if (
    combined.includes("snack") ||
    combined.includes("konsumsi") ||
    combined.includes("makan") ||
    combined.includes("minum") ||
    combined.includes("katering") ||
    combined.includes("prasmanan") ||
    combined.includes("roti") ||
    combined.includes("kue")
  ) {
    return "LEMBAR DOKUMENTASI KONSUMSI & SNACK";
  }

  // 2. Banner / Spanduk / ATK / Modul / Publikasi
  if (
    combined.includes("banner") ||
    combined.includes("spanduk") ||
    combined.includes("baliho") ||
    combined.includes("atk") ||
    combined.includes("alat tulis") ||
    combined.includes("modul") ||
    combined.includes("penggandaan") ||
    combined.includes("fotokopi") ||
    combined.includes("percetakan") ||
    combined.includes("cetak")
  ) {
    return "LEMBAR DOKUMENTASI ATK & PUBLIKASI";
  }

  // 3. Sewa Gedung / Sewa LCD / Sewa Tempat / Peralatan
  if (
    combined.includes("sewa gedung") ||
    combined.includes("sewa tempat") ||
    combined.includes("sewa lcd") ||
    combined.includes("sewa sound") ||
    combined.includes("sewa")
  ) {
    return "LEMBAR DOKUMENTASI SEWA & OPERASIONAL";
  }

  // 4. Pengadaan Barang / Sarana Fisik / Peralatan / Hadroh / Kain Kafan / dll
  if (
    combined.includes("hadroh") ||
    combined.includes("rebana") ||
    combined.includes("alat") ||
    combined.includes("barang") ||
    combined.includes("sarana") ||
    combined.includes("sound") ||
    combined.includes("inventaris") ||
    combined.includes("kafan") ||
    combined.includes("seragam") ||
    combined.includes("laptop") ||
    combined.includes("komputer") ||
    combined.includes("printer") ||
    combined.includes("meja") ||
    combined.includes("kursi") ||
    combined.includes("tenda") ||
    combined.includes("pengadaan")
  ) {
    return "LEMBAR DOKUMENTASI PENGADAAN BARANG";
  }

  // 5. Kegiatan / Pelatihan / Peringatan / Rapat / Acara / Honor / Transport
  if (
    combined.includes("pelatihan") ||
    combined.includes("kegiatan") ||
    combined.includes("acara") ||
    combined.includes("rapat") ||
    combined.includes("sosialisasi") ||
    combined.includes("peringatan") ||
    combined.includes("kader") ||
    combined.includes("mars") ||
    combined.includes("honor") ||
    combined.includes("transport")
  ) {
    return "LEMBAR DOKUMENTASI PELAKSANAAN KEGIATAN";
  }

  return "LEMBAR DOKUMENTASI REALISASI BELANJA";
}

/**
 * Membersihkan nama barang / uraian kegiatan dari format hitungan atau harga
 * Contoh:
 *   "Belanja Alat Hadroh sebanyak 1 Paket x @ Rp. 5.800.000 = Rp. 5.800.000" -> "Alat Hadroh"
 */
export function cleanItemDescription(rawName?: string | null): string {
  if (!rawName) return "Barang / Kegiatan Hibah";
  let cleaned = rawName.trim();
  // Buang potongan hitungan
  cleaned = cleaned.split(/sebanyak|sebesar|\sx\s@|\s=\sRp|\s@\sRp/i)[0].trim();
  // Buang prefix "Belanja " atau "Pengadaan " jika ada agar enak dibaca dalam kalimat
  cleaned = cleaned.replace(/^(belanja\s+pengadaan\s+|belanja\s+|pengadaan\s+)/i, "");
  return cleaned.trim() || "Barang / Kegiatan Hibah";
}

/**
 * Menghasilkan pilihan kalimat baku standar LPJ sesuai kategori belanja
 */
export function getStandardCaptionPresets(
  namaKegiatan?: string | null,
  judulDokumentasi?: string | null,
  penyedia?: string | null
): { label: string; text: string }[] {
  const item = cleanItemDescription(namaKegiatan);
  const combined = `${judulDokumentasi || ""} ${namaKegiatan || ""}`.toLowerCase();
  const namaToko = penyedia?.trim() ? ` pihak ${penyedia}` : " pihak rekanan penyedia";

  // 1. KONSUMSI / SNACK
  if (
    combined.includes("snack") ||
    combined.includes("konsumsi") ||
    combined.includes("makan") ||
    combined.includes("minum") ||
    combined.includes("katering") ||
    combined.includes("roti")
  ) {
    return [
      {
        label: "Serah Terima Snack",
        text: `Penerimaan dan serah terima ${item} dari${namaToko} sesuai rincian jumlah porsi kegiatan.`,
      },
      {
        label: "Distribusi Peserta",
        text: `Distribusi dan pembagian ${item} kepada peserta dan panitia pada saat jeda pelaksanaan kegiatan.`,
      },
      {
        label: "Sajian Konsumsi",
        text: `Dokumentasi sajian menu dan kelengkapan hidangan ${item} yang dinikmati bersama peserta kegiatan.`,
      },
      {
        label: "Penyediaan Konsumsi",
        text: `Dokumentasi penyediaan sarana konsumsi dan snack pendukung kelancaran pelaksanaan acara.`,
      },
    ];
  }

  // 2. BANNER / SPANDUK
  if (
    combined.includes("banner") ||
    combined.includes("spanduk") ||
    combined.includes("baliho")
  ) {
    return [
      {
        label: "Pemasangan Backdrop",
        text: `Pemasangan banner dan backdrop publikasi resmi kegiatan di panggung utama lokasi acara.`,
      },
      {
        label: "Dekorasi Ruangan",
        text: `Tampilan banner publikasi dan dekorasi ruang kegiatan Program Bantuan Hibah Daerah.`,
      },
      {
        label: "Foto Bersama Banner",
        text: `Dokumentasi foto bersama peserta dan panitia berlatar belakang banner kegiatan resmi.`,
      },
      {
        label: "Media Publikasi",
        text: `Dokumentasi visual publikasi dan kelengkapan media informasi kegiatan organisasi.`,
      },
    ];
  }

  // 3. ATK, MODUL & PENGGANDAAN
  if (
    combined.includes("atk") ||
    combined.includes("alat tulis") ||
    combined.includes("modul") ||
    combined.includes("penggandaan") ||
    combined.includes("fotokopi") ||
    combined.includes("cetak")
  ) {
    return [
      {
        label: "Pembagian Modul & ATK",
        text: `Pembagian kelengkapan ATK dan penggandaan modul materi kepada peserta sebelum kegiatan dimulai.`,
      },
      {
        label: "Pemanfaatan Materi",
        text: `Pemanfaatan modul materi dan ATK oleh peserta dalam mengikuti rangkaian kegiatan.`,
      },
      {
        label: "Kelengkapan Berkas",
        text: `Dokumentasi kelengkapan berkas administrasi, penggandaan modul materi, dan sarana ATK kegiatan.`,
      },
      {
        label: "Serah Terima Percetakan",
        text: `Pemeriksaan kelengkapan dan serah terima hasil penggandaan materi kegiatan dari pihak percetakan.`,
      },
    ];
  }

  // 4. SEWA GEDUNG / TEMPAT & PERALATAN
  if (
    combined.includes("sewa gedung") ||
    combined.includes("sewa tempat") ||
    combined.includes("sewa lcd") ||
    combined.includes("sewa sound") ||
    combined.includes("sewa")
  ) {
    return [
      {
        label: "Pemanfaatan Ruangan",
        text: `Pemanfaatan gedung / ruangan tempat pelaksanaan kegiatan yang telah disewa secara resmi.`,
      },
      {
        label: "Operasional Sound & LCD",
        text: `Operasional dan pengaturan sarana audio sound system serta proyektor LCD selama kegiatan berlangsung.`,
      },
      {
        label: "Suasana Tempat Acara",
        text: `Suasana tata letak ruangan dan fasilitas tempat kegiatan saat dihadiri oleh para peserta.`,
      },
      {
        label: "Kelengkapan Fasilitas",
        text: `Dokumentasi sarana prasarana tempat dan perlengkapan penunjang kelancaran acara.`,
      },
    ];
  }

  // 5. PENGADAAN BARANG / SARANA FISIK (Hadroh, Sound, Laptop, Printer, Kafan, dll)
  if (
    combined.includes("hadroh") ||
    combined.includes("rebana") ||
    combined.includes("alat") ||
    combined.includes("barang") ||
    combined.includes("sarana") ||
    combined.includes("sound") ||
    combined.includes("inventaris") ||
    combined.includes("kafan") ||
    combined.includes("seragam") ||
    combined.includes("laptop") ||
    combined.includes("komputer") ||
    combined.includes("printer") ||
    combined.includes("meja") ||
    combined.includes("kursi") ||
    combined.includes("boneka") ||
    combined.includes("pengadaan")
  ) {
    return [
      {
        label: "Penyerahan Fisik",
        text: `Penyerahan fisik sarana ${item} dari${namaToko} kepada pimpinan lembaga dalam kondisi baru dan lengkap.`,
      },
      {
        label: "Uji Fungsi & Fisik",
        text: `Pemeriksaan fisik dan uji fungsi spesifikasi ${item} untuk memastikan kelayakan pemanfaatan sarana organisasi.`,
      },
      {
        label: "Penyimpanan Sekretariat",
        text: `Penyimpanan dan inventarisasi sarana ${item} di sekretariat lembaga siap digunakan untuk kegiatan keumatan.`,
      },
      {
        label: "Pemanfaatan Sarana",
        text: `Dokumentasi kelengkapan fisik dan serah terima pengadaan ${item} bantuan dana hibah daerah.`,
      },
    ];
  }

  // 6. PELAKSANAAN KEGIATAN & PELATIHAN
  if (
    combined.includes("pelatihan") ||
    combined.includes("kegiatan") ||
    combined.includes("acara") ||
    combined.includes("rapat") ||
    combined.includes("sosialisasi") ||
    combined.includes("peringatan") ||
    combined.includes("kader") ||
    combined.includes("mars") ||
    combined.includes("honor") ||
    combined.includes("transport")
  ) {
    return [
      {
        label: "Penyampaian Materi",
        text: `Penyampaian materi pokok pada kegiatan ${item} oleh narasumber/instruktur kepada para peserta.`,
      },
      {
        label: "Sesi Diskusi & Praktik",
        text: `Sesi praktik dan interaksi aktif peserta dalam rangkaian tahapan kegiatan ${item}.`,
      },
      {
        label: "Foto Bersama Penutupan",
        text: `Foto bersama jajaran panitia, narasumber, dan peserta pada penutupan kegiatan ${item}.`,
      },
      {
        label: "Antusiasme Peserta",
        text: `Dokumentasi antusiasme dan keikutsertaan peserta selama berlangsungnya kegiatan ${item}.`,
      },
    ];
  }

  // 7. DEFAULT / UMUM
  return [
    {
      label: "Realisasi Fisik Belanja",
      text: `Dokumentasi fisik realisasi belanja ${item} sesuai peruntukan alokasi dana hibah daerah.`,
    },
    {
      label: "Pemeriksaan & Serah Terima",
      text: `Pemeriksaan kelengkapan dan serah terima hasil belanja ${item} bersama pihak terkait.`,
    },
    {
      label: "Pemanfaatan Hasil Belanja",
      text: `Pemanfaatan hasil belanja ${item} dalam mendukung kelancaran program kerja organisasi.`,
    },
    {
      label: "Kelengkapan Pertanggungjawaban",
      text: `Dokumentasi pendukung pertanggungjawaban realisasi belanja ${item}.`,
    },
  ];
}

/**
 * Menghasilkan keterangan otomatis untuk foto ke-i (index 0, 1, 2, ...)
 */
export function generateStandardPhotoCaption(params: {
  namaKegiatan?: string | null;
  judulDokumentasi?: string | null;
  penyedia?: string | null;
  photoIndex: number;
}): string {
  const presets = getStandardCaptionPresets(
    params.namaKegiatan,
    params.judulDokumentasi,
    params.penyedia
  );
  if (presets.length === 0) {
    return "Dokumentasi pertanggungjawaban realisasi belanja kegiatan.";
  }
  if (params.photoIndex < presets.length) {
    return presets[params.photoIndex].text;
  }
  const lastPreset = presets[presets.length - 1];
  return `${lastPreset.text} (Bagian ${params.photoIndex + 1})`;
}

/**
 * Daftar seluruh opsi kalimat standar LPJ dikelompokkan berdasarkan kategori
 * Memudahkan pengguna jika dalam 1 lembar dokumentasi terdapat kombinasi foto (misal: ada foto materi, foto snack, dan foto penyerahan barang).
 */
export function getAllCategoryCaptionPresets(
  namaKegiatan?: string | null,
  penyedia?: string | null
): { category: string; options: { label: string; text: string }[] }[] {
  const item = cleanItemDescription(namaKegiatan);
  const namaToko = penyedia?.trim() ? ` pihak ${penyedia}` : " pihak rekanan penyedia";

  return [
    {
      category: "Kegiatan & Pelatihan",
      options: [
        {
          label: "Penyampaian Materi",
          text: `Penyampaian materi pokok pada kegiatan ${item} oleh narasumber/instruktur kepada para peserta.`,
        },
        {
          label: "Sesi Tanya Jawab & Praktik",
          text: `Sesi tanya jawab, diskusi interaktif, dan praktik peserta dalam rangkaian kegiatan ${item}.`,
        },
        {
          label: "Foto Bersama Penutupan",
          text: `Foto bersama jajaran pengurus, narasumber, dan seluruh peserta pada penutupan kegiatan ${item}.`,
        },
        {
          label: "Antusiasme Peserta",
          text: `Dokumentasi antusiasme dan keikutsertaan peserta selama berlangsungnya kegiatan ${item}.`,
        },
      ],
    },
    {
      category: "Snack & Konsumsi",
      options: [
        {
          label: "Serah Terima Snack",
          text: `Penerimaan dan serah terima konsumsi / snack kegiatan dari pihak penyedia sesuai rincian jumlah porsi.`,
        },
        {
          label: "Distribusi ke Peserta",
          text: `Distribusi dan pembagian snack / konsumsi kepada seluruh peserta dan panitia pada saat pelaksanaan kegiatan.`,
        },
        {
          label: "Sajian Hidangan Snack",
          text: `Dokumentasi sajian hidangan konsumsi dan snack yang dinikmati bersama peserta dan panitia kegiatan.`,
        },
        {
          label: "Penyediaan Konsumsi",
          text: `Dokumentasi penyediaan sarana konsumsi pendukung kelancaran pelaksanaan acara.`,
        },
      ],
    },
    {
      category: "Pengadaan Barang",
      options: [
        {
          label: "Penyerahan Fisik Barang",
          text: `Penyerahan fisik sarana ${item} dari${namaToko} kepada pimpinan lembaga dalam kondisi baru dan lengkap.`,
        },
        {
          label: "Pemeriksaan & Uji Fungsi",
          text: `Pemeriksaan fisik dan uji fungsi spesifikasi ${item} untuk memastikan kelayakan pemanfaatan sarana organisasi.`,
        },
        {
          label: "Penyimpanan di Sekretariat",
          text: `Penyimpanan dan inventarisasi sarana ${item} di sekretariat lembaga siap digunakan untuk kegiatan keumatan.`,
        },
        {
          label: "Pemanfaatan Sarana",
          text: `Dokumentasi kelengkapan fisik dan serah terima pengadaan ${item} bantuan dana hibah daerah.`,
        },
      ],
    },
    {
      category: "Banner & Publikasi",
      options: [
        {
          label: "Pemasangan Backdrop",
          text: `Pemasangan banner dan backdrop publikasi resmi kegiatan di panggung utama lokasi acara.`,
        },
        {
          label: "Foto Bersama Banner",
          text: `Dokumentasi foto bersama peserta dan panitia berlatar belakang banner kegiatan resmi hibah daerah.`,
        },
        {
          label: "Pembagian Modul & ATK",
          text: `Pembagian kelengkapan modul materi dan ATK kepada seluruh peserta sebelum kegiatan dimulai.`,
        },
      ],
    },
    {
      category: "Sewa Tempat",
      options: [
        {
          label: "Pemanfaatan Ruangan Gedung",
          text: `Pemanfaatan gedung / ruangan tempat pelaksanaan kegiatan yang telah disewa secara resmi.`,
        },
        {
          label: "Operasional Sound & LCD",
          text: `Operasional perangkat audio sound system dan proyektor LCD selama kegiatan berlangsung.`,
        },
      ],
    },
  ];
}




