import { useState, useTransition, Fragment } from "react";
import Link from "next/link";
import {
  Plus,
  Printer,
  Edit3,
  Trash2,
  Receipt as ReceiptIcon,
  Layers,
  Sparkles,
  ArrowUpRight,
  Calculator,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X,
  Loader2,
  FolderPlus,
} from "lucide-react";
import type {
  RabSummary,
  RabStatusItem,
  RabDetailRow,
  AddRabDetailRowInput,
  UpdateRabDetailRowInput,
} from "@/types";
import {
  addRabDetailRowAction,
  updateRabDetailRowAction,
  deleteRabDetailRowAction,
  resetRabToNphdDefaultsAction,
  deleteRabItemAction,
  updateRabAllocationAction,
} from "@/app/actions/rab.action";
import {
  swalLoading,
  swalSuccess,
  swalError,
  swalConfirmDelete,
  swalConfirm,
} from "@/lib/swal";

interface RabTableViewProps {
  summary: RabSummary;
  onSummaryUpdated: (newSummary: RabSummary) => void;
  institutionName?: string;
  leaderName?: string;
  treasurerName?: string;
  onOpenAddGroupModal: () => void;
}

export function RabTableView({
  summary,
  onSummaryUpdated,
  institutionName = "PIMPINAN RANTING FATAYAT NU DAWUHAN SELATAN",
  leaderName = "HENI FUJIATI",
  treasurerName = "NUR ALIMAH",
  onOpenAddGroupModal,
}: RabTableViewProps) {
  const [isPending, startTransition] = useTransition();

  // Modal State for Tambah/Edit Rincian Row
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [editingRow, setEditingRow] = useState<RabDetailRow | null>(null);

  // Modal State for Ubah Kelompok Kegiatan
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<RabStatusItem | null>(null);
  const [editGroupKode, setEditGroupKode] = useState("");
  const [editGroupNama, setEditGroupNama] = useState("");
  const [editGroupAnggaran, setEditGroupAnggaran] = useState<string>("");

  // Form Fields for Rincian Row
  const [uraian, setUraian] = useState("");
  const [koef1Vol, setKoef1Vol] = useState<number>(1);
  const [koef1Satuan, setKoef1Satuan] = useState("Kegiatan");
  const [koef2Vol, setKoef2Vol] = useState<string>("");
  const [koef2Satuan, setKoef2Satuan] = useState("");
  const [hargaSatuan, setHargaSatuan] = useState<string>("");

  const formatRupiah = (val: number) =>
    "Rp " + Math.round(val).toLocaleString("id-ID");

  const formatNum = (val: number) => Math.round(val).toLocaleString("id-ID");

  // Calculated Preview
  const numKoef1 = Number(koef1Vol) || 1;
  const numKoef2 = koef2Vol ? Number(koef2Vol) : null;
  const numHrg = parseFloat(hargaSatuan) || 0;
  const calculatedTotal = numKoef1 * (numKoef2 ?? 1) * numHrg;

  // Open Modal to Add Rincian Row
  const openAddRowModal = (groupId: string) => {
    setSelectedGroupId(groupId);
    setEditingRow(null);
    setUraian("");
    setKoef1Vol(1);
    setKoef1Satuan("Kegiatan");
    setKoef2Vol("");
    setKoef2Satuan("");
    setHargaSatuan("");
    setIsDetailModalOpen(true);
  };

  // Open Modal to Edit Rincian Row
  const openEditRowModal = (groupId: string, row: RabDetailRow) => {
    setSelectedGroupId(groupId);
    setEditingRow(row);
    setUraian(row.uraian);
    setKoef1Vol(row.koefisien1Vol);
    setKoef1Satuan(row.koefisien1Satuan);
    setKoef2Vol(row.koefisien2Vol != null ? String(row.koefisien2Vol) : "");
    setKoef2Satuan(row.koefisien2Satuan || "");
    setHargaSatuan(String(row.hargaSatuan));
    setIsDetailModalOpen(true);
  };

  // Save Rincian (Add or Update)
  const handleSaveDetail = () => {
    if (!uraian.trim()) {
      swalError("Validasi Gagal", "Uraian kegiatan / penggunaan wajib diisi.");
      return;
    }
    if (numKoef1 <= 0) {
      swalError("Validasi Gagal", "Volume Koefisien I harus lebih dari 0.");
      return;
    }
    if (numHrg <= 0) {
      swalError("Validasi Gagal", "Harga satuan harus lebih besar dari Rp 0.");
      return;
    }

    swalLoading(
      editingRow ? "Memperbarui Rincian..." : "Menambahkan Rincian...",
      "Menyimpan kalkulasi anggaran multi-koefisien..."
    );

    startTransition(async () => {
      let res;
      if (editingRow) {
        res = await updateRabDetailRowAction(selectedGroupId, {
          id: editingRow.id,
          uraian: uraian.trim(),
          koefisien1Vol: numKoef1,
          koefisien1Satuan: koef1Satuan.trim(),
          koefisien2Vol: numKoef2,
          koefisien2Satuan: koef2Satuan.trim() || null,
          hargaSatuan: numHrg,
        });
      } else {
        res = await addRabDetailRowAction(selectedGroupId, {
          uraian: uraian.trim(),
          koefisien1Vol: numKoef1,
          koefisien1Satuan: koef1Satuan.trim(),
          koefisien2Vol: numKoef2,
          koefisien2Satuan: koef2Satuan.trim() || null,
          hargaSatuan: numHrg,
        });
      }

      if (res.success && res.data) {
        // Update summary items in local state
        const updatedItems = summary.items.map((it) =>
          it.id === selectedGroupId ? res.data! : it
        );
        const totalAnggaran = updatedItems.reduce((acc, curr) => acc + curr.anggaran, 0);
        const totalRealisasi = updatedItems.reduce((acc, curr) => acc + curr.realisasi, 0);
        const totalSisaPagu = totalAnggaran - totalRealisasi;
        const persentaseSerapanTotal =
          totalAnggaran > 0 ? Math.round((totalRealisasi / totalAnggaran) * 1000) / 10 : 0;

        onSummaryUpdated({
          ...summary,
          totalAnggaran,
          totalRealisasi,
          totalSisaPagu,
          persentaseSerapanTotal,
          items: updatedItems,
        });

        setIsDetailModalOpen(false);
        swalSuccess(
          editingRow ? "Rincian Diperbarui!" : "Rincian Ditambahkan!",
          res.message
        );
      } else {
        swalError("Gagal Menyimpan", res.message);
      }
    });
  };

  // Delete Rincian Row
  const handleDeleteRow = async (groupId: string, row: RabDetailRow) => {
    const isConfirmed = await swalConfirmDelete({
      title: "Hapus Rincian Item?",
      text: `Apakah Anda yakin ingin menghapus item "${row.uraian}" (${formatRupiah(row.total)})?`,
      confirmText: "Ya, Hapus!",
      cancelText: "Batal",
    });

    if (!isConfirmed) return;

    swalLoading("Menghapus Rincian...", "Menyesuaikan kembali subtotal pagu...");
    startTransition(async () => {
      const res = await deleteRabDetailRowAction(groupId, row.id);
      if (res.success && res.data) {
        const updatedItems = summary.items.map((it) =>
          it.id === groupId ? res.data! : it
        );
        const totalAnggaran = updatedItems.reduce((acc, curr) => acc + curr.anggaran, 0);
        const totalRealisasi = updatedItems.reduce((acc, curr) => acc + curr.realisasi, 0);
        const totalSisaPagu = totalAnggaran - totalRealisasi;
        const persentaseSerapanTotal =
          totalAnggaran > 0 ? Math.round((totalRealisasi / totalAnggaran) * 1000) / 10 : 0;

        onSummaryUpdated({
          ...summary,
          totalAnggaran,
          totalRealisasi,
          totalSisaPagu,
          persentaseSerapanTotal,
          items: updatedItems,
        });

        swalSuccess("Rincian Dihapus!", res.message);
      } else {
        swalError("Gagal Menghapus", res.message);
      }
    });
  };

  // Open Modal to Edit Kelompok Kegiatan
  const openEditGroupModal = (group: RabStatusItem) => {
    setEditingGroup(group);
    setEditGroupKode(group.kode);
    setEditGroupNama(group.nama);
    setEditGroupAnggaran(String(group.anggaran));
    setIsEditGroupModalOpen(true);
  };

  // Save Kelompok Kegiatan Changes
  const handleSaveGroup = () => {
    if (!editingGroup) return;
    if (!editGroupKode.trim()) {
      swalError("Validasi Gagal", "Kode rekening kelompok wajib diisi.");
      return;
    }
    if (!editGroupNama.trim()) {
      swalError("Validasi Gagal", "Nama kelompok kegiatan wajib diisi.");
      return;
    }

    const num = parseFloat(editGroupAnggaran) || 0;
    if (num < 0) {
      swalError("Validasi Gagal", "Pagu anggaran tidak boleh bernilai negatif.");
      return;
    }

    swalLoading("Menyimpan Perubahan...", "Memperbarui data kelompok kegiatan...");
    startTransition(async () => {
      const res = await updateRabAllocationAction({
        id: editingGroup.id,
        kode: editGroupKode.trim(),
        nama: editGroupNama.trim(),
        anggaran: num,
      });

      if (res.success && res.data) {
        const updatedItems = summary.items.map((it) =>
          it.id === editingGroup.id
            ? {
                ...it,
                kode: res.data!.kode,
                nama: res.data!.nama,
                anggaran: res.data!.anggaran,
              }
            : it
        );
        const totalAnggaran = updatedItems.reduce((acc, curr) => acc + curr.anggaran, 0);
        const totalRealisasi = updatedItems.reduce((acc, curr) => acc + curr.realisasi, 0);
        const totalSisaPagu = totalAnggaran - totalRealisasi;
        const persentaseSerapanTotal =
          totalAnggaran > 0 ? Math.round((totalRealisasi / totalAnggaran) * 1000) / 10 : 0;

        onSummaryUpdated({
          ...summary,
          totalAnggaran,
          totalRealisasi,
          totalSisaPagu,
          persentaseSerapanTotal,
          items: updatedItems,
        });

        setIsEditGroupModalOpen(false);
        swalSuccess("Kelompok Diperbarui!", res.message);
      } else {
        swalError("Gagal Memperbarui Kelompok", res.message);
      }
    });
  };

  // Delete Kelompok Kegiatan (Whole Pos Rekening)
  const handleDeleteGroup = async (group: RabStatusItem) => {
    const rincianCount = group.rincian?.length || 0;
    const isConfirmed = await swalConfirmDelete({
      title: "Hapus Kelompok Kegiatan?",
      text: `Apakah Anda yakin ingin menghapus kelompok kegiatan "${group.kode} - ${group.nama}"? ${
        rincianCount > 0 ? `Seluruh ${rincianCount} rincian item di dalamnya akan ikut dihapus.` : ""
      } Pastikan belum ada kwitansi transaksi belanja terkait pos ini.`,
      confirmText: "Ya, Hapus Kelompok!",
      cancelText: "Batal",
    });

    if (!isConfirmed) return;

    swalLoading("Menghapus Kelompok Kegiatan...", "Sedang memproses penghapusan data pos rekening...");
    startTransition(async () => {
      const res = await deleteRabItemAction(group.id);
      if (res.success) {
        const updatedItems = summary.items.filter((it) => it.id !== group.id);
        const totalAnggaran = updatedItems.reduce((acc, curr) => acc + curr.anggaran, 0);
        const totalRealisasi = updatedItems.reduce((acc, curr) => acc + curr.realisasi, 0);
        const totalSisaPagu = totalAnggaran - totalRealisasi;
        const persentaseSerapanTotal =
          totalAnggaran > 0 ? Math.round((totalRealisasi / totalAnggaran) * 1000) / 10 : 0;

        onSummaryUpdated({
          ...summary,
          totalAnggaran,
          totalRealisasi,
          totalSisaPagu,
          persentaseSerapanTotal,
          items: updatedItems,
        });

        swalSuccess("Kelompok Kegiatan Dihapus!", res.message);
      } else {
        swalError("Gagal Menghapus Kelompok", res.message);
      }
    });
  };

  // Reset to Official NPHD Defaults (V, VI, VII, VIII)
  const handleResetToNphd = async () => {
    const isConfirmed = await swalConfirm({
      title: "Muat Template Format Gambar NPHD?",
      text: "Data kelompok kegiatan akan disesuaikan persis seperti tabel gambar referensi (V. Pelatihan Jenazah, VI. Pelatihan Mars, VII. Pelatihan Kader Dasar, VIII. Hadroh). Lanjutkan?",
      confirmText: "Ya, Muat Template!",
      cancelText: "Batal",
      icon: "question",
    });

    if (!isConfirmed) return;

    swalLoading("Memuat Template NPHD...", "Menyusun struktur tabel multi-koefisien...");
    startTransition(async () => {
      const res = await resetRabToNphdDefaultsAction();
      if (res.success && res.data) {
        onSummaryUpdated(res.data);
        swalSuccess("Template Berhasil Dimuat!", "Tabel RAB kini sesuai dengan format dokumen NPHD.");
      } else {
        swalError("Gagal Memuat Template", res.message);
      }
    });
  };

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="rabPrintArea" className="space-y-6">
      {/* ================= ACTIONS & TOOLBAR ================= */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm no-print">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Format Rincian Pos Rekening Anggaran Biaya (RAB) NPHD
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Format resmi tabel multi-koefisien dengan rincian belanja dan kemudahan realisasi kwitansi 1-klik.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenAddGroupModal}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Kelompok Kegiatan</span>
          </button>

          <button
            type="button"
            onClick={handleResetToNphd}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Muat data default persis seperti pada foto referensi"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Muat Template Gambar</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold border border-emerald-500/50 shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen RAB</span>
          </button>
        </div>
      </div>

      {/* ================= PRINT HEADER (Shown only on Print) ================= */}
      <div className="hidden print:block text-black text-center mb-6 border-b-2 border-black pb-4">
        <h2 className="text-base font-bold uppercase tracking-wider">
          RENCANA ANGGARAN BIAYA (RAB)
        </h2>
        <h3 className="text-sm font-bold uppercase mt-1">
          HIBAH DAERAH TAHUN ANGGARAN 2026
        </h3>
        <p className="text-xs mt-1 font-semibold uppercase">
          {institutionName}
        </p>
      </div>

      {/* ================= MAIN OFFICIAL NPHD MULTI-COEFFICIENT TABLE ================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden print:bg-white print:border-none print:shadow-none print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans print:text-[10pt] print:text-black">
            {/* Table Double-Header persis seperti gambar */}
            <thead>
              <tr className="bg-slate-950/90 text-slate-300 border-b border-slate-700 print:bg-slate-200 print:text-black print:border-black font-bold text-center">
                <th
                  rowSpan={2}
                  className="py-3.5 px-3 border-r border-slate-800 print:border-black w-12"
                >
                  No
                </th>
                <th
                  rowSpan={2}
                  className="py-3.5 px-4 border-r border-slate-800 print:border-black min-w-[240px] text-left"
                >
                  Uraian Kegiatan/ Penggunaan
                </th>
                <th
                  colSpan={2}
                  className="py-2 px-3 border-r border-slate-800 print:border-black text-center bg-slate-900 print:bg-slate-200"
                >
                  Koefisien I
                </th>
                <th
                  colSpan={2}
                  className="py-2 px-3 border-r border-slate-800 print:border-black text-center bg-slate-900 print:bg-slate-200"
                >
                  Koefisien II
                </th>
                <th
                  rowSpan={2}
                  className="py-3.5 px-3 border-r border-slate-800 print:border-black w-32 text-right"
                >
                  Harga Satuan (Rp)
                </th>
                <th
                  rowSpan={2}
                  className="py-3.5 px-3 border-r border-slate-800 print:border-black w-36 text-right font-extrabold"
                >
                  Jumlah (Rp)
                </th>
                {/* Kolom Realisasi & Aksi (Screen only) */}
                <th
                  rowSpan={2}
                  className="py-3.5 px-3 border-r border-slate-800 print:hidden w-32 text-right text-cyan-300"
                >
                  Realisasi (Rp)
                </th>
                <th
                  rowSpan={2}
                  className="py-3.5 px-3 border-r border-slate-800 print:hidden w-32 text-right text-emerald-300"
                >
                  Sisa Pagu (Rp)
                </th>
                <th
                  rowSpan={2}
                  className="py-3.5 px-3 print:hidden w-44 text-center"
                >
                  Aksi & Realisasi
                </th>
              </tr>

              {/* Sub-Header Koefisien I & II */}
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 print:bg-slate-100 print:text-black print:border-black text-center text-[11px]">
                <th className="py-1.5 px-2.5 border-r border-slate-800 print:border-black w-16">
                  Volume
                </th>
                <th className="py-1.5 px-2.5 border-r border-slate-800 print:border-black w-24">
                  Satuan
                </th>
                <th className="py-1.5 px-2.5 border-r border-slate-800 print:border-black w-16">
                  Volume
                </th>
                <th className="py-1.5 px-2.5 border-r border-slate-800 print:border-black w-24">
                  Satuan
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800 print:divide-black">
              {summary.items.map((group, groupIdx) => {
                const rincianList = group.rincian || [];
                const subtotalAnggaran = rincianList.reduce((sum, r) => sum + r.total, 0) || group.anggaran;
                const subtotalRealisasi = group.realisasi;
                const subtotalSisa = subtotalAnggaran - subtotalRealisasi;

                return (
                  <Fragment key={group.id}>
                    {/* BARIS HEADER KELOMPOK KEGIATAN (Contoh: VI | PELATIHAN MARS) */}
                    <tr className="bg-slate-950/70 print:bg-slate-100 font-bold">
                      <td className="py-2.5 px-3 text-center font-mono text-emerald-400 print:text-black border-r border-slate-800 print:border-black text-sm">
                        {group.kode}
                      </td>
                      <td
                        colSpan={5}
                        className="py-2.5 px-4 text-white print:text-black uppercase tracking-wider text-xs border-r border-slate-800 print:border-black font-extrabold"
                      >
                        <div className="flex items-center justify-between">
                          <span>{group.nama}</span>
                          <span className="text-[10px] text-slate-400 print:hidden font-mono font-normal">
                            ({rincianList.length} Rincian Item)
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-800 print:border-black"></td>
                      <td className="py-2.5 px-3 border-r border-slate-800 print:border-black text-right font-mono font-bold text-slate-300 print:text-black">
                        {/* Empty on group header row, shown on subtotal row */}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-800 print:hidden"></td>
                      <td className="py-2.5 px-3 border-r border-slate-800 print:hidden"></td>
                      <td className="py-2.5 px-3 print:hidden text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openAddRowModal(group.id)}
                            className="px-2 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                            title="Tambah Rincian Item Baru ke Kelompok Ini"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Tambah Rincian</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditGroupModal(group)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 cursor-pointer"
                            title="Ubah Nama atau Kode Kelompok Kegiatan"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteGroup(group)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors border border-slate-700 cursor-pointer"
                            title="Hapus Kelompok Kegiatan Ini Beserta Rinciannya"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* BARIS ITEM-ITEM RINCIAN KEGIATAN */}
                    {rincianList.map((row, rowIdx) => {
                      const rowRealisasi = row.realisasi || 0;
                      const rowSisa = row.sisa != null ? row.sisa : row.total - rowRealisasi;
                      const isRowLunas = rowRealisasi >= row.total && row.total > 0;
                      const isRowSebagian = rowRealisasi > 0 && !isRowLunas;

                      return (
                        <tr
                          key={row.id}
                          className="hover:bg-slate-800/40 print:hover:bg-transparent transition-colors border-b border-slate-800/60 print:border-slate-300"
                        >
                          {/* No */}
                          <td className="py-2.5 px-3 text-center text-slate-400 print:text-black font-mono border-r border-slate-800 print:border-black">
                            {row.no || rowIdx + 1}
                          </td>

                          {/* Uraian Kegiatan / Penggunaan */}
                          <td className="py-2.5 px-4 text-slate-200 print:text-black border-r border-slate-800 print:border-black">
                            <span className="font-medium text-xs">{row.uraian}</span>
                          </td>

                          {/* Koefisien I Volume */}
                          <td className="py-2.5 px-2.5 text-center font-mono text-slate-300 print:text-black border-r border-slate-800 print:border-black">
                            {row.koefisien1Vol}
                          </td>

                          {/* Koefisien I Satuan */}
                          <td className="py-2.5 px-2.5 text-center text-slate-300 print:text-black border-r border-slate-800 print:border-black capitalize">
                            {row.koefisien1Satuan}
                          </td>

                          {/* Koefisien II Volume */}
                          <td className="py-2.5 px-2.5 text-center font-mono text-slate-300 print:text-black border-r border-slate-800 print:border-black">
                            {row.koefisien2Vol != null ? row.koefisien2Vol : ""}
                          </td>

                          {/* Koefisien II Satuan */}
                          <td className="py-2.5 px-2.5 text-center text-slate-300 print:text-black border-r border-slate-800 print:border-black">
                            {row.koefisien2Satuan || ""}
                          </td>

                          {/* Harga Satuan (Rp) */}
                          <td className="py-2.5 px-3 text-right font-mono text-slate-300 print:text-black border-r border-slate-800 print:border-black whitespace-nowrap">
                            {formatNum(row.hargaSatuan)}
                          </td>

                          {/* Jumlah (Rp) */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white print:text-black border-r border-slate-800 print:border-black whitespace-nowrap">
                            {formatNum(row.total)}
                          </td>

                          {/* Realisasi Belanja (Screen only) */}
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-cyan-300 border-r border-slate-800 print:hidden whitespace-nowrap">
                            <div className="flex flex-col items-end">
                              <span>{rowRealisasi > 0 ? formatNum(rowRealisasi) : "-"}</span>
                              {isRowLunas && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  LUNAS
                                </span>
                              )}
                              {isRowSebagian && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                                  SEBAGIAN
                                </span>
                              )}
                              {rowSisa < 0 && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800">
                                  DEFISIT
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Sisa Pagu (Screen only) */}
                          <td
                            className={`py-2.5 px-3 text-right font-mono font-semibold border-r border-slate-800 print:hidden whitespace-nowrap ${
                              rowSisa < 0
                                ? "text-red-400"
                                : rowSisa === 0 && row.total > 0
                                ? "text-slate-500"
                                : "text-emerald-400"
                            }`}
                          >
                            {rowSisa < 0 ? "-" : ""}
                            {formatNum(Math.abs(rowSisa))}
                          </td>

                          {/* Tombol Realisasikan & Actions (Screen only) */}
                          <td className="py-2 px-2 print:hidden text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* 1-Click Realisasikan ke Kwitansi Belanja */}
                              <Link
                                href={`/user/kwitansi?uraian=${encodeURIComponent(
                                  `${row.uraian} (${group.nama})`
                                )}&nominal=${rowSisa > 0 ? rowSisa : row.total}&kategori=${encodeURIComponent(
                                  group.kode
                                )}`}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-all inline-flex items-center gap-1 shadow-sm"
                                title="Buat Kwitansi Belanja Otomatis untuk item ini"
                              >
                                <ReceiptIcon className="w-3 h-3" />
                                <span>Realisasikan</span>
                              </Link>

                              {/* Edit Row Button */}
                              <button
                                type="button"
                                onClick={() => openEditRowModal(group.id, row)}
                                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                                title="Edit Rincian"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>

                              {/* Delete Row Button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(group.id, row)}
                                className="p-1 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors border border-slate-700"
                                title="Hapus Rincian"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* TAMPILAN JIKA BELUM ADA RINCIAN ITEM */}
                    {rincianList.length === 0 && (
                      <tr className="bg-slate-950/40 border-b border-slate-800/60 text-center">
                        <td colSpan={11} className="py-4 px-4 text-slate-400 text-xs italic">
                          <span>Belum ada rincian item belanja pada kelompok ini.</span>
                          <button
                            type="button"
                            onClick={() => openAddRowModal(group.id)}
                            className="ml-2 text-emerald-400 hover:text-emerald-300 font-semibold underline cursor-pointer"
                          >
                            + Tambah Rincian Sekarang
                          </button>
                          <span className="mx-2 text-slate-600">•</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteGroup(group)}
                            className="text-red-400 hover:text-red-300 font-semibold underline cursor-pointer"
                          >
                            Hapus Kelompok Ini
                          </button>
                        </td>
                      </tr>
                    )}

                    {/* BARIS SUBTOTAL KELOMPOK KEGIATAN (Contoh: Jumlah VI | 22.900.000) */}
                    <tr className="bg-slate-950 print:bg-slate-200 border-t-2 border-b-2 border-slate-700 print:border-black font-extrabold text-xs">
                      <td className="py-2.5 px-3 border-r border-slate-800 print:border-black"></td>
                      <td
                        colSpan={5}
                        className="py-2.5 px-4 text-right uppercase tracking-wider text-slate-300 print:text-black border-r border-slate-800 print:border-black"
                      >
                        Jumlah {group.kode}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-800 print:border-black"></td>
                      <td className="py-2.5 px-3 text-right font-mono text-sm text-emerald-300 print:text-black border-r border-slate-800 print:border-black whitespace-nowrap">
                        {formatNum(subtotalAnggaran)}
                      </td>
                      {/* Subtotal Realisasi & Sisa */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-cyan-300 border-r border-slate-800 print:hidden whitespace-nowrap">
                        {formatNum(subtotalRealisasi)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-bold border-r border-slate-800 print:hidden whitespace-nowrap ${
                          subtotalSisa < 0 ? "text-red-400" : "text-emerald-300"
                        }`}
                      >
                        {subtotalSisa < 0 ? "-" : ""}
                        {formatNum(Math.abs(subtotalSisa))}
                      </td>
                      <td className="py-2.5 px-3 print:hidden"></td>
                    </tr>
                  </Fragment>
                );
              })}

              {/* BARIS TOTAL KESELURUHAN ANGGARAN BIAYA (RAB) */}
              <tr className="bg-emerald-950/60 print:bg-slate-300 border-t-4 border-slate-700 print:border-black font-black text-sm">
                <td
                  colSpan={6}
                  className="py-4 px-4 text-right uppercase tracking-widest text-white print:text-black border-r border-slate-800 print:border-black"
                >
                  TOTAL KESELURUHAN PAGU NPHD
                </td>
                <td className="py-4 px-3 border-r border-slate-800 print:border-black"></td>
                <td className="py-4 px-3 text-right font-mono text-base text-emerald-400 print:text-black border-r border-slate-800 print:border-black whitespace-nowrap">
                  {formatRupiah(summary.totalAnggaran)}
                </td>
                <td className="py-4 px-3 text-right font-mono text-cyan-300 border-r border-slate-800 print:hidden whitespace-nowrap">
                  {formatRupiah(summary.totalRealisasi)}
                </td>
                <td
                  className={`py-4 px-3 text-right font-mono border-r border-slate-800 print:hidden whitespace-nowrap ${
                    summary.totalSisaPagu < 0 ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {summary.totalSisaPagu < 0 ? "-" : ""}
                  {formatRupiah(Math.abs(summary.totalSisaPagu))}
                </td>
                <td className="py-4 px-3 print:hidden"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= PRINT SIGNATURE SECTION (Shown only on Print) ================= */}
      <div className="hidden print:flex justify-between items-start mt-12 px-8 text-black text-xs font-sans">
        <div className="text-center w-64">
          <p>Mengetahui,</p>
          <p className="font-bold">Ketua {institutionName}</p>
          <div className="h-20"></div>
          <p className="font-bold underline">{leaderName}</p>
        </div>
        <div className="text-center w-64">
          <p suppressHydrationWarning>
            Kabupaten Tegal, {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
          <p className="font-bold">Bendahara Pengeluaran</p>
          <div className="h-20"></div>
          <p className="font-bold underline">{treasurerName}</p>
        </div>
      </div>

      {/* ================= MODAL TAMBAH / EDIT RINCIAN ITEM ================= */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingRow ? "Ubah Rincian Item RAB" : "Tambah Rincian Item RAB"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Kalkulasi otomatis Volume I × Volume II × Harga Satuan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Uraian Kegiatan */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Uraian Kegiatan / Penggunaan <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Honor Pelatih, Konsumsi, Banner, dsb."
                  value={uraian}
                  onChange={(e) => setUraian(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Koefisien I: Volume & Satuan */}
              <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Koefisien I (Utama)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Volume I</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Contoh: 3"
                      value={koef1Vol}
                      onChange={(e) => setKoef1Vol(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Satuan I</label>
                    <input
                      type="text"
                      placeholder="Contoh: Kegiatan, Paket, Buah"
                      value={koef1Satuan}
                      onChange={(e) => setKoef1Satuan(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Koefisien II: Volume & Satuan (Opsional) */}
              <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Koefisien II (Pengali Tambahan / Opsional)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Volume II</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Contoh: 2, 110, 120 (kosongkan jika 1)"
                      value={koef2Vol}
                      onChange={(e) => setKoef2Vol(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Satuan II</label>
                    <input
                      type="text"
                      placeholder="Contoh: Orang, Box"
                      value={koef2Satuan}
                      onChange={(e) => setKoef2Satuan(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Harga Satuan (Rp) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Harga Satuan (Rp) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm font-semibold">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Contoh: 300000"
                    value={hargaSatuan}
                    onChange={(e) => setHargaSatuan(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white font-mono text-sm font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Live Calculation Preview Banner */}
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-700/50 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Kalkulasi Jumlah Total:</span>
                  <span className="text-xs text-emerald-300 font-mono">
                    {numKoef1} {koef1Satuan} {numKoef2 ? `× ${numKoef2} ${koef2Satuan}` : ""} × {formatNum(numHrg)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-semibold">Jumlah (Rp):</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {formatRupiah(calculatedTotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={handleSaveDetail}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all border border-emerald-500/40 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                ) : (
                  <Calculator className="w-4 h-4" />
                )}
                <span>Simpan Rincian Item</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL UBAH KELOMPOK KEGIATAN ================= */}
      {isEditGroupModalOpen && editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Ubah Kelompok Kegiatan RAB
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Perbarui nama pos rekening atau kode kelompok
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditGroupModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Kode Rekening / Nomor Urut <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 1, 2, VI, 5.2.1"
                  value={editGroupKode}
                  onChange={(e) => setEditGroupKode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nama Kelompok Kegiatan <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: BELANJA ALAT HADROH"
                  value={editGroupNama}
                  onChange={(e) => setEditGroupNama(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Alokasi Pagu Anggaran (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm font-semibold">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    placeholder="0"
                    value={editGroupAnggaran}
                    onChange={(e) => setEditGroupAnggaran(e.target.value)}
                    disabled={(editingGroup.rincian?.length || 0) > 0}
                    className={`w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white font-mono text-sm font-bold focus:outline-none focus:border-emerald-600 ${
                      (editingGroup.rincian?.length || 0) > 0 ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
                {(editingGroup.rincian?.length || 0) > 0 ? (
                  <p className="text-[11px] text-slate-400 mt-1">
                    ℹ️ Pagu kelompok ini dihitung otomatis dari akumulasi {editingGroup.rincian?.length} rincian item ({formatRupiah(editingGroup.anggaran)}).
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-400 font-mono mt-1">
                    Preview: {formatRupiah(parseFloat(editGroupAnggaran) || 0)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={handleSaveGroup}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all border border-emerald-500/40 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                ) : (
                  <Edit3 className="w-4 h-4" />
                )}
                <span>Simpan Perubahan Kelompok</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditGroupModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
