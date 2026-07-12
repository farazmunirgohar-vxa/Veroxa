import { createHmac } from "node:crypto";

type VercelRequest = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  socket: { remoteAddress?: string };
};
type VercelResponse = {
  setHeader(name: string, value: string): void;
  status(code: number): { json(payload: unknown): void };
};

const CONSENT_VERSION = "2026-07-12";
const MAX_BODY_BYTES = 16_384;
const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const hmac = (secret: string, value: string) => createHmac("sha256", secret).update(value).digest("hex");

function safeUrl(value: unknown): string | null {
  const raw = text(value, 2_000);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function parsedBody(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string") {
    try { return JSON.parse(value) as Record<string, unknown>; } catch { return null; }
  }
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}

function trustedIp(req: VercelRequest): string {
  const header = req.headers["x-vercel-forwarded-for"];
  const value = Array.isArray(header) ? header[0] : header;
  return value?.split(",")[0]?.trim().slice(0, 80) || req.socket.remoteAddress || "unknown";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") return res.status(405).json({ accepted: false });
  const body = parsedBody(req.body);
  if (!body || Buffer.byteLength(JSON.stringify(body), "utf8") > MAX_BODY_BYTES) {
    return res.status(400).json({ accepted: false });
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.AUDIT_INTAKE_HMAC_SECRET;
  if (!url || !key || !secret) return res.status(503).json({ accepted: false });

  const restaurantName = text(body.restaurantName, 160);
  const city = text(body.city, 100);
  const state = text(body.state, 40);
  const contactName = text(body.contactName, 160) || null;
  const contactEmail = text(body.contactEmail, 320).toLowerCase() || null;
  const contactPhone = text(body.contactPhone, 50) || null;
  const contactNote = text(body.contactNote, 2_000) || null;
  const websiteUrl = safeUrl(body.websiteUrl);
  const googleProfileUrl = safeUrl(body.googleProfileUrl);
  const formStartedAt = text(body.formStartedAt, 64);
  const idempotencyKey = text(body.idempotencyKey, 128);
  const honeypot = text(body.honeypot, 200) || null;
  const phoneDigits = contactPhone?.replace(/\D/g, "") || "";
  if (
    restaurantName.length < 2 || city.length < 2 || state.length < 2 ||
    (!contactEmail && !contactPhone) || !formStartedAt || idempotencyKey.length < 16 ||
    body.consentToContact !== true || body.consentVersion !== CONSENT_VERSION ||
    (body.websiteUrl && !websiteUrl) || (body.googleProfileUrl && !googleProfileUrl) ||
    (contactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) ||
    (contactPhone && (phoneDigits.length < 7 || phoneDigits.length > 15))
  ) return res.status(400).json({ accepted: false });

  const day = new Date().toISOString().slice(0, 10);
  const fingerprint = hmac(secret, `ip:${trustedIp(req)}|contact:${contactEmail || contactPhone}|day:${day}`);
  const token = hmac(secret, fingerprint);
  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/submit_audit_request_v1`, {
    method: "POST",
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      p_restaurant_name: restaurantName,
      p_city: city,
      p_state: state,
      p_website_url: websiteUrl,
      p_google_profile_url: googleProfileUrl,
      p_contact_name: contactName,
      p_contact_email: contactEmail,
      p_contact_phone: contactPhone,
      p_contact_note: contactNote,
      p_consent_to_contact: true,
      p_consent_version: CONSENT_VERSION,
      p_form_started_at: formStartedAt,
      p_honeypot: honeypot,
      p_fingerprint: fingerprint,
      p_intake_token: token,
      p_idempotency_key: idempotencyKey,
    }),
  });
  const payload = await response.json().catch(() => null) as Array<{ reference_code?: string }> | null;
  if (!response.ok) {
    const errorText = JSON.stringify(payload || {});
    return res.status(errorText.includes("rate_limited") ? 429 : response.status === 400 ? 400 : 503).json({ accepted: false });
  }
  const reference = payload?.[0]?.reference_code;
  return reference
    ? res.status(202).json({ accepted: true, reference })
    : res.status(503).json({ accepted: false });
}
