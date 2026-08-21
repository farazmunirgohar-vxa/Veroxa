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

test("lifecycle bridge carries one correlation ID on a verified signed request", async () => {
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
        assert.equal(Object.hasOwn(init, "credentials"), false,
          "the server bridge must not pass browser-only credential mode to the Sites runtime fetch");
        assert.equal(init.cache, "no-store");
        assert.equal(init.redirect, "error");
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

test("lifecycle Worker transport remains bounded and browser-credential-free", async () => {
  const source = await readFile(new URL(
    "../app/momo-content-ai-lifecycle-bridge.ts",
    import.meta.url,
  ), "utf8");
  assert.doesNotMatch(source, /\bcredentials\s*:/u);
  assert.match(source, /signal:\s*AbortSignal\.timeout\(20_000\)/u);
  assert.match(source, /redirect:\s*"error"/u);
  assert.match(source, /cache:\s*"no-store"/u);
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
  }]);
  assert.doesNotMatch(JSON.stringify(events), /secret|access-token|private/u);
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
