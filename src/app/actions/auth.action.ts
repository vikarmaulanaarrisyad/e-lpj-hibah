"use server";

import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/validations/auth";
import { authService } from "@/services/auth.service";
import type { ActionResponse, LoginResultData, RegisterResultData } from "@/types";

export type { ActionResponse };

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
    return result;
  } catch (error) {
    console.error("[registerAction] Unexpected error:", error);
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
    return result;
  } catch (error) {
    console.error("[loginAction] Unexpected error:", error);
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
