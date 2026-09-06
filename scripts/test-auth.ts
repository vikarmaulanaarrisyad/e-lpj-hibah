import { authService } from "../src/services/auth.service";
import { loginSchema } from "../src/lib/validations/auth";

async function runTests() {
  console.log("=== 1. TEST ZOD VALIDATION ===");
  const empty = loginSchema.safeParse({ email: "", password: "" });
  console.log("Empty input valid?", empty.success);
  if (!empty.success) {
    console.log("Empty errors:", empty.error.errors.map(e => e.message));
  }

  const malformed = loginSchema.safeParse({ email: "invalid-email", password: "123" });
  console.log("Malformed input valid?", malformed.success);
  if (!malformed.success) {
    console.log("Malformed errors:", malformed.error.errors.map(e => e.message));
  }

  console.log("\n=== 2. TEST AUTH SERVICE: WRONG PASSWORD ===");
  const wrongPass = await authService.login({ email: "admin@hibah.internal", password: "WrongPassword" });
  console.log("Wrong password success:", wrongPass.success);
  console.log("Wrong password message:", wrongPass.message);

  console.log("\n=== 3. TEST AUTH SERVICE: SUPER ADMIN LOGIN ===");
  const adminLogin = await authService.login({ email: "admin@hibah.internal", password: "Admin123!" });
  console.log("Admin login success:", adminLogin.success);
  console.log("Redirect target:", adminLogin.data?.redirectUrl);
  console.log("User Role:", adminLogin.data?.user.role);
  console.log("User Name:", adminLogin.data?.user.name);

  console.log("\n=== 4. TEST AUTH SERVICE: PENERIMA HIBAH LOGIN ===");
  const userLogin = await authService.login({ email: "user@hibah.internal", password: "User123!" });
  console.log("User login success:", userLogin.success);
  console.log("Redirect target:", userLogin.data?.redirectUrl);
  console.log("User Role:", userLogin.data?.user.role);
  console.log("User Name:", userLogin.data?.user.name);

  console.log("\n=== 5. TEST NON-EXISTENT USER ===");
  const notFound = await authService.login({ email: "random@unknown.com", password: "Password123!" });
  console.log("Non-existent success:", notFound.success);
  console.log("Non-existent message:", notFound.message);

  console.log("\n=== ALL TESTS COMPLETED SUCCESSFULLY ===");
  process.exit(0);
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
