"use client";

import { useState, useTransition } from "react";
import { addBkuIncomeAction } from "@/app/actions/bku.action";
import { X, ArrowDownRight, Loader2 } from "lucide-react";
import { swalLoading, swalSuccess, swalError } from "@/lib/swal";

interface BkuIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BkuIncomeModal({ isOpen, onClose, onSuccess }: BkuIncomeModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nomorBukti: "SP2D-HB/002/IX/2026",
    tanggal: new Date().toISOString().split("T")[0],
    uraian: "Pencairan Dana Hibah Tahap 2 Sesuai NPHD",
    kategoriRab: "Pencairan Hibah",
    nominalStr: "15000000",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numericNominal = parseFloat(formData.nominalStr.replace(/\D/g, ""));
    if (isNaN(numericNominal) || numericNominal <= 0) {
      setErrorMsg("Nominal harus berupa angka valid lebih besar dari 0.");
      swalError("Nominal Tidak Valid", "Nominal penerimaan harus berupa angka valid lebih besar dari Rp 0.");
      return;
    }

    swalLoading("Mencatat Penerimaan...", "Menyimpan transaksi kas masuk ke Buku Kas Umum...");
    startTransition(async () => {
      const res = await addBkuIncomeAction({
        nomorBukti: formData.nomorBukti,
        tanggal: formData.tanggal,
        uraian: formData.uraian,
        kategoriRab: formData.kategoriRab,
        nominal: numericNominal,
      });

      if (!res.success) {
        setErrorMsg(res.message);
        swalError("Gagal Mencatat Penerimaan", res.message);
      } else {
        onSuccess();
        onClose();
        swalSuccess("Penerimaan Dicatat!", res.message);
      }
    });
  };

  const formatPreview = (str: string) => {
    const num = parseFloat(str.replace(/\D/g, ""));
    return isNaN(num) ? "Rp 0" : "Rp " + num.toLocaleString("id-ID");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Catat Penerimaan Dana (Kas Masuk)
              </h3>
              <p className="text-[11px] text-slate-400">
                Pencairan SP2D / NPHD / Bunga Giro ke Buku Kas Umum
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-800/60 rounded-xl text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nomor Bukti / SP2D
              </label>
              <input
                type="text"
                required
                value={formData.nomorBukti}
                onChange={(e) =>
                  setFormData({ ...formData, nomorBukti: e.target.value })
                }
                placeholder="SP2D/002/2026"
                className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tanggal Kas Masuk
              </label>
              <input
                type="date"
                required
                value={formData.tanggal}
                onChange={(e) =>
                  setFormData({ ...formData, tanggal: e.target.value })
                }
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nominal Penerimaan (Rp)
            </label>
            <input
              type="text"
              required
              value={formData.nominalStr}
              onChange={(e) =>
                setFormData({ ...formData, nominalStr: e.target.value })
              }
              placeholder="Contoh: 15000000"
              className="w-full text-sm font-mono font-bold bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-emerald-400 focus:outline-none focus:border-emerald-600"
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>Konfirmasi Nominal:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {formatPreview(formData.nominalStr)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Uraian Sumber Dana
            </label>
            <textarea
              required
              rows={2}
              value={formData.uraian}
              onChange={(e) =>
                setFormData({ ...formData, uraian: e.target.value })
              }
              placeholder="Pencairan Dana Hibah Tahap 1 Sesuai NPHD..."
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Pos Anggaran / Kategori
            </label>
            <input
              type="text"
              value={formData.kategoriRab}
              onChange={(e) =>
                setFormData({ ...formData, kategoriRab: e.target.value })
              }
              placeholder="Penerimaan Hibah"
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-xl bg-brand-primary hover:bg-brand-secondary text-white text-xs font-semibold transition-all shadow-md flex items-center gap-2 border border-emerald-600/40"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Simpan Penerimaan Kas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
