"use client";

import type { PesananFormData, InstitutionProfile } from "@/types";
import { extractNamaTempat, cleanPihakJabatan } from "@/lib/utils/pesanan-date";
import { cleanAndFormatTitle } from "@/lib/utils/title-case";

interface PesananCanvasProps {
  data: PesananFormData;
  profile?: InstitutionProfile | null;
  institutionName?: string;
}

function formatDateIndo(dateStr?: string | null): string {
  if (!dateStr) return "-";
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const cleanDate = dateStr.split("T")[0];
    const [y, m, d] = cleanDate.split("-");
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const mIdx = parseInt(m, 10) - 1;
    return `${parseInt(d, 10)} ${months[mIdx] || m} ${y}`;
  }
  return dateStr;
}

function cleanTitle(text?: string | null): string {
  return cleanAndFormatTitle(text);
}

function formatPesananDendaText(rawDenda?: string | null): string {
  const defaultText =
    "Terhadap setiap hari keterlambatan penyelesaian pekerjaan Penyedia barang akan dikenakan Denda Keterlambatan sebesar 1/500 (satu per seribu) dari Nilai Pekerjaan atau bagian tertentu dari Nilai Pekerjaan sebelum PPN sesuai dengan persyaratan dan ketentuan yang berlaku";

  if (!rawDenda || !rawDenda.trim()) {
    return defaultText;
  }

  const trimmed = rawDenda.trim();

  // Bersihkan nilai bawaan lama yang ringkas agar otomatis upgrade ke klausul resmi
  if (trimmed.includes("Denda 1/500 dari nilai") || trimmed === "Denda 1/500 per hari keterlambatan.") {
    return defaultText;
  }

  // Hapus awalan nomor urut jika ada
  let cleaned = trimmed.replace(/^6\s*[\)\.]\s*/i, "");

  // Hapus awalan kata "Denda :" atau "Denda " agar tidak terjadi duplikasi dengan label
  cleaned = cleaned.replace(/^Denda\s*:\s*/i, "");
  cleaned = cleaned.replace(/^Denda\s+/i, "");

  return cleaned || defaultText;
}

export function PesananCanvas({ data, profile }: PesananCanvasProps) {
  const namaLembaga = profile?.namaLembaga || "PIMPINAN RANTING FATAYAT NU";
  const subNama = profile?.subNama || "DAWUHAN SELATAN";
  const cleanLembaga = (namaLembaga || "").replace(/^Ketua\s+/i, "").trim();
  const showSubNama = subNama && !cleanLembaga.toLowerCase().includes(subNama.toLowerCase());
  const instansiInduk = profile?.instansiInduk || "KECAMATAN TALANG KABUPATEN TEGAL";
  const alamat = profile?.alamat || "Jl. Kemuning 2016 Desa Dawuhan RT. 23 RW. 06 Kec. Talang Kab. Tegal";
  const email = profile?.email || "prfnudawuhanselatan@gmail.com";
  const noHp = profile?.noHp || "085642719869";
  const noRegistrasi = profile?.noRegistrasi || "HBH-2026-NU-0428";
  const logoUrl = profile?.logoUrl;
  const namaTempat = extractNamaTempat(profile, "Dawuhan");

  const rawJabatan = data.pihak1Jabatan || profile?.jabatanKetua || "Ketua";
  const cleanJabatan = cleanPihakJabatan(rawJabatan, cleanLembaga || namaLembaga, profile?.jabatanKetua || "Ketua");

  const totalCalculated =
    data.totalHarga > 0
      ? data.totalHarga
      : data.items.reduce((s, it) => s + it.jumlah * it.hargaSatuan, 0);

  return (
    <div
      id="pesananPrintArea"
      className="w-full max-w-[780px] bg-white text-slate-900 shadow-2xl rounded-sm pt-5 sm:pt-5 md:pt-[9mm] pb-6 sm:pb-7 md:pb-[12mm] pr-4 sm:pr-6 md:pr-[15mm] pl-8 sm:pl-12 md:pl-[28mm] flex flex-col font-sans select-text border border-slate-300/60 print:shadow-none print:border-none print:w-full print:max-w-none relative"
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
      <div className="flex items-center justify-between pb-2 relative">
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
          <h2 className="text-[17px] sm:text-[16px] leading-[19px] font-bold text-[#006c4e] uppercase tracking-wide">
            {namaLembaga}
          </h2>
          <h3 className="text-[16px] sm:text-[16px] leading-[19px] font-bold text-[#006c4e] uppercase">
            {subNama}
          </h3>
          <h4 className="text-[14px] sm:text-[15px] leading-[19px] font-bold text-[#006c4e] uppercase tracking-normal">
            {instansiInduk}
          </h4>
          <p className="text-[11px] sm:text-[11px] leading-[15px] text-[#006c4e] mt-0 font-medium">
            Alamat : {alamat}
          </p>
          <p className="text-[10.5px] sm:text-[11px] leading-[14px] text-[#006c4e]">
            Email : <span className="underline">{email}</span> | No. Hp: {noHp}
          </p>
        </div>
      </div>

      {/* Formal Kop Dual Border Line */}
      <div className="w-full flex flex-col gap-[2px] mb-1">
        <div className="w-full h-[2.5px] bg-[#006c4e]"></div>
        <div className="w-full h-[0.75px] bg-[#006c4e]"></div>
      </div>

      {/* ================= TITLE & REGISTER NUMBER ================= */}
      <div className="text-center mb-2">
        <h3 className="text-[14px] sm:text-[14px] font-bold tracking-wider uppercase text-black underline decoration-2 decoration-[#006c4e] underline-offset-4">
          SURAT PESANAN
        </h3>
        <p className="font-mono text-[12px] sm:text-[12px] text-black mt-1 font-semibold">
          Nomor : <span>{data.nomorSp || "02/A/PR.FNU/VIII/2026"}</span>
        </p>
        <p className="text-[12px] sm:text-[12.5px] text-black font-semibold mt-1">
          Paket Pekerjaan : <span className="font-bold">{cleanTitle(data.namaPaket) || "Pembelian Alat Rebana"}</span>
        </p>
      </div>

      {/* ================= SALUTATION & NARRATIVE (PEMESAN & PENYEDIA) ================= */}
      <div className="text-black text-[12px] sm:text-[12.5px] leading-[18.5px] mb-3 space-y-2">
        {/* Pihak Kesatu: Pemesan */}
        <div>
          <p className="font-semibold text-black mb-0.5">Yang bertanda tangan di bawah ini :</p>
          <div className="pl-4 grid grid-cols-[90px_12px_1fr] sm:grid-cols-[100px_12px_1fr] gap-y-0.5 text-[12px] sm:text-[12.5px]">
            <span className="text-black font-medium">Nama</span>
            <span>:</span>
            <span className="font-bold uppercase text-black">{data.pihak1Nama || "HENI FUJIATI"}</span>

            <span className="text-black font-medium">Jabatan</span>
            <span>:</span>
            <span className="font-semibold text-black">{cleanJabatan}</span>

            <span className="text-black font-medium">Alamat</span>
            <span>:</span>
            <span className="text-black">{data.pihak1Alamat || alamat}</span>
          </div>
          <p className="text-black italic mt-0.5 pl-4 text-[11px] sm:text-[11.5px]">
            Selanjutnya disebut sebagai <strong>Pemesan</strong>
          </p>
        </div>

        {/* Pihak Kedua: Penyedia Barang */}
        <div>
          <p className="font-semibold text-black mb-0.5">Bersama ini memerintahkan :</p>
          <div className="pl-4 grid grid-cols-[190px_12px_1fr] sm:grid-cols-[200px_12px_1fr] gap-y-0.5 text-[12px] sm:text-[12.5px]">
            <span className="text-black font-medium">Nama</span>
            <span>:</span>
            <span className="font-bold uppercase text-black">{data.pihak2Toko || "ADHUFU"}</span>

            <span className="text-black font-medium">Alamat</span>
            <span>:</span>
            <span className="text-black">{data.pihak2Alamat || "Jl. Sunan Amangkurat 1 Pesarean Kejeron"}</span>

            <span className="text-black font-medium">Yang dalam hal ini diwakili oleh</span>
            <span>:</span>
            <span className="font-bold text-black">{data.pihak2Nama || "ANSHORI"}</span>
          </div>
          <p className="text-black italic mt-0.5 pl-4 text-[11px] sm:text-[11.5px]">
            Selanjutnya disebut sebagai <strong>Penyedia Barang</strong>
          </p>
        </div>

        <p className="font-semibold text-black pt-1">
          Untuk mengirimkan barang dengan memperhatikan ketentuan-ketentuan sebagai berikut :
        </p>
      </div>

      {/* ================= 1) TABEL RINCIAN BARANG ================= */}
      <div className="w-full mb-3">
        <p className="font-bold text-black text-[12.5px] sm:text-[12px] mb-1.5">1) Rincian Barang</p>
        <table
          className="w-full text-left text-[11.5px] sm:text-[12px] border-collapse"
          style={{ border: "1.5px solid #000" }}
        >
          <thead>
            <tr
              className="bg-white text-black font-bold uppercase text-center"
              style={{ borderBottom: "1.5px solid #000" }}
            >
              <th className="p-1.5 sm:p-2 w-8 text-center" style={{ borderRight: "1px solid #000" }}>
                No
              </th>
              <th className="p-1.5 sm:p-2" style={{ borderRight: "1px solid #000" }}>
                Jenis Barang
              </th>
              <th className="p-1.5 sm:p-2 w-20 text-center" style={{ borderRight: "1px solid #000" }}>
                Jumlah
              </th>
              <th className="p-1.5 sm:p-2 w-28 text-right" style={{ borderRight: "1px solid #000" }}>
                Harga Satuan
              </th>
              <th className="p-1.5 sm:p-2 w-32 text-right">
                Harga Total
              </th>
            </tr>
          </thead>
          <tbody className="text-black">
            {data.items && data.items.length > 0 ? (
              data.items.map((item, index) => (
                <tr key={item.id || index} style={{ borderBottom: "1px solid #000" }}>
                  <td
                    className="p-1.5 sm:p-2 text-center font-mono align-top"
                    style={{ borderRight: "1px solid #000" }}
                  >
                    {index + 1}
                  </td>
                  <td className="p-1.5 sm:p-2 align-top" style={{ borderRight: "1px solid #000" }}>
                    <span className="font-bold block">{cleanTitle(item.jenisBarang)}</span>
                  </td>
                  <td
                    className="p-1.5 sm:p-2 text-center font-mono align-top whitespace-nowrap"
                    style={{ borderRight: "1px solid #000" }}
                  >
                    {item.jumlah} {item.satuan || "paket"}
                  </td>
                  <td
                    className="p-1.5 sm:p-2 text-right font-mono align-top whitespace-nowrap"
                    style={{ borderRight: "1px solid #000" }}
                  >
                    Rp {item.hargaSatuan.toLocaleString("id-ID")}
                  </td>
                  <td className="p-1.5 sm:p-2 text-right font-mono font-semibold align-top whitespace-nowrap">
                    Rp {item.totalHarga.toLocaleString("id-ID")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-3 text-center text-slate-500">
                  Belum ada data barang yang dipesan.
                </td>
              </tr>
            )}

            {/* Jumlah Subtotal */}
            <tr className="bg-white font-semibold text-[12px] sm:text-[12.5px]" style={{ borderBottom: "1px solid #000" }}>
              <td
                className="p-1.5 sm:p-2 text-right font-sans"
                colSpan={4}
                style={{ borderRight: "1px solid #000" }}
              >
                Jumlah
              </td>
              <td className="p-1.5 sm:p-2 text-right font-mono text-black">
                Rp {(data.subtotal || totalCalculated).toLocaleString("id-ID")}
              </td>
            </tr>

            {/* PPN / Pajak */}
            <tr className="bg-white text-[11px] sm:text-[11.5px]" style={{ borderBottom: "1px solid #000" }}>
              <td
                className="p-1.5 sm:p-2 text-right font-sans"
                colSpan={4}
                style={{ borderRight: "1px solid #000" }}
              >
                PPN
              </td>
              <td className="p-1.5 sm:p-2 text-right font-mono text-black">
                {data.pajak > 0
                  ? `Rp ${data.pajak.toLocaleString("id-ID")}`
                  : "-"}
              </td>
            </tr>

            {/* Jumlah Total */}
            <tr className="bg-white font-bold text-[12px] sm:text-[12.5px]">
              <td
                className="p-1.5 sm:p-2 text-right uppercase text-black"
                colSpan={4}
                style={{ borderRight: "1px solid #000" }}
              >
                Jumlah Total
              </td>
              <td className="p-1.5 sm:p-2 text-right font-mono text-black">
                Rp {totalCalculated.toLocaleString("id-ID")}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Terbilang & Catatan Pajak */}
        <div className="mt-1.5 p-2 bg-slate-50 border border-slate-300 rounded text-[11.5px] sm:text-[12px] text-black space-y-0.5">
          <div>
            <strong>Terbilang : </strong>
            <span className="italic font-semibold text-black">
              {data.terbilang || "Lima Juta Delapan Ratus Ribu Rupiah"}
            </span>
          </div>
          <p className="text-[10.5px] sm:text-[11px] text-black italic">
            {data.pajakKeterangan || "*harga sudah termasuk pajak"}
          </p>
        </div>
      </div>

      {/* ================= KETENTUAN 2 S/D 6 ================= */}
      <div className="mb-3 text-[11.5px] sm:text-[12px] text-black leading-[18px] space-y-1.5">
        <p>
          <strong>2) Tanggal barang harus sudah diterima :</strong>{" "}
          <span>{formatDateIndo(data.batasWaktu || "2026-08-04")}</span>
        </p>
        <p>
          <strong>3) Waktu Penyelesaian selama :</strong>{" "}
          <span>
            {data.waktuPenyelesaian ||
              "3 (tiga) hari kalender dan pekerjaan harus sudah selesai pada tanggal 04 Agustus 2026"}
          </span>
        </p>
        <p>
          <strong>4) Alamat Pemeriksaan barang :</strong>{" "}
          <span>
            {data.alamatPemeriksaan ||
              "Jl. Kemuning 2016 Desa Dawuhan RT. 23 RW. 06 Kec. Talang Kab. Tegal"}
          </span>
        </p>
        <p>
          <strong>5) Alamat pengiriman barang :</strong>{" "}
          <span>
            {data.alamatPengiriman || "Jl. Sunan Amangkurat 1 Pesarean Kejeron"}
          </span>
        </p>
        <p className="text-justify">
          <strong>6) Denda</strong>{" "}
          <span>{formatPesananDendaText(data.dendaKeterlambatan)}</span>
        </p>
      </div>

      {/* ================= TANDA TANGAN BILATERAL RESMI ================= */}
      <div className="pt-1 text-[12px] sm:text-[12.5px] text-black mt-1">
        <div className="flex justify-end mb-1 pr-[5rem]">
          <p className="font-semibold text-black">
            {namaTempat}, {formatDateIndo(data.tanggal || "2026-08-01")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Kolom Kiri: Penyedia Barang (ADHUFU) */}
          <div className="flex flex-col items-center text-center">
            <p className="font-medium text-black">Menerima dan Menyetujui</p>
            <p className="font-medium text-black">Untuk dan atas nama</p>
            <p className="font-bold text-black uppercase">{data.pihak2Toko || "ADHUFU"}</p>

            {/* Ruang Bersih untuk Tanda Tangan & Stempel Basah Toko */}
            <div className="h-20 my-1" />

            <p className="font-bold text-black uppercase underline decoration-1">
              {data.pihak2Nama || "ANSHORI"}
            </p>
            <p className="text-[10.5px] sm:text-[11px] text-black">Pimpinan Penyedia barang</p>
          </div>

          {/* Kolom Kanan: Pemesan (Fatayat NU Dawuhan Selatan) */}
          <div className="flex flex-col items-center text-center">
            <div className="font-bold text-black uppercase leading-tight">
              <p>{cleanLembaga}</p>
              {showSubNama ? <p>{subNama}</p> : null}
            </div>
            <p className="font-medium text-black mt-0.5">Pemesan</p>

            {/* Ruang Bersih untuk Tanda Tangan & Stempel Basah Lembaga */}
            <div className="h-20 my-1" />

            <p className="font-bold text-black uppercase underline decoration-1">
              {data.pihak1Nama || "HENI FUJIATI"}
            </p>
            <p className="text-[10.5px] sm:text-[11px] text-black">{cleanJabatan}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
