import { Suspense } from "react";
import { redirect } from "next/navigation";
import { authService } from "@/services/auth.service";
import { bastService } from "@/services/bast.service";
import { institutionService } from "@/services/institution.service";
import { receiptRepository } from "@/repositories/receipt.repository";
import { userRepository } from "@/repositories/user.repository";
import { KwitansiHeader } from "@/components/kwitansi/kwitansi-header";
import { BastForm } from "@/components/bast/bast-form";

export const metadata = {
  title: "Berita Acara Serah Terima (BAST) | E-LPJ Hibah",
  description: "Formulir & Pratinjau Cetak Berita Acara Serah Terima Pengadaan Barang Hibah Fatayat NU",
};

export default async function BastPage() {
  const session = await authService.getSession();

  if (!session || session.role !== "USER") {
    redirect("/login");
  }

  // Fetch DB user profile and institution profile
  const [dbUser, profileRes, bastRes, userReceipts] = await Promise.all([
    userRepository.findById(session.sub),
    institutionService.getProfile(session.sub),
    bastService.getBastList(session.sub),
    receiptRepository.findManyByUserId(session.sub),
  ]);

  const profile = profileRes.data || null;
  const bastList = bastRes.data || [];
  const fullInstitution = profile?.subNama
    ? `${profile.namaLembaga} ${profile.subNama}`
    : dbUser?.institution || session.institution;

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col antialiased">
      {/* Universal Top Header */}
      <KwitansiHeader
        userName={dbUser?.name || session.name}
        institution={fullInstitution}
        registrationNumber={profile?.noRegistrasi}
      />

      {/* Main BAST Workspace */}
      <main className="w-full flex-1">
        <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat Berita Acara (BAST)...</div>}>
          <BastForm
            initialBastList={bastList}
            initialReceipts={userReceipts}
            initialProfile={profile}
            userProfile={{
              name: dbUser?.name || session.name,
              leaderName: profile?.namaKetua || dbUser?.leaderName || session.leaderName,
              institution: fullInstitution,
            }}
          />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-950 border-t border-slate-800 py-4 mt-12">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-400">E-LPJ Hibah Amanah</span>
            <span>•</span>
            <span>Badan Kesatuan Bangsa dan Politik & Sekretariat Daerah © 2026</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              Server Audit Terkoneksi
            </span>
            <span>v2.4.0-PROD</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
