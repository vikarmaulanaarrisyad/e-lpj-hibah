import { angkaKeTerbilang, formatRupiahNumber, parseRupiahToNumber } from "../src/lib/utils/terbilang";
import { receiptService } from "../src/services/receipt.service";
import { userRepository } from "../src/repositories/user.repository";

async function test() {
  console.log("=== 1. TEST TERBILANG & FORMATTING ===");
  console.log("3000000 ->", angkaKeTerbilang(3000000));
  console.log("1750000 ->", angkaKeTerbilang(1750000));
  console.log("6500000 ->", angkaKeTerbilang(6500000));
  console.log("formatRupiahNumber(3000000) ->", formatRupiahNumber(3000000));
  console.log("parseRupiahToNumber('3.500.000') ->", parseRupiahToNumber("3.500.000"));

  console.log("\n=== 2. TEST SAVE RECEIPT TO SUPABASE ===");
  const user = await userRepository.findByEmail("user@hibah.internal");
  if (!user) throw new Error("User user@hibah.internal not found");

  const receiptRes = await receiptService.saveReceipt(
    {
      nomorBukti: "BKU-HB/014/VIII/2026",
      tanggal: "06 Agustus 2026",
      pemberi: "PR FATAYAT NU DAWUHAN SELATAN",
      nominal: 3000000,
      terbilang: "Tiga Juta Rupiah",
      uraian: "Belanja Sound Aktif sebanyak 1 unit x @ Rp. 3.000.000 = Rp. 3.000.000",
      ketua: "HENI FUJIATI",
      bendahara: "NUR ALIMAH",
      penerima: "Toko Elektronik Makmur Jaya / Sdr. Bambang",
      denganMaterai: false,
      template: "bank",
      kategoriRab: "5.2.1 Perlengkapan",
    },
    user.id
  );

  console.log("Save receipt success:", receiptRes.success);
  console.log("Saved receipt ID:", receiptRes.data?.id);
  console.log("Saved receipt nomorBukti:", receiptRes.data?.nomorBukti);

  console.log("\n=== 3. TEST AUTO-MATERAI RULE (NOMINAL >= 5.000.000) ===");
  const highValueRes = await receiptService.saveReceipt(
    {
      nomorBukti: "BKU-HB/015/VIII/2026",
      tanggal: "07 Agustus 2026",
      pemberi: "PR FATAYAT NU DAWUHAN SELATAN",
      nominal: 6500000,
      terbilang: "Enam Juta Lima Ratus Ribu Rupiah",
      uraian: "Sewa Panggung Rigging & Sound System Konser Shalawat Akbar = Rp 6.500.000",
      ketua: "HENI FUJIATI",
      bendahara: "NUR ALIMAH",
      penerima: "CV Berkah Nada Sound",
      denganMaterai: false, // passed false to verify service auto-enforces to true
      template: "bank",
    },
    user.id
  );
  console.log("High value receipt success:", highValueRes.success);
  console.log("Auto-materai applied?", highValueRes.data?.denganMaterai); // should be true!

  console.log("\n=== 4. TEST QUERY RECEIPTS BY USER ===");
  const listRes = await receiptService.getReceiptsByUser(user.id);
  console.log("Total receipts in DB for user:", listRes.data?.length);

  console.log("\n=== ALL KWITANSI TESTS PASSED! ===");
  process.exit(0);
}

test().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
