"use server";

import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/validations/auth";
import { authService } from "@/services/auth.service";
import { loggerService } from "@/services/logger.service";
import type { ActionResponse, LoginResultData, RegisterResultData } from "@/types";

/**
 * Server Action for User / Institution Registration.
 * Validates form submission, calls AuthService.register, and auto-logs in.
 */
export async function registerAction(
  data: RegisterInput
): Promise<ActionResponse<RegisterResultData>> {
  try {
    // 1. Strict input validation via Zod
    const validationResult = registerSchema.safeParse(data);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(err.message);
      });

      return {
        success: false,
        message: validationResult.error.errors[0]?.message || "Data formulir pendaftaran tidak valid.",
        errors: fieldErrors,
      };
    }

    // 2. Delegate to Service Layer
    const result = await authService.register(validationResult.data);
    if (result.success && result.data) {
      // Catat event registrasi user ke SystemLog
      await loggerService.log({
        level: "INFO",
        action: "USER_REGISTERED",
        message: `Pendaftaran pengguna baru: ${result.data.user.name} (${result.data.user.email}) - Lembaga: ${result.data.user.institution || "-"}`,
        endpoint: "/register",
        userId: result.data.user.sub,
        userEmail: result.data.user.email,
        details: JSON.stringify({
          name: result.data.user.name,
          institution: result.data.user.institution,
          role: result.data.user.role,
        }),
      });
    } else {
      await loggerService.log({
        level: "WARN",
        action: "REGISTRATION_REJECTED",
        message: `Pendaftaran ditolak untuk email ${validationResult.data.email}: ${result.message}`,
        endpoint: "/register",
        userEmail: validationResult.data.email,
      });
    }

    return result;
  } catch (error) {
    console.error("[registerAction] Unexpected error:", error);
    await loggerService.logError("REGISTRATION_UNCAUGHT_ERROR", error, {
      endpoint: "/register",
      userEmail: data.email,
    });
    return {
      success: false,
      message: "Terjadi gangguan sistem saat memproses pendaftaran. Silakan coba beberapa saat lagi.",
    };
  }
}


/**
 * Server Action for User Login.
 * Validates form submission, calls AuthService, and returns standard response type.
 */
export async function loginAction(
  data: LoginInput
): Promise<ActionResponse<LoginResultData>> {
  try {
    // 1. Strict input validation via Zod
    const validationResult = loginSchema.safeParse(data);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(err.message);
      });

      return {
        success: false,
        message: validationResult.error.errors[0]?.message || "Data formulir tidak valid.",
        errors: fieldErrors,
      };
    }

    // 2. Delegate to Service Layer
    const result = await authService.login(validationResult.data);
    if (!result.success) {
      await loggerService.log({
        level: "WARN",
        action: "AUTH_LOGIN_FAILED",
        message: `Gagal login untuk ${validationResult.data.email}: ${result.message}`,
        endpoint: "/login",
        userEmail: validationResult.data.email,
      });
    }
    return result;
  } catch (error) {
    console.error("[loginAction] Unexpected error:", error);
    await loggerService.logError("AUTH_LOGIN_UNCAUGHT_ERROR", error, {
      endpoint: "/login",
      userEmail: data.email,
    });
    return {
      success: false,
      message: "Terjadi gangguan sistem internal. Silakan coba beberapa saat lagi.",
    };
  }
}

/**
 * Server Action for User Logout.
 */
export async function logoutAction(): Promise<ActionResponse<null>> {
  try {
    const result = await authService.logout();
    return result;
  } catch (error) {
    console.error("[logoutAction] Unexpected error:", error);
    return {
      success: false,
      message: "Gagal memproses logout.",
    };
  }
}
