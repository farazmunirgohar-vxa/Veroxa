/**
 * writeErrors.ts — M023C
 *
 * Map raw write errors to safe, client-facing `WriteFailureResult`
 * envelopes. NEVER leak raw Supabase / Postgres error strings to a
 * client surface.
 */

import type { WriteFailureResult } from "./writeAdapterTypes";

const GENERIC_SAFE_MESSAGE =
  "This action could not be saved yet. The Veroxa team can continue using demo/session mode.";

export function safeWriteFailure(
  message: string = GENERIC_SAFE_MESSAGE,
  retryable: boolean = true,
): WriteFailureResult {
  return {
    ok: false,
    status: "failure",
    safeMessage: message,
    retryable,
  };
}

/**
 * Convert an unknown error (Supabase PostgrestError, network error,
 * thrown JS error) into a safe failure envelope. Logs a short, non-
 * sensitive line for dev visibility but never includes user input
 * or raw error text in the returned `safeMessage`.
 */
export function toSafeWriteFailure(
  error: unknown,
  context: string,
): WriteFailureResult {
  const code = extractErrorCode(error);
  const retryable = isRetryableCode(code);

  if (typeof console !== "undefined" && typeof console.warn === "function") {
    console.warn(`[veroxa.write] ${context} failed`, { code });
  }

  return safeWriteFailure(GENERIC_SAFE_MESSAGE, retryable);
}

function extractErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const e = error as { code?: unknown; status?: unknown };
  if (typeof e.code === "string") return e.code;
  if (typeof e.status === "number") return `http_${e.status}`;
  return undefined;
}

function isRetryableCode(code: string | undefined): boolean {
  if (!code) return true;
  // Schema / permissions / validation are not retryable.
  // 42P01 undefined_table, 42501 insufficient_privilege,
  // 23xxx integrity constraint violations, http_401/403/404.
  if (
    code === "42P01" ||
    code === "42501" ||
    code.startsWith("23") ||
    code === "http_400" ||
    code === "http_401" ||
    code === "http_403" ||
    code === "http_404" ||
    code === "http_422"
  ) {
    return false;
  }
  return true;
}
