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

  globalThis.fetch = async () => { throw new Error("simulated upstream failure"); };
  await expectStatus("Sites upstream failure", await sitesPost(request(JSON.stringify(validBody))), 503);

  globalThis.fetch = async () => Response.json([{ reference_code: "VA-CONTRACT" }], { status: 200 });
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
