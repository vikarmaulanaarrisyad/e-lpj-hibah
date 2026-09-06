import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== UPDATING LEADER NAME IN USERS TABLE ===");

  await prisma.user.updateMany({
    where: { email: "user@hibah.internal" },
    data: {
      institution: "PR Fatayat NU Dawuhan Selatan",
      name: "NUR ALIMAH",
      leaderName: "HENI FUJIATI",
    },
  });

  await prisma.user.updateMany({
    where: { email: "fatayatnudawuhan@gmail.com" },
    data: {
      institution: "PIMPINAN RANTING FATAYAT NU DAWUHAN SELATAN",
      name: "NUR ALIMAH",
      leaderName: "HENI FUJIATI",
    },
  });

  const updatedUsers = await prisma.user.findMany({
    select: { email: true, name: true, leaderName: true, institution: true },
  });
  console.log("Updated Users:", updatedUsers);
}

main().finally(() => prisma.$disconnect());
