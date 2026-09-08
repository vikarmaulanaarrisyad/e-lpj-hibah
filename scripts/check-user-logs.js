const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'prfnudawuhanselatan@gmail.com' }
  });
  if (!user) return;

  const logs = await prisma.userActivity.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  console.log('USER ACTIVITIES (' + logs.length + '):');
  logs.forEach(l => console.log(`- [${l.createdAt.toISOString()}] ${l.action}: ${l.description}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
