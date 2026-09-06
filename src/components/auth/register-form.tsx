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
  Sparkles,
} from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    if (!pass) return { label: "", score: 0, color: "" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { label: "Sangat Lemah", score: 25, color: "bg-red-500" };
    if (score === 2) return { label: "Cukup", score: 50, color: "bg-amber-500" };
    if (score === 3) return { label: "Kuat", score: 75, color: "bg-emerald-500" };
    return { label: "Sangat Kuat", score: 100, color: "bg-emerald-400" };
  };

  const strength = getPasswordStrength(passwordValue);

  const onSubmit = (values: RegisterInput) => {
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

        // Auto-redirect to dashboard
        const targetUrl = response.data?.redirectUrl || "/user";
        setTimeout(() => {
          router.push(targetUrl);
          router.refresh();
        }, 1000);
      } catch (err) {
        console.error("Register client error:", err);
        setServerError("Terjadi kesalahan jaringan. Silakan periksa koneksi Anda.");
      }
    });
  };

  // Helper to fill sample organization data for testing
  const fillSampleOrganization = () => {
    setServerError(null);
    setServerSuccess(null);
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setValue("institution", "PR Fatayat NU Dawuhan Selatan", { shouldValidate: true });
    setValue("leaderName", "Heni Fujiati", { shouldValidate: true });
    setValue("name", "Nur Alimah", { shouldValidate: true });
    setValue("email", `fatayat.dawuhan${randomSuffix}@hibah.id`, { shouldValidate: true });
    setValue("nip", `HBH-2026-NU-0${randomSuffix}`, { shouldValidate: true });
    setValue("password", "FatayatNU2026!", { shouldValidate: true });
    setValue("confirmPassword", "FatayatNU2026!", { shouldValidate: true });
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-primary/20 border border-brand-primary/40 text-emerald-400 mb-3 shadow-glow">
          <ShieldCheck className="w-8 h-8 text-[#047857]" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-xs font-medium mb-2">
          <Building2 className="w-3.5 h-3.5 text-amber-400" />
          Pendaftaran Lembaga Penerima Hibah
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Registrasi Akun Baru
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Daftarkan lembaga atau organisasi Anda untuk mulai mengelola bukti kas, kwitansi LPJ, dan Buku Kas Umum (BKU).
        </p>
      </div>

      {/* Card Container */}
      <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative edge */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600" />

        {/* Server Success Alert */}
        {serverSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 flex items-start gap-3 text-xs sm:text-sm animate-in fade-in slide-in-from-top duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-200">{serverSuccess}</p>
              <p className="text-xs text-emerald-400/90 mt-0.5">
                Membuat sesi login terenkripsi dan mengarahkan ke dashboard...
              </p>
            </div>
          </div>
        )}

        {/* Server Error Alert */}
        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-800/60 text-red-300 flex items-start gap-3 text-xs sm:text-sm animate-in fade-in slide-in-from-top duration-200">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-200">Pendaftaran Tidak Dapat Diproses</p>
              <p className="text-xs text-red-300/90 mt-0.5">{serverError}</p>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nama Lembaga / Ormas */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nama Lembaga / Ormas / Yayasan Penerima Hibah <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Building2 className="w-4 h-4" />
              </div>
              <input
                {...register("institution")}
                type="text"
                disabled={isPending}
                placeholder="Contoh: PR Fatayat NU Dawuhan Selatan"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
              />
            </div>
            {errors.institution && (
              <p className="mt-1 text-xs text-red-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.institution.message}
              </p>
            )}
          </div>

          {/* Grid 2 Kolom: Nama Ketua & Nama Bendahara */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nama Ketua Lembaga */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nama Ketua Lembaga (Setuju Dibayar) <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  {...register("leaderName")}
                  type="text"
                  disabled={isPending}
                  placeholder="Contoh: Heni Fujiati"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
                />
              </div>
              {errors.leaderName && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.leaderName.message}
                </p>
              )}
            </div>

            {/* Nama Penanggung Jawab / Bendahara */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nama Bendahara (Lunas Dibayar) <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  {...register("name")}
                  type="text"
                  disabled={isPending}
                  placeholder="Contoh: Nur Alimah"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>

          {/* Grid 2 Kolom: Email & No Registrasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Alamat Email Resmi Lembaga <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  {...register("email")}
                  type="email"
                  disabled={isPending}
                  placeholder="lembaga@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Nomor Registrasi / SK Lembaga (Opsional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                No. Registrasi / SK Hibah <span className="text-slate-500 text-[11px] font-normal">(Opsional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <input
                  {...register("nip")}
                  type="text"
                  disabled={isPending}
                  placeholder="HBH-2026-NU-0428"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50 font-mono"
                />
              </div>
              {errors.nip && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.nip.message}
                </p>
              )}
            </div>
          </div>

          {/* Grid 2 Kolom: Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kata Sandi <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  disabled={isPending}
                  placeholder="Min. 6 karakter"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Konfirmasi Kata Sandi <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  {...register("confirmPassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  disabled={isPending}
                  placeholder="Ulangi kata sandi"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          {/* Password Strength Bar */}
          {passwordValue.length > 0 && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Kekuatan Kata Sandi:</span>
                <span className="font-semibold text-slate-300">{strength.label}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.color} transition-all duration-300`}
                  style={{ width: `${strength.score}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 py-3 px-4 bg-brand-primary hover:bg-brand-secondary active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/70 border border-emerald-600/30 disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                <span>Mendaftarkan Akun Lembaga...</span>
              </>
            ) : (
              <>
                <span>Daftarkan Akun Penerima Hibah</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Demo Helper: Quick Sample Fill */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Memudahkan Uji Coba Formulir:
          </span>
          <button
            type="button"
            onClick={fillSampleOrganization}
            disabled={isPending}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-800/40 hover:bg-amber-900/40"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            Isi Contoh Lembaga Baru
          </button>
        </div>
      </div>

      {/* Link to Login */}
      <div className="mt-6 text-center text-xs text-slate-400">
        Sudah memiliki akun lembaga terdaftar?{" "}
        <Link
          href="/login"
          className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors underline underline-offset-4"
        >
          Masuk ke Sistem LPJ
        </Link>
      </div>

      {/* Security notice */}
      <div className="mt-6 text-center text-[11px] text-slate-600 space-y-1">
        <p>© 2026 E-LPJ Hibah Internal • Biro Kesejahteraan Rakyat & Setda</p>
        <p>Data dilindungi dengan enkripsi kata sandi standar bcrypt & JWT HttpOnly cookie.</p>
      </div>
    </div>
  );
}
