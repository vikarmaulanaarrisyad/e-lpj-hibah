import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Pendaftaran Lembaga Penerima | E-LPJ Hibah Daerah 2026",
  description:
    "Pendaftaran akun mandiri untuk organisasi, yayasan, pokmas, dan lembaga penerima dana hibah daerah.",
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#0B1120] relative overflow-hidden">
      {/* Ambient background glow & lighting */}
      <div className="absolute -top-40 -left-40 w-[550px] h-[550px] bg-emerald-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-teal-700/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Subtle geometric dot grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto py-6 sm:py-10">
        <RegisterForm />
      </div>
    </main>
  );
}
