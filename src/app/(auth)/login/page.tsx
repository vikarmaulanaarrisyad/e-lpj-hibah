import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Masuk | E-LPJ Hibah Internal",
  description: "Halaman autentikasi sistem pelaporan dan verifikasi hibah internal.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#0F172A] relative overflow-hidden">
      {/* Subtle background ambient lighting / glow circles */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#065F46]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#D97706]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#047857]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 w-full">
        <LoginForm />
      </div>
    </main>
  );
}
