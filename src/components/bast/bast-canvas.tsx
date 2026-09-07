"use client";

import type { BastFormData, InstitutionProfile } from "@/types";

interface BastCanvasProps {
  data: BastFormData;
  profile?: InstitutionProfile | null;
  institutionName?: string;
}

function formatDateIndo(dateStr?: string) {
  if (!dateStr) return "-";
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const cleanDate = dateStr.split("T")[0];
    const [y, m, d] = cleanDate.split("-");
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const monthIndex = parseInt(m, 10) - 1;
    const monthName = months[monthIndex] || m;
    return `${parseInt(d, 10)} ${monthName} ${y}`;
  }
  return dateStr;
}

const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function cleanTitle(text?: string | null): string {
  if (!text) return "";
  return text.split(/\s+sebanyak\s+/i)[0].trim();
}

function getPembukaBast(hariTanggal?: string, tanggalTerbilang?: string) {
  let hari = (hariTanggal ? hariTanggal.split(",")[0] : "").trim();
  let terbilang = (tanggalTerbilang || "").trim();

  // Strip prefix "Pada hari ini," if stored inside tanggalTerbilang
  terbilang = terbilang.replace(/^Pada hari ini,?\s*/i, "").trim();

  // Check if terbilang starts with any day name (e.g. "Selasa tanggal...", "Selasa, tanggal...")
  for (const h of NAMA_HARI) {
    const reg = new RegExp(`^${h}\\b\\s*,?\\s*`, "i");
    if (reg.test(terbilang)) {
      hari = h;
      terbilang = terbilang.replace(reg, "").trim();
      break;
    }
  }

  if (!hari) hari = "Senin";
  if (!terbilang) {
    terbilang = "tanggal tiga puluh satu bulan Juli tahun Dua Ribu Dua Puluh Enam (31 - 07 - 2026)";
  }

  return { hari, terbilang };
}

export function BastCanvas({ data, profile, institutionName }: BastCanvasProps) {
  const namaLembaga = profile?.namaLembaga || "PIMPINAN RANTING FATAYAT NU";
  const subNama = profile?.subNama || "DAWUHAN SELATAN";
  const instansiInduk = profile?.instansiInduk || "KECAMATAN TALANG KABUPATEN TEGAL";
  const alamat = profile?.alamat || "Jl. Kemuning 2016 Desa Dawuhan RT.23 RW.06 Talang – Tegal 52193";
  const email = profile?.email || "prfnudawuhanselatan@gmail.com";
  const noHp = profile?.noHp || "085642719869";
  const logoUrl = profile?.logoUrl;

  const pembuka = getPembukaBast(data.hariTanggal, data.tanggalTerbilang);

  return (
    <div
      id="bastPrintArea"
      className="w-full max-w-[780px] bg-white text-slate-900 shadow-2xl rounded-sm pt-6 sm:pt-8 md:pt-[18mm] pb-6 sm:pb-8 md:pb-[18mm] pr-4 sm:pr-6 md:pr-[15mm] pl-8 sm:pl-12 md:pl-[28mm] flex flex-col font-sans select-text border border-slate-300/60 print:shadow-none print:border-none print:w-full print:max-w-none relative"
      style={{
        minHeight: "1198px",
      }}
    >
      {/* Indikator Panduan Margin Jilid Dokumen (Hidden) */}
      <div
        className="hidden"
        title="Area Margin Penjilidan (28 mm) - Aman untuk penjilidan, staples, & lubang binder"
      >
        <span className="text-[8.5px] font-mono text-emerald-800 font-bold rotate-[-90deg] whitespace-nowrap tracking-wider select-none">
          RUANG JILID (28mm)
        </span>
      </div>

      {/* ================= KOP SURAT RESMI (DARI DATABASE & CLOUDINARY) ================= */}
      <div className="flex items-center justify-between pb-3 relative">
        {/* Logo Lambang (Cloudinary Image / Fallback Vektor Hijau Resmi) */}
        <div className="w-16 h-16 sm:w-[88px] sm:h-[88px] shrink-0 flex items-center justify-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={namaLembaga}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <svg
              className="w-full h-full text-[#006c4e]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 120 120"
            >
              {/* Outer Ring */}
              <rect fill="#006c4e" height="110" rx="6" width="110" x="5" y="5" />
              <rect fill="#ffffff" height="102" rx="4" width="102" x="9" y="9" />
              {/* Inner Green Circle */}
              <circle cx="60" cy="60" fill="#004532" r="46" />
              {/* Crescent moon & star */}
              <path
                d="M 60 26 A 34 34 0 0 0 60 94 A 28 28 0 0 1 60 38 Z"
                fill="#97f5cc"
              />
              <polygon
                fill="#ffdcc3"
                points="60,38 63,47 72,47 65,52 68,61 60,56 52,61 55,52 48,47 57,47"
              />
              {/* 9 Stars of Nahdlatul Ulama */}
              <circle cx="34" cy="48" fill="#ffffff" r="3" />
              <circle cx="86" cy="48" fill="#ffffff" r="3" />
              <circle cx="28" cy="64" fill="#ffffff" r="3" />
              <circle cx="92" cy="64" fill="#ffffff" r="3" />
              <circle cx="38" cy="78" fill="#ffffff" r="3" />
              <circle cx="82" cy="78" fill="#ffffff" r="3" />
              <circle cx="60" cy="84" fill="#ffffff" r="3.5" />
              {/* Badge Text */}
              <rect fill="#006c4e" height="14" rx="2" width="80" x="20" y="96" />
              <text
                fill="#ffffff"
                fontFamily="sans-serif"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
                x="60"
                y="106"
              >
                FATAYAT NU
              </text>
            </svg>
          )}
        </div>

        {/* Kop Text Content */}
        <div className="flex-1 text-center px-3 flex flex-col justify-center">
          <h2 className="text-[17px] sm:text-[18px] leading-[22px] font-bold text-[#006c4e] uppercase tracking-wide">
            {namaLembaga}
          </h2>
          <h3 className="text-[16px] sm:text-[17px] leading-[21px] font-bold text-[#006c4e] uppercase">
            {subNama}
          </h3>
          <h4 className="text-[14px] sm:text-[15px] leading-[19px] font-bold text-[#006c4e] uppercase tracking-normal">
            {instansiInduk}
          </h4>
          <p className="text-[10.5px] leading-[14px] text-[#006c4e] mt-1 font-medium">
            Alamat : {alamat}
          </p>
          <p className="text-[10px] leading-[13px] text-[#006c4e]">
            Email : <span className="underline">{email}</span> | No. Hp: {noHp}
          </p>
        </div>
      </div>

      {/* Formal Kop Dual Border Line (Thick 2.5px + Thin 0.75px) */}
      <div className="w-full flex flex-col gap-[2px] mb-4">
        <div className="w-full h-[2.5px] bg-[#004532]"></div>
        <div className="w-full h-[0.75px] bg-[#004532]"></div>
      </div>

      {/* ================= TITLE OF LEGAL BAST DOCUMENT ================= */}
      <div className="text-center mb-3 flex flex-col items-center">
        <h1 className="text-[14.5px] sm:text-[15px] leading-[20px] font-bold tracking-tight uppercase text-black">
          BERITA ACARA SERAH TERIMA HASIL PEKERJAAN
        </h1>
        <div className="text-[12.5px] font-semibold text-black mt-0.5">
          Nomor : <span className="font-mono font-bold">{data.nomorBast || "014/BAST-HB/FTY/VII/2026"}</span>
        </div>
      </div>

      {/* ================= OPENING LEGAL CLAUSE ================= */}
      <p className="text-[12px] sm:text-[12.5px] leading-[19px] text-justify text-black mb-3">
        Pada hari ini, <span className="font-semibold">{pembuka.hari}</span>{" "}
        <span>{pembuka.terbilang}</span>
        , yang bertanda tangan di bawah ini :
      </p>

      {/* ================= THE TWO PARTIES IDENTIFICATION ================= */}
      <div className="w-full flex flex-col gap-1.5 mb-3 text-[12px] sm:text-[12.5px] leading-[18px] text-black">
        {/* Pihak 1 (Penerima) */}
        <div className="grid grid-cols-12 gap-1 items-baseline">
          <span className="col-span-1">1.</span>
          <span className="col-span-2 font-medium">Nama</span>
          <span className="col-span-9 font-bold uppercase">: {data.pihak1Nama || "HENI FUJIATI"}</span>
        </div>
        <div className="grid grid-cols-12 gap-1 items-baseline -mt-0.5">
          <span className="col-span-1"></span>
          <span className="col-span-2 font-medium">Jabatan</span>
          <span className="col-span-9">: {data.pihak1Jabatan || "Ketua Pimpinan Ranting Fatayat NU Dawuhan Selatan"}</span>
        </div>
        <div className="grid grid-cols-12 gap-1 items-baseline -mt-0.5">
          <span className="col-span-1"></span>
          <span className="col-span-11 italic font-semibold text-black">
            Kemudian disebut PIHAK KESATU
          </span>
        </div>

        {/* Pihak 2 (Penyedia) */}
        <div className="grid grid-cols-12 gap-1 items-baseline mt-1.5">
          <span className="col-span-1">2.</span>
          <span className="col-span-2 font-medium">Nama</span>
          <span className="col-span-9 font-bold uppercase">: {data.pihak2Nama || "ANSHORI"}</span>
        </div>
        <div className="grid grid-cols-12 gap-1 items-baseline -mt-0.5">
          <span className="col-span-1"></span>
          <span className="col-span-2 font-medium">Jabatan</span>
          <span className="col-span-9">: {data.pihak2Toko || "Pemilik SURYA MAS"}</span>
        </div>
        <div className="grid grid-cols-12 gap-1 items-baseline -mt-0.5">
          <span className="col-span-1"></span>
          <span className="col-span-11 italic font-semibold text-black">
            kemudian disebut PIHAK KEDUA
          </span>
        </div>
      </div>

      {/* ================= LEGAL REFERENCE PARAGRAPH ================= */}
      <p className="text-[12px] sm:text-[12.5px] leading-[19px] text-justify text-black mb-3">
        berdasarkan Surat Pesanan Nomor :{" "}
        <span className="font-mono font-semibold text-black">
          {data.nomorSpk || "Wk.5c.74.II/MI.bhd.01/370/7/2023"}
        </span>{" "}
        tanggal <span className="font-semibold">{formatDateIndo(data.tanggalSpk)}</span> PIHAK KESATU telah
        melakukan pemeriksaan hasil pekerjaan{" "}
        <span className="font-semibold">{cleanTitle(data.namaKegiatan) || "Belanja Alat Rebana / Sound Aktif"}</span> dari PIHAK
        KEDUA dengan hasil pemeriksaan fisik sebagai berikut :
      </p>

      {/* ================= PHYSICAL TABLE (A4 LPJ FORMAT) ================= */}
      <div className="w-full mb-3">
        <table className="w-full text-center text-[11px] sm:text-[11.5px] border-collapse" style={{ border: "1.5px solid #000" }}>
          <thead>
            <tr className="font-bold uppercase tracking-tight text-black" style={{ borderBottom: "1.5px solid #000" }}>
              <th className="p-1.5 align-middle w-[8%]" rowSpan={2} style={{ borderRight: "1px solid #000" }}>
                NO.
              </th>
              <th className="p-1.5 align-middle w-[37%]" rowSpan={2} style={{ borderRight: "1px solid #000" }}>
                JENIS BARANG / PEKERJAAN
              </th>
              <th className="p-1 w-[22%]" style={{ borderRight: "1px solid #000", borderBottom: "1px solid #000" }}>
                PESANAN
              </th>
              <th className="p-1 w-[22%]" style={{ borderRight: "1px solid #000", borderBottom: "1px solid #000" }}>
                BARANG DIKIRIM / REALISASI
              </th>
              <th className="p-1 w-[11%]" style={{ borderBottom: "1px solid #000" }}>
                KEADAAN
              </th>
            </tr>
            <tr className="font-medium text-[10px] sm:text-[10.5px] text-black" style={{ borderBottom: "1.5px solid #000" }}>
              <th className="p-1" style={{ borderRight: "1px solid #000" }}>
                Jumlah & Spesifikasi
              </th>
              <th className="p-1" style={{ borderRight: "1px solid #000" }}>
                Jumlah & Spesifikasi
              </th>
              <th className="p-1 font-semibold">
                Baik / Tidak Baik
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items && data.items.length > 0 ? (
              data.items.map((item, index) => (
                <tr key={item.id || index} className="text-black">
                  <td className="p-1.5 align-middle font-mono" style={{ borderRight: "1px solid #000", borderBottom: "1px solid #000" }}>
                    {index + 1}
                  </td>
                  <td className="p-1.5 text-left align-middle font-medium" style={{ borderRight: "1px solid #000", borderBottom: "1px solid #000" }}>
                    {cleanTitle(item.jenisBarang)}
                  </td>
                  <td className="p-1.5 align-middle font-mono text-[11px]" style={{ borderRight: "1px solid #000", borderBottom: "1px solid #000" }}>
                    {item.pesanan}
                  </td>
                  <td className="p-1.5 align-middle font-mono text-[11px]" style={{ borderRight: "1px solid #000", borderBottom: "1px solid #000" }}>
                    {item.realisasi}
                  </td>
                  <td className="p-1.5 align-middle font-semibold" style={{ borderBottom: "1px solid #000" }}>
                    <span className={item.kondisi === "Baik" ? "text-emerald-900" : "text-red-700"}>
                      {item.kondisi}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="text-black">
                <td className="p-2 align-middle font-mono" style={{ borderRight: "1px solid #000", borderBottom: "1px solid #000" }}>
                  1
                </td>
                <td className="p-2 text-left align-middle font-medium" style={{ borderRight: "1px solid #000", borderBottom: "1px solid #000" }}>
                  Sound Aktif Portable 15 Inch + 2 Wireless Microphone & Stand
                </td>
                <td className="p-2 align-middle font-mono" style={{ borderRight: "1px solid #000", borderBottom: "1px solid #000" }}>
                  1 unit
                </td>
                <td className="p-2 align-middle font-mono" style={{ borderRight: "1px solid #000", borderBottom: "1px solid #000" }}>
                  1 unit
                </td>
                <td className="p-2 align-middle font-semibold" style={{ borderBottom: "1px solid #000" }}>
                  Baik
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= CLOSING FORMAL STATEMENT ================= */}
      <p className="text-[12px] sm:text-[12.5px] leading-[19px] text-justify text-black mb-5">
        Kemudian berdasarkan hasil pemeriksaan fisik tersebut PIHAK KESATU menyatakan menerima hasil pekerjaan dari
        PIHAK KEDUA dalam kondisi baik, lengkap, dan berfungsi normal. Demikian Berita Acara Serah Terima Hasil
        Pekerjaan ini dibuat dengan sebenarnya dalam rangkap secukupnya untuk dipergunakan sebagaimana mestinya.
      </p>

      {/* ================= DUAL SIGNATURES ================= */}
      <div className="w-full grid grid-cols-2 mt-4 text-[12px] sm:text-[12.5px] text-black">
        {/* Sisi Kiri: Pihak Kedua (Penyedia) */}
        <div className="flex flex-col items-center text-center">
          <span className="font-semibold uppercase tracking-wider">PIHAK KEDUA</span>

          {/* Ruang Bersih untuk Tanda Tangan & Stempel Basah Toko Rekanan */}
          <div className="h-24 w-full my-1" />

          <span className="font-bold underline uppercase tracking-wide">{data.pihak2Nama || "ANSHORI"}</span>
          <span className="text-[10.5px] text-black font-mono">Penyedia Barang</span>
        </div>

        {/* Sisi Kanan: Pihak Kesatu (Penerima Hasil) */}
        <div className="flex flex-col items-center text-center">
          <span className="font-semibold uppercase tracking-wider">PIHAK KESATU</span>

          {/* Ruang Bersih untuk Tanda Tangan & Stempel Basah Lembaga */}
          <div className="h-24 w-full my-1" />

          <span className="font-bold underline uppercase tracking-wide text-black">{data.pihak1Nama || "HENI FUJIATI"}</span>
          <span className="text-[10.5px] text-black font-mono">Ketua Ranting</span>
        </div>
      </div>
    </div>
  );
}
