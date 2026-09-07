import { Suspense } from "react";
import { redirect } from "next/navigation";
import { authService } from "@/services/auth.service";
import { institutionService } from "@/services/institution.service";
import { userRepository } from "@/repositories/user.repository";
import { rabService } from "@/services/rab.service";
import { KwitansiHeader } from "@/components/kwitansi/kwitansi-header";
import { SuratPengantarForm } from "@/components/surat-pengantar/surat-pengantar-form";

export const metadata = {
  title: "Surat Pengantar LPJ Hibah | E-LPJ Hibah",
  description: "Surat Pengantar Laporan Pertanggungjawaban Bantuan Hibah Ukuran Kertas F4/A4 Portrait",
};

export default async function SuratPengantarPage() {
  const session = await authService.getSession();

  if (!session || session.role !== "USER") {
    redirect("/login");
  }

  // Ambil profil user, profil lembaga, dan ringkasan RAB jika ada
  const [dbUser, profileRes, rabRes] = await Promise.all([
    userRepository.findById(session.sub),
    institutionService.getProfile(session.sub),
    rabService.getRabStatus(session.sub),
  ]);

  const profile = profileRes.data || null;
  const fullInstitution = profile?.subNama
    ? `${profile.namaLembaga} ${profile.subNama}`
    : dbUser?.institution || session.institution;

  const totalAnggaran = rabRes.data?.totalAnggaran || 100000000;

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col antialiased">
      {/* Universal Top Header */}
      <KwitansiHeader
        userName={dbUser?.name || session.name}
        institution={fullInstitution}
        registrationNumber={profile?.noRegistrasi}
        initialProfile={profile}
      />

      {/* Main Surat Pengantar Workspace */}
      <main className="w-full flex-1">
        <Suspense
          fallback={
            <div className="p-8 text-center text-slate-400 font-sans">
              Memuat Surat Pengantar LPJ...
            </div>
          }
        >
          <SuratPengantarForm
            initialProfile={profile}
            userProfile={{
              name: dbUser?.name || session.name,
              leaderName: dbUser?.leaderName || profile?.namaKetua,
              institution: fullInstitution,
            }}
            defaultAnggaran={totalAnggaran}
          />
        </Suspense>
      </main>
    </div>
  );
}
