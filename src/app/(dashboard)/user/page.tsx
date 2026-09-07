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
import { KopSuratButton } from "@/components/kop-surat/kop-surat-button";
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
  BookMarked,
  Send,
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
    <div className="min-h-screen bg-[#0F172A] text-slate-100 p-4 sm:p-6 lg:p-10">
      {/* Top Navbar */}
      <header className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Building2 className="w-6 h-6 text-[#D97706]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white flex flex-wrap items-center gap-2">
              <span>E-LPJ Hibah</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-950 border border-amber-700/60 text-amber-300">
                Penerima Hibah
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Portal Pertanggungjawaban Keuangan &amp; Pengawasan Pagu Anggaran
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end flex-wrap">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-200">{session.name}</p>
            <p className="text-xs text-slate-400">{session.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <KopSuratButton initialProfile={profile} />
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto mt-8 space-y-8 animate-fade-in">
        {/* Welcome Banner with Dynamic Ambient Glow */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-amber-950/20 bg-[length:200%_200%] animate-gradient-shift border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          {/* Ambient Lighting Orbs */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-float" />
          <div
            className="absolute -left-16 -bottom-16 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-float"
            style={{ animationDelay: "1.8s" }}
          />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-700/50 text-amber-300 text-xs font-medium mb-3 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span>Lembaga Penerima Terdaftar</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Selamat Datang, {session.name}
            </h2>
            <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
              Gunakan portal ini untuk mencatat bukti kwitansi riil, mengawasi sisa pagu RAB agar tidak terjadi defisit, menghitung potongan pajak otomatis (PPh & PPN), serta menyusun Buku Kas Umum (BKU) siap cetak.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5 sm:gap-4 text-xs text-slate-400">
              <div className="bg-slate-950/70 px-3.5 py-2 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors shadow-xs">
                <span className="text-slate-500">Lembaga:</span>{" "}
                <span className="text-slate-200 font-medium">
                  {profile?.subNama
                    ? `${profile.namaLembaga} ${profile.subNama}`
                    : session.institution || "PR Fatayat NU Dawuhan Selatan"}
                </span>
              </div>
              <div className="bg-slate-950/70 px-3.5 py-2 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors shadow-xs">
                <span className="text-slate-500">No. Registrasi:</span>{" "}
                <span className="font-mono text-amber-300 font-semibold">
                  {profile?.noRegistrasi || "HBH-2026-NU-0428"}
                </span>
              </div>
              <div className="bg-slate-950/70 px-3.5 py-2 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors shadow-xs">
                <span className="text-slate-500">Kontak:</span>{" "}
                <span className="font-mono text-slate-300">
                  {profile?.noHp || "085642719869"}
                </span>
              </div>
              <div className="bg-slate-950/70 px-3.5 py-2 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors shadow-xs">
                <span className="text-slate-500">Kop & Logo:</span>{" "}
                <span className="font-mono text-emerald-400 font-semibold">
                  {profile?.logoUrl ? "Cloudinary Aktif" : "Default Vector"}
                </span>
              </div>
              <div className="bg-slate-950/70 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2 shadow-xs">
                <div>
                  <span className="text-slate-500">Format No:</span>{" "}
                  <span className="font-mono text-emerald-300 font-semibold">
                    {profile?.formatNomorSp || "/A/PR.FNU/"}
                  </span>
                </div>
                <KopSuratButton initialProfile={profile} variant="badge" />
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Live Stat Metrics Grid with Dynamic Entrance & Hover Lift */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Metric 1: Alokasi */}
          <div className="card-hover-lift glow-hover-emerald bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Alokasi Dana NPHD</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-3 font-mono tracking-tight">
              {formatRupiah(totalAnggaran)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total Pagu RAB yang Ditetapkan</p>
          </div>

          {/* Metric 2: Realisasi */}
          <div className="card-hover-lift bg-slate-900/80 hover:border-amber-500/50 hover:shadow-glow-amber border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Realisasi Belanja</span>
              <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-300 mt-3 font-mono tracking-tight">
              {formatRupiah(totalRealisasi)}
            </p>
            {/* Visual Serapan Anggaran Bar */}
            <div className="w-full bg-slate-800/90 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-400 h-1.5 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(persentaseSerapan, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center justify-between">
              <span>{persentaseSerapan}% terserap</span>
              <span>Sisa: {formatRupiah(totalSisaPagu)}</span>
            </p>
          </div>

          {/* Metric 3: Kwitansi */}
          <div className="card-hover-lift bg-slate-900/80 hover:border-cyan-500/50 hover:shadow-glow-cyan border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Kwitansi Tercatat</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-700/50 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-3 font-mono tracking-tight">
              {receiptsCount} Dokumen
            </p>
            <p className="text-xs text-slate-500 mt-1">Format otentik blanko resmi kas negara</p>
          </div>
        </div>

        {/* Action Module Cards with Interactive Micro-Animations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {/* Card 1: Sampul Cover LPJ */}
          <Link
            href="/user/cover"
            className="group card-hover-lift p-5 sm:p-6 bg-gradient-to-br from-slate-900 to-indigo-950/30 hover:to-indigo-900/30 border border-slate-800 hover:border-indigo-600/70 rounded-2xl shadow-xl flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-indigo-950/60 border border-indigo-700/50 text-indigo-400 flex items-center justify-center shrink-0 shadow-glow group-hover:scale-110 group-hover:rotate-1 transition-transform duration-300">
                  <BookMarked className="w-6 h-6 text-indigo-400" />
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700/60 text-indigo-300 font-semibold shadow-xs">
                  Halaman ke-1
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors mt-4">
                Sampul Cover LPJ
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Halaman sampul depan LPJ hibah berbingkai ornamen klasik resmi, logo instansi, &amp; siap jilid F4.
              </p>
            </div>
            <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform pt-2 border-t border-slate-800/80">
              <span>Buka Sampul Cover</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 2: Surat Pengantar LPJ */}
          <Link
            href="/user/surat-pengantar"
            className="group card-hover-lift p-5 sm:p-6 bg-gradient-to-br from-slate-900 to-emerald-950/40 hover:to-emerald-900/40 border border-slate-800 hover:border-emerald-600/70 rounded-2xl shadow-xl flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-950/70 border border-emerald-700/50 text-emerald-400 flex items-center justify-center shrink-0 shadow-glow group-hover:scale-110 group-hover:rotate-1 transition-transform duration-300">
                  <Send className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-semibold shadow-xs">
                  Halaman ke-2
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors mt-4">
                Surat Pengantar LPJ
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Surat pengantar resmi kepada Bupati Tegal c.q. Kesra, rincian bantuan hibah, &amp; TTE Ketua.
              </p>
            </div>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform pt-2 border-t border-slate-800/80">
              <span>Buka Surat Pengantar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 3: Generator Kwitansi */}
          <Link
            href="/user/kwitansi"
            className="group card-hover-lift p-5 sm:p-6 bg-gradient-to-br from-slate-900 to-emerald-950/40 hover:to-emerald-900/40 border border-slate-800 hover:border-emerald-600/70 rounded-2xl shadow-xl flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-brand-primary/30 border border-brand-primary/50 text-emerald-400 flex items-center justify-center shrink-0 shadow-glow group-hover:scale-110 group-hover:rotate-1 transition-transform duration-300">
                  <FileText className="w-6 h-6 text-[#047857]" />
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-semibold shadow-xs">
                  {receiptsCount} Kwitansi
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors mt-4">
                Generator Kwitansi
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Format kas negara baku, terbilang otomatis, deteksi materai, dan kalkulator pajak PPh/PPN.
              </p>
            </div>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform pt-2 border-t border-slate-800/80">
              <span>Buka Kwitansi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 4: Kontrol Pagu RAB */}
          <Link
            href="/user/rab"
            className="group card-hover-lift p-5 sm:p-6 bg-gradient-to-br from-slate-900 to-amber-950/30 hover:to-amber-900/30 border border-slate-800 hover:border-amber-600/70 rounded-2xl shadow-xl flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-700/50 text-amber-400 flex items-center justify-center shrink-0 shadow-glow group-hover:scale-110 group-hover:rotate-1 transition-transform duration-300">
                  <Layers className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-950 border border-amber-700/60 text-amber-300 font-semibold shadow-xs">
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
            <div className="text-xs font-semibold text-amber-400 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform pt-2 border-t border-slate-800/80">
              <span>Buka Kontrol Pagu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 5: Surat Pesanan (SP) */}
          <Link
            href="/user/pesanan"
            className="group card-hover-lift p-5 sm:p-6 bg-gradient-to-br from-slate-900 to-teal-950/40 hover:to-teal-900/40 border border-slate-800 hover:border-teal-600/70 rounded-2xl shadow-xl flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-teal-950/70 border border-teal-700/50 text-teal-300 flex items-center justify-center shrink-0 shadow-glow group-hover:scale-110 group-hover:rotate-1 transition-transform duration-300">
                  <ShoppingBag className="w-6 h-6 text-teal-300" />
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-teal-950 border border-teal-700/60 text-teal-300 font-semibold shadow-xs">
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
            <div className="text-xs font-semibold text-teal-400 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform pt-2 border-t border-slate-800/80">
              <span>Buka Surat Pesanan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 6: Berita Acara Serah Terima (BAST) */}
          <Link
            href="/user/bast"
            className="group card-hover-lift p-5 sm:p-6 bg-gradient-to-br from-slate-900 to-[#004532]/50 hover:to-[#006c4e]/50 border border-slate-800 hover:border-[#006c4e] rounded-2xl shadow-xl flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#004532]/80 border border-[#006c4e] text-emerald-300 flex items-center justify-center shrink-0 shadow-glow group-hover:scale-110 group-hover:rotate-1 transition-transform duration-300">
                  <FileCheck className="w-6 h-6 text-[#97f5cc]" />
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-[#004532] border border-[#006c4e] text-[#97f5cc] font-semibold shadow-xs">
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
            <div className="text-xs font-semibold text-[#97f5cc] flex items-center gap-1 group-hover:translate-x-1.5 transition-transform pt-2 border-t border-slate-800/80">
              <span>Buka BAST Barang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 7: BKU & SPJ */}
          <Link
            href="/user/bku"
            className="group card-hover-lift p-5 sm:p-6 bg-gradient-to-br from-slate-900 to-cyan-950/30 hover:to-cyan-900/30 border border-slate-800 hover:border-cyan-600/70 rounded-2xl shadow-xl flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-700/50 text-cyan-400 flex items-center justify-center shrink-0 shadow-glow group-hover:scale-110 group-hover:rotate-1 transition-transform duration-300">
                  <BookOpen className="w-6 h-6 text-cyan-400" />
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300 font-semibold shadow-xs">
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
            <div className="text-xs font-semibold text-cyan-400 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform pt-2 border-t border-slate-800/80">
              <span>Buka Buku Kas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
