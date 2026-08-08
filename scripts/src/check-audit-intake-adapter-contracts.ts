import { createHmac } from "node:crypto";

const sitesModuleUrl = new URL("../../artifacts/veroxa-sites/app/api/audit-requests/route.ts", import.meta.url).href;
const { POST: sitesPost } = await import(sitesModuleUrl) as {
  POST(request: Request): Promise<Response>;
};

const originalFetch = globalThis.fetch;
const originalEnv = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  secret: process.env.AUDIT_INTAKE_HMAC_SECRET,
};

const validBody = {
  restaurantName: "Contract Test Restaurant",
  city: "San Antonio",
  state: "TX",
  contactEmail: "owner@example.invalid",
  consentToContact: true,
  consentVersion: "2026-07-12",
  formStartedAt: new Date(Date.now() - 5_000).toISOString(),
  idempotencyKey: "contract-test-key-0001",
};

function request(body: string, method = "POST"): Request {
  return new Request("https://veroxa.example/api/audit-requests", {
    method,
    headers: { "content-type": "application/json" },
    body: method === "POST" ? body : undefined,
  });
}

function declaredRequest(body: string, declaredLength: string): Request {
  return new Request("https://veroxa.example/api/audit-requests", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "content-length": declaredLength,
    },
    body,
  });
}

async function expectStatus(label: string, result: Response, expected: number): Promise<void> {
  if (result.status !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${result.status}`);
  }
  if (result.headers.get("cache-control") !== "no-store, max-age=0") {
    throw new Error(`${label}: response is not explicitly non-cacheable`);
  }
  await result.json();
}

try {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://contract.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_contract";
  process.env.AUDIT_INTAKE_HMAC_SECRET = "c".repeat(64);

  await expectStatus("Sites null JSON", await sitesPost(request("null")), 400);
  await expectStatus("Sites oversized raw body", await sitesPost(request(`${" ".repeat(16_385)}{}`)), 413);
  await expectStatus(
    "Sites oversized declared body",
    await sitesPost(declaredRequest("{}", "16385")),
    413,
  );

  globalThis.fetch = async () => { throw new Error("simulated upstream failure"); };
  await expectStatus("Sites upstream failure", await sitesPost(request(JSON.stringify(validBody))), 503);

  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url !== "https://contract.supabase.co/rest/v1/rpc/submit_audit_request_v2") {
      throw new Error(`Sites intake called the wrong RPC: ${url}`);
    }
    const sent = JSON.parse(String(init?.body)) as Record<string, unknown>;
    const expectedKeys = [
      "p_city",
      "p_consent_to_contact",
      "p_consent_version",
      "p_contact_email",
      "p_contact_name",
      "p_contact_note",
      "p_contact_phone",
      "p_envelope_canonical",
      "p_envelope_expires_at",
      "p_envelope_issued_at",
      "p_envelope_nonce",
      "p_envelope_version",
      "p_fingerprint",
      "p_form_started_at",
      "p_google_profile_url",
      "p_honeypot",
      "p_idempotency_key",
      "p_intake_token",
      "p_ip_quota_fingerprint",
      "p_restaurant_name",
      "p_state",
      "p_website_url",
    ];
    if (JSON.stringify(Object.keys(sent).sort()) !== JSON.stringify(expectedKeys)) {
      throw new Error("Sites intake v2 body does not match the exact 22-parameter contract");
    }
    if (sent.p_envelope_version !== 1 ||
      typeof sent.p_envelope_nonce !== "string" ||
      !/^[0-9a-f]{64}$/u.test(sent.p_envelope_nonce) ||
      sent.p_fingerprint !== sent.p_ip_quota_fingerprint) {
      throw new Error("Sites intake envelope metadata or quota binding is invalid");
    }
    const canonical = String(sent.p_envelope_canonical);
    const envelope = JSON.parse(canonical) as Record<string, unknown>;
    if (envelope.schema !== "veroxa.public-audit-intake-envelope" ||
      envelope.version !== 1 || envelope.nonce !== sent.p_envelope_nonce ||
      envelope.ipQuotaFingerprint !== sent.p_ip_quota_fingerprint ||
      envelope.issuedAt !== sent.p_envelope_issued_at ||
      envelope.expiresAt !== sent.p_envelope_expires_at ||
      Date.parse(String(envelope.expiresAt)) - Date.parse(String(envelope.issuedAt)) !== 120_000) {
      throw new Error("Sites canonical envelope is not bound to the RPC metadata");
    }
    const expectedToken = createHmac("sha256", "c".repeat(64))
      .update(canonical)
      .digest("hex");
    if (sent.p_intake_token !== expectedToken) {
      throw new Error("Sites canonical envelope HMAC is invalid");
    }
    return Response.json([{ reference_code: "VA-CONTRACT" }], { status: 200 });
  };
  await expectStatus("Sites accepted intake", await sitesPost(request(JSON.stringify(validBody))), 202);
} finally {
  globalThis.fetch = originalFetch;
  const restore = (name: string, value: string | undefined) => {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  };
  restore("NEXT_PUBLIC_SUPABASE_URL", originalEnv.url);
  restore("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", originalEnv.key);
  restore("AUDIT_INTAKE_HMAC_SECRET", originalEnv.secret);
}

console.log("Audit intake adapter contract checks passed.");
