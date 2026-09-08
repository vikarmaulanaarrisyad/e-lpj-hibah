import type { Metadata } from "next";
import { authService } from "@/services/auth.service";
import { redirect } from "next/navigation";
import { institutionService } from "@/services/institution.service";
import { receiptRepository } from "@/repositories/receipt.repository";
import { bastRepository } from "@/repositories/bast.repository";
import { pesananRepository } from "@/repositories/pesanan.repository";
import { dokumentasiRepository } from "@/repositories/dokumentasi.repository";
import { KwitansiHeader } from "@/components/kwitansi/kwitansi-header";
import { ArsipDashboard } from "@/components/arsip/arsip-dashboard";
import { cookies } from "next/headers";
import { COOKIE_TAHUN_ANGGARAN, normalizeTahunAnggaran } from "@/lib/utils/tahun-anggaran";

export const metadata: Metadata = {
  title: "Arsip Dokumen LPJ | E-LPJ Hibah",
  description: "Arsip lengkap semua Surat Pesanan, Berita Acara Serah Terima, dan Kwitansi — cetak atau unduh ulang kapan saja.",
};

export default async function ArsipPage() {
  const session = await authService.getSession();
  if (!session || session.role !== "USER") redirect("/login");

  const activeTahun = normalizeTahunAnggaran(cookies().get(COOKIE_TAHUN_ANGGARAN)?.value);

  const [profileRes, receipts, bastDocs, pesananDocs, dokumentasiDocs] = await Promise.all([
    institutionService.getProfile(session.sub),
    receiptRepository.findManyByUserId(session.sub, activeTahun),
    bastRepository.findManyByUserId(session.sub, activeTahun),
    pesananRepository.findManyByUserId(session.sub, activeTahun),
    dokumentasiRepository.findManyByUserId(session.sub, activeTahun),
  ]);

  const profile = profileRes.data || null;
  const institution = profile?.subNama
    ? `${profile.namaLembaga} ${profile.subNama}`
    : session.institution || "PR Fatayat NU";

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col">
      <KwitansiHeader
        institution={institution}
        userName={session.name}
        registrationNumber={profile?.noRegistrasi}
        initialProfile={profile}
      />
      <main className="flex-1 pb-16">
        <ArsipDashboard
          institution={institution}
          userName={session.name}
          profile={profile}
          activeTahun={activeTahun}
          receipts={receipts}
          bastDocs={bastDocs as any[]}
          pesananDocs={pesananDocs}
          dokumentasiDocs={dokumentasiDocs}
        />
      </main>
    </div>
  );
}
