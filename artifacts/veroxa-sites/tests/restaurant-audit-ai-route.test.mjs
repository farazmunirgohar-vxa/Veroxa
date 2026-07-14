import assert from "node:assert/strict";
import test from "node:test";
import {
  AI_AUDIT_MAX_RECORDED_MICROUSD,
  AI_AUDIT_LONG_CONTEXT_THRESHOLD_TOKENS,
  AI_AUDIT_MAX_OUTPUT_TOKENS,
  AI_AUDIT_MAX_TOOL_CALLS,
  AI_AUDIT_MODEL,
  AI_AUDIT_PRICING_VERSION,
  AI_AUDIT_RESERVED_MICROUSD,
  actualMicrousd,
  calculateReservedMicrousd,
  createResearchPostHandler,
} from "../app/api/team/restaurant-audits/research/research-core.ts";

const RESERVATION_ID = "11111111-1111-4111-8111-111111111111";
const WEBSITE = "https://momo.example.com/";
const GOOGLE = "https://www.google.com/maps/place/Momo+House";
const YELP = "https://www.yelp.com/biz/momo-house-san-antonio";
const IDEMPOTENCY_KEY = "audit-request-00000001";

const definitions = [
  ["google_business_profile", 20],
  ["website_experience", 15],
  ["menu_and_ordering", 20],
  ["social_presence", 15],
  ["reviews_and_trust", 15],
  ["local_search_consistency", 15],
];

function modelResult(overrides = {}) {
  return {
    websiteUrl: WEBSITE,
    googleProfileUrl: GOOGLE,
    identityNote: "Momo House in San Antonio, TX is corroborated by the official website and Google profile.",
    identityEvidenceUrls: [WEBSITE, GOOGLE],
    categories: definitions.map(([key, weight], index) => ({
      key,
      status: "confirmed_missing",
      score: Math.min(10, weight - 1),
      evidenceUrl: index % 2 === 0 ? GOOGLE : WEBSITE,
      note: `A cited public source confirms a material weakness for category ${key}.`,
    })),
    ...overrides,
  };
}

function webCall(sources = [
  { type: "url", url: WEBSITE, title: "Momo House" },
  { type: "url", url: GOOGLE, title: "Momo House on Google" },
  { type: "url", url: YELP, title: "Momo House reviews" },
], actionType = "search") {
  return {
    type: "web_search_call",
    id: "ws_test",
    status: "completed",
    action: { type: actionType, sources },
  };
}

function providerPayload({
  result = modelResult(),
  sources,
  usage = { input_tokens: 1_000, output_tokens: 500, total_tokens: 1_500 },
  status = "completed",
  incompleteDetails = null,
  webCalls,
  outputText,
} = {}) {
  return {
    id: "resp_test_123",
    model: AI_AUDIT_MODEL,
    status,
    incomplete_details: incompleteDetails,
    usage,
    output: [
      ...(webCalls || [webCall(sources)]),
      {
        type: "message",
        status: "completed",
        content: [{ type: "output_text", text: outputText ?? JSON.stringify(result) }],
      },
    ],
  };
}

function jsonResponse(value, status = 200, headers = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function request(body = {}, headers = {}) {
  return new Request("https://veroxa.example/api/team/restaurant-audits/research", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://veroxa.example", ...headers },
    body: JSON.stringify({
      targetRequestId: null,
      restaurantName: "Momo House",
      city: "San Antonio",
      state: "TX",
      websiteUrl: WEBSITE,
      googleProfileUrl: GOOGLE,
      idempotencyKey: IDEMPOTENCY_KEY,
      ...body,
    }),
  });
}

function harness(overrides = {}) {
  const calls = { reserve: [], finalize: [], provider: [] };
  const budget = overrides.budget || {
    async reserve(input) {
      calls.reserve.push(input);
      return { reservationId: RESERVATION_ID, status: "reserved", cachedResponse: null };
    },
    async finalize(input) {
      calls.finalize.push(input);
    },
  };
  const deps = {
    enabled: true,
    providerConfigured: true,
    budgetConfigured: true,
    async authenticate() {
      return { role: "team", restaurantId: "22222222-2222-4222-8222-222222222222" };
    },
    budget,
    async callOpenAI(body) {
      calls.provider.push(body);
      return jsonResponse(providerPayload());
    },
    ...overrides,
    budget,
  };
  return { handler: createResearchPostHandler(deps), calls, deps };
}

async function bodyOf(response) {
  return response.json();
}

test("rejects unauthenticated and Client callers before budget or provider work", async () => {
  for (const actor of [null, { role: "client", restaurantId: "restaurant" }]) {
    const { handler, calls } = harness({ authenticate: async () => actor });
    const response = await handler(request());
    assert.equal(response.status, 403);
    assert.deepEqual(await bodyOf(response), { error: "team_access_required" });
    assert.equal(calls.reserve.length, 0);
    assert.equal(calls.provider.length, 0);
  }
});

test("rejects cross-site browser requests", async () => {
  const { handler, calls } = harness();
  const response = await handler(request({}, { origin: "https://evil.example", "sec-fetch-site": "cross-site" }));
  assert.equal(response.status, 403);
  assert.equal((await bodyOf(response)).error, "cross_site_request_rejected");
  assert.equal(calls.reserve.length, 0);
});

test("keeps AI disabled without touching budget or provider", async () => {
  const { handler, calls } = harness({ enabled: false });
  const response = await handler(request());
  assert.equal(response.status, 503);
  assert.equal((await bodyOf(response)).error, "ai_audit_disabled");
  assert.equal(calls.reserve.length, 0);
});

test("fails closed when either provider or server-only budget configuration is absent", async () => {
  for (const override of [{ providerConfigured: false }, { budgetConfigured: false }]) {
    const { handler, calls } = harness(override);
    const response = await handler(request());
    assert.equal(response.status, 503);
    assert.equal((await bodyOf(response)).error, "ai_configuration_unavailable");
    assert.equal(calls.reserve.length, 0);
  }
});

test("rejects malformed, oversized, and non-object request bodies", async () => {
  const { handler } = harness();
  const malformed = new Request("https://veroxa.example/api/team/restaurant-audits/research", {
    method: "POST",
    headers: { origin: "https://veroxa.example", "content-type": "application/json" },
    body: "{bad",
  });
  assert.equal((await bodyOf(await handler(malformed))).error, "invalid_request");
  const arrayBody = new Request("https://veroxa.example/api/team/restaurant-audits/research", {
    method: "POST",
    headers: { origin: "https://veroxa.example", "content-type": "application/json" },
    body: "[]",
  });
  assert.equal((await bodyOf(await handler(arrayBody))).error, "invalid_request");
  const oversized = request({}, { "content-length": "9000" });
  const oversizedResponse = await handler(oversized);
  assert.equal(oversizedResponse.status, 413);
});

test("requires a bounded request idempotency key and rejects header/body disagreement", async () => {
  const { handler, calls } = harness();
  assert.equal((await bodyOf(await handler(request({ idempotencyKey: "short" })))).error, "invalid_idempotency_key");
  assert.equal((await bodyOf(await handler(request({ idempotencyKey: "" })))).error, "invalid_idempotency_key");
  assert.equal((await bodyOf(await handler(request({}, { "idempotency-key": "different-key-0000001" })))).error, "invalid_idempotency_key");
  assert.equal(calls.reserve.length, 0);
});

test("rejects missing identity and unsafe public URLs", async () => {
  const { handler, calls } = harness();
  assert.equal((await bodyOf(await handler(request({ city: "" })))).error, "invalid_restaurant_identity");
  assert.equal((await bodyOf(await handler(request({ websiteUrl: "http://127.0.0.1/admin" })))).error, "invalid_restaurant_identity");
  assert.equal((await bodyOf(await handler(request({ googleProfileUrl: "file:///etc/passwd" })))).error, "invalid_restaurant_identity");
  assert.equal((await bodyOf(await handler(request({ targetRequestId: "not-a-uuid" })))).error, "invalid_restaurant_identity");
  assert.equal(calls.reserve.length, 0);
});

test("rejects overlong identity/idempotency input instead of truncating it into a hash collision", async () => {
  const { handler, calls } = harness();
  assert.equal((await bodyOf(await handler(request({ restaurantName: "x".repeat(161) })))).error, "invalid_restaurant_identity");
  assert.equal((await bodyOf(await handler(request({ city: "x".repeat(101) })))).error, "invalid_restaurant_identity");
  assert.equal((await bodyOf(await handler(request({ state: "x".repeat(41) })))).error, "invalid_restaurant_identity");
  assert.equal((await bodyOf(await handler(request({ idempotencyKey: "x".repeat(129) })))).error, "invalid_idempotency_key");
  assert.equal(calls.reserve.length, 0);
});

test("rejects loopback, private, and IPv4-mapped IPv6 restaurant URLs", async () => {
  const { handler, calls } = harness();
  for (const websiteUrl of [
    "http://[::1]/admin",
    "http://[::ffff:127.0.0.1]/admin",
    "http://[fd00::1]/admin",
    "http://169.254.169.254/latest/meta-data",
  ]) {
    const response = await handler(request({ websiteUrl }));
    assert.equal((await bodyOf(response)).error, "invalid_restaurant_identity");
  }
  assert.equal(calls.reserve.length, 0);
});

test("derives the locked 1,920,200 microusd long-context reservation with 25 percent headroom", () => {
  assert.equal(calculateReservedMicrousd(), 1_920_200);
  assert.equal(AI_AUDIT_RESERVED_MICROUSD, 1_920_200);
});

test("locks model, pricing, caps, private storage, and low-cost web-search controls", async () => {
  const { handler, calls } = harness();
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.equal(calls.provider.length, 1);
  const sent = calls.provider[0];
  assert.equal(sent.model, AI_AUDIT_MODEL);
  assert.equal(sent.store, false);
  assert.equal(sent.service_tier, "default");
  assert.equal(sent.max_tool_calls, AI_AUDIT_MAX_TOOL_CALLS);
  assert.equal(sent.max_output_tokens, AI_AUDIT_MAX_OUTPUT_TOKENS);
  assert.equal(sent.parallel_tool_calls, false);
  assert.deepEqual(sent.prompt_cache_options, { mode: "explicit" });
  assert.deepEqual(sent.reasoning, { effort: "low" });
  assert.deepEqual(sent.include, ["web_search_call.action.sources"]);
  assert.equal(sent.tools[0].search_context_size, "low");
  assert.equal(sent.tools[0].return_token_budget, "default");
  assert.equal(calls.reserve[0].pricingVersion, AI_AUDIT_PRICING_VERSION);
  assert.equal(calls.reserve[0].reservedMicrousd, AI_AUDIT_RESERVED_MICROUSD);
  assert.deepEqual(calls.reserve[0].requestSnapshot, {
    schemaVersion: 1,
    targetRequestId: null,
    restaurantName: "Momo House",
    city: "San Antonio",
    state: "TX",
    websiteUrl: WEBSITE,
    googleProfileUrl: GOOGLE,
  });
});

test("uses a stable hashed non-PII safety identifier no longer than 64 characters", async () => {
  const first = harness();
  const second = harness();
  await first.handler(request());
  await second.handler(request());
  const identifier = first.calls.provider[0].safety_identifier;
  assert.equal(identifier, second.calls.provider[0].safety_identifier);
  assert.match(identifier, /^[0-9a-f]{64}$/);
  assert.doesNotMatch(identifier, /momo|22222222/i);
});

test("binds the request hash to restaurant identity while keeping the same key actor-scoped", async () => {
  const first = harness();
  const second = harness();
  await first.handler(request());
  await second.handler(request({ city: "Austin" }));
  assert.equal(first.calls.reserve[0].idempotencyHash, second.calls.reserve[0].idempotencyHash);
  assert.notEqual(first.calls.reserve[0].requestHash, second.calls.reserve[0].requestHash);
  const targetBound = harness();
  await targetBound.handler(request({ targetRequestId: "33333333-3333-4333-8333-333333333333" }));
  assert.notEqual(first.calls.reserve[0].requestHash, targetBound.calls.reserve[0].requestHash);
});

test("maps budget exhaustion, failed replay, idempotency conflict, and pending reservations without provider calls", async () => {
  const cases = [
    [new Error("daily_ai_budget_exceeded"), 429, "ai_budget_exhausted"],
    [new Error("ai_audit_failed_reservation_cannot_replay"), 409, "ai_previous_attempt_failed"],
    [new Error("idempotency_request_hash_mismatch"), 409, "idempotency_conflict"],
    [null, 409, "ai_research_in_progress"],
  ];
  for (const [error, status, code] of cases) {
    const { handler, calls } = harness({
      budget: {
        async reserve() {
          if (error) throw error;
          return { reservationId: RESERVATION_ID, status: "in_progress", cachedResponse: null };
        },
        async finalize() {},
      },
    });
    const response = await handler(request());
    assert.equal(response.status, status);
    assert.equal((await bodyOf(response)).error, code);
    assert.equal(calls.provider.length, 0);
  }
});

test("returns a validated completed idempotent replay without a second provider call", async () => {
  const original = harness();
  const originalResponse = await original.handler(request());
  assert.equal(originalResponse.status, 200);
  const cached = original.calls.finalize[0].response;
  const replay = harness({
    budget: {
      async reserve() {
        return { reservationId: RESERVATION_ID, status: "completed", cachedResponse: cached };
      },
      async finalize() {
        throw new Error("must not finalize replay");
      },
    },
  });
  const response = await replay.handler(request());
  assert.equal(response.status, 200);
  assert.equal((await bodyOf(response)).idempotentReplay, true);
  assert.equal(replay.calls.provider.length, 0);
});

test("rejects a poisoned or request-mismatched cached response", async () => {
  const { handler } = harness({
    budget: {
      async reserve() {
        return { reservationId: RESERVATION_ID, status: "completed", cachedResponse: { model: AI_AUDIT_MODEL, requestHash: "bad" } };
      },
      async finalize() {},
    },
  });
  const response = await handler(request());
  assert.equal(response.status, 503);
  assert.equal((await bodyOf(response)).error, "ai_cached_result_invalid");
});

test("retains the full reservation on network and ambiguous upstream failures", async () => {
  for (const callOpenAI of [
    async () => { throw new Error("timeout"); },
    async () => new Response("bad gateway", { status: 502 }),
  ]) {
    const { handler, calls } = harness({ callOpenAI });
    const response = await handler(request());
    assert.ok([502, 503].includes(response.status));
    assert.equal(calls.finalize.length, 1);
    assert.equal(calls.finalize[0].status, "failed_provider");
    assert.equal(calls.finalize[0].actualMicrousd, AI_AUDIT_RESERVED_MICROUSD);
  }
});

test("rejects incomplete provider status and missing usage after recording failure", async () => {
  for (const payload of [
    providerPayload({ status: "incomplete", incompleteDetails: { reason: "max_output_tokens" } }),
    providerPayload({ usage: null }),
  ]) {
    const { handler, calls } = harness({ callOpenAI: async () => jsonResponse(payload) });
    const response = await handler(request());
    assert.equal(response.status, 502);
    assert.equal((await bodyOf(response)).error, "ai_output_incomplete");
    assert.equal(calls.finalize[0].status, "failed_output");
  }
});

test("rejects a provider response billed under an unapproved model family", async () => {
  const payload = { ...providerPayload(), model: "gpt-5.6-sol" };
  const { handler, calls } = harness({ callOpenAI: async () => jsonResponse(payload) });
  const response = await handler(request());
  assert.equal(response.status, 502);
  assert.equal((await bodyOf(response)).error, "ai_output_incomplete");
  assert.equal(calls.finalize[0].status, "failed_output");
});

test("rejects missing complete source provenance and missing actual search actions", async () => {
  const noSources = webCall();
  delete noSources.action.sources;
  const cases = [
    providerPayload({ webCalls: [noSources] }),
    providerPayload({ webCalls: [webCall(undefined, "open_page")] }),
  ];
  for (const payload of cases) {
    const { handler } = harness({ callOpenAI: async () => jsonResponse(payload) });
    const response = await handler(request());
    assert.equal(response.status, 502);
    assert.equal((await bodyOf(response)).error, "ai_output_incomplete");
  }
});

test("rejects malformed structured output and duplicate category keys", async () => {
  const duplicate = modelResult();
  duplicate.categories[1] = { ...duplicate.categories[0] };
  for (const payload of [
    providerPayload({ outputText: "not-json" }),
    providerPayload({ result: duplicate }),
  ]) {
    const { handler } = harness({ callOpenAI: async () => jsonResponse(payload) });
    const response = await handler(request());
    assert.equal(response.status, 502);
    assert.ok(["ai_output_invalid", "ai_output_uncorroborated"].includes((await bodyOf(response)).error));
  }
});

test("rejects model evidence URLs that were not in the provider source list", async () => {
  const result = modelResult();
  result.categories[0].evidenceUrl = "https://fabricated.example/evidence";
  const { handler, calls } = harness({ callOpenAI: async () => jsonResponse(providerPayload({ result })) });
  const response = await handler(request());
  assert.equal(response.status, 502);
  assert.equal((await bodyOf(response)).error, "ai_output_uncorroborated");
  assert.equal(calls.finalize[0].response, null);
});

test("requires two independent identity domains and the supplied website/Google anchors", async () => {
  const oneDomain = modelResult({ identityEvidenceUrls: [WEBSITE, "https://blog.momo.example.com/location"] });
  const missingWebsite = modelResult({ identityEvidenceUrls: [GOOGLE, YELP] });
  const missingGoogle = modelResult({ identityEvidenceUrls: [WEBSITE, YELP] });
  const cases = [
    providerPayload({
      result: oneDomain,
      sources: [
        { type: "url", url: WEBSITE, title: "Momo House" },
        { type: "url", url: "https://blog.momo.example.com/location", title: "Momo House blog" },
        { type: "url", url: GOOGLE, title: "Google" },
      ],
    }),
    providerPayload({ result: missingWebsite }),
    providerPayload({ result: missingGoogle }),
  ];
  for (const payload of cases) {
    const { handler } = harness({ callOpenAI: async () => jsonResponse(payload) });
    const response = await handler(request());
    assert.equal(response.status, 502);
    assert.equal((await bodyOf(response)).error, "ai_output_uncorroborated");
  }
});

test("requires the identity note to name the exact restaurant, city, and state", async () => {
  for (const identityNote of [
    "A same-name restaurant appears online in Austin, TX.",
    "Momo House in San Antonio has an ATX listing, but the state is not explicitly named.",
  ]) {
    const result = modelResult({ identityNote });
    const { handler } = harness({ callOpenAI: async () => jsonResponse(providerPayload({ result })) });
    const response = await handler(request());
    assert.equal(response.status, 502);
    assert.equal((await bodyOf(response)).error, "ai_output_uncorroborated");
  }
});

test("drops private-network sources and fails corroboration rather than returning them", async () => {
  const sources = [
    { type: "url", url: "http://192.168.1.1/admin", title: "private" },
    { type: "url", url: GOOGLE, title: "Google" },
  ];
  const result = modelResult({ identityEvidenceUrls: ["http://192.168.1.1/admin", GOOGLE] });
  const { handler } = harness({ callOpenAI: async () => jsonResponse(providerPayload({ result, sources })) });
  const response = await handler(request({ websiteUrl: "" }));
  assert.equal(response.status, 502);
  assert.ok(["ai_output_incomplete", "ai_output_uncorroborated"].includes((await bodyOf(response)).error));
});

test("deduplicates tracking variants while preserving every distinct sanitized source", async () => {
  const sources = [
    { type: "url", url: `${WEBSITE}?utm_source=one`, title: "Momo one" },
    { type: "url", url: `${WEBSITE}?utm_source=two`, title: "Momo two" },
    { type: "url", url: GOOGLE, title: "Google" },
    { type: "url", url: YELP, title: "Yelp" },
  ];
  const result = modelResult({ identityEvidenceUrls: [`${WEBSITE}?utm_source=one`, GOOGLE] });
  const { handler } = harness({ callOpenAI: async () => jsonResponse(providerPayload({ result, sources })) });
  const response = await handler(request());
  assert.equal(response.status, 200);
  const body = await bodyOf(response);
  assert.equal(body.sources.length, 3);
  assert.equal(new Set(body.sources.map((source) => source.url)).size, 3);
});

test("calculates usage cost from input, output/reasoning, and all web calls", async () => {
  assert.equal(actualMicrousd({ inputTokens: 1_000, outputTokens: 500, totalTokens: 1_500, webSearchCalls: 1 }), 14_000);
  const { handler, calls } = harness();
  const response = await handler(request());
  assert.equal(response.status, 200);
  const body = await bodyOf(response);
  assert.equal(body.actualMicrousd, 14_000);
  assert.equal(calls.finalize[0].actualMicrousd, 14_000);
  assert.equal(calls.finalize[0].status, "completed");
  const thresholdUsage = {
    inputTokens: AI_AUDIT_LONG_CONTEXT_THRESHOLD_TOKENS,
    outputTokens: 500,
    totalTokens: AI_AUDIT_LONG_CONTEXT_THRESHOLD_TOKENS + 500,
    webSearchCalls: 1,
  };
  assert.equal(actualMicrousd(thresholdUsage), 285_000);
  assert.equal(actualMicrousd({
    ...thresholdUsage,
    inputTokens: AI_AUDIT_LONG_CONTEXT_THRESHOLD_TOKENS + 1,
    totalTokens: AI_AUDIT_LONG_CONTEXT_THRESHOLD_TOKENS + 501,
  }), 558_502);
});

test("rejects any prompt-cache usage under the explicit no-breakpoint policy", async () => {
  for (const details of [{ cached_tokens: 1 }, { cache_write_tokens: 1 }]) {
    const payload = providerPayload({
      usage: {
        input_tokens: 1_000,
        output_tokens: 500,
        total_tokens: 1_500,
        input_tokens_details: details,
      },
    });
    const { handler, calls } = harness({ callOpenAI: async () => jsonResponse(payload) });
    const response = await handler(request());
    assert.equal(response.status, 502);
    assert.equal((await bodyOf(response)).error, "ai_output_incomplete");
    assert.equal(calls.finalize[0].actualMicrousd, AI_AUDIT_RESERVED_MICROUSD);
    assert.equal(calls.finalize[0].usage, null);
  }
});

test("fails closed if measured provider usage exceeds the conservative reservation", async () => {
  const webCalls = Array.from({ length: 4 }, (_, index) => ({ ...webCall(), id: `ws_${index}` }));
  const payload = providerPayload({
    webCalls,
    usage: { input_tokens: 1_000_000, output_tokens: 2_400, total_tokens: 1_002_400 },
  });
  const { handler, calls } = harness({ callOpenAI: async () => jsonResponse(payload) });
  const response = await handler(request());
  assert.equal(response.status, 502);
  assert.equal((await bodyOf(response)).error, "ai_cost_bound_exceeded");
  assert.ok(calls.finalize[0].actualMicrousd > AI_AUDIT_RESERVED_MICROUSD);
  assert.ok(calls.finalize[0].actualMicrousd <= AI_AUDIT_MAX_RECORDED_MICROUSD);
});

test("bounds an implausible provider usage claim and still finalizes the reservation", async () => {
  const webCalls = Array.from({ length: 4 }, (_, index) => ({ ...webCall(), id: `ws_absurd_${index}` }));
  const payload = providerPayload({
    webCalls,
    usage: {
      input_tokens: AI_AUDIT_MAX_RECORDED_MICROUSD + 1,
      output_tokens: 0,
      total_tokens: AI_AUDIT_MAX_RECORDED_MICROUSD + 1,
    },
  });
  const { handler, calls } = harness({ callOpenAI: async () => jsonResponse(payload) });
  const response = await handler(request());
  assert.equal(response.status, 502);
  assert.equal((await bodyOf(response)).error, "ai_output_incomplete");
  assert.equal(calls.finalize.length, 1);
  assert.equal(calls.finalize[0].status, "failed_output");
  assert.equal(calls.finalize[0].actualMicrousd, AI_AUDIT_RESERVED_MICROUSD);
  assert.equal(calls.finalize[0].usage, null);
});

test("does not release provider output if the server-only finalization ledger fails", async () => {
  const calls = { reserve: [], finalize: [], provider: [] };
  const { handler } = harness({
    budget: {
      async reserve(input) {
        calls.reserve.push(input);
        return { reservationId: RESERVATION_ID, status: "reserved", cachedResponse: null };
      },
      async finalize(input) {
        calls.finalize.push(input);
        throw new Error("database unavailable");
      },
    },
  });
  const response = await handler(request());
  assert.equal(response.status, 503);
  assert.deepEqual(await bodyOf(response), { error: "ai_budget_finalization_failed" });
  assert.equal(calls.finalize.length, 1);
});

test("returns no-store and anti-sniffing headers on success and failure", async () => {
  for (const response of [await harness().handler(request()), await harness({ enabled: false }).handler(request())]) {
    assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.match(response.headers.get("content-security-policy"), /default-src 'none'/);
  }
});
