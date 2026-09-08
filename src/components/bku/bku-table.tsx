"use client";

import { useState } from "react";
import type { BkuLedgerEntry, BkuSummary } from "@/types";
import {
  Search,
  Plus,
  Printer,
  FileText,
  ExternalLink,
  Trash2,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { deleteBkuTransactionAction } from "@/app/actions/bku.action";
import { deleteReceiptAction } from "@/app/actions/receipt.action";
import { swalLoading, swalSuccess, swalError, swalConfirmDelete } from "@/lib/swal";

interface BkuTableProps {
  entries: BkuLedgerEntry[];
  summary: BkuSummary;
  institutionName?: string;
  leaderName?: string;
  treasurerName?: string;
  onOpenIncomeModal: () => void;
  onRefresh: () => void;
}

export function BkuTable({
  entries,
  summary,
  institutionName = "PIMPINAN RANTING FATAYAT NU DAWUHAN SELATAN",
  leaderName = "HENI FUJIATI",
  treasurerName = "NUR ALIMAH",
  onOpenIncomeModal,
  onRefresh,
}: BkuTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PENERIMAAN" | "PENGELUARAN">("ALL");

  const formatRupiah = (val: number) => {
    return val === 0 ? "-" : "Rp " + val.toLocaleString("id-ID");
  };

  const formatDate = (d: Date | string) => {
    const dateObj = new Date(d);
    return dateObj.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    const matchSearch =
      e.nomorBukti.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.uraian.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.kategoriRab && e.kategoriRab.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchType =
      typeFilter === "ALL" || e.jenis === typeFilter;

    return matchSearch && matchType;
  });

  const handleDelete = async (id: string) => {
    const isConfirmed = await swalConfirmDelete({
      title: "Hapus Transaksi BKU?",
      text: "Apakah Anda yakin ingin menghapus transaksi penerimaan kas ini dari pembukuan BKU?",
      confirmText: "Ya, Hapus!",
      cancelText: "Batal",
    });
    if (!isConfirmed) return;

    swalLoading("Menghapus Transaksi...", "Sedang memperbarui pembukuan kas umum...");
    const res = await deleteBkuTransactionAction(id);
    if (res.success) {
      swalSuccess("Berhasil Dihapus!", res.message);
      onRefresh();
    } else {
      swalError("Gagal Menghapus Transaksi", res.message);
    }
  };

  const handleDeleteReceipt = async (receiptId: string, nomorBukti: string) => {
    const isConfirmed = await swalConfirmDelete({
      title: "Hapus Transaksi & Dokumen Terkait?",
      text: `Apakah Anda yakin ingin menghapus kwitansi ${nomorBukti}? Seluruh dokumen terkait (Surat Pesanan/SP, Berita Acara/BAST, Kwitansi, dan catatan BKU) akan ikut terhapus. Pos anggaran RAB tetap aman dan pagunya akan otomatis dipulihkan.`,
      confirmText: "Ya, Hapus Semua Terkait!",
      cancelText: "Batal",
    });
    if (!isConfirmed) return;

    swalLoading("Menghapus Kwitansi...", "Sedang membersihkan transaksi dan memulihkan anggaran...");
    const res = await deleteReceiptAction(receiptId);
    if (res.success) {
      swalSuccess("Berhasil Dihapus!", res.message);
      onRefresh();
    } else {
      swalError("Gagal Menghapus Kwitansi", res.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* ================= CONTROLS & ACTION TOOLBAR ================= */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm no-print">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nomor bukti kas, rincian belanja, pos RAB..."
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Filter Type */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <button
              type="button"
              onClick={() => setTypeFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === "ALL"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Semua ({entries.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("PENERIMAAN")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === "PENERIMAAN"
                  ? "bg-emerald-900/80 text-emerald-300 border border-emerald-700/50"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Debet ({entries.filter((x) => x.jenis === "PENERIMAAN").length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("PENGELUARAN")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === "PENGELUARAN"
                  ? "bg-amber-900/80 text-amber-300 border border-amber-700/50"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Kredit ({entries.filter((x) => x.jenis === "PENGELUARAN").length})
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenIncomeModal}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-all shadow-md flex items-center gap-2 border border-emerald-500/40"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Kas Masuk (SP2D)</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Cetak BKU F4</span>
          </button>
        </div>
      </div>

      {/* ================= FORMAL BKU DOCUMENT CONTAINER ================= */}
      <div id="bkuPrintArea" className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden print:bg-white print:border-none print:shadow-none print:text-black">
        {/* Document Header (Formal Kas Negara / LPJ) */}
        <div className="p-6 border-b border-slate-800 text-center print:border-b-2 print:border-black print:pb-4">
          <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider print:text-black">
            Buku Kas Umum (BKU)
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-emerald-400 uppercase mt-0.5 print:text-black">
            Laporan Pertanggungjawaban Dana Hibah (LPJ)
          </p>
          <p className="text-xs text-slate-400 mt-1 print:text-black">
            Entitas Penerima: <strong className="text-slate-200 print:text-black">{institutionName}</strong>
          </p>
        </div>

        {/* ================= BKU LEDGER TABLE ================= */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-300 font-semibold border-b border-slate-800 print:bg-slate-100 print:text-black print:border-black">
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3 w-28">Tanggal</th>
                <th className="py-3 px-3 w-36">No. Bukti Kas</th>
                <th className="py-3 px-3 w-32">Pos RAB</th>
                <th className="py-3 px-4 min-w-[240px]">Uraian Transaksi</th>
                <th className="py-3 px-3 w-36 text-right text-emerald-400 print:text-black">Penerimaan (Debet)</th>
                <th className="py-3 px-3 w-36 text-right text-amber-300 print:text-black">Pengeluaran (Kredit)</th>
                <th className="py-3 px-4 w-36 text-right text-cyan-300 print:text-black">Saldo Berjalan</th>
                <th className="py-3 px-3 w-20 text-center no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 print:divide-slate-300">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-medium">
                    Belum ada data transaksi Buku Kas Umum. Mulai dengan mencatat penerimaan hibah atau membuat kwitansi belanja.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const isIncome = entry.jenis === "PENERIMAAN";
                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-800/40 transition-colors print:hover:bg-transparent"
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-mono print:text-black">
                        {entry.nomorUrut}
                      </td>
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap print:text-black" suppressHydrationWarning>
                        {formatDate(entry.tanggal)}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-200 whitespace-nowrap print:text-black">
                        {entry.nomorBukti}
                      </td>
                      <td className="py-3 px-3 text-slate-400 print:text-black">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-medium print:bg-transparent print:p-0 print:text-black">
                          {entry.kategoriRab || "-"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-200 leading-relaxed print:text-black">
                        <p>{entry.uraian}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {entry.penerima && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 font-medium bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40 print:text-black print:border-none print:p-0">
                              <span className="text-slate-400 print:text-black">Penerima:</span>
                              <strong>{entry.penerima}</strong>
                            </span>
                          )}
                          {entry.totalPajak && entry.totalPajak > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-cyan-300 font-medium bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40 print:text-black print:border-none print:p-0">
                              <span className="text-slate-400 print:text-black">Pot. Pajak:</span>
                              <strong>{"Rp " + entry.totalPajak.toLocaleString("id-ID")}</strong>
                              <span className="text-slate-400 text-[10px] font-normal print:hidden">
                                (Netto: Rp {(entry.nominalBersih || 0).toLocaleString("id-ID")})
                              </span>
                            </span>
                          ) : null}
                          {entry.receiptId && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400/80 font-medium no-print">
                              <FileText className="w-3 h-3" /> Kwitansi LPJ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-emerald-400 whitespace-nowrap print:text-black">
                        {formatRupiah(entry.debet)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-amber-300 whitespace-nowrap print:text-black">
                        {formatRupiah(entry.kredit)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-cyan-300 whitespace-nowrap print:text-black">
                        {"Rp " + entry.saldoBerjalan.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-3 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          {entry.receiptId ? (
                            <>
                              <Link
                                href={`/user/kwitansi?no=${encodeURIComponent(entry.nomorBukti)}`}
                                className="p-1 rounded bg-slate-800 hover:bg-emerald-900/60 hover:text-emerald-300 text-slate-400 transition-colors"
                                title="Buka Lembar Kwitansi"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDeleteReceipt(entry.receiptId!, entry.nomorBukti)}
                                className="p-1 rounded bg-slate-800 hover:bg-red-900/60 hover:text-red-300 text-slate-400 transition-colors"
                                title="Hapus Kwitansi & Pulihkan Anggaran"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDelete(entry.id)}
                              className="p-1 rounded bg-slate-800 hover:bg-red-900/60 hover:text-red-300 text-slate-400 transition-colors"
                              title="Hapus Transaksi Penerimaan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* ================= TABLE TOTAL FOOTER ================= */}
            <tfoot>
              <tr className="bg-slate-950 font-bold text-xs border-t-2 border-slate-700 print:bg-slate-200 print:border-black print:text-black">
                <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-slate-300 print:text-black">
                  Total Mutasi Kas:
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-400 print:text-black">
                  {"Rp " + summary.totalPenerimaan.toLocaleString("id-ID")}
                </td>
                <td className="py-3 px-3 text-right font-mono text-amber-300 print:text-black">
                  {"Rp " + summary.totalPengeluaran.toLocaleString("id-ID")}
                </td>
                <td className="py-3 px-4 text-right font-mono text-cyan-300 print:text-black text-sm">
                  {"Rp " + summary.saldoAkhir.toLocaleString("id-ID")}
                </td>
                <td className="no-print"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ================= BUKU PEMBANTU PAJAK (REKAPITULASI PEMUNGUTAN PAJAK) ================= */}
        <div className="p-6 bg-slate-950/60 border-t border-slate-800 print:bg-transparent print:border-t-2 print:border-black">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider print:text-black">
                Buku Pembantu Pajak (Rekapitulasi Pemungutan & Penyetoran Pajak LPJ)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 print:text-black">
                Daftar pungutan pajak bendahara atas pengadaan barang/jasa hibah yang wajib disetor ke Kas Negara (NTPN)
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded bg-cyan-950 border border-cyan-800/60 text-cyan-300 font-mono text-xs font-bold print:hidden">
              Total Pungutan: Rp {summary.totalPajakDipungut.toLocaleString("id-ID")}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800 print:bg-transparent print:border print:border-black">
            <div>
              <span className="text-[10px] text-slate-400 block print:text-black">PPN 11%</span>
              <span className="font-mono font-bold text-slate-200 print:text-black text-xs">
                {"Rp " + summary.totalPpn.toLocaleString("id-ID")}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block print:text-black">PPh 21 (Honor/Upah)</span>
              <span className="font-mono font-bold text-slate-200 print:text-black text-xs">
                {"Rp " + summary.totalPph21.toLocaleString("id-ID")}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block print:text-black">PPh 22 (Barang &gt; 2 Jt)</span>
              <span className="font-mono font-bold text-slate-200 print:text-black text-xs">
                {"Rp " + summary.totalPph22.toLocaleString("id-ID")}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block print:text-black">PPh 23 (Sewa/Katering)</span>
              <span className="font-mono font-bold text-slate-200 print:text-black text-xs">
                {"Rp " + summary.totalPph23.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-cyan-950/40 p-2 rounded-lg border border-cyan-800/50 print:bg-transparent print:border-none print:p-0">
              <span className="text-[10px] text-cyan-300 block font-semibold print:text-black">
                Total Setoran Pajak
              </span>
              <span className="font-mono font-bold text-cyan-200 print:text-black text-xs sm:text-sm">
                {"Rp " + summary.totalPajakDipungut.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* ================= BERITA ACARA PENUTUPAN KAS (KAS OPNAME) ================= */}
        <div className="p-6 bg-slate-950/40 border-t border-slate-800 print:bg-transparent print:border-t-2 print:border-black">
          <div className="text-xs text-slate-300 leading-relaxed print:text-black">
            <p className="font-semibold text-slate-200 print:text-black">
              Posisi Kas Akhir Buku Kas Umum per tanggal cetak:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3 p-3 bg-slate-950 rounded-xl border border-slate-800 print:bg-transparent print:border-none print:p-0">
              <div>
                <span className="text-slate-400 print:text-black text-[11px] block">1. Saldo Kas di Bank</span>
                <span className="font-mono font-bold text-slate-200 print:text-black">
                  {"Rp " + summary.saldoAkhir.toLocaleString("id-ID")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 print:text-black text-[11px] block">2. Uang Tunai di Brankas</span>
                <span className="font-mono font-bold text-slate-200 print:text-black">Rp 0</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-black text-[11px] block">3. Total Fisik Kas</span>
                <span className="font-mono font-bold text-emerald-400 print:text-black">
                  {"Rp " + summary.saldoAkhir.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          {/* Tanda Tangan Formal 2 Pihak */}
          <div className="grid grid-cols-2 gap-8 text-center mt-8 pt-4">
            <div>
              <p className="text-[11px] text-slate-400 print:text-black">Setuju / Mengetahui</p>
              <p className="text-xs font-semibold text-slate-200 print:text-black">
                Ketua {institutionName}
              </p>
              <div className="h-16 flex items-end justify-center">
                <span className="text-xs font-bold text-slate-100 uppercase underline tracking-wider print:text-black">
                  {leaderName}
                </span>
              </div>
            </div>

            <div>
              <p className="text-[11px] text-slate-400 print:text-black">
                Dibuat Oleh:
              </p>
              <p className="text-xs font-semibold text-slate-200 print:text-black">
                Bendahara Pengeluaran
              </p>
              <div className="h-16 flex items-end justify-center">
                <span className="text-xs font-bold text-slate-100 uppercase underline tracking-wider print:text-black">
                  {treasurerName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
