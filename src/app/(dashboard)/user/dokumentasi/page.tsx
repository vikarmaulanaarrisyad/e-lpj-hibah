import { Suspense } from "react";
import { redirect } from "next/navigation";
import { authService } from "@/services/auth.service";
import { bastService } from "@/services/bast.service";
import { pesananService } from "@/services/pesanan.service";
import { institutionService } from "@/services/institution.service";
import { receiptRepository } from "@/repositories/receipt.repository";
import { dokumentasiService } from "@/services/dokumentasi.service";
import { KwitansiHeader } from "@/components/kwitansi/kwitansi-header";
import { DokumentasiForm } from "@/components/dokumentasi/dokumentasi-form";
import { ProcurementStepper } from "@/components/workflow/procurement-stepper";

import { cookies } from "next/headers";
import { COOKIE_TAHUN_ANGGARAN, normalizeTahunAnggaran } from "@/lib/utils/tahun-anggaran";

export const metadata = {
  title: "Dokumentasi Kegiatan & Pengadaan Sarana | E-LPJ Hibah",
  description: "Formulir & lembar lampiran dokumentasi kegiatan dan foto fisik barang pengadaan sarana hibah.",
};

export default async function DokumentasiPage() {
  const session = await authService.getSession();

  if (!session || session.role !== "USER") {
    redirect("/login");
  }

  const activeTahun = normalizeTahunAnggaran(
    cookies().get(COOKIE_TAHUN_ANGGARAN)?.value
  );

  // Ambil profil lembaga, arsip BAST, SP, Kwitansi, dan dokumentasi tersimpan untuk tahun aktif
  const [profileRes, bastRes, pesananRes, userReceipts, savedDocsRes] = await Promise.all([
    institutionService.getProfile(session.sub),
    bastService.getBastList(session.sub, activeTahun),
    pesananService.getPurchaseOrders(session.sub, activeTahun),
    receiptRepository.findManyByUserId(session.sub, activeTahun),
    dokumentasiService.getDokumentasiList(session.sub, activeTahun),
  ]);

  const profile = profileRes.data || null;
  const fullInstitution = profile?.subNama
    ? `${profile.namaLembaga} ${profile.subNama}`
    : session.institution;

  const bastOptions = (bastRes.data || []).map((b) => ({
    id: b.id,
    nomor: b.nomorBast,
    nama: b.namaKegiatan,
    tanggal: b.tanggal.toISOString ? b.tanggal.toISOString() : String(b.tanggal),
    pihak1Nama: b.pihak1Nama,
    pihak2Nama: b.pihak2Nama || b.pihak2Toko,
  }));

  const spOptions = (pesananRes.data || []).map((s) => ({
    id: s.id,
    nomor: s.nomorSp,
    nama: s.namaPaket,
    tanggal: s.tanggal.toISOString ? s.tanggal.toISOString() : String(s.tanggal),
    pihak1Nama: s.pihak1Nama,
    pihak2Nama: s.pihak2Nama || s.pihak2Toko,
  }));

  const receiptOptions = userReceipts.map((r) => ({
    id: r.id,
    nomor: r.nomorBukti,
    nama: r.uraian,
    tanggal: r.tanggal.toISOString ? r.tanggal.toISOString() : String(r.tanggal),
    pihak1Nama: r.ketua,
    pihak2Nama: r.penerima,
  }));

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
        {/* Alur Pengadaan Terpadu Stepper (Step 5 of 5) */}
        <div className="max-w-[1720px] mx-auto px-4 sm:px-8 pt-6">
          <ProcurementStepper currentStep={5} />
        </div>

        <Suspense
          fallback={
            <div className="p-8 text-center text-slate-400 font-sans">
              Memuat Lembar Dokumentasi Kegiatan...
            </div>
          }
        >
          <DokumentasiForm
            initialProfile={profile}
            userProfile={{
              name: session.name,
              leaderName: profile?.namaKetua || session.leaderName,
              institution: fullInstitution,
            }}
            bastOptions={bastOptions}
            spOptions={spOptions}
            receiptOptions={receiptOptions}
            initialSavedList={savedDocsRes.data || []}
          />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-950 border-t border-slate-800 py-4 mt-12 no-print">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-400">E-LPJ Hibah Amanah</span>
            <span>•</span>
            <span>Modul Dokumentasi Fisik &amp; Galeri Pengadaan © 2026</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              F4 Portrait Engine Aktif
            </span>
            <span>v2.4.0-PROD</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
