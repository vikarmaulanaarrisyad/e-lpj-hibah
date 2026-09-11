import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { authService } from "@/services/auth.service";
import { institutionService } from "@/services/institution.service";
import { receiptRepository } from "@/repositories/receipt.repository";
import { KwitansiHeader } from "@/components/kwitansi/kwitansi-header";
import { NotaForm } from "@/components/nota/nota-form";

import { cookies } from "next/headers";
import { COOKIE_TAHUN_ANGGARAN, normalizeTahunAnggaran } from "@/lib/utils/tahun-anggaran";

export const metadata: Metadata = {
  title: "Lembar Penempelan Nota Asli | E-LPJ Hibah",
  description:
    "Format resmi lembar cetak penempelan nota belanja asli dan faktur toko ukuran F4/Folio Portrait LPJ Hibah.",
};

interface NotaPageProps {
  searchParams?: {
    receiptNo?: string;
    no?: string;
    tanggal?: string;
  };
}

export default async function NotaPage({ searchParams }: NotaPageProps) {
  const session = await authService.getSession();

  if (!session || session.role !== "USER") {
    redirect("/login");
  }

  const activeTahun = normalizeTahunAnggaran(
    cookies().get(COOKIE_TAHUN_ANGGARAN)?.value
  );

  const [profileRes, userReceipts] = await Promise.all([
    institutionService.getProfile(session.sub),
    receiptRepository.findManyByUserId(session.sub, activeTahun),
  ]);

  const profile = profileRes.data || null;
  const fullInstitution = profile?.subNama
    ? `${profile.namaLembaga} ${profile.subNama}`
    : session.institution || "PR Fatayat NU Dawuhan Selatan";

  const targetReceiptNo = searchParams?.receiptNo || searchParams?.no || null;
  const targetTanggal = searchParams?.tanggal || null;

  const receiptOptions = userReceipts.map((r) => {
    let tglIso = "";
    if (r.tanggal) {
      if (typeof r.tanggal === "string") {
        tglIso = (r.tanggal as string).split("T")[0];
      } else {
        const d = new Date(r.tanggal);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        tglIso = `${year}-${month}-${day}`;
      }
    }
    return {
      id: r.id,
      nomor: r.nomorBukti,
      nama: r.uraian,
      tanggal: tglIso,
      pihak1Nama: r.ketua,
      pihak2Nama: r.penerima,
      nominal: r.nominal,
    };
  });

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col antialiased">
      {/* Universal Top Header */}
      <KwitansiHeader
        userName={session.name}
        institution={fullInstitution}
        registrationNumber={profile?.noRegistrasi}
        initialProfile={profile}
      />

      {/* Main Workspace */}
      <main className="w-full flex-1">
        <Suspense
          fallback={
            <div className="p-8 text-center text-slate-400 font-sans">
              Memuat Lembar Penempelan Nota Asli...
            </div>
          }
        >
          <NotaForm
            initialProfile={profile}
            userProfile={{
              name: session.name,
              leaderName: profile?.namaKetua || session.leaderName,
              institution: fullInstitution,
            }}
            receiptOptions={receiptOptions}
            initialSelectedReceiptNo={targetReceiptNo}
            initialTargetTanggal={targetTanggal}
          />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-950 border-t border-slate-800/80 py-4 px-4 sm:px-8 text-xs text-slate-400 no-print">
        <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-400">E-LPJ Hibah Internal</span>
            <span>•</span>
            <span>Biro Kesejahteraan Rakyat & Sekretariat Daerah © 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              Lembar Nota F4 Siap Cetak
            </span>
            <span className="font-mono text-slate-500">v2.4.0-PROD</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
