/**
 * Placeholder auth types — UI shell only.
 *
 * These types describe the SHAPE the real auth layer will use, but no real
 * auth is wired today. Do not import Supabase here. Do not add any runtime
 * code beyond types/constants.
 *
 * See: docs/AUTH_ARCHITECTURE_PLAN.md
 *      docs/database/auth-draft/001_auth_user_profiles.sql
 */

export type VeroxaRole = "client" | "team" | "operator" | "owner";

export interface PlaceholderSession {
  userId: string;
  email: string;
  role: VeroxaRole;
  clientId?: string | null;
  displayName?: string | null;
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";
