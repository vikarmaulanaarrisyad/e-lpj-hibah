"use client";

import type { SuratPengantarFormData, InstitutionProfile } from "@/types";
import { formatRupiahNumber } from "@/lib/utils/terbilang";
import { buildFormattedDocumentNumber } from "@/lib/utils/pesanan-date";

interface SuratPengantarCanvasProps {
  data: SuratPengantarFormData;
  profile?: InstitutionProfile | null;
}

export function SuratPengantarCanvas({ data, profile }: SuratPengantarCanvasProps) {
  // Nilai profil lembaga dari database dengan fallback terstandar
  const namaLembaga = profile?.namaLembaga || "PIMPINAN RANTING FATAYAT NU";
  const subNama = profile?.subNama || "DAWUHAN SELATAN";
  const instansiInduk = profile?.instansiInduk || "KECAMATAN TALANG KABUPATEN TEGAL";
  const alamat = profile?.alamat || "Jl. Kemuning 2016 Desa Dawuhan RT.23 RW.06 Talang – Tegal 52193";
  const email = profile?.email || "prfnudawuhanselatan@gmail.com";
  const noHp = profile?.noHp || "085642719869";
  const logoUrl = data.logoUrl || profile?.logoUrl;

  const patternFromDb = profile?.formatNomorSp || profile?.formatNomorBast || "/A/PR.FNU/";
  const defaultNomorFromDb = buildFormattedDocumentNumber(
    "01",
    patternFromDb,
    data.penandatanganTanggal || "2026-12-31"
  );
  const nomorSurat = data.nomorSurat || defaultNomorFromDb;

  const minHeightPx = data.paperSize === "A4" ? "1123px" : "1198px";

  return (
    <div
      id="suratPengantarPrintArea"
      className="w-full max-w-[780px] bg-white text-slate-900 shadow-2xl rounded-sm pt-6 sm:pt-8 md:pt-[18mm] pb-8 sm:pb-10 md:pb-[20mm] pr-4 sm:pr-6 md:pr-[15mm] pl-8 sm:pl-12 md:pl-[28mm] flex flex-col font-sans select-text border border-slate-300/60 print:shadow-none print:border-none print:w-full print:max-w-none relative"
      style={{
        minHeight: minHeightPx,
      }}
    >
      {/* Indikator Panduan Margin Jilid Dokumen (Hanya Tampil di Layar / no-print) */}
      <div
        className="no-print absolute top-0 bottom-0 left-0 w-[24px] sm:w-[28px] md:w-[28mm] border-r border-dashed border-emerald-400/50 pointer-events-none flex flex-col justify-center items-center opacity-30 hover:opacity-90 transition-opacity"
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
              crossOrigin="anonymous"
            />
          ) : (
            <svg
              className="w-full h-full text-[#006c4e]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 120 120"
            >
              <rect fill="#006c4e" height="110" rx="6" width="110" x="5" y="5" />
              <rect fill="#ffffff" height="102" rx="4" width="102" x="9" y="9" />
              <circle cx="60" cy="60" fill="#004532" r="46" />
              <path
                d="M 60 26 A 34 34 0 0 0 60 94 A 28 28 0 0 1 60 38 Z"
                fill="#97f5cc"
              />
              <polygon
                fill="#ffdcc3"
                points="60,38 63,47 72,47 65,52 68,61 60,56 52,61 55,52 48,47 57,47"
              />
              <circle cx="34" cy="48" fill="#ffffff" r="3" />
              <circle cx="86" cy="48" fill="#ffffff" r="3" />
              <circle cx="28" cy="64" fill="#ffffff" r="3" />
              <circle cx="92" cy="64" fill="#ffffff" r="3" />
              <circle cx="38" cy="78" fill="#ffffff" r="3" />
              <circle cx="82" cy="78" fill="#ffffff" r="3" />
              <circle cx="60" cy="84" fill="#ffffff" r="3.5" />
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
            Email : <span className="underline">{email}</span> No. Hp. {noHp}
          </p>
        </div>
      </div>

      {/* Pembatas Formal Garis Ganda Kop Surat */}
      <div className="w-full flex flex-col gap-[2px] mb-4">
        <div className="w-full h-[2.5px] bg-[#006c4e]" />
        <div className="w-full h-[0.75px] bg-[#006c4e]" />
      </div>

      {/* ================= TANGGAL SURAT (KANAN ATAS) ================= */}
      <div className="text-right text-[12.5px] sm:text-[13px] text-black font-normal mb-2">
        {data.kotaTanggal || "Dawuhan,   Desember 2026"}
      </div>

      {/* ================= BLOK NOMOR, LAMPIRAN, PERIHAL (KIRI) ================= */}
      <div className="grid grid-cols-[85px_15px_1fr] sm:grid-cols-[95px_15px_1fr] text-[12.5px] sm:text-[13px] text-black leading-snug gap-y-1">
        <div>Nomor</div>
        <div>:</div>
        <div>{nomorSurat}</div>

        <div>Lampiran</div>
        <div>:</div>
        <div>{data.lampiran || "1 (satu) bendel"}</div>

        <div>Perihal</div>
        <div>:</div>
        <div>
          <div>Laporan Pertanggungjawaban</div>
          <div className="mt-0.5">Bantuan Hibah</div>
        </div>
      </div>

      {/* ================= TUJUAN SURAT (SISI KANAN) ================= */}
      <div className="flex justify-end mt-4 sm:mt-6 mb-6 sm:mb-8">
        <div className="w-[52%] sm:w-[48%] text-[12.5px] sm:text-[13px] text-black space-y-1">
          <p>Kepada Yang terhormat,</p>
          <p className="font-extrabold uppercase tracking-wide">
            {data.tujuanJabatan || "BUPATI TEGAL"}
          </p>
          <p>{data.tujuanTempat || "Di – Tempat"}</p>
        </div>
      </div>

      {/* ================= SALAM & PARAGRAF PEMBUKA ================= */}
      <div className="text-black text-[12.5px] sm:text-[13px] leading-relaxed space-y-3 font-normal">
        <p>Dengan hormat,</p>

        {/* Paragraf 1: Pernyataan Bantuan Hibah Diterima */}
        <p className="text-justify indent-8 sm:indent-10">
          Sehubungan dengan telah diterimanya Bantuan Hibah/Bantuan Sosial dari{" "}
          {data.instansiPemberi || "Pemerintah Kabupaten Tegal c.q. Bagian Kesejahteraan Rakyat Sekretariat Daerah Kabupaten Tegal"}{" "}
          sejumlah Rp. {formatRupiahNumber(data.nominal)},- ({data.terbilang || "Seratus Juta Rupiah"}){" "}
          Tahun Anggaran {data.tahunAnggaran || "2026"} untuk{" "}
          {data.namaLembagaPenerima || "Pimpinan Ranting Fatayat NU Dawuhan Selatan Desa Dawuhan Kecamatan Talang Kabupaten Tegal"}.
        </p>

        {/* Paragraf 2: Penyampaian Laporan Terlampir */}
        <p className="text-justify indent-8 sm:indent-10">
          Bersama ini kami sampaikan laporan pertanggungjawaban Bantuan Hibah/Bantuan Sosial dari Pemerintah Kabupaten sebagaimana terlampir.
        </p>

        {/* Paragraf 3: Penutup */}
        <p className="text-justify indent-8 sm:indent-10">
          {data.paragrafPenutup || "Demikian laporan kami untuk menjadikan periksa dan guna seperlunya."}
        </p>
      </div>

      {/* ================= TANDA TANGAN KETUA (KANAN BAWAH) ================= */}
      <div className="flex justify-end mt-8 sm:mt-12">
        <div className="w-[52%] sm:w-[48%] text-center text-[12.5px] sm:text-[13px] text-black flex flex-col items-center">
          <p>
            {data.penandatanganKota || "Dawuhan"},{" "}
            {data.penandatanganTanggal || data.penandatanganBulanTahun || "31 Desember 2026"}
          </p>
          <p className="font-bold mt-0.5">{data.penandatanganJabatan || "Ketua"}</p>

          {/* Area Tanda Tangan & Stempel Basah */}
          <div className="h-20 sm:h-24 w-full flex items-center justify-center relative" />

          {/* Nama Terang Ketua */}
          <p className="font-extrabold uppercase tracking-wide">
            {data.penandatanganNama || "HENI FUJIATI"}
          </p>
        </div>
      </div>
    </div>
  );
}
