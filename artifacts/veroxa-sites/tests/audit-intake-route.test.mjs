import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../app/api/audit-requests/route.ts";

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_ENV = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  secret: process.env.AUDIT_INTAKE_HMAC_SECRET,
};

function configure() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  process.env.AUDIT_INTAKE_HMAC_SECRET = "audit-intake-test-secret";
}

function restore(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

test.afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  restore("NEXT_PUBLIC_SUPABASE_URL", ORIGINAL_ENV.url);
  restore("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", ORIGINAL_ENV.key);
  restore("AUDIT_INTAKE_HMAC_SECRET", ORIGINAL_ENV.secret);
});

function body(overrides = {}) {
  return {
    restaurantName: "Momo's House",
    city: "San Antonio",
    state: "Texas",
    websiteUrl: "https://momos.example/",
    googleProfileUrl: "https://maps.google.com/?cid=123",
    contactName: "Faraz",
    contactEmail: "owner@example.com",
    contactPhone: "+1 210 555 0100",
    contactNote: "Please contact me about the Audit.",
    consentToContact: true,
    consentVersion: "2026-07-12",
    formStartedAt: "2026-08-08T00:00:00.000Z",
    honeypot: "",
    idempotencyKey: "audit-attempt-00000001",
    ...overrides,
  };
}

function request(value = body(), options = {}) {
  return new Request("https://veroxa.example/api/audit-requests", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": "203.0.113.40",
      ...(options.headers || {}),
    },
    body: options.rawBody ?? JSON.stringify(value),
  });
}

test("Audit intake fails closed when its server-only signing boundary is unavailable", async () => {
  delete process.env.AUDIT_INTAKE_HMAC_SECRET;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response();
  };
  const response = await POST(request());
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { accepted: false });
  assert.equal(called, false);
});

test("Audit intake rejects invalid input before the signed RPC boundary", async () => {
  configure();
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response();
  };
  for (const candidate of [
    body({ consentToContact: false }),
    body({ contactEmail: "not-an-email", contactPhone: "" }),
    body({ websiteUrl: "file:///etc/passwd" }),
    body({ idempotencyKey: "short" }),
  ]) {
    const response = await POST(request(candidate));
    assert.equal(response.status, 400);
  }
  assert.equal(called, false);
});

test("Audit intake stops an oversized stream before calling Supabase", async () => {
  configure();
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response();
  };
  const oversized = new Request("https://veroxa.example/api/audit-requests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "x".repeat(16_385),
  });
  const response = await POST(oversized);
  assert.equal(response.status, 413);
  assert.equal(called, false);
});

test("Audit intake sends only the signed v2 envelope contract and returns its reference", async () => {
  configure();
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return Response.json([{
      request_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      reference_code: "AUD-2026-0001",
      request_status: "received",
    }], { status: 200 });
  };
  const response = await POST(request());
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), {
    accepted: true,
    reference: "AUD-2026-0001",
  });
  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    "https://example.supabase.co/rest/v1/rpc/submit_audit_request_v2",
  );
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers.apikey, "sb_publishable_test");
  const rpc = JSON.parse(calls[0].init.body);
  assert.equal(rpc.p_restaurant_name, "Momo's House");
  assert.equal(rpc.p_fingerprint, rpc.p_ip_quota_fingerprint);
  assert.equal(rpc.p_envelope_version, 1);
  assert.match(rpc.p_envelope_nonce, /^[0-9a-f]{64}$/u);
  assert.match(rpc.p_intake_token, /^[0-9a-f]{64}$/u);
  assert.equal(
    Date.parse(rpc.p_envelope_expires_at) - Date.parse(rpc.p_envelope_issued_at),
    120_000,
  );
  const envelope = JSON.parse(rpc.p_envelope_canonical);
  assert.equal(envelope.restaurantName, "Momo's House");
  assert.equal(envelope.ipQuotaFingerprint, rpc.p_ip_quota_fingerprint);
  assert.equal(envelope.idempotencyKey, "audit-attempt-00000001");
});

test("Audit intake maps only bounded public RPC outcomes", async () => {
  configure();
  for (const [upstream, expected] of [
    [Response.json({ message: "rate_limited" }, { status: 429 }), 429],
    [Response.json({ message: "submission_rejected" }, { status: 400 }), 400],
    [Response.json({ message: "internal" }, { status: 500 }), 503],
    [Response.json([], { status: 200 }), 503],
  ]) {
    globalThis.fetch = async () => upstream;
    const response = await POST(request());
    assert.equal(response.status, expected);
    assert.deepEqual(await response.json(), { accepted: false });
  }
});
