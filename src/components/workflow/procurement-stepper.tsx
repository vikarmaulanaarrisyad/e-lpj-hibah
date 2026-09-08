"use client";

import Link from "next/link";
import {
  PieChart,
  Receipt,
  FileText,
  CheckSquare,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export interface ProcurementStepperProps {
  currentStep: 1 | 2 | 3 | 4;
  relatedReceiptNo?: string | null;
  relatedReceiptId?: string | null;
  relatedSpNo?: string | null;
  relatedSpId?: string | null;
  relatedBastNo?: string | null;
  relatedBastId?: string | null;
  showQuickNav?: boolean;
}

export function ProcurementStepper({
  currentStep,
  relatedReceiptNo,
  relatedReceiptId,
  relatedSpNo,
  relatedSpId,
  relatedBastNo,
  relatedBastId,
  showQuickNav = true,
}: ProcurementStepperProps) {
  const steps = [
    {
      step: 1,
      name: "Pagu Anggaran RAB",
      shortName: "1. Pagu RAB",
      desc: "Perencanaan & Batas Pagu NPHD",
      icon: PieChart,
      href: "/user/rab",
      isOptional: false,
      docNo: null,
    },
    {
      step: 2,
      name: "Kwitansi Belanja Kas",
      shortName: "2. Realisasi Kwitansi",
      desc: "Pencatatan Transaksi & Kas BKU",
      icon: Receipt,
      isOptional: false,
      href: relatedReceiptNo
        ? `/user/kwitansi?receiptNo=${encodeURIComponent(relatedReceiptNo)}`
        : "/user/kwitansi",
      docNo: relatedReceiptNo || null,
    },
    {
      step: 3,
      name: "Surat Pesanan (SP)",
      shortName: "3. Surat Pesanan (SP)",
      desc: "Pemesanan Barang ke Toko",
      icon: FileText,
      isOptional: true,
      href: relatedSpNo
        ? `/user/pesanan?no=${encodeURIComponent(relatedSpNo)}`
        : relatedReceiptNo
        ? `/user/pesanan?receiptNo=${encodeURIComponent(relatedReceiptNo)}${
            relatedReceiptId ? `&receiptId=${encodeURIComponent(relatedReceiptId)}` : ""
          }`
        : "/user/pesanan",
      docNo: relatedSpNo || null,
    },
    {
      step: 4,
      name: "Berita Acara (BAST)",
      shortName: "4. Berita Acara (BAST)",
      desc: "Pemeriksaan & Serah Terima Barang",
      icon: CheckSquare,
      isOptional: true,
      href: relatedBastNo
        ? `/user/bast?no=${encodeURIComponent(relatedBastNo)}`
        : relatedSpNo
        ? `/user/bast?spNo=${encodeURIComponent(relatedSpNo)}`
        : relatedReceiptNo
        ? `/user/bast?receiptNo=${encodeURIComponent(relatedReceiptNo)}`
        : "/user/bast",
      docNo: relatedBastNo || null,
    },
  ];

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl mb-6 backdrop-blur-md">
      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <span>Alur Pengadaan Terpadu Hibah</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-normal">
                Workflow Step {currentStep} of 4
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Pagu RAB <span className="text-emerald-400 font-semibold">➔</span> Realisasi Kwitansi Kas{" "}
              <span className="text-emerald-400 font-semibold">➔</span> Surat Pesanan (SP)*{" "}
              <span className="text-emerald-400 font-semibold">➔</span> Berita Acara (BAST)*
            </p>
          </div>
        </div>

        {/* Status Keterkaitan Dokumen */}
        {(relatedReceiptNo || relatedSpNo || relatedBastNo) && (
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            {relatedReceiptNo && (
              <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-mono flex items-center gap-1">
                <Receipt className="w-3 h-3 text-emerald-400" />
                <span>{relatedReceiptNo}</span>
              </span>
            )}
            {relatedSpNo && (
              <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-mono flex items-center gap-1">
                <FileText className="w-3 h-3 text-cyan-400" />
                <span>{relatedSpNo}</span>
              </span>
            )}
            {relatedBastNo && (
              <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-mono flex items-center gap-1">
                <CheckSquare className="w-3 h-3 text-amber-400" />
                <span>{relatedBastNo}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stepper Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {steps.map((st) => {
          const isActive = currentStep === st.step;
          const isCompleted = currentStep > st.step || Boolean(st.docNo);
          const Icon = st.icon;

          return (
            <Link
              key={st.step}
              href={st.href}
              className={`relative p-3 rounded-xl border transition-all text-left flex flex-col justify-between group ${
                isActive
                  ? "bg-emerald-950/40 border-emerald-500/70 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/40"
                  : isCompleted
                  ? "bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
                  : "bg-slate-950/40 border-slate-800/60 opacity-85 hover:opacity-100 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isActive
                          ? "bg-emerald-500 text-slate-950"
                          : isCompleted
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {isCompleted && !isActive ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        st.step
                      )}
                    </span>
                    <span
                      className={`text-xs font-bold tracking-tight ${
                        isActive
                          ? "text-emerald-300"
                          : isCompleted
                          ? "text-slate-200 group-hover:text-white"
                          : "text-slate-400"
                      }`}
                    >
                      {st.shortName}
                    </span>
                  </div>

                  {st.isOptional && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">
                      Opsional
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 leading-tight line-clamp-1 mb-2">
                  {st.desc}
                </p>
              </div>

              {/* Bottom Doc No or Action Link */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                {st.docNo ? (
                  <span className="font-mono text-emerald-400 font-semibold truncate max-w-[150px]">
                    ✓ {st.docNo}
                  </span>
                ) : isActive ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    Sedang Diedit
                  </span>
                ) : (
                  <span className="text-slate-400 group-hover:text-slate-300 flex items-center gap-0.5">
                    Buka Langkah <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                )}

                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive
                      ? "text-emerald-400"
                      : isCompleted
                      ? "text-emerald-600"
                      : "text-slate-400"
                  }`}
                />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Flow Transition Bar */}
      {showQuickNav && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="font-semibold text-slate-300">Tips Alur:</span>
            {currentStep === 1 && (
              <span>
                Pilih kegiatan di tabel lalu klik <strong>&ldquo;Realisasikan&rdquo;</strong> untuk membuat Kwitansi belanja baru.
              </span>
            )}
            {currentStep === 2 && (
              <span>
                Setelah kwitansi disimpan ke BKU, Anda dapat melanjutkan membuat <strong>Surat Pesanan (SP)</strong> atau langsung <strong>BAST</strong> jika dibutuhkan.
              </span>
            )}
            {currentStep === 3 && (
              <span>
                Setelah Surat Pesanan disimpan, lanjutkan membuat <strong>Berita Acara (BAST)</strong> untuk melengkapi serah terima barang.
              </span>
            )}
            {currentStep === 4 && (
              <span>
                Setelah BAST selesai, seluruh dokumen pengadaan belanja telah lengkap dan siap dibundel ke LPJ.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep === 2 && relatedReceiptNo && (
              <>
                <Link
                  href={`/user/pesanan?receiptNo=${encodeURIComponent(relatedReceiptNo)}${
                    relatedReceiptId ? `&receiptId=${encodeURIComponent(relatedReceiptId)}` : ""
                  }`}
                  className="px-2.5 py-1 rounded-lg bg-sky-950 border border-sky-700/60 hover:border-sky-500 text-sky-300 hover:text-white text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                >
                  <span>Lanjut Buat SP</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <Link
                  href={`/user/bast?receiptNo=${encodeURIComponent(relatedReceiptNo)}${
                    relatedReceiptId ? `&receiptId=${encodeURIComponent(relatedReceiptId)}` : ""
                  }`}
                  className="px-2.5 py-1 rounded-lg bg-amber-950 border border-amber-700/60 hover:border-amber-500 text-amber-300 hover:text-white text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                >
                  <span>Lanjut Buat BAST</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </>
            )}

            {currentStep === 3 && (relatedSpNo || relatedReceiptNo) && (
              <Link
                href={`/user/bast?${
                  relatedSpNo
                    ? `spNo=${encodeURIComponent(relatedSpNo)}`
                    : `receiptNo=${encodeURIComponent(relatedReceiptNo || "")}`
                }`}
                className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-700/60 hover:border-emerald-500 text-emerald-300 hover:text-white text-[11px] font-semibold transition-all inline-flex items-center gap-1"
              >
                <span>Lanjut Buat BAST</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
