import { prisma } from "@/lib/prisma";
import type { User, CreateUserData } from "@/types";

export class UserRepository {
  /**
   * Find a user by their unique email address.
   * Strictly raw database query, no business rules or validation logic.
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
    } catch (error) {
      console.error("[UserRepository] Error in findByEmail:", error);
      throw error;
    }
  }

  /**
   * Find a user by their unique ID.
   */
  async findById(id: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error("[UserRepository] Error in findById:", error);
      throw error;
    }
  }

  /**
   * Create a new user record in the database.
   */
  async create(data: CreateUserData): Promise<User> {
    try {
      return await prisma.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          name: data.name,
          password: data.password,
          role: data.role,
          institution: data.institution ?? null,
          leaderName: data.leaderName ?? null,
          nip: data.nip ?? null,
        },
      });
    } catch (error) {
      console.error("[UserRepository] Failed to create user:", error);
      throw new Error("Gagal menyimpan data pengguna ke database.");
    }
  }

  /**
   * Update institution and leader information for a user
   */
  async updateInstitutionAndLeader(
    id: string,
    data: { institution?: string; leaderName?: string }
  ): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data: {
          ...(data.institution !== undefined && { institution: data.institution }),
          ...(data.leaderName !== undefined && { leaderName: data.leaderName }),
        },
      });
    } catch (error) {
      console.error("[UserRepository] Failed to update institution/leader:", error);
      throw error;
    }
  }
}

export const userRepository = new UserRepository();
