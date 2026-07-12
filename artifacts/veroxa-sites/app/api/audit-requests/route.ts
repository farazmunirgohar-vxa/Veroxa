import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const CONSENT_VERSION = "2026-07-12";
const MAX_BODY_BYTES = 16_384;

type IntakeBody = {
  restaurantName?: unknown;
  city?: unknown;
  state?: unknown;
  websiteUrl?: unknown;
  googleProfileUrl?: unknown;
  contactName?: unknown;
  contactEmail?: unknown;
  contactPhone?: unknown;
  contactNote?: unknown;
  consentToContact?: unknown;
  consentVersion?: unknown;
  formStartedAt?: unknown;
  honeypot?: unknown;
  idempotencyKey?: unknown;
};

function text(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function safeHttpUrl(value: unknown): string | null {
  const raw = text(value, 2_000);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function response(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store, max-age=0",
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });
}

async function hmacHex(secret: string, value: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request): Promise<Response> {
  const configuredLength = Number(request.headers.get("content-length") || 0);
  if (configuredLength > MAX_BODY_BYTES) return response({ accepted: false }, 413);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const intakeSecret = process.env.AUDIT_INTAKE_HMAC_SECRET;
  if (!url || !publishableKey || !intakeSecret) return response({ accepted: false }, 503);

  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return response({ accepted: false }, 400);
  }
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return response({ accepted: false }, 413);
  }

  let body: IntakeBody;
  try {
    body = JSON.parse(rawBody) as IntakeBody;
  } catch {
    return response({ accepted: false }, 400);
  }

  const restaurantName = text(body.restaurantName, 160);
  const city = text(body.city, 100);
  const state = text(body.state, 40);
  const contactName = text(body.contactName, 160) || null;
  const contactEmail = text(body.contactEmail, 320).toLowerCase() || null;
  const contactPhone = text(body.contactPhone, 50) || null;
  const contactNote = text(body.contactNote, 2_000) || null;
  const websiteUrl = safeHttpUrl(body.websiteUrl);
  const googleProfileUrl = safeHttpUrl(body.googleProfileUrl);
  const idempotencyKey = text(body.idempotencyKey, 128);
  const formStartedAt = text(body.formStartedAt, 64);
  const honeypot = text(body.honeypot, 200) || null;

  if (
    restaurantName.length < 2 ||
    city.length < 2 ||
    state.length < 2 ||
    (!contactEmail && !contactPhone) ||
    !formStartedAt ||
    idempotencyKey.length < 16 ||
    body.consentVersion !== CONSENT_VERSION ||
    body.consentToContact !== true
  ) {
    return response({ accepted: false }, 400);
  }
  if (body.websiteUrl && !websiteUrl) return response({ accepted: false }, 400);
  if (body.googleProfileUrl && !googleProfileUrl) return response({ accepted: false }, 400);
  if (contactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) {
    return response({ accepted: false }, 400);
  }
  const phoneDigits = contactPhone?.replace(/\D/g, "") || "";
  if (contactPhone && (phoneDigits.length < 7 || phoneDigits.length > 15)) {
    return response({ accepted: false }, 400);
  }

  const trustedIp = request.headers.get("cf-connecting-ip")?.trim().slice(0, 80) || "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const fingerprint = await hmacHex(intakeSecret, `ip:${trustedIp}|contact:${contactEmail || contactPhone}|day:${day}`);
  const intakeToken = await hmacHex(intakeSecret, fingerprint);

  const supabase = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase.rpc("submit_audit_request_v1", {
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
    p_intake_token: intakeToken,
    p_idempotency_key: idempotencyKey,
  });
  if (error) {
    if (error.message.includes("rate_limited")) return response({ accepted: false }, 429);
    if (error.message.includes("submission_rejected")) return response({ accepted: false }, 400);
    return response({ accepted: false }, 503);
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.reference_code) return response({ accepted: false }, 503);
  return response({ accepted: true, reference: row.reference_code }, 202);
}
