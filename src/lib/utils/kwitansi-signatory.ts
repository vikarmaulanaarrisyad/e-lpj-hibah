import type { InstitutionProfile, ReceiptFormData } from "@/types";

/**
 * Konversi teks ke format Proper Case (Title Case)
 * dengan menjaga akronim umum organisasi (NU, PR, PAC, dll.) tetap huruf kapital.
 */
export function toTitleCaseWithAcronyms(str: string): string {
  if (!str) return "";
  const acronyms = new Set([
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
    "FATAYAT",
    "MUSLIMAT",
    "RI",
    "RT",
    "RW",
    "DPRD",
  ]);

  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      const upper = word.toUpperCase();
      if (acronyms.has(upper)) {
        // Khusus Fatayat dan Muslimat biasanya ditulis kapital di awal
        if (upper === "FATAYAT") return "Fatayat";
        if (upper === "MUSLIMAT") return "Muslimat";
        return upper;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

/**
 * Mengambil dua baris keterangan jabatan Ketua untuk kolom "Setuju dibayar"
 * secara dinamis dari database (InstitutionProfile atau ReceiptFormData).
 *
 * Contoh:
 * - Line 1: "Ketua Pimpinan Ranting Fatayat NU"
 * - Line 2: "Dawuhan Selatan"
 */
export function getSignatoryKetuaTitles(
  profile?: InstitutionProfile | null,
  data?: Partial<ReceiptFormData>
): { line1: string; line2: string } {
  const rawNamaLembaga = profile?.namaLembaga || data?.namaLembaga;
  const rawSubNama = profile?.subNama || data?.subNama;
  const rawJabatanKetua = profile?.jabatanKetua || data?.jabatanKetua;

  // 1. Format Sub Nama (misal: "Dawuhan Selatan")
  const subNama = rawSubNama ? toTitleCaseWithAcronyms(rawSubNama.trim()) : "";

  // 2. Tentukan Line 1 (Jabatan / Lembaga)
  let line1 = "";

  if (rawJabatanKetua && rawJabatanKetua.trim()) {
    const cleanJabatan = rawJabatanKetua.trim();
    // Jika jabatanKetua diakhiri dengan subNama, pisahkan agar rapi 2 baris
    if (subNama && cleanJabatan.toLowerCase().endsWith(subNama.toLowerCase())) {
      line1 = cleanJabatan.slice(0, cleanJabatan.length - subNama.length).trim();
    } else {
      line1 = cleanJabatan;
    }
  }

  // Jika line 1 belum terbentuk, susun dari namaLembaga
  if (!line1 && rawNamaLembaga && rawNamaLembaga.trim()) {
    const formattedLembaga = toTitleCaseWithAcronyms(rawNamaLembaga.trim());
    line1 = formattedLembaga.toLowerCase().startsWith("ketua")
      ? formattedLembaga
      : `Ketua ${formattedLembaga}`;
  }

  // Default fallback jika data di DB belum ada
  if (!line1) {
    line1 = "Ketua Pimpinan Ranting Fatayat";
  }

  // 3. Tentukan Line 2 (Sub Nama / Desa / Wilayah)
  let line2 = subNama || "Dawuhan Selatan";

  // Satukan "NU" dengan subNama di baris kedua (contoh: "Ketua Pimpinan Ranting Fatayat" & "NU Dawuhan Selatan")
  // agar teks proporsional dan tidak terjadi "NU" turun sendiri terpisah dari wilayahnya.
  if (/\s+NU$/i.test(line1)) {
    line1 = line1.replace(/\s+NU$/i, "").trim();
    if (!line2.toLowerCase().startsWith("nu")) {
      line2 = `NU ${line2}`.trim();
    }
  }

  return { line1, line2 };
}
