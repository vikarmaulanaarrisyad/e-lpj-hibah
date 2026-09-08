"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import Link from "next/link";
import {
  Camera,
  UploadCloud,
  Trash2,
  ZoomIn,
  X,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ImageIcon,
  Loader2,
  FileText,
} from "lucide-react";
import type { DokumentasiPhoto } from "@/types";
import { swalError } from "@/lib/swal";
import { generateStandardPhotoCaption } from "@/lib/utils/pesanan-date";

export interface KwitansiPhotoUploaderProps {
  nomorBukti: string;
  uraian?: string;
  tanggal?: string;
  penerima?: string;
  pemberi?: string;
  initialPhotos?: DokumentasiPhoto[];
  onPhotosChanged?: (photos: DokumentasiPhoto[]) => void;
}

/**
 * Kompresi gambar client-side via HTML5 Canvas (max 1280px, 0.8 JPEG quality).
 * Menurunkan file foto kamera HP (5-10MB) menjadi ~150-250KB tanpa kehilangan detail penting nota!
 */
async function compressImageClient(
  file: File,
  maxDimension = 1280,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.onload = (e) => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Gagal memuat format gambar"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function KwitansiPhotoUploader({
  nomorBukti,
  uraian,
  tanggal,
  penerima,
  pemberi,
  initialPhotos = [],
  onPhotosChanged,
}: KwitansiPhotoUploaderProps) {
  const [photos, setPhotos] = useState<DokumentasiPhoto[]>(initialPhotos);
  const [isCompressing, setIsCompressing] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<DokumentasiPhoto | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storageKey = `elpj_kwitansi_photos_${nomorBukti || "draft"}`;

  // 1. Muat foto dari Local Storage saat nomorBukti berganti
  useEffect(() => {
    if (initialPhotos && initialPhotos.length > 0) {
      setPhotos(initialPhotos);
      return;
    }

    if (!nomorBukti) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setPhotos(parsed);
          onPhotosChanged?.(parsed);
        }
      } else {
        setPhotos([]);
      }
    } catch (err) {
      console.warn("[LocalStorage] Gagal membaca foto kwitansi:", err);
    }
  }, [nomorBukti, initialPhotos]);

  // 2. Simpan perubahan foto ke Local Storage dan berikan callback ke parent
  const updatePhotos = (newPhotos: DokumentasiPhoto[]) => {
    setPhotos(newPhotos);
    onPhotosChanged?.(newPhotos);

    try {
      localStorage.setItem(storageKey, JSON.stringify(newPhotos));
    } catch (err) {
      console.warn("[LocalStorage] Gagal menyimpan foto:", err);
    }
  };

  // 3. Handle File Input Selection
  const handleFilesSelected = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    try {
      const newItems: DokumentasiPhoto[] = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;

        const compressedDataUrl = await compressImageClient(file, 1280, 0.8);
        const currentIndex = photos.length + newItems.length;
        const autoCaption = generateStandardPhotoCaption({
          namaKegiatan: uraian,
          penyedia: penerima,
          photoIndex: currentIndex,
        });

        newItems.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url: compressedDataUrl,
          caption: autoCaption,
          tanggal: tanggal ? tanggal.split("T")[0] : new Date().toISOString().split("T")[0],
          lokasi: pemberi || "Sekretariat Lembaga",
        });
      }

      if (newItems.length > 0) {
        updatePhotos([...photos, ...newItems]);
      }
    } catch (err: any) {
      console.error("[KwitansiPhotoUploader] Error compress:", err);
      swalError("Gagal Mengunggah Foto", "Terjadi kendala saat membaca file gambar.");
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFilesSelected(e.target.files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFilesSelected(e.dataTransfer.files);
  };

  const handleRemovePhoto = (photoId: string) => {
    const filtered = photos.filter((p) => p.id !== photoId);
    updatePhotos(filtered);
  };

  const handleCaptionChange = (photoId: string, newCaption: string) => {
    const updated = photos.map((p) =>
      p.id === photoId ? { ...p, caption: newCaption } : p
    );
    updatePhotos(updated);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-600/50 flex items-center justify-center text-amber-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span>Foto Bukti Belanja &amp; Nota Toko</span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                {photos.length} Foto
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Lampirkan foto nota, bon toko, atau fisik barang pengadaan (tersinkron ke Lembar Dokumentasi F4)
            </p>
          </div>
        </div>

        {/* Link cepat ke modul dokumentasi jika ada foto */}
        {nomorBukti && (
          <Link
            href={`/user/dokumentasi?receiptNo=${encodeURIComponent(nomorBukti)}`}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700/60 hover:border-emerald-500 text-emerald-300 hover:text-white font-semibold transition-all inline-flex items-center gap-1 shrink-0"
            title="Buka foto ini dalam lembar dokumentasi cetak F4 resmi"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Susun Lembar F4</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Drag and Drop / Upload Button Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
          isDragging
            ? "border-emerald-500 bg-emerald-950/30"
            : "border-slate-700/80 hover:border-emerald-500/70 bg-slate-950/40 hover:bg-slate-950/70"
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
          {isCompressing ? (
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          ) : (
            <UploadCloud className="w-5 h-5 text-emerald-400" />
          )}
        </div>

        <div>
          <p className="text-xs font-bold text-slate-200">
            {isCompressing
              ? "Mengompresi Foto..."
              : "Klik atau Tarik Foto Bukti / Nota ke Sini"}
          </p>
          <p className="text-[10.5px] text-slate-400 mt-0.5">
            Mendukung file JPG, PNG, WEBP • Otomatis dikompresi (~150KB) agar hemat memori &amp; ringan
          </p>
        </div>
      </div>

      {/* Photo Gallery Grid */}
      {photos.length > 0 && (
        <div className="space-y-2 pt-1">
          <label className="text-[11px] font-semibold text-slate-300 block">
            Daftar Foto Bukti ({photos.length}):
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-start gap-2.5 group hover:border-slate-700 transition-colors"
              >
                {/* Thumbnail */}
                <div
                  onClick={() => setPreviewPhoto(photo)}
                  className="relative w-16 h-16 rounded-lg bg-slate-900 overflow-hidden shrink-0 cursor-pointer border border-slate-800 group-hover:border-emerald-500/60 transition-colors"
                  title="Klik untuk melihat ukuran penuh"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || `Bukti ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </div>

                {/* Caption & Actions */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono font-bold text-emerald-400">
                      Foto #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                      title="Hapus foto ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={photo.caption || ""}
                    onChange={(e) => handleCaptionChange(photo.id, e.target.value)}
                    placeholder="Keterangan foto (cth: Nota Toko)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-[11px] text-white focus:outline-none focus:border-emerald-500"
                  />

                  {/* Quick Tag Chips */}
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {["Nota Toko", "Fisik Barang", "Serah Terima"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          handleCaptionChange(
                            photo.id,
                            `${tag} ${penerima ? `- ${penerima}` : ""}`.trim()
                          )
                        }
                        className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Zoom Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white">
                {previewPhoto.caption || "Pratinjau Foto Bukti"}
              </span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full max-h-[70vh] flex items-center justify-center overflow-hidden rounded-xl bg-black">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.caption || "Pratinjau"}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
