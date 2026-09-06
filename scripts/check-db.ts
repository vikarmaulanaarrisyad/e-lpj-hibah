import { prisma } from "../src/lib/prisma";

async function main() {
  const users = await prisma.user.findMany();
  console.log("=== USERS ===");
  console.log(users);

  const receipts = await prisma.receipt.findMany();
  console.log("=== RECEIPTS ===");
  console.log(receipts);

  const bku = await prisma.bkuTransaction.findMany();
  console.log("=== BKU TRANSACTIONS ===");
  console.log(bku);
}

main().finally(() => prisma.$disconnect());
