"use client";

import type { ReceiptFormData, InstitutionProfile } from "@/types";
import { getSignatoryKetuaTitles } from "@/lib/utils/kwitansi-signatory";

interface KwitansiCanvasProps {
  data: ReceiptFormData;
  profile?: InstitutionProfile | null;
  showCutGuides?: boolean;
}

function formatDisplayDate(dateStr?: string) {
  if (!dateStr) return "-";
  // Handle ISO YYYY-MM-DD format from <input type="date">
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

export function KwitansiCanvas({ data, profile, showCutGuides = false }: KwitansiCanvasProps) {
  const ketuaTitles = getSignatoryKetuaTitles(profile, data);

  return (
    <div
      id="kwitansiPrintContainer"
      className="w-full overflow-x-auto pb-4 flex justify-start sm:justify-center items-center"
    >
      {/* Khusus Kwitansi: Kunci Orientasi Cetak Browser ke F4 Landscape (330mm x 215mm) */}
      <style>{`
        @media print {
          @page {
            size: 330mm 215mm landscape !important;
            margin: 0mm !important;
          }
        }
      `}</style>

      {/* ================= F4 PAPER SHEET CONTAINER (330mm × 215mm LANDSCAPE) ================= */}
      <div
        id="f4PaperSheet"
        className="relative bg-white rounded-xl shadow-2xl p-0 flex flex-col justify-center items-center border border-slate-700/60 transition-all duration-300 w-full overflow-hidden shrink-0"
        style={{
          maxWidth: "1080px",
          minWidth: "680px",
          aspectRatio: "330 / 215", // Exact F4 / Folio Landscape ratio (330mm × 215mm)
        }}
      >
        {/* Subtle Sheet Watermark / Metadata in screen view */}
        <div className="absolute top-2.5 left-5 right-5 flex items-center justify-between text-[11px] text-slate-400 font-mono no-print pointer-events-none select-none z-20">
          <span className="flex items-center gap-1.5 font-medium text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Kertas: F4 Landscape (330mm × 215mm)
          </span>
          <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Kwitansi: 27,99 cm × 9,6 cm (Presisi 1:1)
          </span>
          <span className="text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Posisi: Center
          </span>
        </div>

        {/* ================= KWITANSI CANVAS (CENTERED, EXACT 27,99 cm × 9,6 cm) ================= */}
        <div
          id="kwitansiCanvas"
          className="relative bg-[#fafaf5] text-slate-900 rounded-sm shadow-md transition-all duration-300 select-none overflow-hidden my-auto [container-type:inline-size]"
          style={{
            width: "84.82%", // 279.9mm / 330mm = 84.82% (proporsi fisik persis sama dengan cetakan F4)
            aspectRatio: "27.99 / 9.6", // Ukuran presisi 27,99 cm × 9,6 cm
          }}
        >
          {/* Tag <img> Latar Belakang Blanko: Menjamin 100% Tercetak Di Semua Browser */}
          <img
            src="/templates/kwitansi-blank-template.png"
            alt="Blanko Kwitansi Resmi"
            crossOrigin="anonymous"
            className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0"
            style={{
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
          />

          {/* ================= PERFORATION GUIDE (GARIS POTONG) ================= */}
          {showCutGuides && (
            <div
              id="guideCutLine"
              className="absolute top-1.5 bottom-1.5 left-[20.8%] w-0 border-l border-dashed border-[#8A9A68]/70 z-20 flex flex-col justify-between items-center py-2 pointer-events-none no-print"
            >
              <span className="text-[11px] text-[#4d5d28] -ml-2 bg-[#FAF9F5] px-0.5">✂</span>
              <span className="font-mono text-[8px] text-[#4d5d28] uppercase tracking-widest [writing-mode:vertical-rl] py-2 opacity-80 font-bold">
                Gunting / Arsip Buku Kas
              </span>
              <span className="text-[11px] text-[#4d5d28] -ml-2 bg-[#FAF9F5] px-0.5">✂</span>
            </div>
          )}

          {/* ================= CONTENT OVERLAY MATCHING EXACT TEMPLATE ================= */}
          <div className="relative z-10 w-full h-full flex font-sans">
            {/* SISI KIRI (ARSIP / COUNTERFOIL STUB ~20.8%) */}
            <div className="w-[20.8%] h-full pointer-events-none" />

            {/* SISI KANAN (BADAN KWITANSI UTAMA ~79.2%) */}
            <div className="w-[79.2%] h-full pt-[3.8cqw] pb-[3.4cqw] pr-[4.5cqw] pl-[4.8cqw] flex flex-col justify-between">
              {/* Top 3 Formal Rows */}
              <div className="space-y-[0.38cqw]">
                {/* Row 1: Telah Diterima Dari */}
                <div className="flex items-start text-[1.62cqw] leading-snug">
                  <span className="w-[15.5cqw] font-normal text-slate-800 shrink-0 whitespace-nowrap pt-[0.05cqw]">
                    Telah Diterima Dari
                  </span>
                  <span className="font-bold text-slate-800 shrink-0 mr-[0.8cqw] pt-[0.05cqw]">:</span>
                  <span className="font-bold text-slate-950 tracking-wide uppercase flex-1 leading-snug">
                    {data.pemberi || "PIMPINAN RANTING FATAYAT NU DAWUHAN SELATAN"}
                  </span>
                </div>

                {/* Row 2: Uang Sebanyak */}
                <div className="flex items-start text-[1.62cqw] leading-snug">
                  <span className="w-[15.5cqw] font-normal text-slate-800 shrink-0 whitespace-nowrap pt-[0.05cqw]">
                    Uang Sebanyak
                  </span>
                  <span className="font-bold text-slate-800 shrink-0 mr-[0.8cqw] pt-[0.05cqw]">:</span>
                  <span className="font-semibold text-slate-900 flex-1 leading-snug italic">
                    {data.terbilang || "Tiga Juta Rupiah"}
                  </span>
                </div>

                {/* Row 3: Guna Membayar */}
                <div className="flex items-start text-[1.56cqw] leading-snug">
                  <span className="w-[15.5cqw] font-normal text-slate-800 shrink-0 whitespace-nowrap pt-[0.05cqw]">
                    Guna Membayar
                  </span>
                  <span className="font-bold text-slate-800 shrink-0 mr-[0.8cqw] pt-[0.05cqw]">:</span>
                  <span className="font-medium text-slate-950 flex-1 leading-snug break-words">
                    {data.uraian || "Belanja Sound Aktif sebanyak 1 unit x @ Rp. 3.000.000 = Rp. 3.000.000"}
                  </span>
                </div>
              </div>

              {/* Middle Section: Cyan Parallelogram Nominal Badge & Tax Notice */}
              <div className="my-[0.12cqw] flex items-center justify-between">
                <div className="relative inline-block drop-shadow-[0_2px_4px_rgba(0,108,78,0.2)]">
                  <div className="transform -skew-x-12 bg-gradient-to-r from-[#22d3ee] via-[#06b6d4] to-[#0891b2] px-[2.0cqw] py-[0.22cqw] rounded-[3px] border border-[#ecfeff]">
                    <div className="transform skew-x-12 flex items-baseline gap-[0.45cqw] text-slate-950">
                      <span className="text-[1.65cqw] font-black tracking-tight">
                        Rp.
                      </span>
                      <span className="font-mono text-[2.05cqw] font-black tracking-tight">
                        {data.nominal || "3.000.000"},-
                      </span>
                    </div>
                  </div>
                </div>

                {data.totalPajak > 0 && (
                  <div className="text-[0.95cqw] font-mono text-slate-800 bg-emerald-50/90 border border-emerald-300/80 px-[1.2cqw] py-[0.18cqw] rounded leading-tight text-right shadow-xs">
                    <span className="font-bold text-emerald-900 block">
                      Pot. Pajak: Rp {data.totalPajak.toLocaleString("id-ID")}
                    </span>
                    <span className="text-slate-600">
                      Netto: <strong>Rp {data.nominalBersih.toLocaleString("id-ID")}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Section: 3-Column Signatories */}
              <div className="grid grid-cols-3 gap-[1.2cqw] text-center items-end">
                {/* Column 1: Setuju Dibayar (Ketua) */}
                <div className="flex flex-col justify-between items-center text-center h-[10.8cqw]">
                  <div className="text-[1.14cqw] text-slate-800 leading-tight text-center w-full flex flex-col items-center">
                    <p className="font-semibold text-slate-950 text-center">Setuju dibayar</p>
                    <p className="text-[1.06cqw] font-normal text-slate-700 text-center">{ketuaTitles.line1}</p>
                    <p className="text-[1.06cqw] font-normal text-slate-700 text-center">{ketuaTitles.line2}</p>
                  </div>
                  {/* Ruang Tanda Tangan Lapang */}
                  <div className="flex-1 min-h-[4.8cqw] flex items-center justify-center pointer-events-none" />
                  <div className="w-full text-center">
                    <span className="text-[1.42cqw] font-bold text-slate-950 uppercase tracking-wider block underline decoration-slate-950 decoration-1 underline-offset-2 text-center">
                      {data.ketua || "HENI FUJIATI"}
                    </span>
                  </div>
                </div>

                {/* Column 2: Lunas Dibayar (Bendahara) */}
                <div className="flex flex-col justify-between items-center text-center h-[10.8cqw]">
                  <div className="text-[1.14cqw] text-slate-800 leading-tight text-center w-full flex flex-col items-center">
                    <p className="whitespace-nowrap text-slate-950 text-center">
                      Lunas dibayar Tgl :{" "}
                      <span className="font-bold">{formatDisplayDate(data.tanggal)}</span>
                    </p>
                    <p className="text-[1.06cqw] font-normal text-slate-700 text-center">Bendahara</p>
                  </div>
                  {/* Ruang Tanda Tangan Lapang */}
                  <div className="flex-1 min-h-[4.8cqw] flex items-center justify-center pointer-events-none" />
                  <div className="w-full text-center">
                    <span className="text-[1.42cqw] font-bold text-slate-950 uppercase tracking-wider block underline decoration-slate-950 decoration-1 underline-offset-2 text-center">
                      {data.bendahara || "NUR ALIMAH"}
                    </span>
                  </div>
                </div>

                {/* Column 3: Yang Menerima */}
                <div className="flex flex-col justify-between items-center text-center h-[10.8cqw] relative">
                  {/* Floating Materai Box if checked - positioned in signature area above recipient */}
                  {data.denganMaterai && (
                    <div
                      id="materaiBox"
                      className="absolute top-[2.4cqw] left-1/2 -translate-x-1/2 w-[6.2cqw] h-[3.4cqw] border border-dashed border-red-500/80 bg-red-50/60 text-red-800 rounded flex flex-col items-center justify-center pointer-events-none z-10 shadow-xs"
                    >
                      <span className="font-mono text-[0.78cqw] font-black tracking-widest text-red-600 leading-tight">
                        MATERAI
                      </span>
                      <span className="font-mono text-[0.68cqw] font-bold text-red-500 leading-tight">
                        Rp 10.000
                      </span>
                    </div>
                  )}

                  <div className="text-[1.14cqw] text-slate-800 leading-tight text-center w-full flex flex-col items-center">
                    <p className="font-semibold text-slate-950 text-center">Yang Menerima</p>
                  </div>
                  {/* Ruang Tanda Tangan Lapang */}
                  <div className="flex-1 min-h-[4.8cqw] flex items-center justify-center pointer-events-none" />
                  <div className="w-full text-center">
                    {data.penerima ? (
                      <div>
                        <span className="text-[1.42cqw] font-bold text-slate-950 uppercase tracking-wider block underline decoration-slate-950 decoration-1 underline-offset-2 text-center">
                          {data.penerima}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[1.25cqw] font-medium text-slate-800 block max-w-[17cqw] mx-auto border-b border-dotted border-slate-700 pb-[0.2cqw] text-center">
                        .......................................
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
