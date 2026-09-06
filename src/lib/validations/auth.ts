import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email wajib diisi" })
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid (contoh: user@hibah.internal)"),
  password: z
    .string({ required_error: "Password wajib diisi" })
    .min(6, "Password minimal 6 karakter"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string({ required_error: "Nama penanggung jawab wajib diisi" })
      .min(3, "Nama penanggung jawab minimal 3 karakter")
      .max(100, "Nama maksimal 100 karakter"),
    institution: z
      .string({ required_error: "Nama lembaga / organisasi wajib diisi" })
      .min(3, "Nama lembaga minimal 3 karakter")
      .max(150, "Nama lembaga maksimal 150 karakter"),
    leaderName: z
      .string()
      .max(100, "Nama ketua maksimal 100 karakter")
      .optional()
      .or(z.literal("")),
    email: z
      .string({ required_error: "Email wajib diisi" })
      .min(1, "Email wajib diisi")
      .email("Format email tidak valid (contoh: lembaga@domain.com)"),
    nip: z
      .string()
      .max(50, "Nomor registrasi maksimal 50 karakter")
      .optional()
      .or(z.literal("")),
    password: z
      .string({ required_error: "Password wajib diisi" })
      .min(6, "Password minimal 6 karakter"),
    confirmPassword: z
      .string({ required_error: "Konfirmasi password wajib diisi" })
      .min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok dengan password di atas",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
