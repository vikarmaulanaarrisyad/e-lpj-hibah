import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { userRepository } from "@/repositories/user.repository";
import type { LoginInput, RegisterInput } from "@/lib/validations/auth";
import type { SessionPayload, LoginResultData, RegisterResultData, ServiceResponse } from "@/types";

const COOKIE_NAME = "e_lpj_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "e-lpj-hibah-internal-super-secret-key-32chars-min"
);

export class AuthService {
  /**
   * Register a new user/institution, hash password, create session JWT, and store in cookie.
   */
  async register(input: RegisterInput): Promise<ServiceResponse<RegisterResultData>> {
    const normalizedEmail = input.email.toLowerCase().trim();

    // 1. Check if email already registered
    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      return {
        success: false,
        message: "Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.",
      };
    }

    // 2. Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // 3. Create user in database (Default role: USER)
    const newUser = await userRepository.create({
      email: normalizedEmail,
      name: input.name.trim(),
      leaderName: input.leaderName?.trim() || null,
      password: hashedPassword,
      role: "USER",
      institution: input.institution.trim(),
      nip: input.nip ? input.nip.trim() : null,
    });

    // 4. Prepare session payload
    const sessionPayload: SessionPayload = {
      sub: newUser.id,
      email: newUser.email,
      name: newUser.name,
      leaderName: newUser.leaderName,
      role: "USER",
      institution: newUser.institution,
      nip: newUser.nip,
    };

    // 5. Sign JWT (Valid for 24 hours)
    const token = await new SignJWT({ ...sessionPayload })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    // 6. Store in HTTP-only cookie
    try {
      const cookieStore = cookies();
      cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });
    } catch {
      // Running outside request context
    }

    return {
      success: true,
      message: `Pendaftaran berhasil! Selamat datang, ${newUser.name}. Mengalihkan ke dashboard...`,
      data: {
        redirectUrl: "/user",
        user: sessionPayload,
      },
    };
  }

  /**
   * Authenticate user credentials, generate session JWT, and store in HTTP-only cookie.
   */
  async login(input: LoginInput): Promise<ServiceResponse<LoginResultData>> {
    // 1. Query user from repository
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      return {
        success: false,
        message: "Email atau password yang Anda masukkan tidak sesuai.",
      };
    }

    // 2. Compare password hash
    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      return {
        success: false,
        message: "Email atau password yang Anda masukkan tidak sesuai.",
      };
    }

    // 3. Prepare session payload
    const sessionPayload: SessionPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      leaderName: user.leaderName,
      role: user.role as "ADMIN" | "USER",
      institution: user.institution,
      nip: user.nip,
    };

    // 4. Sign JWT (Valid for 1 day)
    const token = await new SignJWT({ ...sessionPayload })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    // 5. Store in HTTP-only cookie if in request context
    try {
      const cookieStore = cookies();
      cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });
    } catch {
      // Running outside request context (e.g. testing)
    }

    // 6. Determine role-based redirection
    const redirectUrl = user.role === "ADMIN" ? "/admin" : "/user";

    return {
      success: true,
      message: `Selamat datang kembali, ${user.name}! Mengalihkan ke dashboard...`,
      data: {
        redirectUrl,
        user: sessionPayload,
      },
    };
  }

  /**
   * Clear session cookie and log out the user.
   */
  async logout(): Promise<ServiceResponse<null>> {
    try {
      const cookieStore = cookies();
      cookieStore.delete(COOKIE_NAME);
    } catch {
      // Non-request context
    }

    return {
      success: true,
      message: "Sesi telah berakhir. Anda berhasil keluar.",
    };
  }

  /**
   * Verify and retrieve current active session.
   */
  async getSession(): Promise<SessionPayload | null> {
    try {
      const cookieStore = cookies();
      const token = cookieStore.get(COOKIE_NAME)?.value;
      if (!token) return null;

      const { payload } = await jwtVerify(token, JWT_SECRET);
      return payload as unknown as SessionPayload;
    } catch {
      return null;
    }
  }

  /**
   * Helper to verify a raw token string (used in Next.js Edge Middleware).
   */
  async verifyTokenString(token: string): Promise<SessionPayload | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return payload as unknown as SessionPayload;
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
