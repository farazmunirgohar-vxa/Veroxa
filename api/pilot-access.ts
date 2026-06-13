import { timingSafeEqual } from "node:crypto";
type VercelRequest = { method?: string; body?: unknown; headers: Record<string, string | string[] | undefined>; socket: { remoteAddress?: string } };
type VercelResponse = { setHeader(name: string, value: string): void; status(code: number): { json(payload: unknown): void } };

type PilotRecord = { email: "momo@veroxa.app" | "faraz@veroxa.app"; role: "client" | "team"; accountId: string; envName: "VEROXA_PILOT_MOMO_HOUSE_PASSWORD" | "VEROXA_PILOT_TEAM_FARAZ_PASSWORD" };
type SafeFailureMode = "method_not_allowed" | "disabled" | "unauthorized" | "rate_limited";
const records: readonly PilotRecord[] = [
  { email: "momo@veroxa.app", role: "client", accountId: "pilot-account-momo-house-san-antonio", envName: "VEROXA_PILOT_MOMO_HOUSE_PASSWORD" },
  { email: "faraz@veroxa.app", role: "team", accountId: "pilot-account-team-faraz", envName: "VEROXA_PILOT_TEAM_FARAZ_PASSWORD" },
];
const buckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
function normalizeEmail(value: unknown) { return typeof value === "string" ? value.trim().toLowerCase().slice(0, 200) : ""; }
function normalizePassword(value: unknown) { return typeof value === "string" ? value.slice(0, 200) : ""; }
function safeEqual(a: string, b: string) { const left = Buffer.from(a); const right = Buffer.from(b); if (left.length !== right.length) { timingSafeEqual(right, right); return false; } return timingSafeEqual(left, right); }
function readPassword(record: PilotRecord) { const value = process.env[record.envName]?.trim(); return value || null; }
function configured() { return records.every((record) => Boolean(readPassword(record))); }
function trustedRequestIp(req: VercelRequest) {
  // Do not trust raw client-supplied X-Forwarded-For for rate-limit keys.
  // Vercel exposes trusted request IP metadata through platform headers when available;
  // otherwise fall back to the socket peer address.
  const vercelForwardedFor = req.headers["x-vercel-forwarded-for"];
  const vercelIp = Array.isArray(vercelForwardedFor) ? vercelForwardedFor[0] : vercelForwardedFor;
  return vercelIp?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
}
function failure(mode: SafeFailureMode) { return { ok: false, mode }; }
function rateLimited(req: VercelRequest, email: string) { const now = Date.now(); const key = `${trustedRequestIp(req)}:${email || "unknown"}`; const bucket = buckets.get(key); if (!bucket || bucket.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + WINDOW_MS }); return false; } if (bucket.count >= MAX_ATTEMPTS) return true; bucket.count += 1; return false; }
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json(failure("method_not_allowed"));
  const body = typeof req.body === "object" && req.body ? req.body as Record<string, unknown> : {};
  const email = normalizeEmail(body.email);
  if (rateLimited(req, email)) return res.status(429).json(failure("rate_limited"));
  if (!configured()) { console.warn("Pilot access disabled: required server-only env vars are missing."); return res.status(503).json(failure("disabled")); }
  const password = normalizePassword(body.password);
  const record = records.find((candidate) => candidate.email === email);
  const expected = record ? readPassword(record) : null;
  if (!record || !expected || !password || !safeEqual(password, expected)) return res.status(401).json(failure("unauthorized"));
  return res.status(200).json({ ok: true, mode: "manual_pilot_auth", accountId: record.accountId, email: record.email, role: record.role });
}
