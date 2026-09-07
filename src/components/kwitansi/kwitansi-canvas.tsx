"use client";

import type { ReceiptFormData } from "@/types";

interface KwitansiCanvasProps {
  data: ReceiptFormData;
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

export function KwitansiCanvas({ data, showCutGuides = false }: KwitansiCanvasProps) {
  return (
    <div
      id="kwitansiPrintContainer"
      className="w-full overflow-x-auto pb-4 flex justify-start sm:justify-center items-center"
    >
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
            <div className="w-[79.2%] h-full pt-[5.4cqw] pb-[2cqw] pr-[3.5cqw] pl-[5cqw] flex flex-col justify-between">
              {/* Top 3 Formal Rows */}
              <div className="space-y-[0.9cqw]">
                {/* Row 1: Telah Diterima Dari */}
                <div className="flex items-baseline text-[1.58cqw] leading-[1.35]">
                  <span className="w-[14.8cqw] font-normal text-slate-800 shrink-0 whitespace-nowrap">
                    Telah Diterima Dari
                  </span>
                  <span className="font-bold text-slate-800 shrink-0 mr-[0.8cqw]">:</span>
                  <span className="font-bold text-slate-950 tracking-wide uppercase flex-1 leading-[1.35]">
                    {data.pemberi || "PIMPINAN RANTING FATAYAT NU DAWUHAN SELATAN"}
                  </span>
                </div>

                {/* Row 2: Uang Sebanyak */}
                <div className="flex items-baseline text-[1.58cqw] leading-[1.35]">
                  <span className="w-[14.8cqw] font-normal text-slate-800 shrink-0 whitespace-nowrap">
                    Uang Sebanyak
                  </span>
                  <span className="font-bold text-slate-800 shrink-0 mr-[0.8cqw]">:</span>
                  <span className="font-semibold text-slate-900 flex-1 leading-[1.35]">
                    {data.terbilang || "Tiga Juta Rupiah"}
                  </span>
                </div>

                {/* Row 3: Guna Membayar */}
                <div className="flex items-baseline text-[1.52cqw] leading-[1.35]">
                  <span className="w-[14.8cqw] font-normal text-slate-800 shrink-0 whitespace-nowrap">
                    Guna Membayar
                  </span>
                  <span className="font-bold text-slate-800 shrink-0 mr-[0.8cqw]">:</span>
                  <span className="font-normal text-slate-900 flex-1 leading-[1.35] line-clamp-2">
                    {data.uraian || "Belanja Sound Aktif sebanyak 1 unit x @ Rp. 3.000.000 = Rp. 3.000.000"}
                  </span>
                </div>
              </div>

              {/* Middle Section: Cyan Parallelogram Nominal Badge & Tax Notice */}
              <div className="my-[0.5cqw] flex items-center justify-between">
                <div className="relative inline-block drop-shadow-[0_2px_4px_rgba(0,108,78,0.22)]">
                  <div className="transform -skew-x-12 bg-gradient-to-r from-[#22d3ee] via-[#06b6d4] to-[#0891b2] px-[2.2cqw] py-[0.35cqw] rounded-[3px] border border-[#ecfeff]">
                    <div className="transform skew-x-12 flex items-baseline gap-[0.4cqw] text-slate-950">
                      <span className="text-[1.6cqw] font-black tracking-tight">
                        Rp.
                      </span>
                      <span className="font-mono text-[2.05cqw] font-black tracking-tight">
                        {data.nominal || "3.000.000"},-
                      </span>
                    </div>
                  </div>
                </div>

                {data.totalPajak > 0 && (
                  <div className="text-[0.92cqw] font-mono text-slate-800 bg-emerald-50/90 border border-emerald-300/80 px-[1.2cqw] py-[0.2cqw] rounded leading-tight text-right shadow-xs">
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
                <div className="flex flex-col justify-between h-[9.2cqw]">
                  <div className="text-[1.18cqw] text-slate-800 leading-[1.3]">
                    <p>Setuju dibayar</p>
                    <p className="font-normal">Ketua Pimpinan Ranting Fatayat NU</p>
                    <p className="font-normal">Dawuhan Selatan</p>
                  </div>
                  <div>
                    <span className="text-[1.35cqw] font-bold text-slate-950 uppercase tracking-wider block truncate">
                      {data.ketua || "HENI FUJIATI"}
                    </span>
                    {/* <div className="w-[12cqw] h-[1.5px] bg-slate-800/80 mx-auto mt-[0.25cqw]"></div> */}
                  </div>
                </div>

                {/* Column 2: Lunas Dibayar (Bendahara) */}
                <div className="flex flex-col justify-between h-[9.2cqw]">
                  <div className="text-[1.18cqw] text-slate-800 leading-[1.3]">
                    <p className="whitespace-nowrap">
                      Lunas dibayar Tgl :{" "}
                      <span className="font-semibold">{formatDisplayDate(data.tanggal)}</span>
                    </p>
                    <p className="font-normal">Bendahara</p>
                  </div>
                  <div>
                    <span className="text-[1.35cqw] font-bold text-slate-950 uppercase tracking-wider block truncate">
                      {data.bendahara || "NUR ALIMAH"}
                    </span>
                    {/* <div className="w-[12cqw] h-[1.5px] bg-slate-800/80 mx-auto mt-[0.25cqw]"></div> */}
                  </div>
                </div>

                {/* Column 3: Yang Menerima */}
                <div className="flex flex-col justify-between h-[9.2cqw] relative">
                  {/* Floating Materai Box if checked */}
                  {data.denganMaterai && (
                    <div
                      id="materaiBox"
                      className="absolute -top-[0.8cqw] left-1/2 -translate-x-1/2 w-[6.5cqw] h-[3.6cqw] border border-dashed border-red-600 bg-red-100/70 text-red-900 rounded flex flex-col items-center justify-center pointer-events-none z-30 shadow-sm"
                    >
                      <span className="font-mono text-[0.75cqw] font-black tracking-widest text-red-700">
                        MATERAI
                      </span>
                      <span className="font-mono text-[0.65cqw] font-bold text-red-600">
                        Rp 10.000
                      </span>
                    </div>
                  )}

                  <div className="text-[1.18cqw] text-slate-800 leading-[1.3]">
                    <p>Yang Menerima</p>
                  </div>
                  <div>
                    {data.penerima ? (
                      <div>
                        <span className="text-[1.35cqw] font-bold text-slate-950 uppercase tracking-wider block truncate">
                          {data.penerima}
                        </span>
                        {/* <div className="w-[12cqw] h-[1.5px] bg-slate-800/80 mx-auto mt-[0.25cqw]"></div> */}
                      </div>
                    ) : (
                      <span className="text-[1.18cqw] font-medium text-slate-800 block truncate max-w-[15cqw] mx-auto border-b border-dotted border-slate-700 pb-[0.2cqw]">
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
