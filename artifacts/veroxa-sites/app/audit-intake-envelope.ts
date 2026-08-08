import { momoCanonicalJson } from "./momo-canonical-json.ts";

const ENVELOPE_SCHEMA = "veroxa.public-audit-intake-envelope";
const ENVELOPE_VERSION = 1 as const;
const ENVELOPE_LIFETIME_MS = 120_000;

type AuditIntakeFields = {
  restaurantName: string;
  city: string;
  state: string;
  websiteUrl: string | null;
  googleProfileUrl: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactNote: string | null;
  consentToContact: true;
  consentVersion: "2026-07-12";
  formStartedAt: string;
  honeypot: string | null;
  idempotencyKey: string;
};

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
  return Array.from(
    new Uint8Array(signature),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

function randomNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function authorizeAuditIntake(input: {
  secret: string;
  trustedIp: string;
  fields: AuditIntakeFields;
  now?: Date;
  nonce?: string;
}): Promise<{
  envelopeVersion: 1;
  issuedAt: string;
  expiresAt: string;
  nonce: string;
  canonical: string;
  ipQuotaFingerprint: string;
  intakeToken: string;
}> {
  const now = input.now ?? new Date();
  if (!Number.isFinite(now.getTime())) throw new Error("invalid_envelope_time");
  const nonce = input.nonce ?? randomNonce();
  if (!/^[0-9a-f]{64}$/u.test(nonce)) throw new Error("invalid_envelope_nonce");
  const issuedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + ENVELOPE_LIFETIME_MS).toISOString();
  const quotaDay = issuedAt.slice(0, 10);
  const ipQuotaFingerprint = await hmacHex(
    input.secret,
    `veroxa:public-audit-ip-quota:v1\n${quotaDay}\n${input.trustedIp}`,
  );
  const canonical = momoCanonicalJson({
    schema: ENVELOPE_SCHEMA,
    version: ENVELOPE_VERSION,
    issuedAt,
    expiresAt,
    nonce,
    ipQuotaFingerprint,
    ...input.fields,
  });
  const intakeToken = await hmacHex(input.secret, canonical);
  return {
    envelopeVersion: ENVELOPE_VERSION,
    issuedAt,
    expiresAt,
    nonce,
    canonical,
    ipQuotaFingerprint,
    intakeToken,
  };
}
