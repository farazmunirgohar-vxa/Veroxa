const CONSENT_VERSION = "2026-07-12";
const MAX_BODY_BYTES = 16_384;
const RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const json = (status: number, payload: unknown) => Response.json(payload, { status, headers: RESPONSE_HEADERS });

async function hmac(secret: string, value: string): Promise<string> {
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

function trustedIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 80) || "unknown";
}

async function handlePost(request: Request): Promise<Response> {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (!Number.isFinite(declaredLength) || declaredLength > MAX_BODY_BYTES) {
    return json(413, { accepted: false });
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return json(413, { accepted: false });
  }

  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("invalid body");
    body = parsed as Record<string, unknown>;
  } catch {
    return json(400, { accepted: false });
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.AUDIT_INTAKE_HMAC_SECRET;
  if (!url || !key || !secret) return json(503, { accepted: false });

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
  ) return json(400, { accepted: false });

  const day = new Date().toISOString().slice(0, 10);
  const fingerprint = await hmac(secret, `ip:${trustedIp(request)}|contact:${contactEmail || contactPhone}|day:${day}`);
  const token = await hmac(secret, fingerprint);
  let response: Response;
  try {
    response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/submit_audit_request_v1`, {
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
  } catch {
    return json(503, { accepted: false });
  }

  const payload = await response.json().catch(() => null) as Array<{ reference_code?: string }> | null;
  if (!response.ok) {
    const errorText = JSON.stringify(payload || {});
    return json(errorText.includes("rate_limited") ? 429 : response.status === 400 ? 400 : 503, { accepted: false });
  }
  const reference = payload?.[0]?.reference_code;
  return reference ? json(202, { accepted: true, reference }) : json(503, { accepted: false });
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") return json(405, { accepted: false });
    return handlePost(request);
  },
};
