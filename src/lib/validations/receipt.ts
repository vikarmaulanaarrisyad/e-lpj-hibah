import { z } from "zod";

export const receiptSchema = z.object({
  id: z.string().optional(),
  nomorBukti: z
    .string({ required_error: "Nomor bukti kas (BKU) wajib diisi" })
    .min(3, "Nomor bukti minimal 3 karakter"),
  tanggal: z
    .string({ required_error: "Tanggal transaksi wajib diisi" })
    .min(3, "Tanggal transaksi wajib diisi"),
  pemberi: z
    .string({ required_error: "Entitas pembayar wajib diisi" })
    .min(3, "Entitas pembayar minimal 3 karakter"),
  nominal: z
    .number({ required_error: "Nominal pengeluaran wajib diisi" })
    .min(1000, "Nominal minimal Rp 1.000"),
  terbilang: z
    .string({ required_error: "Teks terbilang wajib diisi" })
    .min(3, "Teks terbilang wajib diisi"),
  uraian: z
    .string({ required_error: "Rincian belanja/guna membayar wajib diisi" })
    .min(5, "Rincian belanja minimal 5 karakter"),
  ketua: z
    .string({ required_error: "Nama Ketua wajib diisi" })
    .min(2, "Nama Ketua minimal 2 karakter"),
  bendahara: z
    .string({ required_error: "Nama Bendahara wajib diisi" })
    .min(2, "Nama Bendahara minimal 2 karakter"),
  penerima: z
    .string({ required_error: "Nama Penerima/Rekanan wajib diisi" })
    .min(2, "Nama Penerima minimal 2 karakter"),
  denganMaterai: z.boolean().default(false),
  template: z.enum(["bank", "folio", "triple"]).default("bank"),
  kategoriRab: z.string().optional(),

  // Pajak Otomatis
  isPpn: z.boolean().optional().default(false),
  ppnRate: z.number().optional().default(0.11),
  ppnNominal: z.number().optional().default(0),
  isPph21: z.boolean().optional().default(false),
  pph21Rate: z.number().optional().default(0.05),
  pph21Nominal: z.number().optional().default(0),
  isPph22: z.boolean().optional().default(false),
  pph22Rate: z.number().optional().default(0.015),
  pph22Nominal: z.number().optional().default(0),
  isPph23: z.boolean().optional().default(false),
  pph23Rate: z.number().optional().default(0.02),
  pph23Nominal: z.number().optional().default(0),
  dpp: z.number().optional(),
  totalPajak: z.number().optional().default(0),
  nominalBersih: z.number().optional(),
  keteranganPajak: z.string().nullable().optional(),
});

export type ReceiptValidationInput = z.infer<typeof receiptSchema>;
