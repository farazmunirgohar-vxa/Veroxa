/**
 * devClientIdValidation.ts — M024B
 *
 * Validate and normalise a dev client UUID before passing it to the
 * smoke test runner. Pure JS — no network, no Supabase.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

/**
 * Returns the trimmed, lower-cased UUID if valid, otherwise `null`.
 */
export function normalizeDevClientId(value: unknown): string | null {
  if (!isValidUuid(value)) return null;
  return (value as string).trim().toLowerCase();
}
