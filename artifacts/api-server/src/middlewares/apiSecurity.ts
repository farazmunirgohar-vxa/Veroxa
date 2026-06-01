import type { NextFunction, Request, Response } from "express";

const API_KEY_HEADER = "x-veroxa-api-key";
const DEFAULT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 60;

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

function envFlag(name: string): boolean {
  return process.env[name] === "true";
}

function getInternalApiKey(): string | null {
  const key = process.env["VEROXA_INTERNAL_API_KEY"] ?? process.env["VEROXA_API_ACCESS_TOKEN"];
  const trimmed = key?.trim();
  return trimmed ? trimmed : null;
}

function isSafeDevApiBypassEnabled(): boolean {
  return process.env["NODE_ENV"] === "development" && envFlag("VEROXA_ALLOW_UNAUTHENTICATED_DEV_API");
}

function getHeaderValue(req: Request, name: string): string | null {
  const value = req.header(name);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function rateLimitKey(req: Request): string {
  const forwardedFor = req.header("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || req.ip || req.socket.remoteAddress || "unknown";
}

function parsePositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function requireProtectedApiAccess(req: Request, res: Response, next: NextFunction): void {
  const expectedKey = getInternalApiKey();

  if (!expectedKey) {
    if (isSafeDevApiBypassEnabled()) {
      next();
      return;
    }

    res.status(503).json({
      mode: "disabled",
      message: "This protected API route is not available in this environment.",
    });
    return;
  }

  const providedKey = getHeaderValue(req, API_KEY_HEADER);
  if (providedKey !== expectedKey) {
    res.status(401).json({
      mode: "unauthorized",
      message: "Protected API access is required.",
    });
    return;
  }

  next();
}

export function protectedApiRateLimit(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  const windowMs = parsePositiveIntEnv("VEROXA_API_RATE_LIMIT_WINDOW_MS", DEFAULT_RATE_LIMIT_WINDOW_MS);
  const maxRequests = parsePositiveIntEnv("VEROXA_API_RATE_LIMIT_MAX", DEFAULT_RATE_LIMIT_MAX_REQUESTS);
  const key = rateLimitKey(req);
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (bucket.count >= maxRequests) {
    res.status(429).json({
      mode: "rate_limited",
      message: "Too many requests. Please try again later.",
    });
    return;
  }

  bucket.count += 1;
  next();
}

export function requireAiRoutesEnabled(_req: Request, res: Response, next: NextFunction): void {
  if (!envFlag("VEROXA_ENABLE_AI_ROUTES")) {
    res.status(503).json({
      mode: "disabled",
      message: "AI routes are disabled in this environment.",
    });
    return;
  }
  next();
}

export function requireGoogleRoutesEnabled(_req: Request, res: Response, next: NextFunction): void {
  if (!envFlag("VEROXA_ENABLE_GOOGLE_ROUTES")) {
    res.status(503).json({
      mode: "disabled",
      message: "Google-powered audit routes are disabled in this environment.",
    });
    return;
  }
  next();
}
