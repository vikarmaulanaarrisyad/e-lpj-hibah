import type { InstitutionProfile, ReceiptFormData } from "@/types";
import { formatProperCase } from "./title-case";

/**
 * Konversi teks ke format Proper Case (Title Case)
 * dengan menjaga akronim umum organisasi (NU, PR, PAC, dll.) tetap huruf kapital.
 */
export function toTitleCaseWithAcronyms(str: string): string {
  return formatProperCase(str);
}

/**
 * Menentukan teks jabatan penandatangan (Ketua) secara otomatis & cerdas
 * dengan hierarki prioritas:
 * 1. Input langsung pengguna di form kwitansi (data.jabatanKetua)
 * 2. Profil Lembaga di database (profile.jabatanKetua)
 *    - Otomatis menyingkronkan jika template DB masih mengandung "Dawuhan Selatan" padahal wilayah user berbeda (cth: Dukuhmalang)
 *    - Otomatis melengkapi jika hanya tertulis "Ketua"
 * 3. Disusun otomatis dari Entitas Pembayar (data.pemberi)
 * 4. Disusun otomatis dari Nama Lembaga + Wilayah (profile.namaLembaga + profile.subNama)
 */
export function resolveJabatanKetua(
  profile?: InstitutionProfile | null,
  data?: Partial<ReceiptFormData>
): string {
  // 1. Prioritas Utama: Input kustom langsung dari pengguna di form kwitansi
  if (data?.jabatanKetua && data.jabatanKetua.trim()) {
    return data.jabatanKetua.trim();
  }

  const rawSubNama = profile?.subNama || data?.subNama || "";
  const subNamaFormatted = rawSubNama ? toTitleCaseWithAcronyms(rawSubNama.trim()) : "";

  // 2. Prioritas Kedua: Profil Lembaga dari database
  if (profile?.jabatanKetua && profile.jabatanKetua.trim()) {
    let clean = profile.jabatanKetua.trim();

    // Deteksi jika data di DB masih tersimpan default "Dawuhan Selatan",
    // padahal wilayah/subNama aktual lembaga BUKAN Dawuhan Selatan (misal: "DUKUHMALANG")
    if (
      subNamaFormatted &&
      !/dawuhan\s+selatan/i.test(subNamaFormatted) &&
      /dawuhan\s+selatan/i.test(clean)
    ) {
      clean = clean.replace(/dawuhan\s+selatan/gi, subNamaFormatted);
      return clean;
    }

    // Jika di DB hanya tertulis "Ketua", lengkapi dengan nama lembaga & wilayah
    if (/^ketua$/i.test(clean)) {
      const rawLembaga = profile.namaLembaga || data?.namaLembaga;
      const lembaga = rawLembaga ? toTitleCaseWithAcronyms(rawLembaga.trim()) : "";
      if (lembaga) {
        return `Ketua ${lembaga}${subNamaFormatted ? ` ${subNamaFormatted}` : ""}`.trim();
      }
    }

    return clean;
  }

  // 3. Prioritas Ketiga: Susun otomatis dari Entitas Pembayar pada kwitansi (data.pemberi)
  if (data?.pemberi && data.pemberi.trim()) {
    const formattedPemberi = toTitleCaseWithAcronyms(data.pemberi.trim());
    return formattedPemberi.toLowerCase().startsWith("ketua")
      ? formattedPemberi
      : `Ketua ${formattedPemberi}`;
  }

  // 4. Prioritas Keempat: Susun otomatis dari profile.namaLembaga + subNama
  const rawNamaLembaga = profile?.namaLembaga || data?.namaLembaga;
  if (rawNamaLembaga && rawNamaLembaga.trim()) {
    const formattedLembaga = toTitleCaseWithAcronyms(rawNamaLembaga.trim());
    const base = formattedLembaga.toLowerCase().startsWith("ketua")
      ? formattedLembaga
      : `Ketua ${formattedLembaga}`;
    return `${base}${subNamaFormatted ? ` ${subNamaFormatted}` : ""}`.trim();
  }

  // 5. Default fallback
  return "Ketua Pimpinan Ranting Fatayat NU";
}

/**
 * Mengambil keterangan jabatan Ketua untuk kolom "Setuju dibayar"
 * secara dinamis dari database (InstitutionProfile atau ReceiptFormData).
 */
export function getSignatoryKetuaTitles(
  profile?: InstitutionProfile | null,
  data?: Partial<ReceiptFormData>
): { line1: string; line2: string } {
  const fullTitle = resolveJabatanKetua(profile, data);

  // Jika teks sengaja dipisah dengan enter / newline (\n)
  if (fullTitle.includes("\n")) {
    const [part1, ...rest] = fullTitle.split("\n");
    return {
      line1: part1.trim(),
      line2: rest.join(" ").trim(),
    };
  }

  return {
    line1: fullTitle,
    line2: "",
  };
}
