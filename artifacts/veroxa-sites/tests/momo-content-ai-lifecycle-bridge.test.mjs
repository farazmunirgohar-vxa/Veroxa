import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { build } from "esbuild";
import { Miniflare } from "miniflare";
import {
  getMomoContentAiLifecycleBridgeConfig,
  importVerifiedMomoContentAiLifecycleSigningKey,
  invokeMomoContentAiLifecycleBridge,
  MOMO_CONTENT_AI_LIFECYCLE_BRIDGE_PUBLIC_KEY_SPKI_BASE64,
  MomoContentAiLifecycleBridgeError,
} from "../app/momo-content-ai-lifecycle-bridge.ts";
import {
  parseMomoContentAiBridgeEnvelopeV2,
  verifyMomoContentAiBridgeEnvelopeV2Signature,
  verifyMomoContentAiBridgeSignature,
} from
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
          "momo-content-ai-lifecycle-v2",
        );
        assert.equal(
          Object.hasOwn(init.headers, "x-veroxa-content-ai-timestamp-ms"),
          false,
        );
        assert.equal(
          Object.hasOwn(init.headers, "x-veroxa-content-ai-nonce"),
          false,
        );
        assert.equal(
          Object.hasOwn(init.headers, "x-veroxa-content-ai-signature"),
          false,
        );
        assert.equal(typeof init.body, "string");
        const envelope = parseMomoContentAiBridgeEnvelopeV2(
          JSON.parse(init.body),
        );
        assert.ok(envelope);
        assert.deepEqual(Object.keys(envelope).sort(), [
          "correlationId",
          "nonce",
          "payload",
          "schemaVersion",
          "signature",
          "signedAtMs",
        ]);
        assert.equal(envelope.payload, JSON.stringify(request));
        assert.equal(envelope.correlationId, CORRELATION_ID);
        assert.equal(Object.hasOwn(init, "credentials"), false);
        assert.equal(Object.hasOwn(init, "cache"), false,
          "the Worker bridge must not pass an unsupported RequestInit cache member");
        assert.equal(init.redirect, "manual",
          "Workers must expose redirects for explicit fail-closed rejection");
        assert.ok(init.signal instanceof AbortSignal);
        assert.equal(init.signal.aborted, false);
        assert.equal(await verifyMomoContentAiBridgeEnvelopeV2Signature({
          publicKeyBase64: publicKey,
          accessToken: ACCESS_TOKEN,
          envelope,
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
        assert.equal(typeof init.body, "string");
        const envelope = parseMomoContentAiBridgeEnvelopeV2(
          JSON.parse(init.body),
        );
        assert.ok(envelope);
        assert.equal(envelope.payload, JSON.stringify(request));
        assert.equal(envelope.correlationId, CORRELATION_ID);
        assert.equal(await verifyMomoContentAiBridgeEnvelopeV2Signature({
          publicKeyBase64: publicKey,
          accessToken: SERVER_VERIFIED_ACCESS_TOKEN,
          envelope,
        }), true);
        return Response.json({ data: { status: "verified" } });
      },
    },
  );
  assert.equal(sessionCalls, 0);
  assert.deepEqual(result, { status: "verified" });
});

test("signed envelope rejects every mutation and preserves the v1 rollback verifier", async () => {
  let envelope;
  await invokeMomoContentAiLifecycleBridge(
    client(),
    bridgeConfig(),
    { operation: "finalize_upload", assetId: "asset" },
    {
      correlationId: CORRELATION_ID,
      async fetchImplementation(_url, init) {
        assert.equal(typeof init.body, "string");
        envelope = parseMomoContentAiBridgeEnvelopeV2(JSON.parse(init.body));
        return Response.json({ data: null });
      },
    },
  );
  assert.ok(envelope);
  const signedAtMs = Number(envelope.signedAtMs);
  assert.equal(await verifyMomoContentAiBridgeEnvelopeV2Signature({
    publicKeyBase64: publicKey,
    accessToken: ACCESS_TOKEN,
    envelope,
    nowMs: signedAtMs,
  }), true);

  const mutations = [
    { envelope: { ...envelope, payload: `${envelope.payload} ` } },
    { accessToken: `${ACCESS_TOKEN}-substituted`, envelope },
    {
      envelope: {
        ...envelope,
        correlationId: "22222222-2222-4222-8222-222222222222",
      },
    },
    {
      envelope: {
        ...envelope,
        nonce: "33333333-3333-4333-8333-333333333333",
      },
    },
    {
      envelope: {
        ...envelope,
        signedAtMs: String(signedAtMs + 1),
      },
    },
    {
      envelope: {
        ...envelope,
        signature: `${envelope.signature[0] === "A" ? "B" : "A"}${
          envelope.signature.slice(1)
        }`,
      },
    },
    { envelope, nowMs: signedAtMs + 60_001 },
    { envelope, nowMs: signedAtMs - 60_001 },
    { publicKeyBase64: otherPublicKey, envelope },
  ];
  for (const mutation of mutations) {
    assert.equal(await verifyMomoContentAiBridgeEnvelopeV2Signature({
      publicKeyBase64: mutation.publicKeyBase64 ?? publicKey,
      accessToken: mutation.accessToken ?? ACCESS_TOKEN,
      envelope: mutation.envelope,
      nowMs: mutation.nowMs ?? signedAtMs,
    }), false);
  }

  const missingKey = { ...envelope };
  delete missingKey.signature;
  assert.equal(parseMomoContentAiBridgeEnvelopeV2(missingKey), null);
  assert.equal(parseMomoContentAiBridgeEnvelopeV2({
    ...envelope,
    unexpected: true,
  }), null);
  assert.equal(parseMomoContentAiBridgeEnvelopeV2({
    ...envelope,
    payload: "x".repeat(300_001),
  }), null);

  const legacyTimestamp = Date.now().toString();
  const legacyNonce = "44444444-4444-4444-8444-444444444444";
  const legacyBody = JSON.stringify({ operation: "legacy_rollback_probe" });
  const legacyPrivateKey = await crypto.subtle.importKey(
    "pkcs8",
    Buffer.from(privateKey, "base64"),
    { name: "Ed25519" },
    false,
    ["sign"],
  );
  const legacySignature = Buffer.from(await crypto.subtle.sign(
    "Ed25519",
    legacyPrivateKey,
    new TextEncoder().encode(
      `veroxa:momo-content-ai-lifecycle:v1\nPOST\n/functions/v1/momo-content-ai-lifecycle\n${legacyTimestamp}\n${legacyNonce}\n${ACCESS_TOKEN}\n${legacyBody}`,
    ),
  )).toString("base64url");
  assert.equal(await verifyMomoContentAiBridgeSignature({
    publicKeyBase64: publicKey,
    timestampMs: legacyTimestamp,
    nonce: legacyNonce,
    accessToken: ACCESS_TOKEN,
    body: legacyBody,
    signature: legacySignature,
  }), true);
});

test("bridge enforces distinct signed-payload and escaped-envelope byte caps", async () => {
  let fetchCalls = 0;
  await assert.rejects(
    invokeMomoContentAiLifecycleBridge(
      client(),
      bridgeConfig(),
      { padding: "x".repeat(300_001) },
      {
        correlationId: CORRELATION_ID,
        telemetry: () => undefined,
        fetchImplementation: async () => {
          fetchCalls += 1;
          return Response.json({ data: null });
        },
      },
    ),
    (error) => error instanceof MomoContentAiLifecycleBridgeError &&
      error.stage === "request" &&
      error.code === "momo_content_ai_lifecycle_request_too_large",
  );
  assert.equal(fetchCalls, 0);

  let wireBytes = 0;
  const request = { padding: "\\".repeat(149_000) };
  await invokeMomoContentAiLifecycleBridge(
    client(),
    bridgeConfig(),
    request,
    {
      correlationId: CORRELATION_ID,
      async fetchImplementation(_url, init) {
        fetchCalls += 1;
        assert.equal(typeof init.body, "string");
        wireBytes = new TextEncoder().encode(init.body).byteLength;
        const envelope = parseMomoContentAiBridgeEnvelopeV2(
          JSON.parse(init.body),
        );
        assert.ok(envelope);
        assert.equal(envelope.payload, JSON.stringify(request));
        return Response.json({ data: null });
      },
    },
  );
  assert.equal(fetchCalls, 1);
  assert.ok(wireBytes > 300_000);
  assert.ok(wireBytes <= 610_000);
});

test("real Workerd transport preserves v2 without custom signature headers", async () => {
  const sitesRoot = fileURLToPath(new URL("..", import.meta.url));
  const wrapper = `
    import { invokeMomoContentAiLifecycleBridge } from "./app/momo-content-ai-lifecycle-bridge.ts";
    export default {
      async fetch(_request, env) {
        const data = await invokeMomoContentAiLifecycleBridge(
          { auth: { getSession() { throw new Error("session_lookup_must_not_run"); } } },
          {
            endpoint: "https://upstream.test/functions/v1/momo-content-ai-lifecycle",
            publishableKey: "sb_publishable_workerd_test",
            bridgePrivateKey: env.PRIVATE_KEY,
            bridgePublicKey: env.PUBLIC_KEY,
          },
          { operation: "commit_upload", marker: "workerd-v2-envelope" },
          {
            correlationId: "${CORRELATION_ID}",
            serverVerifiedAccessToken: env.ACCESS_TOKEN,
            fetchImplementation: fetch,
          },
        );
        return Response.json({ data });
      },
    };
  `;
  const bundle = await build({
    stdin: { contents: wrapper, loader: "ts", resolveDir: sitesRoot },
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
    target: "es2022",
  });
  let observation;
  const miniflare = new Miniflare({
    compatibilityDate: "2026-05-22",
    modules: [{
      type: "ESModule",
      path: "momo-content-ai-lifecycle-sender.js",
      contents: bundle.outputFiles[0].text,
    }],
    bindings: {
      PRIVATE_KEY: privateKey,
      PUBLIC_KEY: publicKey,
      ACCESS_TOKEN: SERVER_VERIFIED_ACCESS_TOKEN,
    },
    async outboundService(request) {
      const raw = await request.text();
      const envelope = parseMomoContentAiBridgeEnvelopeV2(JSON.parse(raw));
      assert.ok(envelope);
      const authorization = request.headers.get("authorization") || "";
      const accessToken = authorization.startsWith("Bearer ")
        ? authorization.slice(7)
        : "";
      observation = {
        authorizationExact: accessToken === SERVER_VERIFIED_ACCESS_TOKEN,
        customSignatureHeadersAbsent: [
          "x-veroxa-content-ai-timestamp-ms",
          "x-veroxa-content-ai-nonce",
          "x-veroxa-content-ai-signature",
        ].every((name) => request.headers.get(name) === null),
        payloadExact: envelope.payload === JSON.stringify({
          operation: "commit_upload",
          marker: "workerd-v2-envelope",
        }),
        correlationExact: envelope.correlationId === CORRELATION_ID,
        signatureVerified:
          await verifyMomoContentAiBridgeEnvelopeV2Signature({
            publicKeyBase64: publicKey,
            accessToken,
            envelope,
          }),
      };
      return Response.json({ data: observation });
    },
  });
  try {
    const response = await miniflare.dispatchFetch("http://local.test/probe");
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).data, {
      authorizationExact: true,
      customSignatureHeadersAbsent: true,
      payloadExact: true,
      correlationExact: true,
      signatureVerified: true,
    });
    assert.deepEqual(observation, {
      authorizationExact: true,
      customSignatureHeadersAbsent: true,
      payloadExact: true,
      correlationExact: true,
      signatureVerified: true,
    });
  } finally {
    await miniflare.dispose();
  }
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

test("lifecycle bridge rejects non-403 failures without reading their body", async () => {
  const events = [];
  let bodyRead = false;
  let bodyCancelled = false;
  await assert.rejects(
    invokeMomoContentAiLifecycleBridge(
      client(),
      bridgeConfig(),
      { operation: "finalize_upload" },
      {
        correlationId: CORRELATION_ID,
        telemetry: (event) => events.push(event),
        fetchImplementation: async () => ({
          status: 500,
          ok: false,
          headers: new Headers({ "content-type": "application/json" }),
          body: {
            async cancel() {
              bodyCancelled = true;
            },
          },
          async text() {
            bodyRead = true;
            throw new Error("non_403_body_must_not_be_read");
          },
        }),
      },
    ),
    (error) => error instanceof MomoContentAiLifecycleBridgeError &&
      error.stage === "response_status" && error.retryable === true &&
      error.httpStatus === 500 && error.upstreamAuthError === null,
  );
  assert.equal(bodyRead, false);
  assert.equal(bodyCancelled, true);
  assert.equal(events.length, 1);
  assert.equal(events[0].upstreamAuthError, null);
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
