/**
 * placeholderSession.ts — temporary pilot-session marker for placeholder auth.
 *
 * This is not production auth. It only records that the current browser tab
 * completed the deterministic/manual pilot login flow. Missing or wrong credentials
 * never create a marker, and team routes must not render from AUTH_MODE alone.
 */

import type { VeroxaRole, VeroxaSession } from "./authContract";

const PLACEHOLDER_SESSION_KEY = "veroxa.placeholder.session.v1";

interface StoredPlaceholderSession {
  role: VeroxaRole;
  email: string;
  accountLabel: string | null;
  clientId: string | null;
  restaurantId: string | null;
  createdAt: string;
}

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function createPlaceholderSession(
  role: VeroxaRole,
  email: string,
  accountLabel: string | null = null,
  clientId: string | null = null,
  restaurantId: string | null = null,
): void {
  if (!canUseSessionStorage()) return;
  const payload: StoredPlaceholderSession = {
    role,
    email: email.trim().toLowerCase(),
    accountLabel,
    clientId,
    restaurantId,
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
      userId: `pilot-${parsed.role}`,
      email: parsed.email,
      role: parsed.role,
      clientId: typeof parsed.clientId === "string" ? parsed.clientId : null,
      displayName: typeof parsed.accountLabel === "string" && parsed.accountLabel.trim()
        ? parsed.accountLabel
        : parsed.role === "team" ? "Team Faraz" : "Momo House San Antonio",
    };
  } catch {
    clearPlaceholderSession();
    return null;
  }
}
