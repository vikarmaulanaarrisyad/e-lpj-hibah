"use client";

import type { CoverFormData, InstitutionProfile } from "@/types";

interface CoverCanvasProps {
  data: CoverFormData;
  profile?: InstitutionProfile | null;
}

export function CoverCanvas({ data, profile }: CoverCanvasProps) {
  const namaLembaga = data.namaLembaga || profile?.namaLembaga || "PIMPINAN RANTING FATAYAT NU";
  const subNama = data.subNama || profile?.subNama || "DAWUHAN SELATAN";
  const alamat = data.alamat || profile?.alamat || "Jl. Kemuning 2016 Desa Dawuhan RT.23 RW.06 Talang – Tegal 52193";
  const logoUrl = data.logoUrl || profile?.logoUrl;

  return (
    <div
      id="coverPrintArea"
      className="w-full max-w-[780px] bg-white text-slate-900 shadow-2xl rounded-sm pt-8 sm:pt-12 md:pt-[24mm] pb-8 sm:pb-12 md:pb-[24mm] pr-6 sm:pr-8 md:pr-[20mm] pl-10 sm:pl-12 md:pl-[28mm] flex flex-col items-center justify-between font-sans select-text border border-slate-300/60 print:shadow-none print:border-none print:w-full print:max-w-none relative overflow-hidden"
      style={{
        minHeight: "1198px",
      }}
    >
      {/* Indikator Panduan Margin Jilid Dokumen (Hanya Tampil di Layar / no-print) */}
      <div
        className="no-print absolute top-0 bottom-0 left-0 w-[24px] sm:w-[28px] md:w-[28mm] border-r border-dashed border-emerald-400/50 pointer-events-none flex flex-col justify-center items-center opacity-30 hover:opacity-90 transition-opacity z-20"
        title="Area Margin Penjilidan (28 mm) - Aman untuk penjilidan, staples, & lubang binder"
      >
        <span className="text-[8.5px] font-mono text-emerald-800 font-bold rotate-[-90deg] whitespace-nowrap tracking-wider select-none">
          RUANG JILID (28mm)
        </span>
      </div>

      {/* ================= BINGKAI ORNAMEN HALAMAN (PAGE BORDER) ================= */}
      {data.borderStyle === "ornament-classic" && (
        <div className="absolute inset-2 sm:inset-3 md:inset-[10mm] pointer-events-none z-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Motif kotak diagonal klasik standar Word / LPJ resmi */}
              <pattern
                id="coverOrnamentPattern"
                width="16"
                height="16"
                patternUnits="userSpaceOnUse"
              >
                {/* Kotak terluar */}
                <rect x="0.5" y="0.5" width="15" height="15" fill="#ffffff" stroke="#000000" strokeWidth="1" />
                {/* Segitiga hitam diagonal */}
                <polygon points="1.5,1.5 14.5,14.5 1.5,14.5" fill="#000000" />
                {/* Garis batas diagonal */}
                <line x1="1.5" y1="1.5" x2="14.5" y2="14.5" stroke="#000000" strokeWidth="0.8" />
              </pattern>
            </defs>

            {/* Bingkai Luar Kotak Motif Penuh */}
            <rect
              x="8"
              y="8"
              width="calc(100% - 16px)"
              height="calc(100% - 16px)"
              fill="none"
              stroke="url(#coverOrnamentPattern)"
              strokeWidth="16"
            />
            {/* Garis Border Batas Tipis Dalam */}
            <rect
              x="17"
              y="17"
              width="calc(100% - 34px)"
              height="calc(100% - 34px)"
              fill="none"
              stroke="#000000"
              strokeWidth="1"
            />
          </svg>
        </div>
      )}

      {data.borderStyle === "formal-double" && (
        <div className="absolute inset-2 sm:inset-3 md:inset-[10mm] pointer-events-none z-10 border-4 border-black p-1">
          <div className="w-full h-full border border-black" />
        </div>
      )}

      {data.borderStyle === "minimalist" && (
        <div className="absolute inset-2 sm:inset-3 md:inset-[10mm] pointer-events-none z-10 border-2 border-black" />
      )}

      {/* ================= BAGIAN 1: HEADER JUDUL LAPORAN ================= */}
      <div className="w-full flex flex-col items-center text-center z-10 pt-4 sm:pt-6">
        <h2 className="text-lg sm:text-xl md:text-[22px] font-extrabold uppercase tracking-wide text-black font-sans leading-tight">
          {data.judulLaporan || "LAPORAN PERTANGGUNGJAWABAN"}
        </h2>
        <h1 className="text-2xl sm:text-3xl md:text-[32px] font-black uppercase tracking-wider text-black font-sans mt-2 sm:mt-3 leading-tight">
          {data.subJudul || "BANTUAN HIBAH"}
        </h1>
        <h3 className="text-sm sm:text-base md:text-[17px] font-bold uppercase tracking-normal text-black font-sans mt-3 sm:mt-4">
          {data.namaPemerintah || "PEMERINTAH DAERAH KABUPATEN TEGAL"}
        </h3>
        <h3 className="text-sm sm:text-base md:text-[17px] font-bold uppercase tracking-normal text-black font-sans mt-1">
          TAHUN {data.tahunAnggaran || "2026"}
        </h3>
      </div>

      {/* ================= BAGIAN 2: LOGO EMBLEM RESMI (TANPA BINGKAI) ================= */}
      <div className="w-full flex flex-col items-center justify-center my-8 sm:my-12 z-10">
        <div className="inline-flex items-center justify-center">
          {logoUrl ? (
            /* Logo Custom Cloudinary */
            <img
              src={logoUrl}
              alt="Logo Lembaga"
              className="w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 object-contain"
              crossOrigin="anonymous"
            />
          ) : (
            /* Logo Vektor Otentik Fatayat NU */
            <div className="w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 bg-[#006c4e] flex flex-col items-center justify-between p-3 relative">
              <div className="flex-1 w-full flex items-center justify-center relative">
                {/* Lingkaran Tali Persatuan */}
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-2 border-dashed border-white/80 flex items-center justify-center relative">
                  {/* Bintang Utama & Bunga Melati */}
                  <svg className="w-18 h-18 sm:w-22 sm:h-22 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l2.4 7.2h7.6l-6.1 4.5 2.3 7.3-6.2-4.6-6.2 4.6 2.3-7.3-6.1-4.5h7.6z" />
                  </svg>
                  {/* Tali Ikatan Melingkar Bawah */}
                  <div className="absolute bottom-1 w-18 h-4 border-b-2 border-white rounded-full" />
                </div>
              </div>

              {/* Banner Pita Bawah: FATAYAT NU */}
              <div className="w-full bg-white text-[#006c4e] font-extrabold text-sm sm:text-base tracking-widest text-center py-1 uppercase rounded-xs shadow-xs">
                FATAYAT NU
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= BAGIAN 3: IDENTITAS LEMBAGA PENYUSUN ================= */}
      <div className="w-full flex flex-col items-center text-center z-10 pb-4 sm:pb-6">
        <span className="text-base sm:text-lg font-bold uppercase tracking-widest text-black mb-10 sm:mb-14 md:mb-16">
          {data.kataPengantar || "OLEH"}
        </span>

        <h3 className="text-lg sm:text-xl md:text-[21px] font-extrabold uppercase tracking-wide text-black leading-snug">
          {namaLembaga}
        </h3>
        {subNama && (
          <h3 className="text-lg sm:text-xl md:text-[21px] font-extrabold uppercase tracking-wide text-black mt-0.5 leading-snug">
            {subNama}
          </h3>
        )}

        <p className="text-xs sm:text-sm font-semibold text-black mt-2 sm:mt-3 max-w-[560px] leading-relaxed">
          {alamat}
        </p>
      </div>
    </div>
  );
}
