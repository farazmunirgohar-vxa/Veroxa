/**
 * placeholderSession.ts — temporary preview-session marker for placeholder auth.
 *
 * This is not production auth. It only records that the current browser tab
 * completed the env-backed placeholder login flow. Missing or wrong credentials
 * never create a marker, and team routes must not render from AUTH_MODE alone.
 */

import type { VeroxaRole, VeroxaSession } from "./authContract";

const PLACEHOLDER_SESSION_KEY = "veroxa.placeholder.session.v1";

interface StoredPlaceholderSession {
  role: VeroxaRole;
  email: string;
  createdAt: string;
}

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function createPlaceholderSession(role: VeroxaRole, email: string): void {
  if (!canUseSessionStorage()) return;
  const payload: StoredPlaceholderSession = {
    role,
    email: email.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
  };
  window.sessionStorage.setItem(PLACEHOLDER_SESSION_KEY, JSON.stringify(payload));
}

export function clearPlaceholderSession(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(PLACEHOLDER_SESSION_KEY);
}

export function readPlaceholderSession(): VeroxaSession | null {
  if (!canUseSessionStorage()) return null;
  const raw = window.sessionStorage.getItem(PLACEHOLDER_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredPlaceholderSession>;
    if ((parsed.role !== "client" && parsed.role !== "team") || typeof parsed.email !== "string") {
      clearPlaceholderSession();
      return null;
    }

    return {
      userId: `placeholder-${parsed.role}`,
      email: parsed.email,
      role: parsed.role,
      clientId: parsed.role === "client" ? null : null,
      displayName: parsed.role === "team" ? "Veroxa Team" : "Restaurant Partner",
    };
  } catch {
    clearPlaceholderSession();
    return null;
  }
}
