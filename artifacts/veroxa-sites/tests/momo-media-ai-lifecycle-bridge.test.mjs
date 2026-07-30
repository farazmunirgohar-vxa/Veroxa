import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import {
  getMomoMediaAiLifecycleBridgeConfig,
  invokeMomoMediaAiLifecycleBridge,
  reconcileMomoMediaAiTerminalLifecycleBridge,
} from "../app/momo-media-ai-lifecycle-bridge.ts";
import {
  validMomoMediaAiLifecycleRequest,
  verifyMomoMediaAiBridgeSignature,
} from "../supabase/functions/_shared/momo-media-ai-lifecycle-contract.ts";

const bridgeKeys = generateKeyPairSync("ed25519");
const bridgePrivateKey = bridgeKeys.privateKey.export({
  type: "pkcs8",
  format: "der",
}).toString("base64");
const bridgePublicKey = bridgeKeys.publicKey.export({
  type: "spki",
  format: "der",
}).toString("base64");
const publishableKey = "sb_publishable_test_key";
const accessToken = "header.payload.signature";

test("lifecycle bridge configuration is fail-closed and canonical", () => {
  assert.equal(getMomoMediaAiLifecycleBridgeConfig({}), null);
  assert.equal(getMomoMediaAiLifecycleBridgeConfig({
    NEXT_PUBLIC_SUPABASE_URL: "http://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    VEROXA_MEDIA_AI_BRIDGE_PRIVATE_KEY: bridgePrivateKey,
  }), null);
  assert.equal(getMomoMediaAiLifecycleBridgeConfig({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co/path",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    VEROXA_MEDIA_AI_BRIDGE_PRIVATE_KEY: bridgePrivateKey,
  }), null);
  assert.equal(getMomoMediaAiLifecycleBridgeConfig({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "not_publishable",
    VEROXA_MEDIA_AI_BRIDGE_PRIVATE_KEY: bridgePrivateKey,
  }), null);
  assert.equal(getMomoMediaAiLifecycleBridgeConfig({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    VEROXA_MEDIA_AI_BRIDGE_PRIVATE_KEY: "too-short",
  }), null);
  assert.deepEqual(getMomoMediaAiLifecycleBridgeConfig({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    VEROXA_MEDIA_AI_BRIDGE_PRIVATE_KEY: bridgePrivateKey,
  }), {
    endpoint:
      "https://example.supabase.co/functions/v1/momo-media-ai-lifecycle",
    publishableKey,
    bridgePrivateKey,
  });
});

test("lifecycle bridge forwards one verified Team session without retry", async () => {
  let sessionReads = 0;
  let calls = 0;
  const client = {
    auth: {
      async getSession() {
        sessionReads += 1;
        return {
          data: {
            session: {
              access_token: accessToken,
              expires_at: Math.floor(Date.now() / 1_000) + 3_600,
            },
          },
          error: null,
        };
      },
      async refreshSession() {
        throw new Error("must not refresh a current session");
      },
    },
  };
  const config = getMomoMediaAiLifecycleBridgeConfig({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    VEROXA_MEDIA_AI_BRIDGE_PRIVATE_KEY: bridgePrivateKey,
  });
  assert.ok(config);
  const result = await invokeMomoMediaAiLifecycleBridge(
    client,
    config,
    {
      operation: "start",
      candidateId: "10000000-0000-4000-8000-000000000001",
      requestHash: "b".repeat(64),
    },
    async (url, init) => {
      calls += 1;
      assert.equal(
        url,
        "https://example.supabase.co/functions/v1/momo-media-ai-lifecycle",
      );
      assert.equal(init.method, "POST");
      assert.equal(init.headers.authorization, `Bearer ${accessToken}`);
      assert.equal(init.headers.apikey, publishableKey);
      assert.match(
        init.headers["x-veroxa-media-ai-timestamp-ms"],
        /^\d{13}$/,
      );
      assert.match(
        init.headers["x-veroxa-media-ai-nonce"],
        /^[0-9a-f-]{36}$/,
      );
      assert.match(
        init.headers["x-veroxa-media-ai-signature"],
        /^[A-Za-z0-9_-]{86}$/,
      );
      assert.equal(init.cache, "no-store");
      assert.equal(init.credentials, "omit");
      assert.equal(init.redirect, "error");
      assert.deepEqual(JSON.parse(init.body), {
        operation: "start",
        candidateId: "10000000-0000-4000-8000-000000000001",
        requestHash: "b".repeat(64),
      });
      assert.equal(await verifyMomoMediaAiBridgeSignature({
        publicKeyBase64: bridgePublicKey,
        timestampMs: init.headers["x-veroxa-media-ai-timestamp-ms"],
        nonce: init.headers["x-veroxa-media-ai-nonce"],
        accessToken,
        body: init.body,
        signature: init.headers["x-veroxa-media-ai-signature"],
      }), true);
      return Response.json({
        data: [{
          candidate_id: "10000000-0000-4000-8000-000000000001",
          should_call: true,
          candidate_status: "provider_running",
        }],
      });
    },
  );
  assert.equal(sessionReads, 1);
  assert.equal(calls, 1);
  assert.deepEqual(result, [{
    candidate_id: "10000000-0000-4000-8000-000000000001",
    should_call: true,
    candidate_status: "provider_running",
  }]);
});

test("lifecycle bridge rejects absent sessions and ambiguous responses", async () => {
  const config = getMomoMediaAiLifecycleBridgeConfig({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    VEROXA_MEDIA_AI_BRIDGE_PRIVATE_KEY: bridgePrivateKey,
  });
  assert.ok(config);
  const noSession = {
    auth: {
      async getSession() {
        return { data: { session: null }, error: null };
      },
      async refreshSession() {
        throw new Error("must not refresh an absent session");
      },
    },
  };
  await assert.rejects(
    invokeMomoMediaAiLifecycleBridge(
      noSession,
      config,
      { operation: "preflight" },
      async () => {
        throw new Error("must not fetch");
      },
    ),
    /lifecycle_session_unavailable/,
  );

  const client = {
    auth: {
      async getSession() {
        return {
          data: {
            session: {
              access_token: accessToken,
              expires_at: Math.floor(Date.now() / 1_000) + 3_600,
            },
          },
          error: null,
        };
      },
      async refreshSession() {
        throw new Error("must not refresh a current session");
      },
    },
  };
  let calls = 0;
  await assert.rejects(
    invokeMomoMediaAiLifecycleBridge(
      client,
      config,
      { operation: "preflight" },
      async () => {
        calls += 1;
        return Response.json({ error: "rejected" }, { status: 409 });
      },
    ),
    /lifecycle_bridge_rejected/,
  );
  assert.equal(calls, 1, "A rejected lifecycle call must never retry.");

  await assert.rejects(
    invokeMomoMediaAiLifecycleBridge(
      client,
      config,
      { operation: "preflight" },
      async () => new Response("not-json", {
        headers: { "content-type": "text/plain" },
      }),
    ),
    /lifecycle_bridge_rejected/,
  );
});

test("lifecycle bridge refreshes once before a provider-length operation", async () => {
  const config = getMomoMediaAiLifecycleBridgeConfig({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    VEROXA_MEDIA_AI_BRIDGE_PRIVATE_KEY: bridgePrivateKey,
  });
  assert.ok(config);
  let refreshes = 0;
  const client = {
    auth: {
      async getSession() {
        return {
          data: {
            session: {
              access_token: "expiring.token",
              expires_at: Math.floor(Date.now() / 1_000) + 60,
            },
          },
          error: null,
        };
      },
      async refreshSession() {
        refreshes += 1;
        return {
          data: {
            session: {
              access_token: "fresh.token",
              expires_at: Math.floor(Date.now() / 1_000) + 3_600,
            },
          },
          error: null,
        };
      },
    },
  };
  await invokeMomoMediaAiLifecycleBridge(
    client,
    config,
    { operation: "preflight" },
    async (_url, init) => {
      assert.equal(init.headers.authorization, "Bearer fresh.token");
      return Response.json({ data: [{ lifecycle_admin_healthy: true }] });
    },
  );
  assert.equal(refreshes, 1);
});

test("terminal lifecycle reconciliation retries the exact database tuple once", async () => {
  const config = getMomoMediaAiLifecycleBridgeConfig({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    VEROXA_MEDIA_AI_BRIDGE_PRIVATE_KEY: bridgePrivateKey,
  });
  assert.ok(config);
  const client = {
    auth: {
      async getSession() {
        return {
          data: {
            session: {
              access_token: accessToken,
              expires_at: Math.floor(Date.now() / 1_000) + 3_600,
            },
          },
          error: null,
        };
      },
      async refreshSession() {
        throw new Error("must not refresh a current session");
      },
    },
  };
  const request = {
    operation: "fail",
    candidateId: "10000000-0000-4000-8000-000000000001",
    requestHash: "b".repeat(64),
    errorCode: "provider_rejected",
  };
  let calls = 0;
  const result = await reconcileMomoMediaAiTerminalLifecycleBridge(
    client,
    config,
    request,
    async (_url, init) => {
      calls += 1;
      assert.deepEqual(JSON.parse(init.body), request);
      if (calls === 1) {
        return Response.json({ error: "response_lost" }, { status: 503 });
      }
      return Response.json({ data: request.candidateId });
    },
  );
  assert.equal(result, request.candidateId);
  assert.equal(calls, 2);

  calls = 0;
  await assert.rejects(
    reconcileMomoMediaAiTerminalLifecycleBridge(
      client,
      config,
      request,
      async () => {
        calls += 1;
        return Response.json({ error: "rejected" }, { status: 409 });
      },
    ),
    /lifecycle_bridge_rejected/,
  );
  assert.equal(calls, 2, "Terminal reconciliation must stop after one retry.");
});

test("Edge bridge proof rejects tampering, expiry, and unknown payload fields", async () => {
  const body = JSON.stringify({
    operation: "start",
    candidateId: "10000000-0000-4000-8000-000000000001",
    requestHash: "b".repeat(64),
  });
  const config = getMomoMediaAiLifecycleBridgeConfig({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    VEROXA_MEDIA_AI_BRIDGE_PRIVATE_KEY: bridgePrivateKey,
  });
  assert.ok(config);
  let proof;
  const client = {
    auth: {
      async getSession() {
        return {
          data: {
            session: {
              access_token: accessToken,
              expires_at: Math.floor(Date.now() / 1_000) + 3_600,
            },
          },
          error: null,
        };
      },
      async refreshSession() {
        throw new Error("must not refresh a current session");
      },
    },
  };
  await invokeMomoMediaAiLifecycleBridge(
    client,
    config,
    JSON.parse(body),
    async (_url, init) => {
      proof = {
        timestampMs: init.headers["x-veroxa-media-ai-timestamp-ms"],
        nonce: init.headers["x-veroxa-media-ai-nonce"],
        signature: init.headers["x-veroxa-media-ai-signature"],
      };
      return Response.json({ data: [] });
    },
  );
  assert.ok(proof);
  assert.equal(await verifyMomoMediaAiBridgeSignature({
    publicKeyBase64: bridgePublicKey,
    ...proof,
    accessToken,
    body,
  }), true);
  assert.equal(await verifyMomoMediaAiBridgeSignature({
    publicKeyBase64: bridgePublicKey,
    ...proof,
    accessToken: `${accessToken}.tampered`,
    body,
  }), false);
  assert.equal(await verifyMomoMediaAiBridgeSignature({
    publicKeyBase64: bridgePublicKey,
    ...proof,
    accessToken,
    body: `${body} `,
  }), false);
  assert.equal(await verifyMomoMediaAiBridgeSignature({
    publicKeyBase64: bridgePublicKey,
    ...proof,
    accessToken,
    body,
    nowMs: Number(proof.timestampMs) + 60_001,
  }), false);
  assert.equal(validMomoMediaAiLifecycleRequest({
    ...JSON.parse(body),
    actorId: "10000000-0000-4000-8000-000000000002",
  }), false);
  assert.equal(validMomoMediaAiLifecycleRequest({
    operation: "complete",
    candidateId: "10000000-0000-4000-8000-000000000001",
    requestHash: "b".repeat(64),
    providerRequestId: "request-1",
    storagePath: "restaurants/r/renditions/c/hash.png",
    fileSize: 1,
    width: 1024,
    height: 1024,
    contentSha256: "c".repeat(64),
    accountedMicrousd: 1,
    accountingBasis: "provider_usage_estimate",
    providerUsage: {
      input_tokens: 3,
      input_tokens_details: { image_tokens: 2, text_tokens: 1 },
      output_tokens: 4,
      total_tokens: 7,
      unexpected: "not persisted",
    },
  }), false);
  const conservativeCompletion = {
    operation: "complete",
    candidateId: "10000000-0000-4000-8000-000000000001",
    requestHash: "b".repeat(64),
    providerRequestId: "request-1",
    storagePath: "restaurants/r/renditions/c/hash.png",
    fileSize: 1,
    width: 1024,
    height: 1024,
    contentSha256: "c".repeat(64),
    accountedMicrousd: 20_000_000,
    accountingBasis: "conservative_reservation",
    providerUsage: null,
  };
  assert.equal(
    validMomoMediaAiLifecycleRequest(conservativeCompletion),
    true,
  );
  assert.equal(validMomoMediaAiLifecycleRequest({
    ...conservativeCompletion,
    providerRequestId: " request-1 ",
  }), false);
  assert.equal(validMomoMediaAiLifecycleRequest({
    ...conservativeCompletion,
    providerUsage: {
      input_tokens: 3,
      input_tokens_details: { image_tokens: 2, text_tokens: 1 },
      output_tokens: 4,
      total_tokens: 7,
    },
  }), false);
});
