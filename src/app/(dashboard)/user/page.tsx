import { authService } from "@/services/auth.service";
import { rabService } from "@/services/rab.service";
import { receiptRepository } from "@/repositories/receipt.repository";
import { bastRepository } from "@/repositories/bast.repository";
import { pesananRepository } from "@/repositories/pesanan.repository";
import { institutionService } from "@/services/institution.service";
import { bkuService } from "@/services/bku.service";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import {
  Building2,
  UploadCloud,
  FileText,
  Wallet,
  BookOpen,
  Layers,
  ShieldCheck,
  ArrowRight,
  FileCheck,
  ShoppingBag,
} from "lucide-react";

export default async function UserDashboardPage() {
  const session = await authService.getSession();

  if (!session || session.role !== "USER") {
    redirect("/login");
  }

  // Fetch real-time metrics and institution profile from database
  const [rabRes, receiptsCount, bkuRes, bastCount, pesananCount, profileRes] = await Promise.all([
    rabService.getRabStatus(session.sub),
    receiptRepository.countByUserId(session.sub),
    bkuService.getBkuLedger(session.sub),
    bastRepository.countByUserId(session.sub),
    pesananRepository.countByUserId(session.sub),
    institutionService.getProfile(session.sub),
  ]);

  const profile = profileRes.data || null;
  const rabSummary = rabRes.data;
  const bkuSummary = bkuRes.data?.summary;

  const totalAnggaran = rabSummary?.totalAnggaran || 25000000;
  const totalRealisasi = rabSummary?.totalRealisasi || bkuSummary?.totalPengeluaran || 0;
  const persentaseSerapan =
    totalAnggaran > 0 ? Math.round((totalRealisasi / totalAnggaran) * 1000) / 10 : 0;
  const totalSisaPagu = totalAnggaran - totalRealisasi;

  const formatRupiah = (val: number) => "Rp " + Math.round(val).toLocaleString("id-ID");

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 p-6 lg:p-10">
      {/* Top Navbar */}
      <header className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Building2 className="w-6 h-6 text-[#D97706]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              E-LPJ Hibah
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-950 border border-amber-700/60 text-amber-300">
                Penerima Hibah
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Portal Pertanggungjawaban Keuangan & Pengawasan Pagu Anggaran
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-200">{session.name}</p>
            <p className="text-xs text-slate-400">{session.email}</p>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto mt-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-[#D97706]/15 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-700/40 text-amber-300 text-xs font-medium mb-3">
              <Building2 className="w-3.5 h-3.5" />
              Lembaga Penerima Terdaftar
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Selamat Datang, {session.name}
            </h2>
            <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
              Gunakan portal ini untuk mencatat bukti kwitansi riil, mengawasi sisa pagu RAB agar tidak terjadi defisit, menghitung potongan pajak otomatis (PPh & PPN), serta menyusun Buku Kas Umum (BKU) siap cetak.
            </p>

            <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-400">
              <div className="bg-slate-950/60 px-3.5 py-2 rounded-lg border border-slate-800">
                <span className="text-slate-500">Lembaga:</span>{" "}
                <span className="text-slate-200 font-medium">
                  {profile?.subNama
                    ? `${profile.namaLembaga} ${profile.subNama}`
                    : session.institution || "PR Fatayat NU Dawuhan Selatan"}
                </span>
              </div>
              <div className="bg-slate-950/60 px-3.5 py-2 rounded-lg border border-slate-800">
                <span className="text-slate-500">No. Registrasi:</span>{" "}
                <span className="font-mono text-amber-300 font-semibold">
                  {profile?.noRegistrasi || "HBH-2026-NU-0428"}
                </span>
              </div>
              <div className="bg-slate-950/60 px-3.5 py-2 rounded-lg border border-slate-800">
                <span className="text-slate-500">Kontak:</span>{" "}
                <span className="font-mono text-slate-300">
                  {profile?.noHp || "085642719869"}
                </span>
              </div>
              <div className="bg-slate-950/60 px-3.5 py-2 rounded-lg border border-slate-800">
                <span className="text-slate-500">Kop & Logo:</span>{" "}
                <span className="font-mono text-emerald-400 font-semibold">
                  {profile?.logoUrl ? "Cloudinary Aktif" : "Default Vector"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Live Stat Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Alokasi Dana NPHD</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-3 font-mono">
              {formatRupiah(totalAnggaran)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total Pagu RAB yang Ditetapkan</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Realisasi Belanja</span>
              <FileText className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-300 mt-3 font-mono">
              {formatRupiah(totalRealisasi)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {persentaseSerapan}% dari total anggaran (Sisa: {formatRupiah(totalSisaPagu)})
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Kwitansi Tercatat</span>
              <UploadCloud className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-3 font-mono">
              {receiptsCount} Dokumen
            </p>
            <p className="text-xs text-slate-500 mt-1">Format otentik blanko resmi kas negara</p>
          </div>
        </div>

        {/* Action Module Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {/* Card 1: Kwitansi */}
          <Link
            href="/user/kwitansi"
            className="group p-5 sm:p-6 bg-gradient-to-br from-slate-900 to-emerald-950/40 hover:to-emerald-900/40 border border-slate-800 hover:border-emerald-600/60 rounded-2xl transition-all shadow-xl flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-brand-primary/30 border border-brand-primary/50 text-emerald-400 flex items-center justify-center shrink-0 shadow-glow group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6 text-[#047857]" />
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-semibold">
                  Generator
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors mt-4">
                Generator Kwitansi
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Format kas negara baku, terbilang otomatis, deteksi materai, dan kalkulator pajak PPh/PPN.
              </p>
            </div>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform pt-2 border-t border-slate-800/80">
              <span>Buka Kwitansi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 2: Kontrol Pagu RAB */}
          <Link
            href="/user/rab"
            className="group p-5 sm:p-6 bg-gradient-to-br from-slate-900 to-amber-950/30 hover:to-amber-900/30 border border-slate-800 hover:border-amber-600/60 rounded-2xl transition-all shadow-xl flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-700/50 text-amber-400 flex items-center justify-center shrink-0 shadow-glow group-hover:scale-105 transition-transform">
                  <Layers className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-950 border border-amber-700/60 text-amber-300 font-semibold">
                  Anti-Defisit
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors mt-4">
                Kontrol Pagu RAB
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Pantau serapan per rekening (5.2.1 s/d 5.2.4), batas pagu NPHD, dan proteksi over-budget.
              </p>
            </div>
            <div className="text-xs font-semibold text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform pt-2 border-t border-slate-800/80">
              <span>Buka Kontrol Pagu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 3: Surat Pesanan (SP) */}
          <Link
            href="/user/pesanan"
            className="group p-5 sm:p-6 bg-gradient-to-br from-slate-900 to-teal-950/40 hover:to-teal-900/40 border border-slate-800 hover:border-teal-600/60 rounded-2xl transition-all shadow-xl flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-teal-950/70 border border-teal-700/50 text-teal-300 flex items-center justify-center shrink-0 shadow-glow group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-6 h-6 text-teal-300" />
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-teal-950 border border-teal-700/60 text-teal-300 font-semibold">
                  {pesananCount} Surat
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition-colors mt-4">
                Surat Pesanan (SP)
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Purchase Order resmi pengadaan barang & jasa, 6 klausul kontrak baku, tabel kalkulasi harga, & TTE.
              </p>
            </div>
            <div className="text-xs font-semibold text-teal-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform pt-2 border-t border-slate-800/80">
              <span>Buka Surat Pesanan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 4: Berita Acara Serah Terima (BAST) */}
          <Link
            href="/user/bast"
            className="group p-5 sm:p-6 bg-gradient-to-br from-slate-900 to-[#004532]/50 hover:to-[#006c4e]/50 border border-slate-800 hover:border-[#006c4e] rounded-2xl transition-all shadow-xl flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#004532]/80 border border-[#006c4e] text-emerald-300 flex items-center justify-center shrink-0 shadow-glow group-hover:scale-105 transition-transform">
                  <FileCheck className="w-6 h-6 text-[#97f5cc]" />
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-[#004532] border border-[#006c4e] text-[#97f5cc] font-semibold">
                  {bastCount} Arsip
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors mt-4">
                Berita Acara (BAST)
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Administrasi serah terima hasil pengadaan barang/sarana, terbilang resmi, uji fungsi, & 4 pilar audit.
              </p>
            </div>
            <div className="text-xs font-semibold text-[#97f5cc] flex items-center gap-1 group-hover:translate-x-1 transition-transform pt-2 border-t border-slate-800/80">
              <span>Buka BAST Barang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 5: BKU & SPJ */}
          <Link
            href="/user/bku"
            className="group p-5 sm:p-6 bg-gradient-to-br from-slate-900 to-cyan-950/30 hover:to-cyan-900/30 border border-slate-800 hover:border-cyan-600/60 rounded-2xl transition-all shadow-xl flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-700/50 text-cyan-400 flex items-center justify-center shrink-0 shadow-glow group-hover:scale-105 transition-transform">
                  <BookOpen className="w-6 h-6 text-cyan-400" />
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300 font-semibold">
                  Otomatis
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors mt-4">
                Buku Kas Umum (BKU)
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Pembukuan kronologis debet/kredit, saldo berjalan, Kas Opname, dan Pembantu Pajak.
              </p>
            </div>
            <div className="text-xs font-semibold text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform pt-2 border-t border-slate-800/80">
              <span>Buka Buku Kas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
