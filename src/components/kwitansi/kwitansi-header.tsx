"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

interface KwitansiHeaderProps {
  institution?: string | null;
  userName: string;
  registrationNumber?: string | null;
}

export function KwitansiHeader({
  institution,
  userName,
  registrationNumber,
}: KwitansiHeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    {
      label: "Dashboard",
      href: "/user",
      icon: LayoutDashboard,
      active: pathname === "/user",
    },
    {
      label: "Kontrol Pagu RAB",
      href: "/user/rab",
      icon: Layers,
      active: pathname?.startsWith("/user/rab"),
    },
    {
      label: "Surat Pesanan (SP)",
      href: "/user/pesanan",
      icon: ShoppingBag,
      active: pathname?.startsWith("/user/pesanan"),
    },
    {
      label: "Berita Acara (BAST)",
      href: "/user/bast",
      icon: FileCheck,
      active: pathname?.startsWith("/user/bast"),
    },
    {
      label: "Generator Kwitansi",
      href: "/user/kwitansi",
      icon: FileText,
      active: pathname?.startsWith("/user/kwitansi"),
    },
    {
      label: "Buku Kas Umum (BKU)",
      href: "/user/bku",
      icon: BookOpen,
      active: pathname?.startsWith("/user/bku"),
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md">
      <div className="h-16 sm:h-20 w-full px-3 sm:px-8 mx-auto flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand & Organization Identity */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <Link href="/user" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-primary/30 border border-brand-primary/50 flex items-center justify-center text-emerald-400 shadow-glow group-hover:scale-105 transition-transform shrink-0">
              <ReceiptText className="w-5 h-5 sm:w-6 sm:h-6 text-[#047857]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                  E-LPJ Hibah
                </span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[10px] sm:text-[11px] font-semibold">
                  TA 2026
                </span>
              </div>
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium line-clamp-1">
                Sistem Pertanggungjawaban Keuangan
              </span>
            </div>
          </Link>

          {/* Institution Badge (Desktop xl) */}
          <div className="hidden xl:flex flex-col border-l border-slate-800 pl-6">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200 truncate max-w-xs">
                {institution || "PR Fatayat NU Dawuhan Selatan"}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-medium border border-emerald-800/40">
                Hibah Aktif
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              No. Registrasi: {registrationNumber || "HBH-2026-NU-0428"}
            </span>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-950/80 border border-slate-800 p-1.5 rounded-xl text-xs">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
                link.active
                  ? "bg-brand-primary text-white font-semibold shadow-md border border-emerald-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all font-medium flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Bundel</span>
          </button>
        </nav>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-200 leading-tight">
              {userName}
            </span>
            <span className="text-[11px] text-slate-400">
              Bendahara Pengeluaran
            </span>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-brand-primary/40 border border-brand-primary/60 flex items-center justify-center text-emerald-300 shrink-0">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>

          <div className="hidden sm:block">
            <LogoutButton />
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors focus:outline-none"
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
        <div className="lg:hidden w-full bg-slate-950/98 border-b border-slate-800 px-4 py-5 shadow-2xl animate-fade-in">
          {/* Mobile Institution Info Banner */}
          <div className="mb-4 p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0">
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
              Aktif
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
      )}
    </header>
  );
}
