import { authService } from "../src/services/auth.service";
import { prisma } from "../src/lib/prisma";

async function runTest() {
  console.log("=== TEST REGISTRATION MODULE ===");

  const testEmail = `test.lembaga.${Date.now()}@hibah.internal`;
  const input = {
    name: "Drs. H. Mulyadi",
    institution: "Yayasan Pondok Pesantren Al-Hidayah",
    email: testEmail,
    nip: "AHU-009988.AH.01.2026",
    password: "Password123!",
    confirmPassword: "Password123!",
  };

  console.log("1. Testing valid registration for:", testEmail);
  const result = await authService.register(input);
  console.log("Result success:", result.success);
  console.log("Result message:", result.message);
  console.log("Redirect URL:", result.data?.redirectUrl);
  console.log("Session payload:", result.data?.user);

  if (!result.success) {
    throw new Error("Registration should have succeeded!");
  }

  console.log("\n2. Testing duplicate email rejection for:", testEmail);
  const dupResult = await authService.register(input);
  console.log("Duplicate result success:", dupResult.success);
  console.log("Duplicate result message:", dupResult.message);

  if (dupResult.success) {
    throw new Error("Duplicate registration should have failed!");
  }

  // Cleanup test user
  await prisma.user.delete({
    where: { email: testEmail },
  });
  console.log("\n3. Cleaned up test user successfully.");

  console.log("=== ALL REGISTRATION TESTS PASSED ===");
}

runTest()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
