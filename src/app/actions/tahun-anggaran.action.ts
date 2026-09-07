"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { COOKIE_TAHUN_ANGGARAN, normalizeTahunAnggaran } from "@/lib/utils/tahun-anggaran";

/**
 * Menyimpan tahun anggaran aktif ke dalam cookie HTTP-only / browser session
 */
export async function setTahunAnggaranAction(tahun: string) {
  const norm = normalizeTahunAnggaran(tahun);
  cookies().set(COOKIE_TAHUN_ANGGARAN, norm, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 tahun persistensi
    sameSite: "lax",
  });

  revalidatePath("/user");
  revalidatePath("/user/kwitansi");
  revalidatePath("/user/pesanan");
  revalidatePath("/user/bast");
  revalidatePath("/user/bku");
  revalidatePath("/user/rab");
  revalidatePath("/user/dokumentasi");
  revalidatePath("/user/cover");
  revalidatePath("/user/surat-pengantar");

  return { success: true, tahun: norm };
}

/**
 * Mengambil tahun anggaran aktif dari cookie
 */
export async function getTahunAnggaranAction(): Promise<string> {
  const c = cookies().get(COOKIE_TAHUN_ANGGARAN);
  return normalizeTahunAnggaran(c?.value);
}
