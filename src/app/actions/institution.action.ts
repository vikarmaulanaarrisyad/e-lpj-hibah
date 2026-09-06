"use server";

import { authService } from "@/services/auth.service";
import { institutionService } from "@/services/institution.service";
import type {
  InstitutionProfile,
  UpdateInstitutionProfileInput,
  ServiceResponse,
} from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Mengambil profil Kop Surat dan Lembaga
 */
export async function getInstitutionProfileAction(): Promise<ServiceResponse<InstitutionProfile>> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return { success: false, message: "Sesi tidak valid." };
    }

    return await institutionService.getProfile(session.sub);
  } catch (error) {
    console.error("[getInstitutionProfileAction] Error:", error);
    return { success: false, message: "Terjadi kesalahan sistem saat memuat profil." };
  }
}

/**
 * Server Action: Menyimpan atau memperbarui profil Kop Surat, Logo, dan Nomor
 */
export async function saveInstitutionProfileAction(
  input: UpdateInstitutionProfileInput
): Promise<ServiceResponse<InstitutionProfile>> {
  try {
    const session = await authService.getSession();
    if (!session || !session.sub) {
      return { success: false, message: "Sesi telah berakhir. Silakan login kembali." };
    }

    const res = await institutionService.updateProfile(session.sub, input);
    if (res.success) {
      revalidatePath("/user");
      revalidatePath("/user/bast");
      revalidatePath("/user/kwitansi");
      revalidatePath("/user/bku");
    }
    return res;
  } catch (error) {
    console.error("[saveInstitutionProfileAction] Error:", error);
    return { success: false, message: "Gagal menyimpan data Kop Surat." };
  }
}
