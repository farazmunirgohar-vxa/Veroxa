/**
 * schemaVerificationTypes.ts — M024B
 *
 * Types for the internal schema verification and dev write smoke
 * test harness. No runtime behavior. Types only.
 */

export type SchemaTableName =
  | "clients"
  | "restaurant_upload_keys"
  | "upload_submissions"
  | "direction_requests"
  | "team_review_decisions";

export type SchemaVerificationStatusValue =
  | "not_configured"
  | "not_checked"
  | "passed"
  | "failed"
  | "partial";

export interface SchemaTableCheck {
  tableName: SchemaTableName;
  status: SchemaVerificationStatusValue;
  safeMessage: string;
}

export interface SchemaVerificationResult {
  ok: boolean;
  status: SchemaVerificationStatusValue;
  safeMessage: string;
  checkedAt: string;
  tableChecks: SchemaTableCheck[];
  /** Internal-only details. Never surface raw to clients. */
  details?: string;
}

export interface SchemaSmokeTestResult {
  ok: boolean;
  status: "passed" | "failed" | "partial" | "skipped" | "dry_run";
  safeMessage: string;
  ranAt: string;
  steps: SchemaSmokeTestStep[];
}

export interface SchemaSmokeTestStep {
  name: string;
  status: "passed" | "failed" | "skipped" | "dry_run";
  safeMessage: string;
}
