"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Receipt as ReceiptIcon,
  FileText,
  Package,
  Printer,
  ExternalLink,
  Search,
  ChevronDown,
  ChevronUp,
  Building2,
  Calendar,
  Hash,
} from "lucide-react";
import Link from "next/link";
import type { InstitutionProfile } from "@/types";

interface Receipt {
  id: string;
  nomorBukti: string;
  tanggal: Date | string;
  uraian: string;
  penerima: string;
  nominal: number;
}

interface BastDoc {
  id: string;
  nomorBast: string;
  tanggal: Date | string;
  namaKegiatan: string;
  pihak2Toko: string;
  pihak2Nama: string;
}

interface PesananDoc {
  id: string;
  nomorSp: string;
  tanggal: Date | string;
  namaPaket: string;
  pihak2Toko: string;
  totalHarga: number;
}

interface ArsipDashboardProps {
  institution: string;
  userName: string;
  profile: InstitutionProfile | null;
  activeTahun: string;
  receipts: Receipt[];
  bastDocs: BastDoc[];
  pesananDocs: PesananDoc[];
}

function fRupiah(v: number) {
  return "Rp " + Math.round(v).toLocaleString("id-ID");
}

function fDate(d: Date | string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500"
      />
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  count,
  color,
  linkHref,
  linkLabel,
  isOpen,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  color: string;
  linkHref: string;
  linkLabel: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onToggle}
        className="flex items-center gap-3 text-left group flex-1"
      >
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${color}`}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-bold text-white group-hover:text-slate-200">
            {title}
          </h2>
          <p className="text-[10px] text-slate-500">{count} dokumen tersimpan</p>
        </div>
        <div className="text-slate-500 ml-2">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      <Link
        href={linkHref}
        className="ml-4 shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors font-medium"
      >
        <Printer className="w-3 h-3" />
        {linkLabel}
        <ExternalLink className="w-3 h-3 opacity-60" />
      </Link>
    </div>
  );
}

export function ArsipDashboard({
  institution,
  userName,
  profile,
  activeTahun,
  receipts,
  bastDocs,
  pesananDocs,
}: ArsipDashboardProps) {
  const [searchKwitansi, setSearchKwitansi] = useState("");
  const [searchBast, setSearchBast] = useState("");
  const [searchSp, setSearchSp] = useState("");

  const [openKwitansi, setOpenKwitansi] = useState(true);
  const [openBast, setOpenBast] = useState(true);
  const [openSp, setOpenSp] = useState(true);

  // Filter helpers
  const filteredReceipts = receipts.filter((r) => {
    const q = searchKwitansi.toLowerCase();
    return (
      !q ||
      r.nomorBukti.toLowerCase().includes(q) ||
      r.uraian.toLowerCase().includes(q) ||
      r.penerima.toLowerCase().includes(q)
    );
  });

  const filteredBast = bastDocs.filter((b) => {
    const q = searchBast.toLowerCase();
    return (
      !q ||
      b.nomorBast.toLowerCase().includes(q) ||
      b.namaKegiatan.toLowerCase().includes(q) ||
      b.pihak2Toko.toLowerCase().includes(q)
    );
  });

  const filteredSp = pesananDocs.filter((p) => {
    const q = searchSp.toLowerCase();
    return (
      !q ||
      p.nomorSp.toLowerCase().includes(q) ||
      p.namaPaket.toLowerCase().includes(q) ||
      p.pihak2Toko.toLowerCase().includes(q)
    );
  });

  const totalDokumen = receipts.length + bastDocs.length + pesananDocs.length;

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/user"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Arsip Dokumen LPJ</h1>
              <p className="text-xs text-slate-400">
                {activeTahun === "ALL"
                  ? "Semua Tahun Anggaran"
                  : `Tahun Anggaran ${activeTahun}`}{" "}
                — {totalDokumen} total dokumen
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Institution Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/20 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{institution}</p>
          <p className="text-[11px] text-slate-400">
            No. Reg:{" "}
            <span className="font-mono text-amber-300">
              {profile?.noRegistrasi || "–"}
            </span>{" "}
            • Ketua: {profile?.namaKetua || "–"}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 shrink-0 text-center">
          {[
            { label: "Kwitansi", count: receipts.length, color: "text-amber-400" },
            { label: "BAST", count: bastDocs.length, color: "text-blue-400" },
            { label: "SP/SPK", count: pesananDocs.length, color: "text-purple-400" },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-slate-800/60 rounded-xl px-3 py-2 min-w-[64px]">
              <p className={`text-lg font-bold font-mono ${color}`}>{count}</p>
              <p className="text-[10px] text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== SECTION: KWITANSI ===== */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5">
          <SectionHeader
            icon={<ReceiptIcon className="w-4.5 h-4.5 text-amber-400" />}
            title="Daftar Arsip Kwitansi"
            count={receipts.length}
            color="bg-amber-500/10 border-amber-500/20"
            linkHref="/user/kwitansi"
            linkLabel="Buka & Cetak"
            isOpen={openKwitansi}
            onToggle={() => setOpenKwitansi((v) => !v)}
          />
        </div>

        {openKwitansi && (
          <div className="border-t border-slate-800 p-5 pt-4 space-y-3">
            {receipts.length > 0 && (
              <SearchInput
                value={searchKwitansi}
                onChange={setSearchKwitansi}
                placeholder="Cari no. kwitansi, uraian, atau penerima..."
              />
            )}
            {receipts.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">
                <ReceiptIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Belum ada kwitansi tersimpan untuk tahun ini.{" "}
                <Link href="/user/kwitansi" className="text-amber-400 underline">
                  Buat Kwitansi
                </Link>
              </div>
            ) : filteredReceipts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Tidak ada hasil untuk &quot;{searchKwitansi}&quot;
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2 text-left font-semibold w-8">No.</th>
                      <th className="pb-2 text-left font-semibold">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" /> No. Kwitansi
                        </span>
                      </th>
                      <th className="pb-2 text-left font-semibold">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Tanggal
                        </span>
                      </th>
                      <th className="pb-2 text-left font-semibold">Uraian</th>
                      <th className="pb-2 text-left font-semibold">Penerima</th>
                      <th className="pb-2 text-right font-semibold">Nominal</th>
                      <th className="pb-2 text-center font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReceipts.map((r, i) => (
                      <tr
                        key={r.id}
                        className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors group"
                      >
                        <td className="py-2.5 text-slate-500">{i + 1}.</td>
                        <td className="py-2.5 font-mono text-amber-300 font-semibold">
                          {r.nomorBukti}
                        </td>
                        <td className="py-2.5 text-slate-400 whitespace-nowrap">
                          {fDate(r.tanggal)}
                        </td>
                        <td className="py-2.5 text-slate-300 max-w-[200px]">
                          <p className="truncate">{r.uraian}</p>
                        </td>
                        <td className="py-2.5 text-slate-400">{r.penerima}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-amber-400 whitespace-nowrap">
                          {fRupiah(r.nominal)}
                        </td>
                        <td className="py-2.5 text-center">
                          <Link
                            href={`/user/kwitansi?id=${r.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/30 text-amber-400 text-[10px] font-semibold transition-colors"
                          >
                            <Printer className="w-3 h-3" />
                            Cetak
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-700">
                      <td colSpan={5} className="pt-3 font-bold text-slate-300 text-xs">
                        TOTAL {filteredReceipts.length} Kwitansi
                      </td>
                      <td className="pt-3 text-right font-bold font-mono text-amber-400 text-xs whitespace-nowrap">
                        {fRupiah(filteredReceipts.reduce((s, r) => s + r.nominal, 0))}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== SECTION: BERITA ACARA (BAST) ===== */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5">
          <SectionHeader
            icon={<FileText className="w-4.5 h-4.5 text-blue-400" />}
            title="Daftar Arsip Berita Acara Serah Terima (BAST)"
            count={bastDocs.length}
            color="bg-blue-500/10 border-blue-500/20"
            linkHref="/user/bast"
            linkLabel="Buka & Cetak"
            isOpen={openBast}
            onToggle={() => setOpenBast((v) => !v)}
          />
        </div>

        {openBast && (
          <div className="border-t border-slate-800 p-5 pt-4 space-y-3">
            {bastDocs.length > 0 && (
              <SearchInput
                value={searchBast}
                onChange={setSearchBast}
                placeholder="Cari no. BAST, nama kegiatan, atau toko..."
              />
            )}
            {bastDocs.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Belum ada BAST tersimpan untuk tahun ini.{" "}
                <Link href="/user/bast" className="text-blue-400 underline">
                  Buat BAST
                </Link>
              </div>
            ) : filteredBast.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Tidak ada hasil untuk &quot;{searchBast}&quot;
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2 text-left font-semibold w-8">No.</th>
                      <th className="pb-2 text-left font-semibold">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" /> No. BAST
                        </span>
                      </th>
                      <th className="pb-2 text-left font-semibold">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Tanggal
                        </span>
                      </th>
                      <th className="pb-2 text-left font-semibold">Nama Kegiatan / Paket</th>
                      <th className="pb-2 text-left font-semibold">Rekanan / Toko</th>
                      <th className="pb-2 text-center font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBast.map((b, i) => (
                      <tr
                        key={b.id}
                        className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors group"
                      >
                        <td className="py-2.5 text-slate-500">{i + 1}.</td>
                        <td className="py-2.5 font-mono text-blue-300 font-semibold">
                          {b.nomorBast}
                        </td>
                        <td className="py-2.5 text-slate-400 whitespace-nowrap">
                          {fDate(b.tanggal)}
                        </td>
                        <td className="py-2.5 text-slate-300 max-w-[220px]">
                          <p className="truncate">{b.namaKegiatan}</p>
                        </td>
                        <td className="py-2.5 text-slate-400">
                          <p className="truncate max-w-[140px]">{b.pihak2Toko}</p>
                          {b.pihak2Nama && (
                            <p className="text-[10px] text-slate-600 truncate">
                              {b.pihak2Nama}
                            </p>
                          )}
                        </td>
                        <td className="py-2.5 text-center">
                          <Link
                            href={`/user/bast?id=${b.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/30 text-blue-400 text-[10px] font-semibold transition-colors"
                          >
                            <Printer className="w-3 h-3" />
                            Cetak
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== SECTION: SURAT PESANAN (SP) ===== */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5">
          <SectionHeader
            icon={<Package className="w-4.5 h-4.5 text-purple-400" />}
            title="Daftar Arsip Surat Pesanan (SP / SPK)"
            count={pesananDocs.length}
            color="bg-purple-500/10 border-purple-500/20"
            linkHref="/user/pesanan"
            linkLabel="Buka & Cetak"
            isOpen={openSp}
            onToggle={() => setOpenSp((v) => !v)}
          />
        </div>

        {openSp && (
          <div className="border-t border-slate-800 p-5 pt-4 space-y-3">
            {pesananDocs.length > 0 && (
              <SearchInput
                value={searchSp}
                onChange={setSearchSp}
                placeholder="Cari no. SP, nama paket, atau toko..."
              />
            )}
            {pesananDocs.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Belum ada Surat Pesanan tersimpan untuk tahun ini.{" "}
                <Link href="/user/pesanan" className="text-purple-400 underline">
                  Buat Surat Pesanan
                </Link>
              </div>
            ) : filteredSp.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Tidak ada hasil untuk &quot;{searchSp}&quot;
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2 text-left font-semibold w-8">No.</th>
                      <th className="pb-2 text-left font-semibold">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" /> No. SP
                        </span>
                      </th>
                      <th className="pb-2 text-left font-semibold">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Tanggal
                        </span>
                      </th>
                      <th className="pb-2 text-left font-semibold">Nama Paket / Kegiatan</th>
                      <th className="pb-2 text-left font-semibold">Rekanan / Toko</th>
                      <th className="pb-2 text-right font-semibold">Total</th>
                      <th className="pb-2 text-center font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSp.map((p, i) => (
                      <tr
                        key={p.id}
                        className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors group"
                      >
                        <td className="py-2.5 text-slate-500">{i + 1}.</td>
                        <td className="py-2.5 font-mono text-purple-300 font-semibold">
                          {p.nomorSp}
                        </td>
                        <td className="py-2.5 text-slate-400 whitespace-nowrap">
                          {fDate(p.tanggal)}
                        </td>
                        <td className="py-2.5 text-slate-300 max-w-[220px]">
                          <p className="truncate">{p.namaPaket}</p>
                        </td>
                        <td className="py-2.5 text-slate-400">
                          <p className="truncate max-w-[140px]">{p.pihak2Toko}</p>
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-purple-400 whitespace-nowrap">
                          {fRupiah(p.totalHarga)}
                        </td>
                        <td className="py-2.5 text-center">
                          <Link
                            href={`/user/pesanan?id=${p.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/30 text-purple-400 text-[10px] font-semibold transition-colors"
                          >
                            <Printer className="w-3 h-3" />
                            Cetak
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-700">
                      <td colSpan={5} className="pt-3 font-bold text-slate-300 text-xs">
                        TOTAL {filteredSp.length} Surat Pesanan
                      </td>
                      <td className="pt-3 text-right font-bold font-mono text-purple-400 text-xs whitespace-nowrap">
                        {fRupiah(filteredSp.reduce((s, p) => s + p.totalHarga, 0))}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom hint */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-center">
        <p className="text-[11px] text-slate-500">
          💡 Klik tombol <strong className="text-slate-400">Cetak</strong> di setiap baris untuk membuka dokumen dan mencetak / mendownload PDF-nya.{" "}
          <br className="hidden sm:block" />
          Untuk mengunduh semua sekaligus, gunakan fitur{" "}
          <Link href="/user" className="text-amber-400 hover:text-amber-300 underline">
            Download Arsip (.ZIP)
          </Link>{" "}
          di halaman utama.
        </p>
      </div>
    </div>
  );
}
