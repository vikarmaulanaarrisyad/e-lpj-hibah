import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("--- SEEDING SURAT PESANAN: PEMBELIAN ALAT REBANA (ADHUFU) ---");

  // 1. Get Fatayat NU user
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: "fatayat.dawuhan@gmail.com" },
        { role: "USER" },
      ],
    },
  });

  if (!user) {
    throw new Error("User tidak ditemukan di database!");
  }

  console.log("✓ Target User:", user.email, "ID:", user.id);

  const items = [
    {
      id: "item-1",
      no: 1,
      jenisBarang: "Alat Rebana",
      spesifikasi: "1 paket lengkap alat rebana hadroh / rebana Fatayat NU",
      jumlah: 1,
      satuan: "paket",
      hargaSatuan: 5800000,
      totalHarga: 5800000,
    },
  ];

  // 2. Upsert PurchaseOrder record
  const nomorSp = "02/A/PR.FNU/VIII/2026";
  const tanggal = new Date("2026-08-01T00:00:00.000Z");

  const purchaseOrder = await prisma.purchaseOrder.upsert({
    where: {
      userId_nomorSp: {
        userId: user.id,
        nomorSp,
      },
    } as any,
    update: {
      tanggal,
      namaPaket: "Pembelian Alat Rebana",
      pihak1Nama: "HENI FUJIATI",
      pihak1Jabatan: "Ketua",
      pihak1Alamat: "Jl Kemuning 2016 Desa Dawuhan RT. 23 RW. 06 Kec. Talang Kab. Tegal",
      pihak2Toko: "ADHUFU",
      pihak2Nama: "ANSHORI",
      pihak2Alamat: "Jl. Sunan Amangkurat 1 Pesarean Kejeron",
      itemsJson: JSON.stringify(items),
      subtotal: 5800000,
      pajak: 0,
      pajakKeterangan: "- (Sudah Termasuk Pajak)",
      totalHarga: 5800000,
      terbilang: "Lima Juta Delapan Ratus Ribu Rupiah",
      batasWaktu: "2026-08-04",
      waktuPenyelesaian: "3 (tiga) hari kalender dan pekerjaan harus sudah selesai pada tanggal 04 Agustus 2026",
      alamatPengiriman: "Jl. Sunan Amangkurat 1 Pesarean Kejeron",
      alamatPemeriksaan: "Jl. Kemuning 2016 Desa Dawuhan RT. 23 RW. 06 Kec. Talang Kab. Tegal",
      dendaKeterlambatan: "Terhadap setiap hari keterlambatan penyelesaian pekerjaan Penyedia barang akan dikenakan Denda Keterlambatan sebesar 1/500 (satu per seribu) dari Nilai Pekerjaan atau bagian tertentu dari Nilai Pekerjaan sebelum PPN sesuai dengan persyaratan dan ketentuan yang berlaku",
      userId: user.id,
    },
    create: {
      nomorSp,
      tanggal,
      namaPaket: "Pembelian Alat Rebana",
      pihak1Nama: "HENI FUJIATI",
      pihak1Jabatan: "Ketua",
      pihak1Alamat: "Jl Kemuning 2016 Desa Dawuhan RT. 23 RW. 06 Kec. Talang Kab. Tegal",
      pihak2Toko: "ADHUFU",
      pihak2Nama: "ANSHORI",
      pihak2Alamat: "Jl. Sunan Amangkurat 1 Pesarean Kejeron",
      itemsJson: JSON.stringify(items),
      subtotal: 5800000,
      pajak: 0,
      pajakKeterangan: "- (Sudah Termasuk Pajak)",
      totalHarga: 5800000,
      terbilang: "Lima Juta Delapan Ratus Ribu Rupiah",
      batasWaktu: "2026-08-04",
      waktuPenyelesaian: "3 (tiga) hari kalender dan pekerjaan harus sudah selesai pada tanggal 04 Agustus 2026",
      alamatPengiriman: "Jl. Sunan Amangkurat 1 Pesarean Kejeron",
      alamatPemeriksaan: "Jl. Kemuning 2016 Desa Dawuhan RT. 23 RW. 06 Kec. Talang Kab. Tegal",
      dendaKeterlambatan: "Terhadap setiap hari keterlambatan penyelesaian pekerjaan Penyedia barang akan dikenakan Denda Keterlambatan sebesar 1/500 (satu per seribu) dari Nilai Pekerjaan atau bagian tertentu dari Nilai Pekerjaan sebelum PPN sesuai dengan persyaratan dan ketentuan yang berlaku",
      userId: user.id,
    },
  });

  console.log("✓ Purchase Order berhasil disimpan ke database!");
  console.log("ID:", purchaseOrder.id);
  console.log("Nomor SP:", purchaseOrder.nomorSp);
  console.log("Paket:", purchaseOrder.namaPaket);
  console.log("Total:", purchaseOrder.totalHarga);
  console.log("Terbilang:", purchaseOrder.terbilang);
}

main()
  .catch((e) => {
    console.error("Error seeding Purchase Order:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
