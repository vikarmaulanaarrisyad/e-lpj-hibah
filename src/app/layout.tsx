import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "E-LPJ Hibah Internal | Sistem Pelaporan & Verifikasi Hibah",
  description:
    "Aplikasi internal pengelolaan laporan pertanggungjawaban hibah, tracking anggaran, dan verifikasi multi-tier.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="bg-brand-neutral text-slate-100 min-h-screen antialiased selection:bg-emerald-700 selection:text-white">
        {children}
      </body>
    </html>
  );
}
