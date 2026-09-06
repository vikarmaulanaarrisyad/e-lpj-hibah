import { redirect } from "next/navigation";
import { authService } from "@/services/auth.service";

export default async function HomePage() {
  const session = await authService.getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "ADMIN") {
    redirect("/admin");
  } else {
    redirect("/user");
  }
}
