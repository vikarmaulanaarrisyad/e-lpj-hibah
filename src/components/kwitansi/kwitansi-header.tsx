"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ReceiptText,
  Building2,
  User,
  Menu,
  X,
  LayoutDashboard,
  Layers,
  FileText,
  BookOpen,
  FileCheck,
  Printer,
  ChevronRight,
  ShoppingBag,
  BookMarked,
  Send,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { KopSuratModal } from "@/components/kop-surat/kop-surat-modal";
import type { InstitutionProfile } from "@/types";

interface KwitansiHeaderProps {
  institution?: string | null;
  userName: string;
  registrationNumber?: string | null;
  initialProfile?: InstitutionProfile | null;
}

export function KwitansiHeader({
  institution,
  userName,
  registrationNumber,
  initialProfile,
}: KwitansiHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isKopModalOpen, setIsKopModalOpen] = useState(false);

  const navLinks = [
    {
      label: "Dashboard",
      shortLabel: "Dashboard",
      href: "/user",
      icon: LayoutDashboard,
      active: pathname === "/user",
    },
    {
      label: "Cover LPJ",
      shortLabel: "Cover",
      href: "/user/cover",
      icon: BookMarked,
      active: pathname?.startsWith("/user/cover"),
    },
    {
      label: "Surat Pengantar",
      shortLabel: "Pengantar",
      href: "/user/surat-pengantar",
      icon: Send,
      active: pathname?.startsWith("/user/surat-pengantar"),
    },
    {
      label: "Kontrol Pagu RAB",
      shortLabel: "Pagu RAB",
      href: "/user/rab",
      icon: Layers,
      active: pathname?.startsWith("/user/rab"),
    },
    {
      label: "Surat Pesanan (SP)",
      shortLabel: "Pesanan (SP)",
      href: "/user/pesanan",
      icon: ShoppingBag,
      active: pathname?.startsWith("/user/pesanan"),
    },
    {
      label: "Berita Acara (BAST)",
      shortLabel: "BAST",
      href: "/user/bast",
      icon: FileCheck,
      active: pathname?.startsWith("/user/bast"),
    },
    {
      label: "Generator Kwitansi",
      shortLabel: "Kwitansi",
      href: "/user/kwitansi",
      icon: FileText,
      active: pathname?.startsWith("/user/kwitansi"),
    },
    {
      label: "Buku Kas Umum (BKU)",
      shortLabel: "BKU",
      href: "/user/bku",
      icon: BookOpen,
      active: pathname?.startsWith("/user/bku"),
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md">
      <div className="h-16 sm:h-20 w-full max-w-[1920px] px-3 sm:px-6 xl:px-8 mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* ================= Brand & Organization Identity ================= */}
        <div className="flex items-center gap-2.5 sm:gap-5 shrink-0 min-w-0">
          <Link href="/user" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-brand-primary/30 border border-brand-primary/50 flex items-center justify-center text-emerald-400 shadow-glow group-hover:scale-105 transition-transform shrink-0">
              <ReceiptText className="w-4 h-4 sm:w-5 sm:h-5 text-[#047857]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-xs sm:text-base font-bold text-white tracking-tight whitespace-nowrap">
                  E-LPJ Hibah
                </span>
                <span className="px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[9px] sm:text-[11px] font-semibold">
                  TA 2026
                </span>
              </div>
              <span className="hidden sm:inline text-[10px] sm:text-xs text-slate-400 font-medium line-clamp-1 whitespace-nowrap">
                Sistem Pertanggungjawaban Keuangan
              </span>
            </div>
          </Link>

          {/* Institution Badge: Full on 2xl, compact on xl, tucked into mobile menu below xl */}
          <div className="hidden 2xl:flex flex-col border-l border-slate-800 pl-4 lg:pl-5">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-200 truncate max-w-[240px]">
                {institution || "PR Fatayat NU Dawuhan Selatan"}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-medium border border-emerald-800/40 shrink-0">
                Hibah Aktif
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              No. Registrasi: {registrationNumber || "HBH-2026-NU-0428"}
            </span>
          </div>

          <div className="hidden xl:flex 2xl:hidden flex-col border-l border-slate-800 pl-3 max-w-[140px]">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-200 truncate" title={institution || "PR Fatayat NU"}>
                {institution || "PR Fatayat NU"}
              </span>
            </div>
            <span className="text-[9.5px] text-slate-400 font-mono truncate">
              {registrationNumber || "HBH-2026-NU"}
            </span>
          </div>
        </div>

        {/* ================= Desktop Navigation Tabs (Responsive & Scroll-Safe) ================= */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-950/85 border border-slate-800 p-1 sm:p-1.5 rounded-xl text-xs overflow-x-auto no-scrollbar shrink min-w-0 max-w-full">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-2 2xl:px-3 py-1.5 rounded-lg transition-all font-medium whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                link.active
                  ? "bg-brand-primary text-white font-semibold shadow-md border border-emerald-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <span className="hidden 2xl:inline">{link.label}</span>
              <span className="2xl:hidden">{link.shortLabel}</span>
            </Link>
          ))}

          {/* Kop Lembaga Button */}
          <button
            type="button"
            onClick={() => setIsKopModalOpen(true)}
            className="px-2 2xl:px-3 py-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-900 transition-all font-medium flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            title="Pengaturan Kop Surat, Logo Lembaga, dan Format Penomoran Akun"
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden 2xl:inline">Kop Lembaga</span>
            <span className="hidden xl:inline 2xl:hidden">Kop</span>
          </button>

          {/* Cetak Bundel Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="px-2 2xl:px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all font-medium flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            title="Cetak Dokumen Bundel LPJ"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden 2xl:inline">Cetak Bundel</span>
            <span className="hidden xl:inline 2xl:hidden">Cetak</span>
          </button>
        </nav>

        {/* ================= User Profile & Actions ================= */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden md:flex flex-col text-right max-w-[130px] lg:max-w-[170px]">
            <span className="text-xs font-semibold text-slate-200 leading-tight truncate" title={userName}>
              {userName}
            </span>
            <span className="text-[10px] text-slate-400 truncate">
              Bendahara Pengeluaran
            </span>
          </div>

          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-brand-primary/40 border border-brand-primary/60 flex items-center justify-center text-emerald-300 shrink-0"
            title={userName}
          >
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>

          <div className="hidden sm:block">
            <LogoutButton />
          </div>

          {/* Mobile & Tablet Hamburger Toggle Button (< lg) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors focus:outline-none shrink-0"
            aria-label={isMobileMenuOpen ? "Tutup Menu Navigasi" : "Buka Menu Navigasi"}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-emerald-400" />
            ) : (
              <Menu className="w-5 h-5 text-slate-300" />
            )}
          </button>
        </div>
      </div>

      {/* ================= MOBILE / TABLET SLIDE-DOWN DRAWER MENU ================= */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-16 sm:top-20 bg-slate-950/60 backdrop-blur-xs z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed inset-x-0 top-16 sm:top-20 z-40 lg:hidden w-full bg-slate-950/98 border-b border-slate-800 px-4 py-5 shadow-2xl max-h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-5rem)] overflow-y-auto no-scrollbar animate-fade-in">
            {/* Mobile Institution Info Banner */}
            <div className="mb-4 p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate">
                    {institution || "PR Fatayat NU Dawuhan Selatan"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono truncate">
                    No. Reg: {registrationNumber || "HBH-2026-NU-0428"}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-semibold border border-emerald-800/40 shrink-0">
                Hibah Aktif
              </span>
            </div>

            {/* Navigation Links Grid */}
            <nav className="flex flex-col gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      link.active
                        ? "bg-brand-primary text-white border border-emerald-600/40 shadow-md"
                        : "text-slate-300 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          link.active ? "text-emerald-200" : "text-slate-400"
                        }`}
                      />
                      <span>{link.label}</span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 ${
                        link.active ? "text-emerald-200" : "text-slate-500"
                      }`}
                    />
                  </Link>
                );
              })}

              {/* Button Atur Kop Surat & Format Penomoran */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsKopModalOpen(true);
                }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-amber-300 hover:text-white hover:bg-slate-900 transition-all border border-slate-800 mt-1"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Atur Kop Surat &amp; Format Penomoran</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* Quick Print Button */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  window.print();
                }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-all border border-slate-800 mt-1"
              >
                <div className="flex items-center gap-3">
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Cetak Bundel LPJ</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </nav>

            {/* User Profile & Mobile Logout Strip */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-300">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">{userName}</span>
                  <span className="text-[10px] text-slate-400">
                    Bendahara Pengeluaran Hibah
                  </span>
                </div>
              </div>
              <div className="sm:hidden">
                <LogoutButton />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Pengaturan Kop Surat & Identitas Lembaga Universal */}
      <KopSuratModal
        isOpen={isKopModalOpen}
        onClose={() => setIsKopModalOpen(false)}
        initialProfile={initialProfile}
        onProfileUpdated={() => {
          router.refresh();
        }}
      />
    </header>
  );
}
