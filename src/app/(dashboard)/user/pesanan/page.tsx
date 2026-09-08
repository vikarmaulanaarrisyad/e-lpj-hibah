import { Suspense } from "react";
import { redirect } from "next/navigation";
import { authService } from "@/services/auth.service";
import { pesananService } from "@/services/pesanan.service";
import { institutionService } from "@/services/institution.service";
import { receiptRepository } from "@/repositories/receipt.repository";
import { userRepository } from "@/repositories/user.repository";
import { KwitansiHeader } from "@/components/kwitansi/kwitansi-header";
import { PesananForm } from "@/components/pesanan/pesanan-form";

import { bastService } from "@/services/bast.service";

import { cookies } from "next/headers";
import { COOKIE_TAHUN_ANGGARAN, normalizeTahunAnggaran } from "@/lib/utils/tahun-anggaran";

export const metadata = {
  title: "Surat Pesanan (SP) Pengadaan Barang | E-LPJ Hibah",
  description: "Formulir & Pratinjau Cetak Surat Pesanan (Purchase Order) Pengadaan Barang Hibah BPKAD & Bakesbangpol",
};

export default async function PesananPage() {
  const session = await authService.getSession();

  if (!session || session.role !== "USER") {
    redirect("/login");
  }

  const activeTahun = normalizeTahunAnggaran(
    cookies().get(COOKIE_TAHUN_ANGGARAN)?.value
  );

  // Fetch DB user profile, institution profile, purchase orders, receipts, BAST list, and next auto SP number for active year
  const [dbUser, profileRes, pesananRes, userReceipts, bastRes, nextSpData] = await Promise.all([
    userRepository.findById(session.sub),
    institutionService.getProfile(session.sub),
    pesananService.getPurchaseOrders(session.sub, activeTahun),
    receiptRepository.findManyByUserId(session.sub, activeTahun),
    bastService.getBastList(session.sub, activeTahun),
    pesananService.generateNextNomorSp(session.sub),
  ]);

  const profile = profileRes.data || null;
  const pesananList = pesananRes.data || [];
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
        initialProfile={profile}
      />

      {/* Main Surat Pesanan Workspace */}
      <main className="w-full flex-1">
        <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat Surat Pesanan...</div>}>
          <PesananForm
            initialPesananList={pesananList}
            initialBastList={bastList}
            initialReceipts={userReceipts}
            initialProfile={profile}
            initialNextNomorSp={nextSpData}
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
