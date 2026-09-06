/**
 * Modul Kalkulator Pajak Otomatis Dana Hibah & Belanja Pemerintah
 * Sesuai UU HPP (PPN 11%) dan PMK Perpajakan Bendahara Pengeluaran Hibah / APBD / BOS
 */

export interface TaxCalculationParams {
  nominal: number; // Nominal bruto transaksi
  isPpn?: boolean;
  isPpnIncluded?: boolean; // true: Harga Termasuk PPN (Include), false: Belum PPN (Exclude)
  ppnRate?: number; // Default 0.11 (11%)
  isPph21?: boolean;
  pph21Rate?: number; // Default 0.05 (5%)
  isPph22?: boolean;
  pph22Rate?: number; // Default 0.015 (1.5%)
  isPph23?: boolean;
  pph23Rate?: number; // Default 0.02 (2%)
}

export interface TaxCalculationResult {
  nominalBruto: number;
  dpp: number;
  ppnNominal: number;
  pph21Nominal: number;
  pph22Nominal: number;
  pph23Nominal: number;
  totalPph: number;
  totalPajak: number;
  nominalBersih: number; // Uang yang diterima rekanan (Netto)
  keteranganPajak: string;
}

/**
 * Menghitung rincian pajak (PPN & PPh) berdasarkan nominal transaksi
 */
export function calculateTaxBreakdown(params: TaxCalculationParams): TaxCalculationResult {
  const nominalBruto = Math.max(0, params.nominal || 0);
  const ppnRate = params.ppnRate ?? 0.11;
  const pph21Rate = params.pph21Rate ?? 0.05;
  const pph22Rate = params.pph22Rate ?? 0.015;
  const pph23Rate = params.pph23Rate ?? 0.02;

  let dpp = nominalBruto;
  let ppnNominal = 0;

  if (params.isPpn && nominalBruto > 0) {
    if (params.isPpnIncluded) {
      // Nominal sudah termasuk PPN: DPP = Nominal / (1 + tarif)
      dpp = Math.round(nominalBruto / (1 + ppnRate));
      ppnNominal = nominalBruto - dpp;
    } else {
      // Nominal adalah DPP (belum termasuk PPN)
      dpp = nominalBruto;
      ppnNominal = Math.round(dpp * ppnRate);
    }
  }

  // Hitung Potongan PPh atas DPP
  const pph21Nominal = params.isPph21 && dpp > 0 ? Math.round(dpp * pph21Rate) : 0;
  const pph22Nominal = params.isPph22 && dpp > 0 ? Math.round(dpp * pph22Rate) : 0;
  const pph23Nominal = params.isPph23 && dpp > 0 ? Math.round(dpp * pph23Rate) : 0;

  const totalPph = pph21Nominal + pph22Nominal + pph23Nominal;
  const totalPajak = ppnNominal + totalPph;

  // Nominal bersih yang diterima penyedia/rekanan setelah dipotong pajak yang dipungut bendahara
  const nominalBersih = Math.max(0, nominalBruto - totalPajak);

  // Susun deskripsi keterangan pajak
  const taxDescriptions: string[] = [];
  if (ppnNominal > 0) {
    taxDescriptions.push(`PPN ${(ppnRate * 100).toFixed(0)}%: Rp ${ppnNominal.toLocaleString("id-ID")}`);
  }
  if (pph21Nominal > 0) {
    taxDescriptions.push(`PPh 21 ${(pph21Rate * 100).toFixed(0)}%: Rp ${pph21Nominal.toLocaleString("id-ID")}`);
  }
  if (pph22Nominal > 0) {
    taxDescriptions.push(`PPh 22 ${(pph22Rate * 100).toFixed(1)}%: Rp ${pph22Nominal.toLocaleString("id-ID")}`);
  }
  if (pph23Nominal > 0) {
    taxDescriptions.push(`PPh 23 ${(pph23Rate * 100).toFixed(0)}%: Rp ${pph23Nominal.toLocaleString("id-ID")}`);
  }

  const keteranganPajak =
    taxDescriptions.length > 0
      ? `Potongan: ${taxDescriptions.join(" | ")} (Netto: Rp ${nominalBersih.toLocaleString("id-ID")})`
      : "";

  return {
    nominalBruto,
    dpp,
    ppnNominal,
    pph21Nominal,
    pph22Nominal,
    pph23Nominal,
    totalPph,
    totalPajak,
    nominalBersih,
    keteranganPajak,
  };
}
