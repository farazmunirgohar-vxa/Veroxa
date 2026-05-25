import type { AppRole } from "@/domain/users/permissions";

export type AuthStatus = "anonymous" | "authenticating" | "authenticated" | "expired" | "denied";

export interface AuthUser {
  id:        string;
  name:      string;
  email:     string;
  role:      AppRole;
  clientId?: string;   // present when role === "client"
}

export interface Session {
  user:       AuthUser;
  issuedAt:   string;
  expiresAt:  string;
  token:      string;  // demo opaque string
}

export interface Credentials {
  email:    string;
  password: string;
}

export type AuthResult =
  | { ok: true;  session: Session }
  | { ok: false; reason: "invalid_credentials" | "role_locked" | "session_expired" | "unknown" };
