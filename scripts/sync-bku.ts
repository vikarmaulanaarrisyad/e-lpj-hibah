import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== SINKRONISASI KWITANSI KE BUKU KAS UMUM (BKU) ===");
  const receipts = await prisma.receipt.findMany({
    orderBy: { tanggal: "asc" },
  });

  console.log(`Ditemukan ${receipts.length} kwitansi di database.`);

  let synced = 0;
  for (const r of receipts) {
    const existing = await prisma.bkuTransaction.findUnique({
      where: { receiptId: r.id },
    });

    if (!existing) {
      await prisma.bkuTransaction.create({
        data: {
          nomorBukti: r.nomorBukti,
          tanggal: r.tanggal,
          uraian: r.uraian,
          jenis: "PENGELUARAN",
          kategoriRab: r.kategoriRab ?? null,
          nominal: r.nominal,
          receiptId: r.id,
          userId: r.userId,
        },
      });
      console.log(`✓ Disinkronkan: ${r.nomorBukti} - Rp ${r.nominal.toLocaleString("id-ID")}`);
      synced++;
    } else {
      console.log(`- Sudah ada: ${r.nomorBukti}`);
    }
  }

  // Also check if there is an initial grant disbursement entry for test user
  const user = await prisma.user.findFirst({ where: { role: "USER" } });
  if (user) {
    const hasIncome = await prisma.bkuTransaction.findFirst({
      where: { userId: user.id, jenis: "PENERIMAAN" },
    });

    if (!hasIncome) {
      const grantIncome = await prisma.bkuTransaction.create({
        data: {
          nomorBukti: "SP2D-HB/001/VIII/2026",
          tanggal: new Date("2026-08-01"),
          uraian: "Penerimaan Pencairan Dana Hibah Tahap 1 Sesuai NPHD No. 000.1.2/HB-NU/2026",
          jenis: "PENERIMAAN",
          kategoriRab: "Penerimaan Hibah",
          nominal: 25000000, // Rp 25.000.000
          userId: user.id,
        },
      });
      console.log(`✓ Ditambahkan Penerimaan Hibah Awal: Rp ${grantIncome.nominal.toLocaleString("id-ID")}`);
    }
  }

  console.log(`Sinkronisasi selesai. Total ${synced} kwitansi baru dipetakan ke BKU.`);
}

main()
  .catch((e) => {
    console.error("Error during sync:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
