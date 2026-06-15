/**
 * placeholderSession.ts — temporary pilot-session marker for placeholder auth.
 *
 * This is not production auth. It only records that the current browser tab
 * completed the server-controlled/manual pilot login flow. Missing, wrong, or
 * stale credentials never create a marker, and team/client routes must not
 * render from AUTH_MODE alone.
 */

import type { VeroxaRole, VeroxaSession } from "./authContract";
import { findPilotAccessAccountBySessionFields, getPilotAccessStatus } from "./pilotAccessAccounts";

const LEGACY_PLACEHOLDER_SESSION_KEYS = ["veroxa.placeholder.session.v1"] as const;
const PLACEHOLDER_SESSION_KEY = "veroxa.placeholder.session.v2.post-pr87";
const PLACEHOLDER_SESSION_VERSION = "post-pr87-pilot-session-v2";
const PLACEHOLDER_SESSION_KIND = "server-controlled-pilot";

interface StoredPlaceholderSession {
  sessionVersion: typeof PLACEHOLDER_SESSION_VERSION;
  sessionKind: typeof PLACEHOLDER_SESSION_KIND;
  accountId: string;
  role: VeroxaRole;
  email: string;
  accountLabel: string;
  clientId: string | null;
  restaurantId: string | null;
  createdAt: string;
}

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function clearLegacyPlaceholderSessions(): void {
  if (!canUseSessionStorage()) return;
  for (const key of LEGACY_PLACEHOLDER_SESSION_KEYS) {
    window.sessionStorage.removeItem(key);
  }
}

export function createPlaceholderSession(input: {
  role: VeroxaRole;
  email: string;
  accountLabel: string;
  accountId: string;
  clientId: string | null;
  restaurantId: string | null;
}): void {
  if (!canUseSessionStorage()) return;
  clearLegacyPlaceholderSessions();
  const payload: StoredPlaceholderSession = {
    sessionVersion: PLACEHOLDER_SESSION_VERSION,
    sessionKind: PLACEHOLDER_SESSION_KIND,
    accountId: input.accountId,
    role: input.role,
    email: input.email.trim().toLowerCase(),
    accountLabel: input.accountLabel,
    clientId: input.clientId,
    restaurantId: input.restaurantId,
    createdAt: new Date().toISOString(),
  };
  window.sessionStorage.setItem(PLACEHOLDER_SESSION_KEY, JSON.stringify(payload));
}

export function clearPlaceholderSession(): void {
  if (!canUseSessionStorage()) return;
  clearLegacyPlaceholderSessions();
  window.sessionStorage.removeItem(PLACEHOLDER_SESSION_KEY);
}

export function readPlaceholderSession(): VeroxaSession | null {
  if (!canUseSessionStorage()) return null;
  clearLegacyPlaceholderSessions();
  if (!getPilotAccessStatus().isConfigured) {
    window.sessionStorage.removeItem(PLACEHOLDER_SESSION_KEY);
    return null;
  }
  const raw = window.sessionStorage.getItem(PLACEHOLDER_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredPlaceholderSession>;
    if (
      parsed.sessionVersion !== PLACEHOLDER_SESSION_VERSION ||
      parsed.sessionKind !== PLACEHOLDER_SESSION_KIND ||
      typeof parsed.accountId !== "string" ||
      (parsed.role !== "client" && parsed.role !== "team") ||
      typeof parsed.email !== "string" ||
      typeof parsed.accountLabel !== "string" ||
      (parsed.clientId !== null && typeof parsed.clientId !== "string") ||
      (parsed.restaurantId !== null && typeof parsed.restaurantId !== "string") ||
      typeof parsed.createdAt !== "string"
    ) {
      clearPlaceholderSession();
      return null;
    }

    const account = findPilotAccessAccountBySessionFields({
      accountId: parsed.accountId,
      email: parsed.email,
      role: parsed.role,
      clientId: parsed.clientId,
      restaurantId: parsed.restaurantId,
    });
    if (!account) {
      clearPlaceholderSession();
      return null;
    }

    return {
      userId: account.accountId,
      email: account.email,
      role: account.role,
      clientId: account.clientId,
      displayName: account.accountLabel,
      accountStatus: "active",
    };
  } catch {
    clearPlaceholderSession();
    return null;
  }
}
