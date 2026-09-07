import type { Metadata } from "next";
import { authService } from "@/services/auth.service";
import { userRepository } from "@/repositories/user.repository";
import { bkuService } from "@/services/bku.service";
import { institutionService } from "@/services/institution.service";
import { redirect } from "next/navigation";
import { KwitansiHeader } from "@/components/kwitansi/kwitansi-header";
import { BkuClientView } from "@/components/bku/bku-client-view";

export const metadata: Metadata = {
  title: "Buku Kas Umum (BKU) & Rekap Saldo | E-LPJ Hibah",
  description:
    "Pembukuan Buku Kas Umum (BKU), pencatatan penerimaan dana hibah, belanja otomatis dari kwitansi terverifikasi, dan Berita Acara Kas Opname.",
};

export default async function BkuPage() {
  const session = await authService.getSession();

  if (!session || session.role !== "USER") {
    redirect("/login");
  }

  // Preload user profile, ledger entries, and institution profile concurrently
  const [user, ledgerRes, profileRes] = await Promise.all([
    userRepository.findById(session.sub),
    bkuService.getBkuLedger(session.sub),
    institutionService.getProfile(session.sub),
  ]);

  const profile = profileRes.data || null;
  const institution = profile?.subNama
    ? `${profile.namaLembaga} ${profile.subNama}`
    : user?.institution || session.institution || "PIMPINAN RANTING FATAYAT NU DAWUHAN SELATAN";
  const userName = user?.name || session.name || "NUR ALIMAH";
  const leaderName = profile?.namaKetua || user?.leaderName || "HENI FUJIATI";

  const entries = ledgerRes.data?.entries || [];
  const summary = ledgerRes.data?.summary || {
    totalPenerimaan: 0,
    totalPengeluaran: 0,
    saldoAkhir: 0,
    persentaseRealisasi: 0,
    totalTransaksi: 0,
    jumlahKwitansi: 0,
    totalPpn: 0,
    totalPph21: 0,
    totalPph22: 0,
    totalPph23: 0,
    totalPajakDipungut: 0,
    totalNominalBersih: 0,
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col">
      {/* ================= MAIN HEADER NAVBAR ================= */}
      <KwitansiHeader
        institution={institution}
        userName={userName}
        registrationNumber={profile?.noRegistrasi}
        initialProfile={profile}
      />

      {/* ================= WORKSPACE BODY ================= */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-8 py-6">
        <BkuClientView
          initialEntries={entries}
          initialSummary={summary}
          institutionName={institution}
          userName={userName}
          leaderName={leaderName}
          treasurerName={userName}
        />
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="w-full bg-slate-950 border-t border-slate-800/80 py-4 px-4 sm:px-8 text-xs text-slate-400 no-print">
        <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-400">E-LPJ Hibah Internal</span>
            <span>•</span>
            <span>Buku Kas Umum Standar Permendagri & Biro Kesra © 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              Ledger Kas Terenkripsi & Sinkron
            </span>
            <span className="font-mono text-slate-500">v2.4.0-PROD</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
