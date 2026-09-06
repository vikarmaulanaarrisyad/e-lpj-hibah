import type { Role } from "./user";

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  leaderName?: string | null;
  role: Role;
  institution?: string | null;
  nip?: string | null;
}

export interface LoginResultData {
  redirectUrl: string;
  user: SessionPayload;
}

export type RegisterResultData = LoginResultData;

