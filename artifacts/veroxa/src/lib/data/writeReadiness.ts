/**
 * writeReadiness.ts — M022
 *
 * Single source of truth for "are real writes turned on?" in this
 * build. Imported by surfaces that might otherwise assume writes
 * work (e.g. upload form, direction submit, team review actions).
 *
 * THIS FILE NEVER WRITES. No Supabase calls, no fetch, no network.
 *
 * The next build (M023) will introduce a controlled
 * `VITE_VEROXA_ENABLE_DEV_WRITES` flag, an anon/auth-safe write
 * adapter, and per-table policies. Until then this constant stays
 * false and all submit handlers stay local/session-only.
 */

export const WRITES_ENABLED = false as const;

export interface WriteReadinessStatus {
  enabled: false;
  reason: string;
  nextStep: string;
}

export function getWriteReadinessStatus(): WriteReadinessStatus {
  return {
    enabled: false,
    reason: "Real writes are not enabled in this build.",
    nextStep:
      "M023 will add controlled dev Supabase writes behind an explicit flag.",
  };
}

export function explainWhyWritesDisabled(): string {
  return [
    "No Supabase service role key in the frontend.",
    "No insert/update/delete/upsert calls wired up.",
    "No real upload storage path connected.",
    "Awaiting M023 (SQL planning + write adapter behind a flag).",
  ].join(" ");
}
