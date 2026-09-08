const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'prfnudawuhanselatan@gmail.com' }
  });
  console.log('USER:', user?.id, user?.email);
  if (!user) return;

  const receipts = await prisma.receipt.findMany({ where: { userId: user.id } });
  console.log('RECEIPTS (' + receipts.length + '):', receipts.map(r => ({ id: r.id, no: r.nomorBukti, nominal: r.nominal, uraian: r.uraian })));

  const basts = await prisma.bastDocument.findMany({ where: { userId: user.id } });
  console.log('BAST (' + basts.length + '):', basts.map(b => ({ id: b.id, no: b.nomorBast, kegiatan: b.namaKegiatan, receiptId: b.receiptId })));

  const pos = await prisma.purchaseOrder.findMany({ where: { userId: user.id } });
  console.log('POS (' + pos.length + '):', pos.map(p => ({ id: p.id, no: p.nomorSp, paket: p.namaPaket, receiptId: p.receiptId })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
