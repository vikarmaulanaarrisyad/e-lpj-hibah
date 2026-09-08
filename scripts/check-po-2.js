const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pos = await prisma.purchaseOrder.findMany({
    where: { nomorSp: '02/A/PR.FNU/VIII/2026' }
  });
  console.log('PO 2:', JSON.stringify(pos, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
