"use client";
/* eslint-disable react/no-unserializable-props */

import { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Store,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  User,
  Tag,
  Check,
  Building2,
  Sparkles,
  RotateCw,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  getVendorsAction,
  saveVendorAction,
  deleteVendorAction,
} from "@/app/actions/vendor.action";
import { swalSuccess, swalError, swalConfirmDelete, swalLoading } from "@/lib/swal";
import type { Vendor, CreateVendorInput } from "@/types";

interface MasterTokoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVendor?: (vendor: Vendor) => void;
  onVendorsUpdated?: (vendors: Vendor[]) => void;
  initialVendors?: Vendor[];
}

export function MasterTokoModal({
  isOpen,
  onClose,
  onSelectVendor,
  onVendorsUpdated,
  initialVendors = [],
}: MasterTokoModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Form Mode: "LIST" | "ADD" | "EDIT"
  const [viewMode, setViewMode] = useState<"LIST" | "FORM">("LIST");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formInput, setFormInput] = useState<CreateVendorInput>({
    namaToko: "",
    namaPemilik: "",
    alamat: "",
    noHp: "",
    kategori: "Elektronik & Sound System",
  });

  const categoryPresets = [
    "Elektronik & Sound System",
    "Percetakan, Banner & ATK",
    "Konsumsi & Katering",
    "Sewa Sarana & Prasarana",
    "Transportasi & Akomodasi",
    "Lainnya / Umum",
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch / Refresh vendors when modal opens
  useEffect(() => {
    if (isOpen) {
      startTransition(async () => {
        const res = await getVendorsAction();
        if (res.success && res.data) {
          setVendors(res.data);
          onVendorsUpdated?.(res.data);
        }
      });
    }
  }, [isOpen, onVendorsUpdated]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  // Filtered vendors
  const filteredVendors = vendors.filter((v) => {
    const query = searchQuery.toLowerCase().trim();
    const matchQuery =
      v.namaToko.toLowerCase().includes(query) ||
      (v.namaPemilik && v.namaPemilik.toLowerCase().includes(query)) ||
      (v.alamat && v.alamat.toLowerCase().includes(query)) ||
      (v.noHp && v.noHp.includes(query));

    const matchCategory =
      selectedCategory === "ALL" || v.kategori === selectedCategory;

    return matchQuery && matchCategory;
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormInput({
      namaToko: "",
      namaPemilik: "",
      alamat: "",
      noHp: "",
      kategori: "Elektronik & Sound System",
    });
    setViewMode("FORM");
  };

  const handleOpenEdit = (v: Vendor) => {
    setEditingId(v.id);
    setFormInput({
      namaToko: v.namaToko,
      namaPemilik: v.namaPemilik || "",
      alamat: v.alamat || "",
      noHp: v.noHp || "",
      kategori: v.kategori || "Lainnya / Umum",
    });
    setViewMode("FORM");
  };

  const handleSaveForm = () => {
    if (!formInput.namaToko.trim()) {
      swalError("Nama Toko Wajib", "Harap isi nama toko / badan usaha.");
      return;
    }

    swalLoading("Menyimpan...", "Menyimpan data rekanan ke master data...");
    startTransition(async () => {
      const res = await saveVendorAction({
        id: editingId || undefined,
        namaToko: formInput.namaToko,
        namaPemilik: formInput.namaPemilik,
        alamat: formInput.alamat,
        noHp: formInput.noHp,
        kategori: formInput.kategori,
      });

      if (res.success && res.data) {
        const saved = res.data;
        setVendors((prev) => {
          const exists = prev.some((x) => x.id === saved.id);
          const nextList = exists
            ? prev.map((x) => (x.id === saved.id ? saved : x))
            : [saved, ...prev];
          onVendorsUpdated?.(nextList);
          return nextList;
        });
        setViewMode("LIST");
        swalSuccess("Berhasil Disimpan!", res.message);
      } else {
        swalError("Gagal Menyimpan", res.message || "Terjadi kesalahan.");
      }
    });
  };

  const handleDelete = async (v: Vendor) => {
    const isConfirmed = await swalConfirmDelete({
      title: "Hapus Toko Rekanan?",
      text: `Apakah Anda yakin ingin menghapus "${v.namaToko}" dari Master Data? Dokumen yang sudah ada tidak akan terhapus.`,
      confirmText: "Ya, Hapus!",
      cancelText: "Batal",
    });

    if (!isConfirmed) return;

    swalLoading("Menghapus...", "Sedang menghapus toko dari database...");
    startTransition(async () => {
      const res = await deleteVendorAction(v.id);
      if (res.success) {
        setVendors((prev) => {
          const nextList = prev.filter((x) => x.id !== v.id);
          onVendorsUpdated?.(nextList);
          return nextList;
        });
        swalSuccess("Berhasil Dihapus", `Toko "${v.namaToko}" telah dihapus.`);
      } else {
        swalError("Gagal Menghapus", res.message || "Gagal menghapus toko.");
      }
    });
  };

  const handleSelectAndClose = (v: Vendor) => {
    if (onSelectVendor) {
      onSelectVendor(v);
    }
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Master Data Toko / Rekanan Langganan</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60 font-medium">
                  {vendors.length} Toko
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Penyedia langganan untuk pengisian otomatis Surat Pesanan (SP), BAST, dan Kwitansi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-4">
          {viewMode === "LIST" ? (
            <>
              {/* Action Toolbar & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari toko, nama pemilik, alamat, no HP..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                  >
                    <option value="ALL">Semua Kategori</option>
                    {categoryPresets.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Toko</span>
                  </button>
                </div>
              </div>

              {/* Vendors List Cards Grid */}
              {filteredVendors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-1">
                  {filteredVendors.map((v) => (
                    <div
                      key={v.id}
                      className="group bg-slate-950/70 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex flex-col justify-between gap-3 transition-all hover:shadow-lg"
                    >
                      <div className="flex flex-col gap-2">
                        {/* Title & Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                              {v.namaToko}
                            </h3>
                            {v.namaPemilik && (
                              <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                                <User className="w-3 h-3 text-amber-400 shrink-0" />
                                <span>Pemilik / Pimpinan: <strong>{v.namaPemilik}</strong></span>
                              </p>
                            )}
                          </div>
                          {v.kategori && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                              {v.kategori}
                            </span>
                          )}
                        </div>

                        {/* Alamat & Kontak */}
                        <div className="space-y-1 text-[11px] text-slate-400 mt-1">
                          {v.alamat && (
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-2 leading-tight">{v.alamat}</span>
                            </div>
                          )}
                          {v.noHp && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="font-mono text-emerald-300">{v.noHp}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-850 mt-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(v)}
                            title="Edit Data Toko"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(v)}
                            title="Hapus Toko"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 text-xs transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {onSelectVendor && (
                          <button
                            type="button"
                            onClick={() => handleSelectAndClose(v)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Pilih & Terapkan</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4 bg-slate-950/40 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center gap-2">
                  <Store className="w-8 h-8 text-slate-600" />
                  <p className="text-xs text-slate-300 font-semibold">
                    {searchQuery ? "Tidak ada toko yang cocok dengan pencarian." : "Belum ada Toko Rekanan tersimpan."}
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm">
                    Tambahkan toko langganan Anda agar dapat dipilih dengan 1 klik saat membuat Surat Pesanan atau BAST.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Toko Pertama</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Sub-Form: Add / Edit Mode */
            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{editingId ? "Edit Data Rekanan Toko" : "Tambah Toko Rekanan Baru"}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setViewMode("LIST")}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Batal & Kembali
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Toko */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-200 font-semibold flex items-center gap-1">
                    <span>Nama Toko / Perusahaan</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formInput.namaToko}
                    onChange={(e) => setFormInput({ ...formInput, namaToko: e.target.value })}
                    placeholder="Contoh: Toko Surya Mas"
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Nama Pemilik */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-200 font-semibold">
                    Nama Pimpinan / Pemilik Rekanan
                  </label>
                  <input
                    type="text"
                    value={formInput.namaPemilik || ""}
                    onChange={(e) => setFormInput({ ...formInput, namaPemilik: e.target.value })}
                    placeholder="Contoh: Anshori"
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Kategori */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-200 font-semibold">
                    Kategori Usaha / Belanja
                  </label>
                  <select
                    value={formInput.kategori || "Lainnya / Umum"}
                    onChange={(e) => setFormInput({ ...formInput, kategori: e.target.value })}
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {categoryPresets.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* No HP / WA */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-200 font-semibold">
                    Nomor Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formInput.noHp || ""}
                    onChange={(e) => setFormInput({ ...formInput, noHp: e.target.value })}
                    placeholder="Contoh: 085642719869"
                    className="w-full text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Alamat Lengkap */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs text-slate-200 font-semibold">
                    Alamat Lengkap Toko Penyedia
                  </label>
                  <textarea
                    rows={2}
                    value={formInput.alamat || ""}
                    onChange={(e) => setFormInput({ ...formInput, alamat: e.target.value })}
                    placeholder="Contoh: Jl. Raya Talang No. 16, Kec. Talang – Kabupaten Tegal"
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => setViewMode("LIST")}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveForm}
                  disabled={isPending}
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isPending ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{editingId ? "Perbarui Data Toko" : "Simpan Toko ke Master"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>
            💡 Data toko tersimpan permanen di database akun Anda dan siap digunakan berulang kali.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-300 hover:text-white font-medium underline"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default MasterTokoModal;
