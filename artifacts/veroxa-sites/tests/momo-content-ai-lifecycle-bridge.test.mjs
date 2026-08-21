import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  getMomoContentAiLifecycleBridgeConfig,
  importVerifiedMomoContentAiLifecycleSigningKey,
  invokeMomoContentAiLifecycleBridge,
  MOMO_CONTENT_AI_LIFECYCLE_BRIDGE_PUBLIC_KEY_SPKI_BASE64,
  MomoContentAiLifecycleBridgeError,
} from "../app/momo-content-ai-lifecycle-bridge.ts";
import { verifyMomoContentAiBridgeSignature } from
  "../supabase/functions/_shared/momo-content-ai-lifecycle-contract.ts";

const firstPair = generateKeyPairSync("ed25519");
const secondPair = generateKeyPairSync("ed25519");
const privateKey = firstPair.privateKey.export({
  type: "pkcs8",
  format: "der",
}).toString("base64");
const publicKey = firstPair.publicKey.export({
  type: "spki",
  format: "der",
}).toString("base64");
const otherPublicKey = secondPair.publicKey.export({
  type: "spki",
  format: "der",
}).toString("base64");
const CORRELATION_ID = "11111111-1111-4111-8111-111111111111";
const ACCESS_TOKEN = "signed-user-access-token";
const SERVER_VERIFIED_ACCESS_TOKEN =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTQxMTEtODExMS0xMTExMTExMTExMTEifQ.signature";

function bridgeConfig() {
  return {
    endpoint: "https://example.supabase.co/functions/v1/momo-content-ai-lifecycle",
    publishableKey: "sb_publishable_test_key",
    bridgePrivateKey: privateKey,
    bridgePublicKey: publicKey,
  };
}

function client() {
  return {
    auth: {
      async getSession() {
        return {
          data: {
            session: {
              access_token: ACCESS_TOKEN,
              expires_at: Math.floor(Date.now() / 1_000) + 3_600,
            },
          },
          error: null,
        };
      },
      async refreshSession() {
        throw new Error("refresh_not_expected");
      },
    },
  };
}

test("lifecycle bridge requires its dedicated secret and matches the Edge public key", async () => {
  const base = {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_key",
  };
  assert.equal(getMomoContentAiLifecycleBridgeConfig({
    ...base,
    VEROXA_MEDIA_AI_BRIDGE_PRIVATE_KEY: privateKey,
  }), null, "a shared legacy key must never authorize this bridge");
  const config = getMomoContentAiLifecycleBridgeConfig({
    ...base,
    VEROXA_MOMO_CONTENT_AI_LIFECYCLE_BRIDGE_PRIVATE_KEY: privateKey,
  });
  assert.ok(config);
  assert.equal(config.bridgePrivateKey, privateKey);
  assert.equal(
    config.bridgePublicKey,
    MOMO_CONTENT_AI_LIFECYCLE_BRIDGE_PUBLIC_KEY_SPKI_BASE64,
  );

  const edgeSource = await readFile(new URL(
    "../supabase/functions/momo-content-ai-lifecycle/index.ts",
    import.meta.url,
  ), "utf8");
  const edgeKey = edgeSource.match(
    /const BRIDGE_PUBLIC_KEY_SPKI_BASE64\s*=\s*\n?\s*"([A-Za-z0-9+/=]+)"/u,
  )?.[1];
  assert.equal(edgeKey, MOMO_CONTENT_AI_LIFECYCLE_BRIDGE_PUBLIC_KEY_SPKI_BASE64);
});

test("lifecycle signing preflight accepts only a matching Ed25519 key pair", async () => {
  assert.ok(await importVerifiedMomoContentAiLifecycleSigningKey({
    privateKeyBase64: privateKey,
    publicKeyBase64: publicKey,
  }));
  assert.equal(await importVerifiedMomoContentAiLifecycleSigningKey({
    privateKeyBase64: privateKey,
    publicKeyBase64: otherPublicKey,
  }), null);
  assert.equal(await importVerifiedMomoContentAiLifecycleSigningKey({
    privateKeyBase64: "not-base64",
    publicKeyBase64: publicKey,
  }), null);
});

test("lifecycle bridge uses Worker-compatible fetch controls on a verified signed request", async () => {
  const request = { operation: "record_intake_attempt", assetId: "asset" };
  const result = await invokeMomoContentAiLifecycleBridge(
    client(),
    bridgeConfig(),
    request,
    {
      correlationId: CORRELATION_ID,
      async fetchImplementation(url, init) {
        assert.equal(url, bridgeConfig().endpoint);
        assert.equal(init.method, "POST");
        assert.equal(init.headers.authorization, `Bearer ${ACCESS_TOKEN}`);
        assert.equal(init.headers.apikey, bridgeConfig().publishableKey);
        assert.equal(init.headers["content-type"], "application/json");
        assert.equal(init.headers["x-veroxa-correlation-id"], CORRELATION_ID);
        assert.equal(
          init.headers["x-veroxa-server-purpose"],
          "momo-content-ai-lifecycle-v1",
        );
        assert.equal(init.body, JSON.stringify(request));
        assert.equal(Object.hasOwn(init, "credentials"), false);
        assert.equal(Object.hasOwn(init, "cache"), false,
          "the Worker bridge must not pass an unsupported RequestInit cache member");
        assert.equal(init.redirect, "manual",
          "Workers must expose redirects for explicit fail-closed rejection");
        assert.ok(init.signal instanceof AbortSignal);
        assert.equal(init.signal.aborted, false);
        assert.equal(await verifyMomoContentAiBridgeSignature({
          publicKeyBase64: publicKey,
          timestampMs: init.headers["x-veroxa-content-ai-timestamp-ms"],
          nonce: init.headers["x-veroxa-content-ai-nonce"],
          accessToken: ACCESS_TOKEN,
          body: init.body,
          signature: init.headers["x-veroxa-content-ai-signature"],
        }), true);
        return Response.json({ data: { status: "recorded" } });
      },
    },
  );
  assert.deepEqual(result, { status: "recorded" });
});

test("server-verified bearer bypasses cookie session lookup and signs the exact token", async () => {
  let sessionCalls = 0;
  const request = { operation: "finalize_upload", assetId: "asset" };
  const result = await invokeMomoContentAiLifecycleBridge(
    {
      auth: {
        async getSession() {
          sessionCalls += 1;
          throw new Error("session_lookup_must_not_run");
        },
      },
    },
    bridgeConfig(),
    request,
    {
      correlationId: CORRELATION_ID,
      serverVerifiedAccessToken: SERVER_VERIFIED_ACCESS_TOKEN,
      async fetchImplementation(_url, init) {
        assert.equal(
          init.headers.authorization,
          `Bearer ${SERVER_VERIFIED_ACCESS_TOKEN}`,
        );
        assert.equal(await verifyMomoContentAiBridgeSignature({
          publicKeyBase64: publicKey,
          timestampMs: init.headers["x-veroxa-content-ai-timestamp-ms"],
          nonce: init.headers["x-veroxa-content-ai-nonce"],
          accessToken: SERVER_VERIFIED_ACCESS_TOKEN,
          body: init.body,
          signature: init.headers["x-veroxa-content-ai-signature"],
        }), true);
        return Response.json({ data: { status: "verified" } });
      },
    },
  );
  assert.equal(sessionCalls, 0);
  assert.deepEqual(result, { status: "verified" });
});

test("malformed explicit bearer fails before session or transport without leaking", async () => {
  let sessionCalls = 0;
  let fetchCalls = 0;
  for (const invalid of [
    undefined,
    "",
    "opaque-token",
    `${SERVER_VERIFIED_ACCESS_TOKEN} `,
    `${SERVER_VERIFIED_ACCESS_TOKEN},second-token`,
    `a.${"b".repeat(8_192)}.c`,
  ]) {
    const events = [];
    await assert.rejects(
      invokeMomoContentAiLifecycleBridge(
        {
          auth: {
            async getSession() {
              sessionCalls += 1;
              throw new Error("session_lookup_must_not_run");
            },
          },
        },
        bridgeConfig(),
        { operation: "finalize_upload" },
        {
          correlationId: CORRELATION_ID,
          serverVerifiedAccessToken: invalid,
          telemetry: (event) => events.push(event),
          fetchImplementation: async () => {
            fetchCalls += 1;
            return Response.json({ data: null });
          },
        },
      ),
      (error) => error instanceof MomoContentAiLifecycleBridgeError &&
        error.stage === "session" &&
        error.code === "momo_content_ai_lifecycle_session_unavailable",
    );
    assert.equal(events.length, 1);
    assert.doesNotMatch(JSON.stringify(events),
      /eyJhbGci|opaque-token|second-token/u);
  }
  assert.equal(sessionCalls, 0);
  assert.equal(fetchCalls, 0);
});

test("lifecycle Worker transport source excludes unsupported fetch members and stays bounded", async () => {
  const source = await readFile(new URL(
    "../app/momo-content-ai-lifecycle-bridge.ts",
    import.meta.url,
  ), "utf8");
  assert.doesNotMatch(source, /\bcredentials\s*:/u);
  assert.doesNotMatch(source, /\bcache\s*:/u);
  assert.match(source, /signal:\s*AbortSignal\.timeout\(20_000\)/u);
  assert.match(source, /redirect:\s*"manual"/u);
});

test("lifecycle bridge rejects every manual redirect before response-body parsing", async () => {
  const events = [];
  let bodyRead = false;
  const redirectResponse = {
    status: 307,
    ok: false,
    headers: new Headers({ location: "https://other.example.invalid/" }),
    async text() {
      bodyRead = true;
      return "redirect body";
    },
  };
  await assert.rejects(
    invokeMomoContentAiLifecycleBridge(
      client(),
      bridgeConfig(),
      { operation: "finalize_upload" },
      {
        correlationId: CORRELATION_ID,
        telemetry: (event) => events.push(event),
        fetchImplementation: async () => redirectResponse,
      },
    ),
    (error) => error instanceof MomoContentAiLifecycleBridgeError &&
      error.stage === "response_status" &&
      error.code === "momo_content_ai_lifecycle_bridge_rejected" &&
      error.retryable === false && error.httpStatus === 307 &&
      error.correlationId === CORRELATION_ID,
  );
  assert.equal(bodyRead, false);
  assert.deepEqual(events, [{
    event: "momo_content_ai_lifecycle_bridge_failure",
    correlationId: CORRELATION_ID,
    stage: "response_status",
    code: "momo_content_ai_lifecycle_bridge_rejected",
    retryable: false,
    httpStatus: 307,
    upstreamAuthError: null,
  }]);
});

test("lifecycle bridge emits a sanitized stage-specific failure", async () => {
  const events = [];
  await assert.rejects(
    invokeMomoContentAiLifecycleBridge(
      client(),
      bridgeConfig(),
      { operation: "finalize_upload", secretPayload: "must-not-leak" },
      {
        correlationId: CORRELATION_ID,
        telemetry: (event) => events.push(event),
        fetchImplementation: async () => new Response("rejected secret", {
          status: 502,
          headers: { "content-type": "text/plain" },
        }),
      },
    ),
    (error) => error instanceof MomoContentAiLifecycleBridgeError &&
      error.stage === "response_status" && error.retryable === true &&
      error.httpStatus === 502 && error.correlationId === CORRELATION_ID,
  );
  assert.deepEqual(events, [{
    event: "momo_content_ai_lifecycle_bridge_failure",
    correlationId: CORRELATION_ID,
    stage: "response_status",
    code: "momo_content_ai_lifecycle_bridge_rejected",
    retryable: true,
    httpStatus: 502,
    upstreamAuthError: null,
  }]);
  assert.doesNotMatch(JSON.stringify(events), /secret|access-token|private/u);
});

test("lifecycle bridge exposes only allowlisted auth rejection codes", async () => {
  for (const upstreamAuthError of [
    "bridge_access_required",
    "team_access_required",
  ]) {
    const events = [];
    await assert.rejects(
      invokeMomoContentAiLifecycleBridge(
        client(),
        bridgeConfig(),
        { operation: "finalize_upload", secretPayload: "must-not-leak" },
        {
          correlationId: CORRELATION_ID,
          telemetry: (event) => events.push(event),
          fetchImplementation: async () => new Response(
            JSON.stringify({ error: upstreamAuthError }),
            {
              status: 403,
              headers: {
                "content-type": upstreamAuthError === "team_access_required"
                  ? 'application/json; charset="utf-8"'
                  : "application/json",
              },
            },
          ),
        },
      ),
      (error) => error instanceof MomoContentAiLifecycleBridgeError &&
        error.stage === "response_status" && error.httpStatus === 403 &&
        error.upstreamAuthError === upstreamAuthError,
    );
    assert.deepEqual(events, [{
      event: "momo_content_ai_lifecycle_bridge_failure",
      correlationId: CORRELATION_ID,
      stage: "response_status",
      code: "momo_content_ai_lifecycle_bridge_rejected",
      retryable: false,
      httpStatus: 403,
      upstreamAuthError,
    }]);
    assert.doesNotMatch(JSON.stringify(events), /secret|access-token|private/u);
  }
});

test("lifecycle bridge redacts malformed and non-allowlisted error responses", async () => {
  const responses = [
    Response.json({ error: "bridge_access_required" }, { status: 401 }),
    Response.json({ error: "team_access_required" }, { status: 500 }),
    new Response('{"error":"bridge_access_required","secret":"leak"}', {
      status: 403,
      headers: { "content-type": "application/json" },
    }),
    Response.json({ error: "credential_rejected_secret" }, { status: 403 }),
    new Response('{"error":"team_access_required"}', {
      status: 403,
      headers: { "content-type": "text/plain" },
    }),
    new Response('{"error":"team_access_required"}', {
      status: 403,
      headers: { "content-type": "application/jsonp" },
    }),
    new Response('{"error":"team_access_required"}', {
      status: 403,
      headers: { "content-type": "application/json, text/plain" },
    }),
    new Response(
      '{"error":"credential_rejected_secret","error":"team_access_required"}',
      {
        status: 403,
        headers: { "content-type": "application/json" },
      },
    ),
    new Response('{"\\u0065rror":"team_access_required"}', {
      status: 403,
      headers: { "content-type": "application/json" },
    }),
    new Response("{not-json", {
      status: 403,
      headers: { "content-type": "application/json" },
    }),
    new Response(JSON.stringify({
      error: "bridge_access_required",
      padding: "x".repeat(1_024),
    }), {
      status: 403,
      headers: { "content-type": "application/json" },
    }),
  ];
  for (const response of responses) {
    const events = [];
    await assert.rejects(
      invokeMomoContentAiLifecycleBridge(
        client(),
        bridgeConfig(),
        { operation: "finalize_upload", secretPayload: "must-not-leak" },
        {
          correlationId: CORRELATION_ID,
          telemetry: (event) => events.push(event),
          fetchImplementation: async () => response,
        },
      ),
      (error) => error instanceof MomoContentAiLifecycleBridgeError &&
        error.upstreamAuthError === null,
    );
    assert.equal(events.length, 1);
    assert.equal(events[0].upstreamAuthError, null);
    assert.doesNotMatch(
      JSON.stringify(events),
      /credential_rejected_secret|must-not-leak|padding/u,
    );
  }
});

test("key mismatch fails before transport and identifies preflight", async () => {
  const events = [];
  let fetchCalls = 0;
  await assert.rejects(
    invokeMomoContentAiLifecycleBridge(
      client(),
      { ...bridgeConfig(), bridgePublicKey: otherPublicKey },
      { operation: "finalize_upload" },
      {
        correlationId: CORRELATION_ID,
        telemetry: (event) => events.push(event),
        fetchImplementation: async () => {
          fetchCalls += 1;
          return Response.json({ data: null });
        },
      },
    ),
    (error) => error instanceof MomoContentAiLifecycleBridgeError &&
      error.stage === "key_preflight" &&
      error.code === "momo_content_ai_lifecycle_key_pair_invalid",
  );
  assert.equal(fetchCalls, 0);
  assert.equal(events[0].stage, "key_preflight");
});
