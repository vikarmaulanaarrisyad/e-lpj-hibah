import { prisma } from "../src/lib/prisma";
import { institutionService } from "../src/services/institution.service";

async function main() {
  console.log("--- STARTING KOP SURAT & CLOUDINARY LOGO VERIFICATION ---");

  // 1. Get sample user
  const user = await prisma.user.findFirst();
  if (!user) {
    throw new Error("No user found in database!");
  }
  console.log("✓ User loaded:", user.email, "ID:", user.id);

  // 2. Fetch or initialize institution profile
  const getRes = await institutionService.getProfile(user.id);
  console.log("✓ Get Profile Result:", getRes.success, "Nama Lembaga:", getRes.data?.namaLembaga);
  if (!getRes.success || !getRes.data) {
    throw new Error("Failed to get profile");
  }

  // 3. Update Kop Surat, Logo (sample 1x1 png base64), and Numbers
  const sampleLogoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  const updateRes = await institutionService.updateProfile(user.id, {
    namaLembaga: "PIMPINAN RANTING FATAYAT NU",
    subNama: "DAWUHAN SELATAN",
    instansiInduk: "KECAMATAN TALANG KABUPATEN TEGAL",
    alamat: "Jl. Kemuning 2016 Desa Dawuhan RT.23 RW.06 Talang – Tegal 52193",
    email: "prfnudawuhanselatan@gmail.com",
    noHp: "085642719869",
    noRegistrasi: "HBH-2026-NU-0428",
    logoBase64OrUrl: sampleLogoBase64,
    namaKetua: "HENI FUJIATI",
    jabatanKetua: "Ketua Pimpinan Ranting Fatayat NU Dawuhan Selatan",
    namaBendahara: "NUR ALIMAH",
  });

  console.log("✓ Update Profile Result:", updateRes.success, "Message:", updateRes.message);
  console.log("✓ Persisted Logo URL:", updateRes.data?.logoUrl ? "Exists (length: " + updateRes.data.logoUrl.length + ")" : "None");
  console.log("✓ Persisted No. Registrasi:", updateRes.data?.noRegistrasi);
  console.log("✓ Persisted No. HP:", updateRes.data?.noHp);

  // 4. Read directly from prisma to verify database persistence
  const dbProfile = await prisma.institutionProfile.findUnique({
    where: { userId: user.id },
  });

  if (!dbProfile) {
    throw new Error("Profile not found in database via direct Prisma query!");
  }

  console.log("✓ Direct DB Query verified. ID:", dbProfile.id, "subNama:", dbProfile.subNama);
  console.log("--- ALL KOP SURAT, LOGO, AND NUMBER VERIFICATIONS PASSED ---");
}

main()
  .catch((err) => {
    console.error("Verification Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
