import { PrismaClient } from "@prisma/client";
import { bastService } from "../src/services/bast.service";
import { formatTanggalTerbilang } from "../src/services/bast.service";
import type { CreateBastInput } from "../src/types";

const prisma = new PrismaClient();

async function main() {
  console.log("--- STARTING BAST SYSTEM VERIFICATION ---");

  // 1. Test Date Terbilang format
  const sampleDate = new Date("2026-07-31T00:00:00Z");
  const { hariTanggal, terbilangResmi } = formatTanggalTerbilang(sampleDate);
  console.log("✓ Terbilang Test:", terbilangResmi);
  if (!terbilangResmi.includes("Juli") || !terbilangResmi.includes("Dua Ribu")) {
    throw new Error("Terbilang formatting failed");
  }

  // 2. Find a user in DB
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found in DB. Skipping DB record tests.");
    return;
  }
  console.log("✓ Found user:", user.email, "ID:", user.id);

  // 3. Find or link receipt
  const receipt = await prisma.receipt.findFirst({
    where: { userId: user.id },
  });
  console.log("✓ Receipt linked test:", receipt ? receipt.nomorBukti : "None found, using independent BAST");

  // 4. Test Service: Save BAST
  const input: CreateBastInput = {
    nomorBast: "014/BAST-HB/FTY/VII/2026",
    tanggal: new Date("2026-07-31"),
    hariTanggal,
    tanggalTerbilang: terbilangResmi,
    nomorSpk: "Wk.5c.74.II/MI.bhd.01/370/7/2026",
    tanggalSpk: "17 Juli 2026",
    namaKegiatan: "Pengadaan Sarana Sound Aktif & Alat Hadroh Fatayat NU",
    pihak1Nama: user.leaderName || "HENI FUJIATI",
    pihak1Jabatan: `Ketua ${user.institution || "PR Fatayat NU Dawuhan Selatan"}`,
    pihak2Nama: "ANSHORI",
    pihak2Toko: "SURYA MAS (Pemilik / Rekanan)",
    items: [
      {
        id: "1",
        no: 1,
        jenisBarang: "Sound Aktif Portable 15 Inch + 2 Wireless Microphone & Stand",
        pesanan: "1 unit",
        realisasi: "1 unit",
        kondisi: "Baik",
      },
    ],
    statusUji: "Lulus Uji Coba",
    catatanUji: "Barang telah dihidupkan, dites keluaran audio, baterai & mic nirkabel berfungsi normal 100%.",
    fotoFisikNama: "IMG_BAST_014_2026.jpg",
    receiptId: receipt?.id,
  };

  const saveResult = await bastService.saveBast(input, user.id);

  console.log("✓ Save BAST Service Result:", saveResult.success, "ID:", saveResult.data?.id);
  if (!saveResult.success || !saveResult.data) {
    throw new Error(`Failed to save BAST: ${saveResult.message}`);
  }

  // 5. Test Service: Retrieve BAST List
  const listResult = await bastService.getBastList(user.id);
  console.log("✓ Get BAST List Result:", listResult.success, "Count:", listResult.data?.length);

  // 6. Test Service: Retrieve BAST By Nomor
  const detailResult = await bastService.getBastByNomor("014/BAST-HB/FTY/VII/2026", user.id);
  console.log(
    "✓ Detail BAST:",
    detailResult.data?.bast.nomorBast,
    "Pihak 1:",
    detailResult.data?.bast.pihak1Nama,
    "Items count:",
    detailResult.data?.items?.length
  );

  console.log("--- BAST SYSTEM VERIFICATION COMPLETED SUCCESSFULLY ---");
}

main()
  .catch((err) => {
    console.error("Verification Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
