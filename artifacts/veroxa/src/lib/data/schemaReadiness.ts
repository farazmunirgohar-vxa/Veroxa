/**
 * schemaReadiness.ts — M024A
 *
 * Reports the current Supabase metadata schema version drafted in
 * this build, and which downstream pieces are still NOT ready
 * (storage upload, real auth, upload-key RLS, production RLS).
 *
 * Pure data. No Supabase calls. No network. No I/O.
 */

export const SCHEMA_VERSION = "M024A_FIRST_CLIENT_METADATA" as const;

export interface SchemaReadinessStatus {
  schemaVersion: typeof SCHEMA_VERSION;
  schemaCreated: boolean;
  storageReady: boolean;
  realAuthReady: boolean;
  uploadKeyRlsReady: boolean;
  productionReady: boolean;
  metadataTables: readonly string[];
  message: string;
  nextStep: string;
}

const METADATA_TABLES = [
  "clients",
  "restaurant_upload_keys",
  "upload_submissions",
  "direction_requests",
  "team_review_decisions",
] as const;

export function getSchemaReadinessStatus(): SchemaReadinessStatus {
  return {
    schemaVersion: SCHEMA_VERSION,
    schemaCreated: true,
    storageReady: false,
    realAuthReady: false,
    uploadKeyRlsReady: false,
    productionReady: false,
    metadataTables: METADATA_TABLES,
    message:
      "First-client metadata schema migration has been drafted. Storage, real auth, and production RLS are not complete.",
    nextStep:
      "Apply the M024A migration in a dev Supabase project and verify table/RLS access before connecting pages to the write adapter.",
  };
}
