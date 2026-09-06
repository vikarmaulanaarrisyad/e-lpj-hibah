"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/app/actions/auth.action";
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
} from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
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

  const onSubmit = (values: LoginInput) => {
    setServerError(null);
    setServerSuccess(null);

    startTransition(async () => {
      try {
        const response = await loginAction(values);

        if (!response.success) {
          setServerError(response.message);
          return;
        }

        setServerSuccess(response.message);

        // Smooth redirect to dashboard based on role
        const targetUrl = response.data?.redirectUrl || "/";
        setTimeout(() => {
          router.push(targetUrl);
          router.refresh();
        }, 800);
      } catch (err) {
        console.error("Login client error:", err);
        setServerError("Terjadi kesalahan jaringan. Silakan periksa koneksi Anda.");
      }
    });
  };

  // Helper to autofill demo credentials for testing
  const fillDemoAccount = (role: "ADMIN" | "USER") => {
    setServerError(null);
    setServerSuccess(null);
    if (role === "ADMIN") {
      setValue("email", "admin@hibah.internal", { shouldValidate: true });
      setValue("password", "Admin123!", { shouldValidate: true });
    } else {
      setValue("email", "user@hibah.internal", { shouldValidate: true });
      setValue("password", "User123!", { shouldValidate: true });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-primary/20 border border-brand-primary/40 text-emerald-400 mb-4 shadow-glow">
          <ShieldCheck className="w-9 h-9 text-[#047857]" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/20 border border-brand-primary/30 text-emerald-300 text-xs font-medium mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Sistem Verifikasi Hibah Internal
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          E-LPJ Hibah
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Masuk untuk mengelola dan memverifikasi laporan pertanggungjawaban
        </p>
      </div>

      {/* Main Login Card */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50 relative overflow-hidden">
        {/* Subtle accent border on top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-primary via-emerald-500 to-brand-tertiary"></div>

        {/* Server Notification Banners */}
        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-200 flex items-start gap-3 text-sm animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{serverError}</div>
          </div>
        )}

        {serverSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-200 flex items-start gap-3 text-sm animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{serverSuccess}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email / Username Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
            >
              Email Akun Kedinasan / Lembaga
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
                className={`w-full pl-10 pr-4 py-3 bg-slate-950/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-emerald-500 disabled:opacity-50 ${
                  errors.email
                    ? "border-red-500/80 focus:ring-red-500"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Kata Sandi
              </label>
              <button
                type="button"
                className="text-xs text-brand-tertiary hover:text-amber-400 transition-colors font-medium"
                onClick={() =>
                  alert("Silakan hubungi Super Admin/Sekretariat untuk reset kredensial internal.")
                }
              >
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
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isPending}
                {...register("password")}
                className={`w-full pl-10 pr-11 py-3 bg-slate-950/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-emerald-500 disabled:opacity-50 ${
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
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 px-4 bg-brand-primary hover:bg-brand-secondary active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/70 border border-emerald-600/30 disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                <span>Mengautentikasi...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Sistem</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Demo Accounts Quick-Fill Section */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Uji Coba Akun Demo
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              Dev Mode
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isPending}
              onClick={() => fillDemoAccount("ADMIN")}
              className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-emerald-700/50 text-left transition-all group"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
                <UserCheck className="w-3.5 h-3.5" />
                Super Admin
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                admin@hibah.internal
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                Pass: Admin123!
              </p>
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => fillDemoAccount("USER")}
              className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-amber-700/50 text-left transition-all group"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 group-hover:text-amber-300">
                <Building2 className="w-3.5 h-3.5" />
                Penerima Hibah
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                user@hibah.internal
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                Pass: User123!
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Registration Link */}
      <div className="mt-6 text-center text-xs text-slate-400">
        Belum memiliki akun lembaga penerima?{" "}
        <Link
          href="/register"
          className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors underline underline-offset-4"
        >
          Daftar Akun Baru
        </Link>
      </div>

      {/* Security & System Footer Notice */}
      <div className="mt-8 text-center text-xs text-slate-500 space-y-1">
        <p>© 2026 E-LPJ Hibah Internal. Hak Cipta Dilindungi.</p>
        <p className="text-[11px] text-slate-600">
          Akses terbatas hanya untuk pejabat verifikator dan penerima hibah terdaftar.
        </p>
      </div>
    </div>
  );
}
