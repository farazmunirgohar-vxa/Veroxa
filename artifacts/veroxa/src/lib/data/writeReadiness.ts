/**
 * writeReadiness.ts — M022 / M023B / M023C
 *
 * Single source of truth for "are real writes turned on?" in this
 * build. Imported by surfaces that might otherwise assume writes
 * work (e.g. upload form, direction submit, team review actions),
 * and by the write adapter selector.
 *
 * THIS FILE NEVER WRITES. No Supabase calls, no fetch, no network.
 *
 * M023C changes:
 *   - Read `VITE_VEROXA_ENABLE_DEV_WRITES` from import.meta.env.
 *   - Only the EXACT string "true" enables dev writes.
 *   - Anything else (missing, "false", "TRUE", "1", "yes", etc.)
 *     keeps writes disabled.
 *   - `WRITES_ENABLED` is no longer a literal constant — it derives
 *     from the resolved mode at module load.
 */

export type WriteMode = "disabled" | "dev_supabase_writes";

export const DEV_WRITES_ENV_FLAG = "VITE_VEROXA_ENABLE_DEV_WRITES" as const;

/**
 * Strict env flag check. Only the exact string "true" enables dev
 * writes — never "TRUE", "1", "yes", or any truthy value.
 */
export function isDevWriteFlagEnabled(): boolean {
  const raw = (import.meta.env as Record<string, unknown>)[DEV_WRITES_ENV_FLAG];
  return raw === "true";
}

function resolveCurrentWriteMode(): WriteMode {
  return isDevWriteFlagEnabled() ? "dev_supabase_writes" : "disabled";
}

export const CURRENT_WRITE_MODE: WriteMode = resolveCurrentWriteMode();

export function getWriteMode(): WriteMode {
  return CURRENT_WRITE_MODE;
}

export const WRITES_ENABLED: boolean = CURRENT_WRITE_MODE === "dev_supabase_writes";

export interface WriteReadinessStatus {
  enabled: boolean;
  mode: WriteMode;
  envFlagName: typeof DEV_WRITES_ENV_FLAG;
  reason: string;
  nextStep: string;
}

export function getWriteReadinessStatus(): WriteReadinessStatus {
  if (CURRENT_WRITE_MODE === "dev_supabase_writes") {
    return {
      enabled: true,
      mode: "dev_supabase_writes",
      envFlagName: DEV_WRITES_ENV_FLAG,
      reason:
        "Dev Supabase metadata writes are enabled by the explicit env flag. No storage uploads, no service role.",
      nextStep:
        "M023D — connect selected pages to the adapter once schema is applied.",
    };
  }
  return {
    enabled: false,
    mode: "disabled",
    envFlagName: DEV_WRITES_ENV_FLAG,
    reason: "Real writes are not enabled in this build.",
    nextStep:
      "Set VITE_VEROXA_ENABLE_DEV_WRITES=\"true\" in a dev environment to enable the dev write adapter.",
  };
}

export function explainWhyWritesDisabled(): string {
  return [
    "No Supabase service role key in the frontend.",
    "No insert/update/delete/upsert calls run unless the dev flag is set.",
    "No real upload storage path connected.",
    `Set ${DEV_WRITES_ENV_FLAG}="true" in dev to enable the dev write adapter.`,
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
 * Guard for the dev write adapter. Throws if writes are not allowed,
 * so the disabled adapter is the only thing that can ever run when
 * the flag is off.
 */
export function assertWritesAllowed(): void {
  if (!WRITES_ENABLED || CURRENT_WRITE_MODE !== "dev_supabase_writes") {
    throw new Error(
      `assertWritesAllowed: dev write adapter invoked while ${DEV_WRITES_ENV_FLAG} is not "true".`,
    );
  }
}

/**
 * Short, client-safe banner copy explaining the current write state.
 * Use on submit-style pages to set expectations without cluttering.
 */
export function getWriteSafetyBanner(): string {
  if (CURRENT_WRITE_MODE === "dev_supabase_writes") {
    return "Dev writes are enabled. Submissions may be saved to a dev Supabase project. No file uploads, no production data.";
  }
  return "Live saving is not enabled in this build. This demo uses session/local state only.";
}
