import type { Role, User } from "@prisma/client";

export type { Role, User };

export interface CreateUserData {
  email: string;
  name: string;
  leaderName?: string | null;
  password: string; // Already hashed
  role: Role;
  institution?: string | null;
  nip?: string | null;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  leaderName?: string | null;
  role: Role;
  institution?: string | null;
  nip?: string | null;
  createdAt: Date;
}

