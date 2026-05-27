/**
 * writeReadiness.ts — M022, extended in M023B
 *
 * Single source of truth for "are real writes turned on?" in this
 * build. Imported by surfaces that might otherwise assume writes
 * work (e.g. upload form, direction submit, team review actions).
 *
 * THIS FILE NEVER WRITES. No Supabase calls, no fetch, no network.
 *
 * The next build (M023C) will introduce a controlled
 * `VITE_VEROXA_ENABLE_DEV_WRITES` flag, an anon/auth-safe write
 * adapter, and per-table policies. Until then `WRITES_ENABLED`
 * stays false and `CURRENT_WRITE_MODE` stays `"disabled"`.
 *
 * Any `VITE_VEROXA_ENABLE_DEV_WRITES` value in env is intentionally
 * IGNORED by this build — see `getWriteMode()`.
 */

export const WRITES_ENABLED = false as const;

export type WriteMode = "disabled" | "dev_supabase_writes";

/**
 * Locked to "disabled" for M023B. The flag exists so call sites can
 * branch on it without further refactor when M023C enables dev
 * writes behind an explicit env flag.
 */
export const CURRENT_WRITE_MODE: WriteMode = "disabled";

export function getWriteMode(): WriteMode {
  // Intentionally does NOT read any env flag in this build. M023C
  // will switch this to read `VITE_VEROXA_ENABLE_DEV_WRITES` and
  // map it to "dev_supabase_writes" when explicitly enabled.
  return CURRENT_WRITE_MODE;
}

export interface WriteReadinessStatus {
  enabled: false;
  mode: WriteMode;
  reason: string;
  nextStep: string;
}

export function getWriteReadinessStatus(): WriteReadinessStatus {
  return {
    enabled: false,
    mode: CURRENT_WRITE_MODE,
    reason: "Real writes are not enabled in this build.",
    nextStep:
      "M023C will add controlled dev Supabase writes behind an explicit flag.",
  };
}

export function explainWhyWritesDisabled(): string {
  return [
    "No Supabase service role key in the frontend.",
    "No insert/update/delete/upsert calls wired up.",
    "No real upload storage path connected.",
    "Awaiting M023C (controlled dev writes behind explicit flag).",
  ].join(" ");
}

/**
 * Guard for call sites that must never run when writes are off.
 * Throws to make accidental misuse loud during development.
 */
export function assertWritesDisabled(): void {
  if (WRITES_ENABLED || CURRENT_WRITE_MODE !== "disabled") {
    throw new Error(
      "assertWritesDisabled: write path executed while writes were expected to be disabled.",
    );
  }
}

/**
 * Short, client-safe banner copy explaining the current write state.
 * Use on submit-style pages to set expectations without cluttering.
 */
export function getWriteSafetyBanner(): string {
  return "Live saving is not enabled in this build. This demo uses session/local state only.";
}
