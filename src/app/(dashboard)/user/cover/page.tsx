import { Suspense } from "react";
import { redirect } from "next/navigation";
import { authService } from "@/services/auth.service";
import { institutionService } from "@/services/institution.service";
import { KwitansiHeader } from "@/components/kwitansi/kwitansi-header";
import { CoverForm } from "@/components/cover/cover-form";

export const metadata = {
  title: "Sampul Cover LPJ Hibah | E-LPJ Hibah",
  description: "Halaman Sampul (Cover) Laporan Pertanggungjawaban Bantuan Hibah Ukuran Kertas F4 Portrait",
};

export default async function CoverPage() {
  const session = await authService.getSession();

  if (!session || session.role !== "USER") {
    redirect("/login");
  }

  // Fetch institution profile
  const profileRes = await institutionService.getProfile(session.sub);

  const profile = profileRes.data || null;
  const fullInstitution = profile?.subNama
    ? `${profile.namaLembaga} ${profile.subNama}`
    : session.institution;

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col antialiased">
      {/* Universal Top Header */}
      <KwitansiHeader
        userName={session.name}
        institution={fullInstitution}
        registrationNumber={profile?.noRegistrasi}
        initialProfile={profile}
      />

      {/* Main Cover Workspace */}
      <main className="w-full flex-1">
        <Suspense fallback={<div className="p-8 text-center text-slate-400 font-sans">Memuat Sampul Cover LPJ...</div>}>
          <CoverForm
            initialProfile={profile}
            userProfile={{
              name: session.name,
              leaderName: profile?.namaKetua || session.leaderName,
              institution: fullInstitution,
            }}
          />
        </Suspense>
      </main>
    </div>
  );
}
