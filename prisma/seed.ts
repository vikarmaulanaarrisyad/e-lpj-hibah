import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Inisialisasi seeding pengguna E-LPJ Hibah...");

  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const userPassword = await bcrypt.hash("User123!", 10);

  // 1. Super Admin / Verifikator
  const admin = await prisma.user.upsert({
    where: { email: "admin@hibah.internal" },
    update: {},
    create: {
      email: "admin@hibah.internal",
      name: "Super Admin Verifikator",
      password: adminPassword,
      role: Role.ADMIN,
      institution: "Biro Kesejahteraan Rakyat / BPKAD",
      nip: "198501152010011005",
    },
  });
  console.log("✅ Super Admin berhasil di-seed:", admin.email);

  // 2. Grant Recipient / Penerima Hibah
  const user = await prisma.user.upsert({
    where: { email: "user@hibah.internal" },
    update: {},
    create: {
      email: "user@hibah.internal",
      name: "Pengurus Yayasan Harapan Bangsa",
      password: userPassword,
      role: Role.USER,
      institution: "Yayasan Pendidikan & Sosial Harapan Bangsa",
    },
  });
  console.log("✅ Penerima Hibah berhasil di-seed:", user.email);

  console.log("🚀 Seeding selesai!");
}

main()
  .catch((e) => {
    console.error("❌ Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
