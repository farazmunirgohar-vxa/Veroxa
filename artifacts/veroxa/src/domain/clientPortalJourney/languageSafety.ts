/**
 * Client-safe language denylist for generated Client Portal copy.
 *
 * This is a lightweight utility, not a test runner. It lets future tests or
 * review scripts scan generated journey/update/report objects without adding a
 * large testing framework today.
 */

export const CLIENT_SAFE_COPY_DENYLIST = [
  "OpenAI",
  "Supabase",
  "RLS",
  "fixture",
  "backend",
  "connector",
  "API",
  "approval queue",
  "risk level",
  "internal ID",
  "execution internals",
  "AI agent",
  "model output",
] as const;

export type ClientSafeCopyDenylistedTerm = typeof CLIENT_SAFE_COPY_DENYLIST[number];

function denylistPattern(term: ClientSafeCopyDenylistedTerm): RegExp {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i");
}

function collectStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === "string") {
    acc.push(value);
    return acc;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, acc));
    return acc;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectStrings(item, acc));
  }
  return acc;
}

export interface ClientSafeLanguageViolation {
  term: ClientSafeCopyDenylistedTerm;
  text: string;
}

export function findClientSafeLanguageViolations(
  value: unknown,
): ClientSafeLanguageViolation[] {
  const strings = collectStrings(value);
  return CLIENT_SAFE_COPY_DENYLIST.flatMap((term) => {
    const pattern = denylistPattern(term);
    return strings
      .filter((text) => pattern.test(text))
      .map((text) => ({ term, text }));
  });
}

export function isClientSafeLanguage(value: unknown): boolean {
  return findClientSafeLanguageViolations(value).length === 0;
}

export function assertClientSafeLanguage(value: unknown): void {
  const violations = findClientSafeLanguageViolations(value);
  if (violations.length > 0) {
    throw new Error(
      `Client-safe copy contains internal terms: ${violations
        .map((violation) => violation.term)
        .join(", ")}`,
    );
  }
}
