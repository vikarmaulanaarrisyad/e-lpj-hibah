import { z } from "zod";

export const pesananItemSchema = z.object({
  id: z.string().optional(),
  no: z.number().default(1),
  jenisBarang: z
    .string({ required_error: "Nama barang wajib diisi" })
    .min(2, "Nama barang minimal 2 karakter"),
  spesifikasi: z.string().optional().default(""),
  jumlah: z.number().min(1, "Jumlah minimal 1"),
  satuan: z.string().default("unit"),
  hargaSatuan: z.number().min(0, "Harga satuan tidak boleh negatif"),
  totalHarga: z.number().min(0, "Total harga tidak boleh negatif"),
});

export const purchaseOrderSchema = z.object({
  id: z.string().optional(),
  nomorSp: z
    .string({ required_error: "Nomor Surat Pesanan wajib diisi" })
    .min(3, "Nomor SP minimal 3 karakter"),
  tanggal: z
    .string({ required_error: "Tanggal surat wajib diisi" })
    .min(3, "Tanggal surat wajib diisi"),
  namaPaket: z
    .string({ required_error: "Nama paket pengadaan wajib diisi" })
    .min(3, "Nama paket minimal 3 karakter"),
  pihak1Nama: z
    .string({ required_error: "Nama pemesan (Pihak Kesatu) wajib diisi" })
    .min(2, "Nama pemesan minimal 2 karakter"),
  pihak1Jabatan: z
    .string({ required_error: "Jabatan pemesan wajib diisi" })
    .min(2, "Jabatan pemesan minimal 2 karakter"),
  pihak1Alamat: z.string().optional().nullable(),
  pihak2Toko: z
    .string({ required_error: "Nama toko penyedia wajib diisi" })
    .min(2, "Nama toko penyedia minimal 2 karakter"),
  pihak2Nama: z
    .string({ required_error: "Nama pimpinan penyedia wajib diisi" })
    .min(2, "Nama pimpinan penyedia minimal 2 karakter"),
  pihak2Alamat: z.string().optional().nullable(),
  items: z.array(pesananItemSchema).min(1, "Minimal harus ada 1 item barang"),
  subtotal: z.number().default(0),
  pajak: z.number().default(0),
  pajakKeterangan: z.string().optional().nullable(),
  totalHarga: z.number().min(0, "Total harga tidak boleh negatif"),
  terbilang: z.string().default("Nol Rupiah"),
  batasWaktu: z.string().optional().nullable(),
  waktuPenyelesaian: z.string().optional().nullable(),
  alamatPengiriman: z.string().optional().nullable(),
  alamatPemeriksaan: z.string().optional().nullable(),
  dendaKeterlambatan: z.string().optional().nullable(),
  receiptId: z.string().optional().nullable(),
});

export type PurchaseOrderValidationInput = z.infer<typeof purchaseOrderSchema>;
