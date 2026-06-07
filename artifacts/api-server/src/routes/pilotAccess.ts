import { timingSafeEqual } from "node:crypto";
import { Router, type IRouter, type NextFunction, type Request, type Response } from "express";

const router: IRouter = Router();

const CLIENT_EMAIL = "momo@veroxa.app";
const TEAM_EMAIL = "faraz@veroxa.app";
const MOMO_HOUSE_CLIENT_ACCOUNT_ID = "pilot-account-momo-house-san-antonio";
const TEAM_FARAZ_ACCOUNT_ID = "pilot-account-team-faraz";
const PILOT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const PILOT_RATE_LIMIT_MAX_ATTEMPTS = 8;
const PILOT_ACCESS_DISABLED_MESSAGE = "Pilot portal access is not available in this environment.";
const PILOT_ACCESS_INVALID_MESSAGE = "Those sign-in details do not match a Veroxa pilot portal account.";

interface PilotAccessRequestBody {
  email?: unknown;
  password?: unknown;
}

interface PilotRateLimitBucket {
  count: number;
  resetAt: number;
}

interface PilotCredentialRecord {
  role: "client" | "team";
  email: typeof CLIENT_EMAIL | typeof TEAM_EMAIL;
  accountId: typeof MOMO_HOUSE_CLIENT_ACCOUNT_ID | typeof TEAM_FARAZ_ACCOUNT_ID;
  passwordEnvName: "VEROXA_PILOT_MOMO_HOUSE_PASSWORD" | "VEROXA_PILOT_TEAM_FARAZ_PASSWORD";
}

const pilotRateLimitBuckets = new Map<string, PilotRateLimitBucket>();

const PILOT_CREDENTIAL_RECORDS: readonly PilotCredentialRecord[] = [
  {
    role: "client",
    email: CLIENT_EMAIL,
    accountId: MOMO_HOUSE_CLIENT_ACCOUNT_ID,
    passwordEnvName: "VEROXA_PILOT_MOMO_HOUSE_PASSWORD",
  },
  {
    role: "team",
    email: TEAM_EMAIL,
    accountId: TEAM_FARAZ_ACCOUNT_ID,
    passwordEnvName: "VEROXA_PILOT_TEAM_FARAZ_PASSWORD",
  },
];

function parsePositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function rateLimitKey(req: Request, email: string): string {
  // Do not read raw X-Forwarded-For here. Express only derives req.ip
  // from forwarded headers when app-level trust proxy is explicitly enabled;
  // otherwise req.ip is the socket peer and cannot be spoofed by clients.
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  return `${ip}:${email || "unknown"}`;
}

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 200) : "";
}

function normalizePassword(value: unknown): string {
  return typeof value === "string" ? value.slice(0, 200) : "";
}

function readServerPassword(record: PilotCredentialRecord): string | null {
  const value = process.env[record.passwordEnvName]?.trim();
  return value ? value : null;
}

function isPilotAccessConfigured(): boolean {
  return PILOT_CREDENTIAL_RECORDS.every((record) => Boolean(readServerPassword(record)));
}

function safePasswordMatches(providedPassword: string, expectedPassword: string): boolean {
  const provided = Buffer.from(providedPassword, "utf8");
  const expected = Buffer.from(expectedPassword, "utf8");
  if (provided.length !== expected.length) {
    timingSafeEqual(expected, expected);
    return false;
  }
  return timingSafeEqual(provided, expected);
}

function pilotAccessRateLimit(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  const body = (req.body ?? {}) as PilotAccessRequestBody;
  const email = normalizeEmail(body.email);
  const windowMs = parsePositiveIntEnv("VEROXA_PILOT_ACCESS_RATE_LIMIT_WINDOW_MS", PILOT_RATE_LIMIT_WINDOW_MS);
  const maxAttempts = parsePositiveIntEnv("VEROXA_PILOT_ACCESS_RATE_LIMIT_MAX", PILOT_RATE_LIMIT_MAX_ATTEMPTS);
  const key = rateLimitKey(req, email);
  const bucket = pilotRateLimitBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    pilotRateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (bucket.count >= maxAttempts) {
    res.status(429).json({
      ok: false,
      mode: "rate_limited",
      message: "Too many portal access attempts. Please wait and try again.",
    });
    return;
  }

  bucket.count += 1;
  next();
}

router.post("/pilot-access", pilotAccessRateLimit, (req, res) => {
  if (!isPilotAccessConfigured()) {
    res.status(503).json({ ok: false, mode: "disabled", message: PILOT_ACCESS_DISABLED_MESSAGE });
    return;
  }

  const body = (req.body ?? {}) as PilotAccessRequestBody;
  const email = normalizeEmail(body.email);
  const password = normalizePassword(body.password);

  if (!email || !password) {
    res.status(400).json({ ok: false, mode: "invalid", message: PILOT_ACCESS_INVALID_MESSAGE });
    return;
  }

  const record = PILOT_CREDENTIAL_RECORDS.find((candidate) => candidate.email === email);
  const expectedPassword = record ? readServerPassword(record) : null;
  if (!record || !expectedPassword || !safePasswordMatches(password, expectedPassword)) {
    res.status(401).json({ ok: false, mode: "unauthorized", message: PILOT_ACCESS_INVALID_MESSAGE });
    return;
  }

  res.json({
    ok: true,
    mode: "manual_pilot_auth",
    accountId: record.accountId,
    email: record.email,
    role: record.role,
  });
});

export default router;
