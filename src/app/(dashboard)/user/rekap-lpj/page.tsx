import type { Metadata } from "next";
import { authService } from "@/services/auth.service";
import { redirect } from "next/navigation";
import { rabService } from "@/services/rab.service";
import { bkuService } from "@/services/bku.service";
import { institutionService } from "@/services/institution.service";
import { receiptRepository } from "@/repositories/receipt.repository";
import { bastRepository } from "@/repositories/bast.repository";
import { pesananRepository } from "@/repositories/pesanan.repository";
import { KwitansiHeader } from "@/components/kwitansi/kwitansi-header";
import { RekapLpjDashboard } from "@/components/rekap-lpj/rekap-lpj-dashboard";
import { cookies } from "next/headers";
import { COOKIE_TAHUN_ANGGARAN, normalizeTahunAnggaran } from "@/lib/utils/tahun-anggaran";

export const metadata: Metadata = {
  title: "Rekapitulasi LPJ Final | E-LPJ Hibah",
  description: "Ringkasan lengkap Laporan Pertanggungjawaban — RAB, BKU, Kwitansi, BAST, dan Surat Pesanan dalam satu halaman.",
};

export default async function RekapLpjPage() {
  const session = await authService.getSession();
  if (!session || session.role !== "USER") redirect("/login");

  const activeTahun = normalizeTahunAnggaran(cookies().get(COOKIE_TAHUN_ANGGARAN)?.value);

  const [profileRes, rabRes, bkuRes, receipts, bastCount, pesananCount] = await Promise.all([
    institutionService.getProfile(session.sub),
    rabService.getRabStatus(session.sub, activeTahun),
    bkuService.getBkuLedger(session.sub, activeTahun),
    receiptRepository.findManyByUserId(session.sub, activeTahun),
    bastRepository.countByUserId(session.sub, activeTahun),
    pesananRepository.countByUserId(session.sub, activeTahun),
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
        <RekapLpjDashboard
          institution={institution}
          userName={session.name}
          profile={profile}
          activeTahun={activeTahun}
          rabSummary={rabRes.data ?? null}
          bkuSummary={bkuRes.data?.summary ?? null}
          receipts={receipts}
          bastCount={bastCount}
          pesananCount={pesananCount}
        />
      </main>
    </div>
  );
}