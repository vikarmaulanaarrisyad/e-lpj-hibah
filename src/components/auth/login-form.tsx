"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/app/actions/auth.action";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
  UserCheck,
  ArrowRight,
  Calculator,
  FileCheck,
  BadgeCheck,
  Sparkles,
  HelpCircle,
} from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [activeDemo, setActiveDemo] = useState<"ADMIN" | "USER" | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Preload remembered email if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("elpj_remembered_email");
      if (savedEmail) {
        setValue("email", savedEmail, { shouldValidate: false });
      }
    }
  }, [setValue]);

  const onSubmit = (values: LoginInput) => {
    setServerError(null);
    setServerSuccess(null);

    if (rememberMe && typeof window !== "undefined") {
      localStorage.setItem("elpj_remembered_email", values.email);
    } else if (typeof window !== "undefined") {
      localStorage.removeItem("elpj_remembered_email");
    }

    startTransition(async () => {
      try {
        const response = await loginAction(values);

        if (!response.success) {
          setServerError(response.message);
          return;
        }

        setServerSuccess(response.message);

        // Smooth redirect to target URL based on user role
        const targetUrl = response.data?.redirectUrl || "/";
        setTimeout(() => {
          router.push(targetUrl);
          router.refresh();
        }, 750);
      } catch (err) {
        console.error("Login client error:", err);
        setServerError("Terjadi gangguan jaringan saat memverifikasi kredensial. Silakan periksa koneksi internet Anda.");
      }
    });
  };

  // Helper to autofill demo credentials with visual feedback
  const fillDemoAccount = (role: "ADMIN" | "USER") => {
    setServerError(null);
    setServerSuccess(null);
    setActiveDemo(role);

    if (role === "ADMIN") {
      setValue("email", "superadmin@hibah.internal", { shouldValidate: true });
      setValue("password", "Admin123!", { shouldValidate: true });
    } else {
      setValue("email", "user@hibah.internal", { shouldValidate: true });
      setValue("password", "User123!", { shouldValidate: true });
    }
  };

  // Modal bantuan pemulihan sandi yang profesional
  const handleForgotPassword = () => {
    Swal.fire({
      icon: "info",
      title: "Bantuan Pemulihan Kata Sandi",
      html: `
        <div class="text-left space-y-3 text-xs sm:text-sm text-slate-300">
          <p>Untuk menjamin keamanan & kepatuhan regulasi hibah daerah, pengaturan ulang sandi diproses oleh Tim Verifikator / Administrator Sistem.</p>
          <div class="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1.5 font-sans text-xs">
            <p class="text-emerald-400 font-semibold flex items-center gap-1.5">
              <span>🏛️</span> Layanan Pengelolaan Hibah Daerah:
            </p>
            <p class="text-slate-300">📧 Surel: <span class="text-white font-mono">admin@hibah.internal</span></p>
            <p class="text-slate-300">📞 Helpdesk: <span class="text-white font-mono">0856-4271-9869 (WhatsApp / Telp)</span></p>
            <p class="text-slate-400 text-[11px]">🕒 Jam Layanan: Senin - Jumat (08.00 - 16.00 WIB)</p>
          </div>
          <p class="text-slate-400 text-xs">Atau gunakan akun uji coba dengan menekan tombol <b>Uji Coba Akun Demo</b> pada formulir.</p>
        </div>
      `,
      confirmButtonText: "Mengerti",
      confirmButtonColor: "#047857",
      background: "#0f172a",
      color: "#f8fafc",
      customClass: {
        popup: "rounded-3xl border border-slate-800 shadow-2xl",
        title: "text-base sm:text-lg font-bold text-white",
        confirmButton: "px-6 py-2.5 rounded-xl font-medium text-sm transition-all",
      },
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
      {/* Sisi Kiri: Hero Branding & Nilai Tambah Sistem (Desktop Showcase) */}
      <div className="lg:col-span-6 xl:col-span-7 space-y-8">
        {/* Brand Crest & Official Tag */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-medium backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>PORTAL RESMI PENATAUSAHAAN HIBAH DAERAH</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center shadow-glow-emerald border border-emerald-400/30 shrink-0">
              <ShieldCheck className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                E-LPJ <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">Hibah 2026</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                Pemerintah Daerah • Badan Pengelolaan Keuangan & Aset Daerah
              </p>
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            Sistem terintegrasi untuk penyusunan Buku Kas Umum (BKU), kwitansi belanja, pemotongan pajak otomatis, Surat Pesanan, Berita Acara (BAST), serta dokumentasi fisik terstandarisasi.
          </p>
        </div>

        {/* 3 Kartu Keunggulan Sistem */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          {/* Card 1 */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/90 backdrop-blur-md hover:border-emerald-500/40 transition-all group">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Calculator className="w-5 h-5" />
            </div>
            <h2 className="text-xs font-bold text-white mb-1">BKU & Pajak Otomatis</h2>
            <p className="text-[11px] text-slate-400 leading-normal">
              Kalkulasi PPN & PPh 21, 22, 23 otomatis sesuai ketentuan perundang-undangan.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/90 backdrop-blur-md hover:border-teal-500/40 transition-all group">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xs font-bold text-white mb-1">SP & BAST Siap Cetak</h2>
            <p className="text-[11px] text-slate-400 leading-normal">
              Format baku pengadaan barang/jasa standar BPKAD & Inspektorat Daerah.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/90 backdrop-blur-md hover:border-amber-500/40 transition-all group">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xs font-bold text-white mb-1">Audit Trail & Dokumen F4</h2>
            <p className="text-[11px] text-slate-400 leading-normal">
              Susun lembar foto dokumentasi siap cetak kertas F4 / Folio lengkap tanda tangan.
            </p>
          </div>
        </div>

        {/* Live Trust Metrics & Compliance Badge */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Server Keuangan: <strong className="text-slate-200">Online & Aktif</strong></span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>🛡️ Enkripsi SSL 256-Bit</span>
            <span>🏛️ Permendagri No. 77</span>
            <span>📑 Standar SAP 2026</span>
          </div>
        </div>
      </div>

      {/* Sisi Kanan: Modern Card Login Form */}
      <div className="lg:col-span-6 xl:col-span-5">
        <div className="bg-slate-900/85 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 lg:p-9 shadow-2xl shadow-black/60 relative overflow-hidden">
          {/* Top Decorative Gradient Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500" />

          {/* Form Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Masuk ke Akun
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold tracking-wide uppercase">
                Aman & Terenkripsi
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Gunakan email kedinasan atau akun lembaga penerima terdaftar.
            </p>
          </div>

          {/* Server Feedback Banners */}
          {serverError && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-950/60 border border-red-800/70 text-red-200 flex items-start gap-3 text-xs sm:text-sm animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{serverError}</div>
            </div>
          )}

          {serverSuccess && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-700/70 text-emerald-200 flex items-start gap-3 text-xs sm:text-sm animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{serverSuccess}</div>
            </div>
          )}

          {/* Quick Demo Accounts Selection */}
          <div className="mb-6 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Uji Coba Akun Demo (1-Klik)
              </span>
              <span className="text-[10px] text-slate-500">Pilih Role</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Button Demo Super Admin */}
              <button
                type="button"
                disabled={isPending}
                onClick={() => fillDemoAccount("ADMIN")}
                className={`p-2.5 rounded-xl border text-left transition-all duration-200 group flex flex-col justify-between ${
                  activeDemo === "ADMIN"
                    ? "bg-emerald-950/70 border-emerald-500 text-white shadow-sm"
                    : "bg-slate-900/90 border-slate-800 hover:border-emerald-600/50 text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    Super Admin
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    Auditor
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 truncate">
                  superadmin@hibah.internal
                </p>
              </button>

              {/* Button Demo Penerima Hibah */}
              <button
                type="button"
                disabled={isPending}
                onClick={() => fillDemoAccount("USER")}
                className={`p-2.5 rounded-xl border text-left transition-all duration-200 group flex flex-col justify-between ${
                  activeDemo === "USER"
                    ? "bg-amber-950/70 border-amber-500 text-white shadow-sm"
                    : "bg-slate-900/90 border-slate-800 hover:border-amber-600/50 text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    Penerima Hibah
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                    Lembaga
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 truncate">
                  user@hibah.internal
                </p>
              </button>
            </div>
          </div>

          {/* Form Login */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Alamat Email Akun
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="nama@hibah.internal"
                  autoComplete="email"
                  disabled={isPending}
                  {...register("email")}
                  className={`w-full pl-10 pr-4 py-3 bg-slate-950/90 border rounded-xl text-sm text-slate-100 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 disabled:opacity-50 ${
                    errors.email
                      ? "border-red-500/80 focus:ring-red-500"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  Lupa sandi?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan kata sandi akun"
                  autoComplete="current-password"
                  disabled={isPending}
                  {...register("password")}
                  className={`w-full pl-10 pr-11 py-3 bg-slate-950/90 border rounded-xl text-sm text-slate-100 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 disabled:opacity-50 ${
                    errors.password
                      ? "border-red-500/80 focus:ring-red-500"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isPending}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? "Sembunyikan sandi" : "Lihat sandi"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Checkbox Ingat Saya */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900"
                />
                <span className="text-xs text-slate-400 hover:text-slate-300">
                  Ingat email di perangkat ini
                </span>
              </label>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-3.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 hover:shadow-emerald-900/80 border border-emerald-400/20 disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                  <span>Memverifikasi Kredensial...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Register Banner */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400">
              Belum memiliki akun lembaga penerima?{" "}
              <Link
                href="/register"
                className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1 ml-1"
              >
                <span>Daftar Akun Baru</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Security Note */}
        <p className="text-center text-[11px] text-slate-500 mt-4">
          © 2026 E-LPJ Hibah Daerah • Inspektorat & BPKAD Penatausahaan Keuangan
        </p>
      </div>
    </div>
  );
}
