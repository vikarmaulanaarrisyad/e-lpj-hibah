const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'prfnudawuhanselatan@gmail.com' }
  });
  console.log('USER:', user?.id, user?.email);
  const profile = await prisma.institutionProfile.findFirst({ where: { userId: user.id } });
  console.log('=== PROFILE ===', {
    formatNomorKwitansi: profile?.formatNomorKwitansi,
    formatNomorSp: profile?.formatNomorSp,
    formatNomorBast: profile?.formatNomorBast
  });

  const receipts = await prisma.receipt.findMany({ where: { userId: user.id } });
  console.log('=== RECEIPTS (' + receipts.length + ') ===');
  receipts.forEach(r => console.log(JSON.stringify({ id: r.id, no: r.nomorBukti, tgl: r.tanggal, nominal: r.nominal, uraian: r.uraian }, null, 2)));

  const pos = await prisma.purchaseOrder.findMany({ where: { userId: user.id } });
  console.log('=== POS (' + pos.length + ') ===');
  pos.forEach(p => console.log(JSON.stringify({ id: p.id, no: p.nomorSp, tgl: p.tanggal, paket: p.namaPaket, total: p.totalHarga, receiptId: p.receiptId }, null, 2)));

  const basts = await prisma.bastDocument.findMany({ where: { userId: user.id } });
  console.log('=== BAST (' + basts.length + ') ===');
  basts.forEach(b => console.log(JSON.stringify({ id: b.id, no: b.nomorBast, spk: b.nomorSpk, tgl: b.tanggal, tglSpk: b.tanggalSpk, kegiatan: b.namaKegiatan, receiptId: b.receiptId }, null, 2)));

  const docs = await prisma.activityDocumentation.findMany({ where: { userId: user.id } });
  console.log('=== DOCS (' + docs.length + ') ===');
  docs.forEach(d => console.log(JSON.stringify({ id: d.id, judul: d.judulDokumentasi, ref: d.nomorReferensi, tgl: d.tanggalKegiatan, kegiatan: d.namaKegiatan }, null, 2)));

  const vendors = await prisma.vendor.findMany({ where: { userId: user.id } });
  console.log('=== VENDORS (' + vendors.length + ') ===');
  vendors.forEach(v => console.log(JSON.stringify(v, null, 2)));
}

main().catch(console.error).finally(() => prisma.$disconnect());
