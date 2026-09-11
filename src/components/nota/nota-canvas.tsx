"use client";

import type { NotaFormData, InstitutionProfile } from "@/types";

interface NotaCanvasProps {
  data: NotaFormData;
  profile?: InstitutionProfile | null;
  onUpdateJudul?: (judul: string) => void;
  onUpdateKota?: (kota: string) => void;
  onUpdateKetuaNama?: (nama: string) => void;
  onUpdateBendaharaNama?: (nama: string) => void;
}

function formatDateIndo(dateStr?: string): string {
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
    const day = parseInt(d, 10).toString().padStart(2, "0");
    return `${day} ${monthName} ${y}`;
  }
  return dateStr;
}

export function NotaCanvas({
  data,
  profile,
  onUpdateJudul,
  onUpdateKota,
  onUpdateKetuaNama,
  onUpdateBendaharaNama,
}: NotaCanvasProps) {
  // Nilai identitas lembaga dari database profil atau default baku
  const namaLembaga = profile?.namaLembaga || "PIMPINAN RANTING FATAYAT NU";
  const subNama = profile?.subNama || "DAWUHAN SELATAN";
  const instansiInduk = profile?.instansiInduk || "KECAMATAN TALANG KABUPATEN TEGAL";
  const alamat = profile?.alamat || "Jl. Kemuning 2016 Desa Dawuhan RT.23 RW.06 Talang – Tegal 52193";
  const email = profile?.email || "prfnudawuhanselatan@gmail.com";
  const noHp = profile?.noHp || "085642719869";
  const logoUrl = profile?.logoUrl;

  const minHeightPx = data.paperSize === "A4" ? "1123px" : "1198px"; // F4 standard 330mm

  return (
    <div
      id="notaPrintArea"
      className="w-[780px] min-w-[780px] max-w-[780px] bg-white text-slate-900 shadow-2xl rounded-sm pt-[9mm] pb-[12mm] pr-[15mm] pl-[28mm] flex flex-col justify-between font-sans select-text border border-slate-300/60 print:shadow-none print:border-none print:w-full print:max-w-none relative"
      style={{
        minHeight: minHeightPx,
        boxSizing: "border-box",
      }}
    >
      {/* ================= INDIKATOR RUANG JILID (Hanya Layar, Tersembunyi saat Cetak) ================= */}
      <div
        className="absolute left-1 top-1/2 -translate-y-1/2 hidden print:hidden opacity-30 pointer-events-none font-mono"
        title="Area Margin Penjilidan (28 mm)"
      >
        <span className="text-[8px] text-emerald-800 font-bold rotate-[-90deg] whitespace-nowrap select-none inline-block">
          RUANG JILID (28mm)
        </span>
      </div>

      {/* Bagian Atas: KOP SURAT RESMI */}
      <div>
        {/* ================= KOP SURAT RESMI LEMBAGA ================= */}
        <div className="w-full flex items-center justify-between pb-2 relative font-sans">
          {/* Logo Lembaga (Cloudinary / Vektor Resmi Fatayat NU) */}
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

          {/* Teks Identitas Kop Surat Hijau Baku */}
          <div className="flex-1 text-center px-3 flex flex-col justify-center">
            <h2 className="text-[17px] sm:text-[16px] leading-[19px] font-bold text-[#006c4e] uppercase tracking-wide font-sans">
              {namaLembaga}
            </h2>
            <h3 className="text-[16px] sm:text-[16px] leading-[19px] font-bold text-[#006c4e] uppercase font-sans">
              {subNama}
            </h3>
            <h4 className="text-[14px] sm:text-[15px] leading-[19px] font-bold text-[#006c4e] uppercase tracking-normal font-sans">
              {instansiInduk}
            </h4>
            <p className="text-[11px] sm:text-[11px] leading-[15px] text-[#006c4e] mt-0 font-medium font-sans">
              Alamat : {alamat}
            </p>
            <p className="text-[10.5px] sm:text-[11px] leading-[14px] text-[#006c4e] font-sans">
              Email : <span className="underline">{email}</span> | No. Hp: {noHp}
            </p>
          </div>
        </div>

        {/* Garis Ganda Pemisah Kop Surat (Dual Border Khas Dokumen Resmi) */}
        <div className="w-full flex flex-col gap-[2px] mb-2">
          <div className="w-full h-[2.5px] bg-[#006c4e]"></div>
          <div className="w-full h-[0.75px] bg-[#006c4e]"></div>
        </div>

        {/* ================= JUDUL DOKUMEN: NOTA (BISA DIHIDDEN / TAMPIL) ================= */}
        {data.showJudul && (
          <div className="w-full text-center mt-3 mb-6 relative group flex items-center justify-center">
            <h1
              contentEditable={Boolean(onUpdateJudul)}
              suppressContentEditableWarning
              onBlur={(e) => {
                const text = e.currentTarget.textContent?.trim();
                if (text && text !== data.judul) {
                  onUpdateJudul?.(text);
                }
              }}
              className={`text-[16px] sm:text-[17px] font-serif font-bold tracking-[0.25em] uppercase text-black text-center m-0 transition-all ${
                onUpdateJudul
                  ? "cursor-text hover:bg-emerald-50/70 hover:outline-dashed hover:outline-1 hover:outline-emerald-500 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 print:hover:bg-transparent print:outline-none"
                  : ""
              }`}
            >
              {data.judul || "NOTA"}
            </h1>
          </div>
        )}

        {/* ================= AREA PENEMPELAN NOTA ASLI ================= */}
        <div className="w-full min-h-[440px] sm:min-h-[500px] flex flex-col items-center justify-center my-4 relative">
          {data.mode === "photo" && data.photoUrl ? (
            /* Mode Foto Digital: Tampilkan Foto Nota yang diunggah / terhubung dengan Kwitansi */
            <div className="w-full max-w-[560px] flex flex-col items-center p-2">
              <div className="relative border border-slate-300 shadow-sm bg-slate-50 p-2 rounded max-h-[560px] flex items-center justify-center overflow-hidden">
                <img
                  src={data.photoUrl}
                  alt={data.photoCaption || "Nota Asli Belanja Toko"}
                  className="max-h-[520px] max-w-full object-contain"
                />
              </div>
              {data.photoCaption && (
                <p className="text-[11px] font-sans text-slate-600 mt-2 italic text-center">
                  {data.photoCaption}
                </p>
              )}
            </div>
          ) : (
            /* Mode Blanko Bersih (Default Sesuai Permintaan Pengguna): Area Kosong Bersih untuk Tempel Fisik Manual */
            <div
              className={`w-full h-full min-h-[460px] sm:min-h-[520px] flex flex-col items-center justify-center transition-all ${
                data.showGuideBorder
                  ? "border-2 border-dashed border-slate-200/90 rounded-md p-6 bg-slate-50/30 print:border-transparent print:bg-transparent"
                  : ""
              }`}
            >
              {/* Panduan Layar (Otomatis Disembunyikan saat Dicetak) */}
              {data.showGuideBorder && (
                <div className="no-print text-center flex flex-col items-center gap-2 select-none text-slate-400">
                  <div className="w-12 h-12 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                    📎
                  </div>
                  <p className="text-xs font-sans font-medium tracking-wide">
                    TEMPAT PENEMPELAN NOTA ASLI
                  </p>
                  <p className="text-[10.5px] font-sans text-slate-400 max-w-xs">
                    Tempelkan nota kontan, bon toko, atau faktur fisik asli menggunakan lem atau staples di area ini setelah lembar dicetak.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= BLOK PENGESAHAN / TANDA TANGAN (PAS DI TENGAH) ================= */}
      <div className="w-full mt-auto pt-6 font-serif">
        <div
          className={`w-full flex ${
            data.signaturePosition === "right"
              ? "justify-end"
              : data.signaturePosition === "spread"
              ? "justify-between"
              : "justify-center"
          }`}
        >
          {/* Kolom Tanda Tangan (Pas di Tengah Lembar secara Default) */}
          <div
            className={`flex flex-col transition-all ${
              data.signaturePosition === "right"
                ? "w-[420px] max-w-full"
                : data.signaturePosition === "spread"
                ? "w-full px-4"
                : "w-full max-w-[540px] px-2"
            }`}
          >
            {/* Baris Tanggal & Tempat (Tepat di Atas Kolom Bendahara) */}
            <div className="grid grid-cols-2 text-center text-[12.5px] sm:text-[13px] text-black">
              <div>{/* Kolom Kiri Kosong di atas Ketua */}</div>
              <div
                contentEditable={Boolean(onUpdateKota)}
                suppressContentEditableWarning
                onBlur={(e) => {
                  const text = e.currentTarget.textContent?.trim();
                  if (text && onUpdateKota) {
                    const kotaOnly = text.split(",")[0]?.trim();
                    if (kotaOnly) onUpdateKota(kotaOnly);
                  }
                }}
                className={`pb-1 text-center font-normal ${
                  onUpdateKota
                    ? "cursor-text hover:bg-emerald-50/70 hover:outline-dashed hover:outline-1 hover:outline-emerald-500 rounded px-1"
                    : ""
                }`}
              >
                {data.kota || "Dawuhan"}, {formatDateIndo(data.tanggal)}
              </div>
            </div>

            {/* Baris Keterangan Jabatan Dua Baris */}
            <div className="grid grid-cols-2 text-center text-[12.5px] sm:text-[13px] text-black leading-snug font-normal">
              <div>
                <p>{data.ketuaJabatanLabel || "Setuju dibayar"}</p>
                <p className="mt-0.5">{data.ketuaJabatan || "Ketua"}</p>
              </div>
              <div>
                <p>{data.bendaharaJabatanLabel || "Dibayar oleh"}</p>
                <p className="mt-0.5">{data.bendaharaJabatan || "Bendahara"}</p>
              </div>
            </div>

            {/* Ruang Bebas Bersih untuk Tanda Tangan Basah & Cap Stempel Lembaga */}
            <div className="h-20 sm:h-24 flex items-center justify-center">
              {/* Ruang bersih fisik */}
            </div>

            {/* Baris Nama Pejabat Bertandatangan (Huruf Kapital Tegas) */}
            <div className="grid grid-cols-2 text-center text-[12.5px] sm:text-[13px] font-bold text-black uppercase tracking-wide">
              <div
                contentEditable={Boolean(onUpdateKetuaNama)}
                suppressContentEditableWarning
                onBlur={(e) => {
                  const text = e.currentTarget.textContent?.trim();
                  if (text && text !== data.ketuaNama) {
                    onUpdateKetuaNama?.(text);
                  }
                }}
                className={
                  onUpdateKetuaNama
                    ? "cursor-text hover:bg-emerald-50/70 hover:outline-dashed hover:outline-1 hover:outline-emerald-500 rounded px-1"
                    : ""
                }
              >
                {data.ketuaNama || "HENI FUJIATI"}
              </div>
              <div
                contentEditable={Boolean(onUpdateBendaharaNama)}
                suppressContentEditableWarning
                onBlur={(e) => {
                  const text = e.currentTarget.textContent?.trim();
                  if (text && text !== data.bendaharaNama) {
                    onUpdateBendaharaNama?.(text);
                  }
                }}
                className={
                  onUpdateBendaharaNama
                    ? "cursor-text hover:bg-emerald-50/70 hover:outline-dashed hover:outline-1 hover:outline-emerald-500 rounded px-1"
                    : ""
                }
              >
                {data.bendaharaNama || "NUR ALIMAH"}
              </div>
            </div>
          </div>
        </div>

        {/* Catatan Kaki Opsional (Nomor Bukti & Toko, jika diaktifkan) */}
        {data.showMetadataFooter && data.nomorBukti && (
          <div className="pt-4 border-t border-slate-200 mt-6 flex items-center justify-between text-[10px] font-sans text-slate-500">
            <span>Lampiran Bukti Transaksi: {data.nomorBukti}</span>
            {data.namaToko && <span>Penyedia / Toko: {data.namaToko}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
