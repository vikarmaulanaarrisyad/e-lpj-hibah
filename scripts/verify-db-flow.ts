import { prisma } from "../src/lib/prisma";
import { bkuService } from "../src/services/bku.service";
import { receiptService } from "../src/services/receipt.service";
import { userRepository } from "../src/repositories/user.repository";

async function main() {
  console.log("=== VERIFIKASI INTEGRASI DATA DATABASE (KETUA, BENDAHARA, PENERIMA) ===");

  // 1. Get test user
  const user = await prisma.user.findFirst({
    where: { email: "user@hibah.internal" },
  });

  if (!user) {
    throw new Error("User user@hibah.internal tidak ditemukan!");
  }

  console.log("1. Data Profil Pengurus dari Database:");
  console.log("   - Lembaga  :", user.institution);
  console.log("   - Ketua    :", user.leaderName);
  console.log("   - Bendahara:", user.name);

  if (!user.leaderName || !user.name || !user.institution) {
    throw new Error("Profil pengurus di database belum lengkap!");
  }

  // 2. Test save receipt with explicit Penerima and Ketua
  const testNoBukti = "BKU-HB/099/VIII/2026";
  console.log("\n2. Menyimpan Kwitansi Baru ke Database dengan Penerima & Ketua Khusus...");
  const saveRes = await receiptService.saveReceipt(
    {
      nomorBukti: testNoBukti,
      tanggal: "2026-08-10",
      pemberi: user.institution || "PR Fatayat NU Dawuhan Selatan",
      nominal: 1250000,
      terbilang: "Satu Juta Dua Ratus Lima Puluh Ribu Rupiah",
      uraian: "Belanja ATK dan Penggandaan Modul Pelatihan Kader",
      ketua: user.leaderName || "HENI FUJIATI",
      bendahara: user.name || "NUR ALIMAH",
      penerima: "Percetakan & Toko Buku Barokah Grafika",
      denganMaterai: false,
      template: "bank",
      kategoriRab: "5.2.1 Perlengkapan",
    },
    user.id
  );

  console.log("   Save Result:", saveRes.success, saveRes.message);
  if (!saveRes.success || !saveRes.data) {
    throw new Error("Gagal menyimpan kwitansi ke database!");
  }

  // 3. Test get receipt by nomor bukti from database
  console.log("\n3. Mengambil Kwitansi dari Database via findByNomorBukti...");
  const getRes = await receiptService.getReceiptByNomorBukti(testNoBukti, user.id);
  console.log("   Get Result:", getRes.success);
  console.log("   - Nomor Bukti   :", getRes.data?.nomorBukti);
  console.log("   - Penerima Uang :", getRes.data?.penerima);
  console.log("   - Ketua         :", getRes.data?.ketua);
  console.log("   - Bendahara     :", getRes.data?.bendahara);
  console.log("   - Nominal       :", getRes.data?.nominal);

  if (
    getRes.data?.penerima !== "Percetakan & Toko Buku Barokah Grafika" ||
    getRes.data?.ketua !== "HENI FUJIATI"
  ) {
    throw new Error("Data kwitansi di database tidak sesuai dengan yang disimpan!");
  }

  // 4. Test BKU ledger includes penerima and ketua from database
  console.log("\n4. Menguji BKU Ledger untuk memastikan Penerima Uang & Ketua Tampil...");
  const ledgerRes = await bkuService.getBkuLedger(user.id);
  const foundEntry = ledgerRes.data?.entries.find((e) => e.nomorBukti === testNoBukti);

  console.log("   Entry BKU Ditemukan:");
  console.log("   - Nomor Bukti   :", foundEntry?.nomorBukti);
  console.log("   - Uraian        :", foundEntry?.uraian);
  console.log("   - Penerima Uang :", foundEntry?.penerima);
  console.log("   - Ketua         :", foundEntry?.ketua);
  console.log("   - Kredit        :", foundEntry?.kredit);
  console.log("   - Saldo Berjalan:", foundEntry?.saldoBerjalan);

  if (foundEntry?.penerima !== "Percetakan & Toko Buku Barokah Grafika") {
    throw new Error("BKU Ledger belum memetakan penerima uang dari database!");
  }

  // Cleanup test receipt and bku entry
  await prisma.bkuTransaction.deleteMany({
    where: { nomorBukti: testNoBukti },
  });
  await prisma.receipt.deleteMany({
    where: { nomorBukti: testNoBukti },
  });
  console.log("\n5. Cleanup data pengujian berhasil.");

  console.log("\n=== SEMUA PENGUJIAN INTEGRASI DATABASE BERHASIL 100% ===");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
