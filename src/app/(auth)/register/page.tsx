import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Pendaftaran Akun Lembaga Penerima | E-LPJ Hibah Internal",
  description:
    "Pendaftaran akun mandiri untuk organisasi, yayasan, dan lembaga penerima dana hibah APBD / internal.",
};

export default function RegisterPage() {
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

      <div className="relative z-10 w-full py-8">
        <RegisterForm />
      </div>
    </main>
  );
}
