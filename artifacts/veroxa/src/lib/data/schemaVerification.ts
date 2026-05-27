/**
 * schemaVerification.ts — M024B
 *
 * Safely verify that the M024A Supabase metadata schema is present
 * and readable via the anon/browser Supabase client.
 *
 * READ-ONLY. No inserts, updates, deletes, or storage calls.
 * No service role. Raw Supabase errors never reach the UI.
 */

import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  SchemaTableCheck,
  SchemaTableName,
  SchemaVerificationResult,
} from "./schemaVerificationTypes";

export const EXPECTED_M024A_TABLES: readonly SchemaTableName[] = [
  "clients",
  "restaurant_upload_keys",
  "upload_submissions",
  "direction_requests",
  "team_review_decisions",
] as const;

/**
 * Attempt a safe, zero-row read against one table.
 * An empty table with no error → "passed".
 * Any error (table missing, RLS block, etc.) → "failed" with safe msg.
 */
export async function checkTableReadable(
  tableName: SchemaTableName,
): Promise<SchemaTableCheck> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      tableName,
      status: "not_configured",
      safeMessage:
        "Supabase client not configured — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    };
  }

  try {
    const { error } = await client
      .from(tableName)
      .select("id")
      .limit(1);

    if (error) {
      const errObj = error as unknown as Record<string, unknown>;
      const code =
        typeof errObj.code === "string" ? errObj.code : "unknown";
      if (code === "42P01") {
        return {
          tableName,
          status: "failed",
          safeMessage: `Table "${tableName}" does not exist. Apply the M024A migration.`,
        };
      }
      if (code === "42501" || String(code).startsWith("http_4")) {
        return {
          tableName,
          status: "failed",
          safeMessage: `RLS blocked read on "${tableName}". Check dev-stage policies.`,
        };
      }
      return {
        tableName,
        status: "failed",
        safeMessage: `Could not read "${tableName}". Apply the M024A migration and verify RLS.`,
      };
    }

    return {
      tableName,
      status: "passed",
      safeMessage: `Table "${tableName}" is readable.`,
    };
  } catch {
    return {
      tableName,
      status: "failed",
      safeMessage: `Unexpected error checking "${tableName}". Supabase may not be configured.`,
    };
  }
}

/**
 * Run schema verification against all expected M024A tables.
 * Returns a full `SchemaVerificationResult`.
 */
export async function verifyM024ASchema(): Promise<SchemaVerificationResult> {
  const client = getSupabaseClient();
  const checkedAt = new Date().toISOString();

  if (!client) {
    return {
      ok: false,
      status: "not_configured",
      safeMessage:
        "Supabase client not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to verify schema.",
      checkedAt,
      tableChecks: EXPECTED_M024A_TABLES.map((tableName) => ({
        tableName,
        status: "not_configured",
        safeMessage: "Supabase not configured.",
      })),
    };
  }

  const tableChecks = await Promise.all(
    EXPECTED_M024A_TABLES.map((t) => checkTableReadable(t)),
  );

  const passed = tableChecks.filter((c) => c.status === "passed").length;
  const failed = tableChecks.filter((c) => c.status === "failed").length;
  const total = tableChecks.length;

  let status: SchemaVerificationResult["status"];
  let safeMessage: string;
  let ok: boolean;

  if (passed === total) {
    status = "passed";
    safeMessage = `All ${total} M024A tables are readable. Schema verified.`;
    ok = true;
  } else if (passed === 0) {
    status = "failed";
    safeMessage = `No M024A tables are readable (0/${total}). Apply the migration.`;
    ok = false;
  } else {
    status = "partial";
    safeMessage = `${passed}/${total} tables readable, ${failed} failed. Apply or re-run the M024A migration.`;
    ok = false;
  }

  return { ok, status, safeMessage, checkedAt, tableChecks };
}

/**
 * Human-readable summary of a verification result.
 */
export function getSchemaVerificationSummary(
  result: SchemaVerificationResult,
): string {
  const passed = result.tableChecks.filter((c) => c.status === "passed").length;
  return `${result.safeMessage} (${passed}/${result.tableChecks.length} tables, checked ${result.checkedAt})`;
}
