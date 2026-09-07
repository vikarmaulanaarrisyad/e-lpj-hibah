"use client";

import { Fragment } from "react";
import type { RabSummary, InstitutionProfile } from "@/types";
import { angkaKeTerbilang, formatRupiahNumber } from "@/lib/utils/terbilang";

interface RabCanvasProps {
  summary: RabSummary;
  profile?: InstitutionProfile | null;
  institutionName?: string;
  leaderName?: string;
  treasurerName?: string;
  tahunAnggaran?: string;
  tanggalDokumen?: string;
}

export function RabCanvas({
  summary,
  profile,
  institutionName,
  leaderName = "HENI FUJIATI",
  treasurerName = "NUR ALIMAH",
  tahunAnggaran = "2026",
  tanggalDokumen,
}: RabCanvasProps) {
  const namaLembaga = profile?.namaLembaga || "PIMPINAN RANTING FATAYAT NU";
  const subNama = profile?.subNama || "DAWUHAN SELATAN";
  const instansiInduk = profile?.instansiInduk || "KECAMATAN TALANG KABUPATEN TEGAL";
  const alamat = profile?.alamat || "Jl. Kemuning 2016 Desa Dawuhan RT.23 RW.06 Talang – Tegal 52193";
  const email = profile?.email || "prfnudawuhanselatan@gmail.com";
  const noHp = profile?.noHp || "085642719869";
  const logoUrl = profile?.logoUrl;
  const ketuaName = profile?.namaKetua || leaderName;
  const bendaharaName = profile?.namaBendahara || treasurerName;
  const tahun = tahunAnggaran || "2026";

  const fullInstitutionTitle = institutionName || `${namaLembaga} ${subNama}`;

  const formatNum = (val: number) => {
    return Math.round(val).toLocaleString("id-ID");
  };

  const defaultTanggal =
    tanggalDokumen ||
    new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const terbilangText = angkaKeTerbilang(summary.totalAnggaran);

  return (
    <div
      id="rabPrintCanvas"
      className="bg-white text-slate-900 shadow-2xl rounded-sm p-[12mm] flex flex-col font-sans select-text border border-slate-300 print:shadow-none print:border-none print:w-full print:max-w-none relative"
      style={{
        width: "330mm",
        minHeight: "215mm",
        boxSizing: "border-box",
      }}
    >
      {/* ================= KOP SURAT RESMI LEMBAGA ================= */}
      <div className="flex items-center justify-between pb-3 relative">
        {/* Logo Lembaga */}
        <div className="w-[72px] h-[72px] shrink-0 flex items-center justify-center">
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

        {/* Identitas Kop Surat */}
        <div className="flex-1 text-center px-4 flex flex-col justify-center">
          <h2 className="text-[17px] leading-[22px] font-bold text-[#006c4e] uppercase tracking-wide">
            {namaLembaga}
          </h2>
          <h3 className="text-[16px] leading-[21px] font-bold text-[#006c4e] uppercase">
            {subNama}
          </h3>
          <h4 className="text-[14px] leading-[19px] font-bold text-[#006c4e] uppercase tracking-normal">
            {instansiInduk}
          </h4>
          <p className="text-[10px] leading-[14px] text-[#006c4e] mt-1 font-medium">
            Alamat : {alamat}
          </p>
          <p className="text-[9.5px] leading-[13px] text-[#006c4e]">
            Email : <span className="underline">{email}</span> | No. Hp: {noHp}
          </p>
        </div>

        {/* Right decorative badge / space */}
        <div className="w-[72px] shrink-0"></div>
      </div>

      {/* Garis Ganda Pembatas Kop Surat Resmi (Tebal 2.5px + Tipis 0.75px) */}
      <div className="w-full flex flex-col gap-[2px] mb-3">
        <div className="w-full h-[2.5px] bg-[#004532]"></div>
        <div className="w-full h-[0.75px] bg-[#004532]"></div>
      </div>

      {/* ================= JUDUL DOKUMEN RESMI ================= */}
      <div className="text-center mb-4">
        <h1 className="text-[14px] leading-[20px] font-extrabold tracking-wide uppercase text-black">
          RENCANA ANGGARAN BIAYA (RAB)
        </h1>
        <h2 className="text-[12.5px] leading-[18px] font-bold uppercase text-black">
          BANTUAN HIBAH DAERAH TAHUN ANGGARAN {tahun}
        </h2>
        <p className="text-[11px] leading-[16px] font-semibold uppercase text-slate-800 mt-0.5">
          {fullInstitutionTitle}
        </p>
      </div>

      {/* ================= TABEL MULTI-KOEFISIEN FORMAT RESMI NPHD ================= */}
      <div className="w-full overflow-hidden">
        <table className="w-full text-left text-[10px] border-collapse border border-black font-sans table-fixed">
          {/* Exact Proportional Columns for F4 Landscape */}
          <colgroup>
            <col style={{ width: "4%" }} />
            <col style={{ width: "36%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "13%" }} />
          </colgroup>

          {/* Double Table Header persis format resmi NPHD */}
          <thead>
            <tr className="bg-slate-100 text-black border-b border-black font-bold text-center">
              <th
                rowSpan={2}
                className="py-2 px-1 border-r border-black text-center align-middle"
              >
                No
              </th>
              <th
                rowSpan={2}
                className="py-2 px-2.5 border-r border-black text-center align-middle"
              >
                Uraian Kegiatan/ Penggunaan
              </th>
              <th
                colSpan={2}
                className="py-1 px-1 border-r border-black text-center bg-slate-200/80 font-bold"
              >
                Koefisien I
              </th>
              <th
                colSpan={2}
                className="py-1 px-1 border-r border-black text-center bg-slate-200/80 font-bold"
              >
                Koefisien II
              </th>
              <th
                rowSpan={2}
                className="py-2 px-1 border-r border-black text-center align-middle"
              >
                Harga Satuan (Rp)
              </th>
              <th
                rowSpan={2}
                className="py-2 px-2 text-center align-middle font-extrabold"
              >
                Jumlah (Rp)
              </th>
            </tr>
            <tr className="bg-slate-50 text-black border-b border-black text-center text-[9px] font-semibold">
              <th className="py-1 px-1 border-r border-black">Volume</th>
              <th className="py-1 px-1 border-r border-black">Satuan</th>
              <th className="py-1 px-1 border-r border-black">Volume</th>
              <th className="py-1 px-1 border-r border-black">Satuan</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {summary.items.map((group) => {
              const rincianList = group.rincian || [];
              const subtotalAnggaran =
                rincianList.reduce((sum, r) => sum + r.total, 0) || group.anggaran;

              return (
                <Fragment key={group.id}>
                  {/* Baris Kelompok Kegiatan (Contoh: I | ALAT HADROH) */}
                  <tr className="bg-slate-100/90 font-bold text-[10px]">
                    <td className="py-1.5 px-1.5 text-center font-mono border-r border-black">
                      {group.kode}
                    </td>
                    <td
                      colSpan={5}
                      className="py-1.5 px-2.5 uppercase font-bold tracking-wider border-r border-black text-black"
                    >
                      {group.nama}
                    </td>
                    <td className="py-1.5 px-2 border-r border-black text-right"></td>
                    <td className="py-1.5 px-2 text-right"></td>
                  </tr>

                  {/* Baris Rincian Item Belanja */}
                  {rincianList.map((row, rowIdx) => (
                    <tr
                      key={row.id || `${group.id}-${rowIdx}`}
                      className="border-b border-slate-300 hover:bg-slate-50 text-[9.5px]"
                    >
                      <td className="py-1 px-1.5 text-center text-slate-700 font-mono border-r border-black">
                        {row.no || rowIdx + 1}
                      </td>
                      <td className="py-1 px-2.5 text-black border-r border-black font-medium">
                        {row.uraian}
                      </td>
                      <td className="py-1 px-1.5 text-center font-mono border-r border-black">
                        {row.koefisien1Vol || 1}
                      </td>
                      <td className="py-1 px-1.5 text-center capitalize border-r border-black">
                        {row.koefisien1Satuan || "Paket"}
                      </td>
                      <td className="py-1 px-1.5 text-center font-mono border-r border-black">
                        {row.koefisien2Vol != null && row.koefisien2Vol > 0
                          ? row.koefisien2Vol
                          : "-"}
                      </td>
                      <td className="py-1 px-1.5 text-center capitalize border-r border-black">
                        {row.koefisien2Satuan || "-"}
                      </td>
                      <td className="py-1 px-2 text-right font-mono border-r border-black whitespace-nowrap">
                        {formatNum(row.hargaSatuan)}
                      </td>
                      <td className="py-1 px-2 text-right font-mono font-semibold whitespace-nowrap text-black">
                        {formatNum(row.total)}
                      </td>
                    </tr>
                  ))}

                  {/* Jika belum ada rincian item belanja */}
                  {rincianList.length === 0 && (
                    <tr className="border-b border-slate-300 text-center italic text-slate-500 text-[9px]">
                      <td className="py-1.5 px-1.5 border-r border-black">-</td>
                      <td colSpan={5} className="py-1.5 px-2.5 text-left border-r border-black">
                        Belum ada rincian item terdaftar
                      </td>
                      <td className="py-1.5 px-2 border-r border-black text-right font-mono">
                        {formatNum(group.anggaran)}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-semibold">
                        {formatNum(group.anggaran)}
                      </td>
                    </tr>
                  )}

                  {/* Baris Subtotal Kelompok Kegiatan (Contoh: Jumlah I | 5.800.000) */}
                  <tr className="bg-slate-100 font-bold text-[9.5px] border-t border-black border-b border-black">
                    <td className="py-1 px-1 border-r border-black"></td>
                    <td
                      colSpan={5}
                      className="py-1 px-2.5 text-right uppercase tracking-wider border-r border-black font-bold text-black"
                    >
                      Jumlah {group.kode}
                    </td>
                    <td className="py-1 px-2 border-r border-black"></td>
                    <td className="py-1 px-2 text-right font-mono font-bold text-black whitespace-nowrap">
                      {formatNum(subtotalAnggaran)}
                    </td>
                  </tr>
                </Fragment>
              );
            })}

            {/* BARIS TOTAL KESELURUHAN ANGGARAN BIAYA (RAB) */}
            <tr className="bg-slate-300 font-extrabold text-[10.5px] border-t-2 border-b-2 border-black">
              <td
                colSpan={6}
                className="py-2 px-3 text-right uppercase tracking-wider border-r border-black"
              >
                TOTAL KESELURUHAN ANGGARAN BIAYA (RAB)
              </td>
              <td className="py-2 px-2 border-r border-black"></td>
              <td className="py-2 px-2 text-right font-mono font-bold text-black whitespace-nowrap">
                Rp {formatNum(summary.totalAnggaran)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Terbilang Box */}
      <div className="mt-2.5 p-2 bg-slate-50 border border-black text-[10px] italic">
        <span className="font-bold not-italic">Terbilang : </span>
        <span className="capitalize">{terbilangText}</span>
      </div>

      {/* ================= LEMBAR PENGESAHAN & TANDA TANGAN ================= */}
      <div className="mt-8 flex justify-between items-start text-black text-[10px] font-sans px-8">
        {/* Kolom Tanda Tangan Ketua (Kiri) */}
        <div className="text-center w-64 flex flex-col items-center">
          <p className="leading-tight">Mengetahui,</p>
          <p className="font-bold leading-tight">
            Ketua {namaLembaga}
          </p>
          <p className="font-bold leading-tight">{subNama}</p>
          <div className="h-20 flex items-center justify-center">
            {/* Space for Signature & Official Stamp */}
          </div>
          <p className="font-bold underline text-[10.5px] uppercase tracking-wide">
            {ketuaName}
          </p>
        </div>

        {/* Kolom Tanda Tangan Bendahara (Kanan) */}
        <div className="text-center w-64 flex flex-col items-center">
          <p className="leading-tight" suppressHydrationWarning>
            Dawuhan, {defaultTanggal}
          </p>
          <p className="font-bold leading-tight">Bendahara Pengeluaran</p>
          <div className="h-20 flex items-center justify-center">
            {/* Space for Signature */}
          </div>
          <p className="font-bold underline text-[10.5px] uppercase tracking-wide">
            {bendaharaName}
          </p>
        </div>
      </div>
    </div>
  );
}
