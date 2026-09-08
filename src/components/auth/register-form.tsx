"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { registerAction } from "@/app/actions/auth.action";
import {
  ShieldCheck,
  Building2,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  FileCheck2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  FileText,
  BadgeCheck,
  HelpCircle,
} from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      institution: "",
      leaderName: "",
      email: "",
      nip: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password") || "";

  // Password strength helper
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: "", score: 0, color: "", width: "w-0" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { label: "Sangat Lemah", score: 25, color: "bg-red-500", width: "w-1/4" };
    if (score === 2) return { label: "Cukup", score: 50, color: "bg-amber-500", width: "w-2/4" };
    if (score === 3) return { label: "Kuat", score: 75, color: "bg-teal-500", width: "w-3/4" };
    return { label: "Sangat Kuat", score: 100, color: "bg-emerald-400", width: "w-full" };
  };

  const strength = getPasswordStrength(passwordValue);

  const onSubmit = (values: RegisterInput) => {
    if (!agreementChecked) {
      setServerError("Anda harus menyetujui pernyataan keabsahan data sebelum melanjutkan pendaftaran.");
      return;
    }

    setServerError(null);
    setServerSuccess(null);

    startTransition(async () => {
      try {
        const response = await registerAction(values);

        if (!response.success) {
          setServerError(response.message);
          return;
        }

        setServerSuccess(response.message);

        // Auto-redirect to user dashboard
        const targetUrl = response.data?.redirectUrl || "/user";
        setTimeout(() => {
          router.push(targetUrl);
          router.refresh();
        }, 900);
      } catch (err) {
        console.error("Register client error:", err);
        setServerError("Terjadi gangguan jaringan saat memproses pendaftaran. Silakan coba beberapa saat lagi.");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      {/* Sisi Kiri: Panduan & Alur Pendaftaran Lembaga (Desktop Showcase) */}
      <div className="lg:col-span-5 space-y-7 lg:sticky lg:top-8">
        {/* Brand Crest & Tag */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-medium backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>PENDAFTARAN MANDIRI LEMBAGA HIBAH</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center shadow-glow-emerald border border-emerald-400/30 shrink-0">
              <Building2 className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                Registrasi Akun <span className="bg-gradient-to-r from-emerald-400 to-amber-300 bg-clip-text text-transparent">Lembaga</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Penerima Bantuan Hibah APBD Tahun Anggaran 2026
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Daftarkan organisasi masyarakat, yayasan, kelompok swadaya, atau lembaga keagamaan untuk mendapatkan akses pelaporan dana hibah secara resmi.
          </p>
        </div>

        {/* 3 Langkah Mudah Pendaftaran */}
        <div className="space-y-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/90 backdrop-blur-md flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Identitas Lembaga & Legalitas</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Cantumkan nama lengkap organisasi/instansi dan nomor NPHD atau nomor SK yang terdaftar.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/90 backdrop-blur-md flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Pimpinan & Pengelola Keuangan</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Cantumkan nama Ketua Lembaga (penandatangan berkas) dan Bendahara akun pengelola.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/90 backdrop-blur-md flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Langsung Kelola Dokumen LPJ</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Setelah pendaftaran berhasil, Anda langsung dapat menyusun Kwitansi, BAST, SP, dan BKU.
              </p>
            </div>
          </div>
        </div>

        {/* Catatan Penting Regulasi */}
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200/90 flex items-start gap-3">
          <BadgeCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-300">Penting untuk Diperhatikan:</p>
            <p className="text-[11px] text-amber-200/80 leading-normal">
              Pastikan nama lembaga sama persis dengan yang tertera pada rekening koran dan berkas NPHD yang telah ditandatangani bersama Pemerintah Daerah.
            </p>
          </div>
        </div>
      </div>

      {/* Sisi Kanan: Formulir Pendaftaran Interaktif */}
      <div className="lg:col-span-7">
        <div className="bg-slate-900/85 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 lg:p-9 shadow-2xl shadow-black/60 relative overflow-hidden">
          {/* Top Decorative Gradient Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500" />

          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Formulir Pendaftaran
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Lengkapi seluruh formulir di bawah ini dengan data yang sah.
            </p>
          </div>

          {/* Server Error / Success Banners */}
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* ======================================================== */}
            {/* BAGIAN 1: IDENTITAS LEMBAGA & LEGALITAS */}
            {/* ======================================================== */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  1. Identitas Lembaga & Legalitas
                </span>
              </div>

              {/* Nama Lembaga */}
              <div>
                <label
                  htmlFor="institution"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Nama Lembaga / Yayasan / Organisasi <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    id="institution"
                    type="text"
                    placeholder="Contoh: PR Fatayat NU Dawuhan Selatan"
                    disabled={isPending}
                    {...register("institution")}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border rounded-xl text-sm text-slate-100 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 disabled:opacity-50 ${
                      errors.institution
                        ? "border-red-500/80 focus:ring-red-500"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  />
                </div>
                {errors.institution && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errors.institution.message}
                  </p>
                )}
              </div>

              {/* Grid: Nomor SK/NPHD & Nama Ketua */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Nomor SK / NPHD / Register */}
                <div>
                  <label
                    htmlFor="nip"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Nomor NPHD / SK / Registrasi
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <input
                      id="nip"
                      type="text"
                      placeholder="NPHD-2026/014"
                      disabled={isPending}
                      {...register("nip")}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Nama Ketua Lembaga */}
                <div>
                  <label
                    htmlFor="leaderName"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Nama Ketua / Pimpinan Lembaga
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <input
                      id="leaderName"
                      type="text"
                      placeholder="Contoh: Heni Fujiati"
                      disabled={isPending}
                      {...register("leaderName")}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* BAGIAN 2: AKUN PENGELOLA & KATA SANDI */}
            {/* ======================================================== */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <User className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  2. Akun Pengelola & Kredensial Akses
                </span>
              </div>

              {/* Grid: Nama Bendahara & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Nama Penanggung Jawab / Bendahara */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Nama Penanggung Jawab / Bendahara <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="name"
                      type="text"
                      placeholder="Contoh: Nur Alimah"
                      disabled={isPending}
                      {...register("name")}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border rounded-xl text-sm text-slate-100 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 disabled:opacity-50 ${
                        errors.name
                          ? "border-red-500/80 focus:ring-red-500"
                          : "border-slate-800 hover:border-slate-700"
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email Login */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Email Resmi Lembaga <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      placeholder="nama@lembaga.org"
                      autoComplete="email"
                      disabled={isPending}
                      {...register("email")}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border rounded-xl text-sm text-slate-100 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 disabled:opacity-50 ${
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
              </div>

              {/* Grid: Kata Sandi & Konfirmasi Sandi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Kata Sandi */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Kata Sandi <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 6 karakter"
                      autoComplete="new-password"
                      disabled={isPending}
                      {...register("password")}
                      className={`w-full pl-10 pr-11 py-2.5 bg-slate-950/90 border rounded-xl text-sm text-slate-100 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 disabled:opacity-50 ${
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

                {/* Konfirmasi Kata Sandi */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Ulangi Kata Sandi <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Ketik ulang kata sandi"
                      autoComplete="new-password"
                      disabled={isPending}
                      {...register("confirmPassword")}
                      className={`w-full pl-10 pr-11 py-2.5 bg-slate-950/90 border rounded-xl text-sm text-slate-100 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 disabled:opacity-50 ${
                        errors.confirmPassword
                          ? "border-red-500/80 focus:ring-red-500"
                          : "border-slate-800 hover:border-slate-700"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isPending}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                      aria-label={showConfirmPassword ? "Sembunyikan sandi" : "Lihat sandi"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Real-time Password Strength Meter */}
              {passwordValue && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Kekuatan Kata Sandi:</span>
                    <span className="font-semibold text-emerald-400">{strength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full ${strength.color} ${strength.width} transition-all duration-300`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Checkbox Pernyataan Keabsahan Data */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreementChecked}
                  onChange={(e) => setAgreementChecked(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900 shrink-0"
                />
                <span className="text-xs text-slate-400 leading-relaxed">
                  Saya menyatakan dengan sebenarnya bahwa data lembaga yang diisikan adalah sah, benar, dan dapat dipertanggungjawabkan di hadapan instansi pemeriksa keuangan.
                </span>
              </label>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isPending || !agreementChecked}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 hover:shadow-emerald-900/80 border border-emerald-400/20 disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                  <span>Mendaftarkan Lembaga & Menyiapkan Akun...</span>
                </>
              ) : (
                <>
                  <span>Daftarkan Lembaga & Masuk ke Dasbor</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login Link */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400">
              Lembaga Anda sudah pernah terdaftar?{" "}
              <Link
                href="/login"
                className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1 ml-1"
              >
                <span>Masuk ke Akun Anda</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Security Note */}
        <p className="text-center text-[11px] text-slate-500 mt-4">
          © 2026 E-LPJ Hibah Daerah • Kerjasama Pemerintah Daerah & Inspektorat
        </p>
      </div>
    </div>
  );
}
