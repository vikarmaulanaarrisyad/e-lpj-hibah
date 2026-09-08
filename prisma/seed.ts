import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seeding akun Super Admin & Pengawas Sistem E-LPJ Hibah...");

  const superAdminPassword = await bcrypt.hash("Admin123!", 10);

  // 1. Akun Utama Super Admin Monitoring & Error Tracking
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@hibah.internal" },
    update: {
      name: "Super Admin Sistem & Monitoring",
      role: Role.ADMIN,
      institution: "Inspektorat / BPKAD Pengawasan Hibah Daerah",
      nip: "198203152006041002",
    },
    create: {
      email: "superadmin@hibah.internal",
      name: "Super Admin Sistem & Monitoring",
      password: superAdminPassword,
      role: Role.ADMIN,
      institution: "Inspektorat / BPKAD Pengawasan Hibah Daerah",
      nip: "198203152006041002",
      leaderName: "Koordinator Pengawasan & Verifikasi Sistem",
    },
  });
  console.log("✅ Super Admin Utama berhasil di-seed:", superAdmin.email);

  // 2. Akun Alias Admin Verifikator (kompatibilitas tombol demo)
  const adminVerifikator = await prisma.user.upsert({
    where: { email: "admin@hibah.internal" },
    update: {
      name: "Super Admin Verifikator",
      role: Role.ADMIN,
      institution: "Biro Kesejahteraan Rakyat / BPKAD",
    },
    create: {
      email: "admin@hibah.internal",
      name: "Super Admin Verifikator",
      password: superAdminPassword,
      role: Role.ADMIN,
      institution: "Biro Kesejahteraan Rakyat / BPKAD",
      nip: "198501152010011005",
      leaderName: "Tim Verifikasi LPJ Hibah",
    },
  });
  console.log("✅ Admin Verifikator berhasil di-seed:", adminVerifikator.email);

  // 3. Catat Log Inisialisasi Sistem
  await (prisma as any).systemLog.create({
    data: {
      level: "INFO",
      action: "SYSTEM_INITIALIZED",
      message: "Seeding akun Super Admin & inisialisasi modul monitoring sistem berhasil diselesaikan.",
      endpoint: "prisma/seed.ts",
      userEmail: superAdmin.email,
      userId: superAdmin.id,
      details: JSON.stringify({
        superAdminEmail: superAdmin.email,
        role: superAdmin.role,
        institution: superAdmin.institution,
        timestamp: new Date().toISOString(),
      }),
    },
  });
  console.log("✅ Catatan log sistem perdana berhasil dibuat di tabel system_logs");

  console.log("\n==================================================");
  console.log("🚀 SEEDING SUPER ADMIN BERHASIL!");
  console.log("📧 Email    : superadmin@hibah.internal (atau admin@hibah.internal)");
  console.log("🔑 Password : Admin123!");
  console.log("🛡️ Role     : ADMIN (Super Admin)");
  console.log("📊 Fitur    : Monitoring Error/Bug, Registrasi User, Transaksi");
  console.log("==================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
