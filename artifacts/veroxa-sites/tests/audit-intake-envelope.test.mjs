import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { authorizeAuditIntake } from "../app/audit-intake-envelope.ts";

const secret = "test-only-audit-intake-secret-with-more-than-32-bytes";
const now = new Date("2026-08-08T00:12:10.000Z");
const nonce = "ab".repeat(32);
const fields = {
  restaurantName: "Momo House",
  city: "San Antonio",
  state: "TX",
  websiteUrl: "https://momo.example/",
  googleProfileUrl: null,
  contactName: "Owner",
  contactEmail: "owner@momo.example",
  contactPhone: null,
  contactNote: "Please review our public presence.",
  consentToContact: true,
  consentVersion: "2026-07-12",
  formStartedAt: "2026-08-08T00:11:00.000Z",
  honeypot: null,
  idempotencyKey: "audit-request-00000001",
};

function hmac(value) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

test("audit authorization binds the exact canonical envelope and daily trusted-IP quota", async () => {
  const authorization = await authorizeAuditIntake({
    secret,
    trustedIp: "203.0.113.10",
    fields,
    now,
    nonce,
  });
  assert.equal(authorization.envelopeVersion, 1);
  assert.equal(authorization.issuedAt, now.toISOString());
  assert.equal(
    Date.parse(authorization.expiresAt) - Date.parse(authorization.issuedAt),
    120_000,
  );
  assert.equal(authorization.nonce, nonce);
  assert.equal(
    authorization.ipQuotaFingerprint,
    hmac("veroxa:public-audit-ip-quota:v1\n2026-08-08\n203.0.113.10"),
  );
  assert.equal(authorization.intakeToken, hmac(authorization.canonical));

  const envelope = JSON.parse(authorization.canonical);
  assert.deepEqual(Object.keys(envelope), [
    "city",
    "consentToContact",
    "consentVersion",
    "contactEmail",
    "contactName",
    "contactNote",
    "contactPhone",
    "expiresAt",
    "formStartedAt",
    "googleProfileUrl",
    "honeypot",
    "idempotencyKey",
    "ipQuotaFingerprint",
    "issuedAt",
    "nonce",
    "restaurantName",
    "schema",
    "state",
    "version",
    "websiteUrl",
  ]);
  assert.equal(envelope.schema, "veroxa.public-audit-intake-envelope");
  assert.equal(envelope.version, 1);
});

test("audit authorization is deterministic for fixed inputs and rejects malformed nonces", async () => {
  const first = await authorizeAuditIntake({
    secret,
    trustedIp: "unknown",
    fields,
    now,
    nonce,
  });
  const second = await authorizeAuditIntake({
    secret,
    trustedIp: "unknown",
    fields,
    now,
    nonce,
  });
  assert.deepEqual(first, second);

  await assert.rejects(
    authorizeAuditIntake({
      secret,
      trustedIp: "unknown",
      fields,
      now,
      nonce: "not-a-64-byte-lowercase-hex-nonce",
    }),
    /invalid_envelope_nonce/u,
  );

  await assert.rejects(
    authorizeAuditIntake({
      secret,
      trustedIp: "unknown",
      fields,
      now: new Date(Number.NaN),
      nonce,
    }),
    /invalid_envelope_time/u,
  );
});

test("audit v2 verifies the signed envelope before serialized IP and contact quotas", async () => {
  const sql = await readFile(new URL(
    "../supabase/migrations/20260808001210_audit_intake_envelope_v2.sql",
    import.meta.url,
  ), "utf8");
  assert.match(sql, /extensions\.hmac\(p_envelope_canonical, v_intake_secret, 'sha256'\)/u);
  assert.match(sql, /p_envelope_expires_at - p_envelope_issued_at is distinct from interval '2 minutes'/u);
  assert.match(sql, /p_envelope_issued_at > pg_catalog\.transaction_timestamp\(\) \+ interval '30 seconds'/u);
  assert.match(sql, /v_envelope - 'issuedAt' - 'expiresAt' - 'formStartedAt'[\s\S]*?is distinct from pg_catalog\.jsonb_build_object/u);

  const ipLock = sql.indexOf("'audit_ip_quota:'");
  const contactLock = sql.indexOf("'audit_contact_quota:'");
  const firstQuotaCount = sql.indexOf("select count(*)", contactLock);
  assert.ok(ipLock >= 0 && ipLock < contactLock);
  assert.ok(contactLock < firstQuotaCount);
  assert.match(sql, /grant execute on function public\.submit_audit_request_v2/u);
});
