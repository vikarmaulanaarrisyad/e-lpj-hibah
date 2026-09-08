"use client";

import type { DokumentasiFormData, DokumentasiPhoto, InstitutionProfile } from "@/types";
import { extractNamaTempat } from "@/lib/utils/pesanan-date";

interface DokumentasiCanvasProps {
  data: DokumentasiFormData;
  profile?: InstitutionProfile | null;
  onUpdateTitle?: (judul: string) => void;
  onUpdateSubJudul?: (subJudul: string) => void;
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
    const monthIndex = parseInt(m, 10) - 1;
    const monthName = months[monthIndex] || m;
    return `${parseInt(d, 10)} ${monthName} ${y}`;
  }
  return dateStr;
}

function cleanTitle(text?: string | null): string {
  if (!text) return "";
  let clean = text.trim();
  clean = clean.split(/\s+(?:sebanyak|sebesar|sejumlah|senilai)\s+/i)[0].trim();
  clean = clean.split(/\s*x\s*@\s*Rp/i)[0].trim();
  clean = clean.split(/\s*=\s*Rp/i)[0].trim();
  return clean;
}

export function DokumentasiCanvas({
  data,
  profile,
  onUpdateTitle,
  onUpdateSubJudul,
}: DokumentasiCanvasProps) {
  const namaLembaga = profile?.namaLembaga || "PIMPINAN RANTING FATAYAT NU";
  const subNama = profile?.subNama || "DAWUHAN SELATAN";
  const cleanLembaga = (namaLembaga || "").replace(/^Ketua\s+/i, "").trim();
  const showSubNama = subNama && !cleanLembaga.toLowerCase().includes(subNama.toLowerCase());
  const instansiInduk = profile?.instansiInduk || "KECAMATAN TALANG KABUPATEN TEGAL";
  const alamat = profile?.alamat || "Jl. Kemuning 2016 Desa Dawuhan RT. 23 RW. 06 Kec. Talang Kab. Tegal";
  const email = profile?.email || "prfnudawuhanselatan@gmail.com";
  const noHp = profile?.noHp || "085642719869";
  const logoUrl = profile?.logoUrl;
  const namaTempat = extractNamaTempat(profile, "Dawuhan");

  // Tentukan jumlah foto per lembar berdasarkan layout yang dipilih
  const itemsPerPage = data.layout === "4-per-page" ? 4 : data.layout === "1-per-page" ? 1 : 2;

  const photosList = data.photos && data.photos.length > 0 ? data.photos : [];
  const totalPages = Math.max(1, Math.ceil(photosList.length / itemsPerPage));

  // Pecah foto per halaman
  const pages: DokumentasiPhoto[][] = [];
  for (let i = 0; i < totalPages; i++) {
    pages.push(photosList.slice(i * itemsPerPage, (i + 1) * itemsPerPage));
  }

  return (
    <div id="dokumentasiPrintArea" className="flex flex-col gap-8 print:gap-0 print:block select-text">
      {pages.map((pagePhotos, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === totalPages - 1;
        const pageNumber = pageIndex + 1;

        return (
          <div
            key={`page-${pageIndex}`}
            className="dokumentasi-page w-full max-w-[780px] bg-white text-slate-900 shadow-2xl rounded-sm pt-6 sm:pt-7 md:pt-[14mm] pb-6 sm:pb-7 md:pb-[14mm] pr-4 sm:pr-6 md:pr-[15mm] pl-8 sm:pl-12 md:pl-[28mm] flex flex-col justify-between font-sans border border-slate-300/70 print:shadow-none print:border-none print:w-full print:max-w-none relative mx-auto"
            style={{
              minHeight: "1198px", // Setara F4 330mm pada 96 DPI
              boxSizing: "border-box",
            }}
          >
            {/* Indikator Ruang Jilid Dokumen (Hanya tampil di layar) */}
            <div
              className="absolute left-1 top-1/2 -translate-y-1/2 hidden print:hidden opacity-30 pointer-events-none"
              title="Area Jilid (28mm)"
            >
              <span className="text-[8px] font-mono text-emerald-800 font-bold rotate-[-90deg] whitespace-nowrap select-none inline-block">
                RUANG JILID (28mm)
              </span>
            </div>

            {/* Bagian Atas Halaman */}
            <div>
              {isFirstPage ? (
                <>
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
                  <div className="w-full flex flex-col gap-[2px] mb-2">
                    <div className="w-full h-[2.5px] bg-[#006c4e]"></div>
                    <div className="w-full h-[0.75px] bg-[#006c4e]"></div>
                  </div>

                  {/* ================= TITLE & SUBTITLE (BISA DIEDIT LANGSUNG) ================= */}
                  <div className="text-center mb-2.5 relative group">
                    <div className="relative inline-block max-w-full">
                      <h3
                        contentEditable={Boolean(onUpdateTitle)}
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const text = e.currentTarget.textContent?.trim();
                          if (text && text !== data.judulDokumentasi) {
                            onUpdateTitle?.(text);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.currentTarget.blur();
                          }
                        }}
                        title={
                          onUpdateTitle
                            ? "Klik untuk mengubah / mengedit judul langsung di kertas"
                            : undefined
                        }
                        className={`text-[14px] sm:text-[14px] font-bold tracking-wider uppercase text-black underline decoration-2 decoration-[#006c4e] underline-offset-4 transition-all ${
                          onUpdateTitle
                            ? "cursor-text hover:bg-emerald-50 hover:outline-dashed hover:outline-1 hover:outline-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-amber-50/80 rounded px-1.5 py-0.5 print:hover:bg-transparent print:outline-none print:ring-0 print:p-0"
                            : ""
                        }`}
                      >
                        {data.judulDokumentasi || "LEMBAR DOKUMENTASI KEGIATAN & PENGADAAN SARANA"}
                      </h3>
                      {onUpdateTitle && (
                        <span className="no-print print:hidden hidden sm:inline-block text-[10px] text-emerald-700 font-normal ml-1.5 align-middle select-none opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-50 border border-emerald-300 rounded px-1.5 py-0.5 shadow-xs">
                          ✏️ Klik edit langsung
                        </span>
                      )}
                    </div>
                    <div className="block">
                      <p
                        contentEditable={Boolean(onUpdateSubJudul)}
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const text = e.currentTarget.textContent?.trim();
                          if (text && text !== data.subJudul) {
                            onUpdateSubJudul?.(text);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.currentTarget.blur();
                          }
                        }}
                        title={
                          onUpdateSubJudul
                            ? "Klik untuk mengubah / mengedit subjudul langsung di kertas"
                            : undefined
                        }
                        className={`font-mono text-[12px] sm:text-[12px] text-black mt-1 font-semibold inline-block transition-all ${
                          onUpdateSubJudul
                            ? "cursor-text hover:bg-emerald-50 hover:outline-dashed hover:outline-1 hover:outline-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-amber-50/80 rounded px-1.5 py-0.5 print:hover:bg-transparent print:outline-none print:ring-0 print:p-0"
                            : ""
                        }`}
                      >
                        {data.subJudul || "PROGRAM BANTUAN HIBAH DAERAH TAHUN ANGGARAN 2026"}
                      </p>
                    </div>
                  </div>

                  {/* ================= KOTAK INFORMASI KEGIATAN ================= */}
                  <div className="w-full border border-slate-300 rounded-sm bg-slate-50/70 p-2.5 mb-4 text-xs">
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr className="leading-relaxed">
                          <td className="w-32 font-semibold text-black align-top py-0.5">Nama Kegiatan</td>
                          <td className="w-3 text-black align-top py-0.5">:</td>
                          <td className="font-bold text-black align-top py-0.5">
                            {cleanTitle(data.namaKegiatan) || "Pengadaan Sarana & Prasarana Organisasi"}
                          </td>
                        </tr>
                        <tr className="leading-relaxed">
                          <td className="font-semibold text-black align-top py-0.5">Hari / Tanggal</td>
                          <td className="text-black align-top py-0.5">:</td>
                          <td className="text-black align-top py-0.5">
                            {formatDateIndo(data.tanggalKegiatan)}
                          </td>
                        </tr>
                        <tr className="leading-relaxed">
                          <td className="font-semibold text-black align-top py-0.5">Tempat / Lokasi</td>
                          <td className="text-black align-top py-0.5">:</td>
                          <td className="text-black align-top py-0.5">
                            {data.lokasiKegiatan || "Sekretariat PR Fatayat NU Dawuhan Selatan"}
                          </td>
                        </tr>
                        {data.nomorReferensi && (
                          <tr className="leading-relaxed">
                            <td className="font-semibold text-black align-top py-0.5">No. BAST / SP</td>
                            <td className="text-black align-top py-0.5">:</td>
                            <td className="font-mono font-semibold text-black align-top py-0.5">
                              {data.nomorReferensi}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                /* Header Ringkas untuk Halaman ke-2 dst */
                <div className="mb-4 pb-2 border-b border-slate-300 flex items-center justify-between text-xs text-black">
                  <div>
                    <span className="font-bold text-black uppercase">{cleanLembaga} {subNama}</span>
                    <span className="mx-2">•</span>
                    <span>{cleanTitle(data.namaKegiatan) || "Dokumentasi Kegiatan"}</span>
                  </div>
                  <span className="font-semibold text-black">Lembar {pageNumber}</span>
                </div>
              )}

              {/* ================= GRID FOTO DOKUMENTASI ================= */}
              {pagePhotos.length === 0 ? (
                <div className="w-full border-2 border-dashed border-slate-300 rounded-lg p-10 text-center my-6">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-2">
                    📷
                  </div>
                  <p className="text-sm font-semibold text-slate-600">Belum ada foto yang diunggah</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Silakan unggah foto kegiatan atau serah terima barang pada panel di sebelah kiri.
                  </p>
                </div>
              ) : data.layout === "4-per-page" ? (
                /* Layout 4-per-page: 2 baris x 2 kolom */
                <div className="grid grid-cols-2 gap-3.5 my-2">
                  {pagePhotos.map((photo, pIdx) => {
                    const globalPhotoNum = pageIndex * itemsPerPage + pIdx + 1;
                    return (
                      <div
                        key={photo.id}
                        className="border border-slate-300 rounded-sm bg-white overflow-hidden flex flex-col shadow-xs"
                      >
                        {/* Box Foto */}
                        <div className="relative w-full h-[190px] bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-200">
                          {photo.url ? (
                            <img
                              src={photo.url}
                              alt={photo.caption || `Foto ${globalPhotoNum}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-slate-400">Tidak ada gambar</span>
                          )}
                          {/* Badge nomor foto disembunyikan agar tampilan foto resmi bersih tanpa tertutup watermark */}
                          <div className="hidden absolute top-2 left-2 bg-slate-900/80 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                            Foto #{globalPhotoNum}
                          </div>
                        </div>
                        {/* Keterangan Foto */}
                        <div className="p-2 bg-slate-50/70 text-left flex-1 flex flex-col justify-between">
                          <p className="text-[11px] font-medium text-slate-800 leading-snug line-clamp-3">
                            {photo.caption || "Dokumentasi kegiatan penerimaan & pemanfaatan sarana hibah."}
                          </p>
                          {(photo.tanggal || photo.lokasi) && (
                            <p className="text-[9.5px] text-slate-500 mt-1 flex items-center gap-2">
                              {photo.tanggal && <span>📅 {formatDateIndo(photo.tanggal)}</span>}
                              {photo.lokasi && <span>📍 {photo.lokasi}</span>}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : data.layout === "1-per-page" ? (
                /* Layout 1-per-page: 1 foto sangat besar */
                <div className="my-2">
                  {pagePhotos.map((photo, pIdx) => {
                    const globalPhotoNum = pageIndex * itemsPerPage + pIdx + 1;
                    return (
                      <div
                        key={photo.id}
                        className="border border-slate-300 rounded-sm bg-white overflow-hidden shadow-xs"
                      >
                        <div className="relative w-full h-[520px] bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-200">
                          {photo.url ? (
                            <img
                              src={photo.url}
                              alt={photo.caption || `Foto ${globalPhotoNum}`}
                              className="w-full h-full object-contain bg-slate-950/5"
                            />
                          ) : (
                            <span className="text-xs text-slate-400">Tidak ada gambar</span>
                          )}
                          {/* Badge nomor foto disembunyikan agar tampilan foto resmi bersih tanpa tertutup watermark */}
                          <div className="hidden absolute top-3 left-3 bg-slate-900/85 text-white font-mono text-xs font-bold px-2 py-1 rounded shadow-xs">
                            Foto #{globalPhotoNum} (Utama)
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50/70 text-left">
                          <p className="text-xs sm:text-[13px] font-semibold text-slate-900 leading-relaxed">
                            {photo.caption || "Dokumentasi serah terima barang dan kegiatan penerima hibah."}
                          </p>
                          {(photo.tanggal || photo.lokasi) && (
                            <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-3">
                              {photo.tanggal && <span>Tanggal: {formatDateIndo(photo.tanggal)}</span>}
                              {photo.lokasi && <span>Lokasi: {photo.lokasi}</span>}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Layout 2-per-page (Default Rekomendasi LPJ): 2 foto vertikal besar & jelas */
                <div className="flex flex-col gap-4 my-2">
                  {pagePhotos.map((photo, pIdx) => {
                    const globalPhotoNum = pageIndex * itemsPerPage + pIdx + 1;
                    return (
                      <div
                        key={photo.id}
                        className="border border-slate-300 rounded-sm bg-white overflow-hidden flex flex-col shadow-xs"
                      >
                        {/* Container Foto */}
                        <div className="relative w-full h-[270px] bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-200">
                          {photo.url ? (
                            <img
                              src={photo.url}
                              alt={photo.caption || `Foto ${globalPhotoNum}`}
                              className="w-full h-full object-contain bg-slate-950/5"
                            />
                          ) : (
                            <span className="text-xs text-slate-400">Foto belum diunggah</span>
                          )}
                          {/* Badge nomor foto disembunyikan agar tampilan foto resmi bersih tanpa tertutup watermark */}
                          <div className="hidden absolute top-2.5 left-2.5 bg-slate-900/85 text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded shadow-xs">
                            Dokumentasi #{globalPhotoNum}
                          </div>
                        </div>
                        {/* Keterangan Foto */}
                        <div className="p-2.5 bg-slate-50/70 text-left">
                          <p className="text-[12px] font-semibold text-slate-900 leading-snug">
                            {photo.caption || "Serah terima barang dan fisik kegiatan hibah Fatayat NU."}
                          </p>
                          {(photo.tanggal || photo.lokasi) && (
                            <p className="text-[10px] text-slate-600 mt-1 flex items-center gap-3">
                              {photo.tanggal && <span>📅 {formatDateIndo(photo.tanggal)}</span>}
                              {photo.lokasi && <span>📍 {photo.lokasi}</span>}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bagian Bawah Halaman (Tanda Tangan di Halaman Terakhir & Footer Halaman) */}
            <div className="mt-4">
              {/* Blok Tanda Tangan Pengesahan (Hanya di lembar terakhir jika diaktifkan) */}
              {isLastPage && data.sertakanTandaTangan && (
                <div className="w-full pt-3 pb-2 text-xs border-t border-slate-300/80">
                  <div className="flex justify-between items-start text-center">
                    {/* Pihak Penyerah / Toko Rekanan */}
                    <div className="w-56 text-left">
                      <p className="text-slate-700 font-medium">Yang Menyerahkan,</p>
                      <p className="font-bold text-slate-900 leading-tight">
                        {data.penandatangan1Jabatan || "Penyedia / Toko Rekanan"}
                      </p>
                      <div className="h-16 flex items-end">
                        <span className="text-[10px] text-slate-400 italic">(Tanda tangan & stempel toko)</span>
                      </div>
                      <p className="font-bold text-slate-900 underline uppercase tracking-wide">
                        {data.penandatangan1Nama || "ANSHORI"}
                      </p>
                    </div>

                    {/* Pihak Penerima / Ketua Ranting */}
                    <div className="w-64 text-right">
                      <p className="text-slate-700 font-medium">
                        {namaTempat}, {formatDateIndo(data.tanggalKegiatan)}
                      </p>
                      <p className="font-bold text-slate-900 leading-tight">
                        {data.penandatangan2Jabatan || `Ketua ${cleanLembaga}`}
                      </p>
                      <div className="h-16 flex items-end justify-end">
                        <span className="text-[10px] text-slate-400 italic">(Tanda tangan & cap stempel)</span>
                      </div>
                      <p className="font-bold text-slate-900 underline uppercase tracking-wide">
                        {data.penandatangan2Nama || profile?.namaKetua || "HENI FUJIATI"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
