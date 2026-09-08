import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.DEBUG_PRISMA === "true" ? ["query", "error", "warn"] : ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Utility retry otomatis untuk mengatasi lonjakan latensi / transient connection drop WAN ke Supabase
 */
export async function withPrismaRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 500
): Promise<T> {
  let lastError: any;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const msg = error?.message || "";
      const isTransientConnError =
        error?.code === "P1001" ||
        error?.code === "P1002" ||
        error?.code === "P1017" ||
        msg.includes("Can't reach database server") ||
        msg.includes("connection closed") ||
        msg.includes("Connection terminated") ||
        msg.includes("timed out");

      if (isTransientConnError && i < retries) {
        console.warn(`[PrismaRetry] Koneksi Supabase terputus sesaat, mencoba ulang (${i + 1}/${retries})...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
