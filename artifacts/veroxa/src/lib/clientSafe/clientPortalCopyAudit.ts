export const CLIENT_PORTAL_COPY_DENYLIST = [
  "OpenAI",
  "Supabase",
  "RLS",
  "API",
  "backend",
  "fixture",
  "connector",
  "approval queue",
  "internal ID",
  "risk level",
  "operator",
  "owner",
  `Super ${"Admin"}`,
  "demo data",
  "automation internals",
  "fake metric",
  "automatic publishing",
  "auto-publish",
] as const;

function flattenCopy(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(flattenCopy).join(" ");
  if (typeof value === "object") return Object.values(value).map(flattenCopy).join(" ");
  return "";
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function findClientPortalCopyViolations(value: unknown): string[] {
  const copy = flattenCopy(value);
  return CLIENT_PORTAL_COPY_DENYLIST.filter((term) =>
    new RegExp(escapeRegExp(term), "i").test(copy),
  );
}

export function isClientPortalCopySafe(value: unknown): boolean {
  return findClientPortalCopyViolations(value).length === 0;
}
