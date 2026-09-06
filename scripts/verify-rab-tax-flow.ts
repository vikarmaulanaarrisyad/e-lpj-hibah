import { prisma } from "../src/lib/prisma";
import { calculateTaxBreakdown } from "../src/lib/utils/tax";
import { rabService } from "../src/services/rab.service";
import { receiptService } from "../src/services/receipt.service";
import { bkuService } from "../src/services/bku.service";

async function main() {
  console.log("=================================================");
  console.log("🔍 TESTING RAB CONTROL & TAX CALCULATOR FLOW");
  console.log("=================================================\n");

  // 1. Test Tax Mathematics
  console.log("--- 1. Testing Tax Math (PPN 11%, PPh 21, PPh 22, PPh 23) ---");
  const test1 = calculateTaxBreakdown({
    nominal: 3330000,
    isPpn: true,
    isPpnIncluded: true,
    ppnRate: 0.11,
    isPph22: true,
    pph22Rate: 0.015,
  });

  console.log("Test 1 (Include PPN + PPh 22 1.5%):");
  console.log(`  Nominal Bruto : Rp ${test1.nominalBruto.toLocaleString("id-ID")}`);
  console.log(`  DPP           : Rp ${test1.dpp.toLocaleString("id-ID")}`);
  console.log(`  PPN 11%       : Rp ${test1.ppnNominal.toLocaleString("id-ID")}`);
  console.log(`  PPh 22 (1.5%) : Rp ${test1.pph22Nominal.toLocaleString("id-ID")}`);
  console.log(`  Total Pajak   : Rp ${test1.totalPajak.toLocaleString("id-ID")}`);
  console.log(`  Nominal Netto : Rp ${test1.nominalBersih.toLocaleString("id-ID")}`);
  console.log(`  Keterangan    : ${test1.keteranganPajak}\n`);

  if (test1.dpp !== 3000000 || test1.ppnNominal !== 330000 || test1.pph22Nominal !== 45000) {
    throw new Error("Tax math calculation mismatch for Test 1!");
  }

  const test2 = calculateTaxBreakdown({
    nominal: 2000000,
    isPph21: true,
    pph21Rate: 0.05,
  });
  console.log("Test 2 (Honorarium PPh 21 5%):");
  console.log(`  Nominal Bruto : Rp ${test2.nominalBruto.toLocaleString("id-ID")}`);
  console.log(`  PPh 21 (5%)   : Rp ${test2.pph21Nominal.toLocaleString("id-ID")}`);
  console.log(`  Nominal Netto : Rp ${test2.nominalBersih.toLocaleString("id-ID")}\n`);

  if (test2.pph21Nominal !== 100000 || test2.nominalBersih !== 1900000) {
    throw new Error("Tax math calculation mismatch for Test 2!");
  }

  // 2. Find User in DB
  const user = await prisma.user.findFirst({
    where: { role: "USER" },
  });
  if (!user) throw new Error("No user found in database.");

  console.log(`--- 2. Testing User RAB Seed & Ceiling for: ${user.name} (${user.id}) ---`);
  const rabStatus = await rabService.getRabStatus(user.id);
  console.log(`  Total Anggaran RAB: Rp ${rabStatus.data?.totalAnggaran.toLocaleString("id-ID")}`);
  console.log(`  Total Realisasi   : Rp ${rabStatus.data?.totalRealisasi.toLocaleString("id-ID")}`);
  console.log(`  Total Sisa Pagu   : Rp ${rabStatus.data?.totalSisaPagu.toLocaleString("id-ID")}`);
  console.log(`  Status Total      : ${rabStatus.data?.statusTotal}\n`);

  // 3. Test Deficit Detection
  console.log("--- 3. Testing Deficit Prevention Guardrail ---");
  // Check under-budget transaction
  const safeCheck = await rabService.checkBudgetCeiling(user.id, "5.2.1", 1000000);
  console.log("Safe Transaction Check (Rp 1.000.000 on 5.2.1):", {
    isDeficit: safeCheck.data?.isDeficit,
    status: safeCheck.data?.status,
    proyeksiSisa: safeCheck.data?.proyeksiSisaPagu,
  });

  // Check over-budget transaction (e.g. 50.000.000)
  const deficitCheck = await rabService.checkBudgetCeiling(user.id, "5.2.1", 50000000);
  console.log("Deficit Transaction Check (Rp 50.000.000 on 5.2.1):", {
    isDeficit: deficitCheck.data?.isDeficit,
    status: deficitCheck.data?.status,
    defisitNominal: deficitCheck.data?.selisihDefisit,
    warning: deficitCheck.data?.warningMessage,
  });

  if (!deficitCheck.data?.isDeficit) {
    throw new Error("Deficit detection failed to flag 50 million transaction!");
  }

  // 4. Test Persistence of Kwitansi with Tax Fields
  console.log("\n--- 4. Testing Persistence of Receipt with Tax Fields in Supabase ---");
  const testNomorBukti = "BKU-HB/TEST-TAX/2026";
  const saveRes = await receiptService.saveReceipt(
    {
      nomorBukti: testNomorBukti,
      tanggal: "2026-08-15",
      pemberi: user.institution || "PR Fatayat NU Dawuhan Selatan",
      nominal: 3330000,
      terbilang: "Tiga Juta Tiga Ratus Tiga Puluh Ribu Rupiah",
      uraian: "Uji Coba Pengadaan Alat Sound & Laptop dengan PPN & PPh 22",
      ketua: user.leaderName || "HENI FUJIATI",
      bendahara: user.name,
      penerima: "CV Mitra Mandiri Jaya",
      denganMaterai: false,
      template: "bank",
      kategoriRab: "5.2.1",
      isPpn: true,
      ppnRate: 0.11,
      ppnNominal: 330000,
      isPph22: true,
      pph22Rate: 0.015,
      pph22Nominal: 45000,
      dpp: 3000000,
      totalPajak: 375000,
      nominalBersih: 2955000,
      keteranganPajak: "Potongan: PPN 11%: Rp 330.000 | PPh 22 1.5%: Rp 45.000 (Netto: Rp 2.955.000)",
    },
    user.id
  );

  console.log("  Save Result:", saveRes.message);
  if (!saveRes.success) throw new Error(saveRes.message);

  // Verify in DB
  const savedInDb = await prisma.receipt.findUnique({
    where: { nomorBukti: testNomorBukti },
  });

  console.log("  Database Verification:");
  console.log(`    isPpn         : ${savedInDb?.isPpn}`);
  console.log(`    ppnNominal    : Rp ${savedInDb?.ppnNominal.toLocaleString("id-ID")}`);
  console.log(`    pph22Nominal  : Rp ${savedInDb?.pph22Nominal.toLocaleString("id-ID")}`);
  console.log(`    totalPajak    : Rp ${savedInDb?.totalPajak.toLocaleString("id-ID")}`);
  console.log(`    nominalBersih : Rp ${savedInDb?.nominalBersih.toLocaleString("id-ID")}`);

  // Check BKU and Tax Summary
  const bku = await bkuService.getBkuLedger(user.id);
  console.log("\n--- 5. Testing BKU Rekapitulasi Pajak ---");
  console.log(`  Total Penerimaan      : Rp ${bku.data?.summary.totalPenerimaan.toLocaleString("id-ID")}`);
  console.log(`  Total Pengeluaran     : Rp ${bku.data?.summary.totalPengeluaran.toLocaleString("id-ID")}`);
  console.log(`  Total PPN Dipungut    : Rp ${bku.data?.summary.totalPpn.toLocaleString("id-ID")}`);
  console.log(`  Total PPh 22 Dipungut : Rp ${bku.data?.summary.totalPph22.toLocaleString("id-ID")}`);
  console.log(`  Total Pajak Dipungut  : Rp ${bku.data?.summary.totalPajakDipungut.toLocaleString("id-ID")}`);
  console.log(`  Total Kas Bersih Rek  : Rp ${bku.data?.summary.totalNominalBersih.toLocaleString("id-ID")}`);

  // Cleanup test receipt so we keep user's records clean
  await prisma.bkuTransaction.deleteMany({ where: { receiptId: savedInDb?.id } });
  await prisma.receipt.delete({ where: { id: savedInDb?.id } });
  console.log("\n🧹 Test receipt cleaned up successfully.");

  console.log("\n=================================================");
  console.log("🎉 ALL RAB & TAX CALCULATOR TESTS PASSED 100%!");
  console.log("=================================================");
}

main()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
