import { prisma } from "@/lib/prisma";

export type LogLevel = "ERROR" | "WARN" | "INFO";

export interface CreateLogInput {
  level?: LogLevel;
  action: string;
  message: string;
  details?: string | null;
  endpoint?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  ipAddress?: string | null;
}

export class LoggerService {
  /**
   * Catat aktivitas, warning, atau error ke tabel system_logs
   */
  async log(input: CreateLogInput) {
    try {
      return await prisma.systemLog.create({
        data: {
          level: input.level || "INFO",
          action: input.action,
          message: input.message,
          details: input.details ?? null,
          endpoint: input.endpoint ?? null,
          userId: input.userId ?? null,
          userEmail: input.userEmail ?? null,
          ipAddress: input.ipAddress ?? null,
        },
      });
    } catch (err) {
      console.error("[LoggerService] Gagal mencatat log ke DB:", err);
      return null;
    }
  }

  /**
   * Helper spesifik untuk menangkap error / exception & stack trace
   */
  async logError(
    action: string,
    err: unknown,
    context?: { endpoint?: string; userId?: string; userEmail?: string }
  ) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    const details = stack ? `${message}\n\nStack Trace:\n${stack}` : JSON.stringify(err);

    return await this.log({
      level: "ERROR",
      action,
      message,
      details,
      endpoint: context?.endpoint,
      userId: context?.userId,
      userEmail: context?.userEmail,
    });
  }

  /**
   * Mengambil daftar log untuk monitoring Super Admin
   */
  async getLogs(params?: {
    level?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      const { level, search, limit = 50, offset = 0 } = params || {};

      const where: any = {};
      if (level && level !== "ALL") {
        where.level = level;
      }
      if (search && search.trim()) {
        const query = search.trim();
        where.OR = [
          { message: { contains: query, mode: "insensitive" } },
          { action: { contains: query, mode: "insensitive" } },
          { endpoint: { contains: query, mode: "insensitive" } },
          { userEmail: { contains: query, mode: "insensitive" } },
          { details: { contains: query, mode: "insensitive" } },
        ];
      }

      const [items, total] = await Promise.all([
        prisma.systemLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        }),
        prisma.systemLog.count({ where }),
      ]);

      return { items, total };
    } catch (error) {
      console.error("[LoggerService.getLogs] Error:", error);
      return { items: [], total: 0 };
    }
  }

  /**
   * Menghitung statistik keparahan log
   */
  async getStats() {
    try {
      const [total, errors, warns, infos] = await Promise.all([
        prisma.systemLog.count(),
        prisma.systemLog.count({ where: { level: "ERROR" } }),
        prisma.systemLog.count({ where: { level: "WARN" } }),
        prisma.systemLog.count({ where: { level: "INFO" } }),
      ]);

      return { total, errors, warns, infos };
    } catch (error) {
      console.error("[LoggerService.getStats] Error:", error);
      return { total: 0, errors: 0, warns: 0, infos: 0 };
    }
  }

  /**
   * Hapus seluruh log (maintenance)
   */
  async clearAll() {
    try {
      const result = await prisma.systemLog.deleteMany({});
      return { success: true, count: result.count };
    } catch (error) {
      console.error("[LoggerService.clearAll] Error:", error);
      return { success: false, count: 0 };
    }
  }
}

export const loggerService = new LoggerService();
