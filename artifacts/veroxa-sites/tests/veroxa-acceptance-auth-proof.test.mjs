import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  acceptanceAuthProofCanonicalBody,
  acceptanceAuthProofPath,
  acceptanceAuthProofTarget,
  acceptanceAuthProofWakeContext,
  createAcceptanceAuthProofHandler,
} from "../app/api/internal/veroxa/acceptance-auth-proof/core.ts";

const SECRET = "ab".repeat(32);
const NOW = 1_777_000_000_000;
const NONCE = "11111111-1111-4111-8111-111111111111";
const CORRELATION_ID = "22222222-2222-4222-8222-222222222222";
const ACCESS_TOKEN =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NGViZWQzMS1iMTM3LTQ4MzUtYTUzZS1kZjQ0NzhkYzgxNWEifQ.signature";
const TOKEN_HASH = "opaque-generated-token-hash";

const exactUser = {
  id: acceptanceAuthProofTarget.userId,
  email: acceptanceAuthProofTarget.email,
  aud: "authenticated",
  role: "authenticated",
  isAnonymous: false,
  deletedAt: null,
  bannedUntil: null,
};

function signedRequest({
  secret = SECRET,
  timestamp = NOW,
  nonce = NONCE,
  rawBody = acceptanceAuthProofCanonicalBody,
  method = "POST",
  signature,
} = {}) {
  const timestampText = String(timestamp);
  const signed = signature ?? createHmac("sha256", Buffer.from(secret, "hex"))
    .update(
      `${acceptanceAuthProofWakeContext}\n${timestampText}\n${nonce}\n${acceptanceAuthProofCanonicalBody}`,
    )
    .digest("hex");
  return new Request(`https://veroxa.example${acceptanceAuthProofPath}`, {
    method,
    headers: {
      "content-type": "application/json",
      "x-veroxa-acceptance-proof-timestamp-ms": timestampText,
      "x-veroxa-acceptance-proof-nonce": nonce,
      "x-veroxa-acceptance-proof-signature": signed,
    },
    body: method === "POST" ? rawBody : undefined,
  });
}

function harness(overrides = {}) {
  const calls = {
    getExistingUser: 0,
    generate: 0,
    verify: [],
    profiles: [],
    memberships: [],
    finalize: [],
    revoke: [],
    clear: 0,
  };
  const operation = {
    async getExistingUser() {
      calls.getExistingUser += 1;
      return Object.hasOwn(overrides, "existingUser")
        ? overrides.existingUser
        : exactUser;
    },
    async generateMagicLinkTokenHash() {
      calls.generate += 1;
      return Object.hasOwn(overrides, "tokenHash")
        ? overrides.tokenHash
        : TOKEN_HASH;
    },
    async verifyMagicLink(tokenHash) {
      calls.verify.push(tokenHash);
      return Object.hasOwn(overrides, "session")
        ? overrides.session
        : {
          user: exactUser,
          accessToken: ACCESS_TOKEN,
          expiresAt: Math.floor(NOW / 1_000) + 3_600,
        };
    },
    async readClientProfile(userId) {
      calls.profiles.push(userId);
      return overrides.profiles ?? [{ role: "client", status: "active" }];
    },
    async readClientMembership(userId, restaurantId) {
      calls.memberships.push({ userId, restaurantId });
      return overrides.memberships ?? [{
        restaurantId: acceptanceAuthProofTarget.restaurantId,
        role: "client",
        status: "active",
        restaurantName: "Veroxa Synthetic Acceptance Restaurant",
        restaurantStatus: "active",
      }];
    },
    async finalize(input) {
      calls.finalize.push(input);
      if (overrides.finalizeThrows) throw overrides.finalizeThrows;
      return overrides.finalizeResponse ?? Response.json(
        { error: "media_verification_unavailable" },
        {
          status: 503,
          headers: { "x-veroxa-correlation-id": input.correlationId },
        },
      );
    },
    async revoke(accessToken) {
      calls.revoke.push(accessToken);
      if (overrides.revokeThrows) throw overrides.revokeThrows;
    },
    async clearClientSession() {
      calls.clear += 1;
      if (overrides.clearThrows) throw overrides.clearThrows;
    },
    randomUuid() {
      return overrides.correlationId ?? CORRELATION_ID;
    },
  };
  return {
    calls,
    handler: createAcceptanceAuthProofHandler({
      configured: overrides.configured ?? true,
      wakeHmacSecret: overrides.wakeHmacSecret ?? SECRET,
      operation,
      now: () => NOW,
    }),
  };
}

test("the runner is inert when its one-time HMAC secret is absent", async () => {
  const { handler, calls } = harness({ configured: false });
  const response = await handler(signedRequest());
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { schemaVersion: 1, state: "not_found" });
  assert.equal(calls.getExistingUser, 0);
});

test("the runner rejects unsigned, stale, malformed, and non-POST requests before Auth", async () => {
  for (const request of [
    signedRequest({ signature: "00".repeat(32) }),
    signedRequest({ timestamp: NOW - 60_001 }),
    signedRequest({ rawBody: '{"schemaVersion":1,"extra":true}' }),
    signedRequest({ method: "GET" }),
  ]) {
    const { handler, calls } = harness();
    const response = await handler(request);
    assert.ok([400, 403, 405].includes(response.status));
    assert.equal(calls.getExistingUser, 0);
  }
});

test("uppercase HMAC secret and signature hex are accepted", async () => {
  const wakeHmacSecret = SECRET.toUpperCase();
  const signature = createHmac("sha256", Buffer.from(wakeHmacSecret, "hex"))
    .update(
      `${acceptanceAuthProofWakeContext}\n${NOW}\n${NONCE}\n${acceptanceAuthProofCanonicalBody}`,
    )
    .digest("hex")
    .toUpperCase();
  const { handler } = harness({ wakeHmacSecret });
  const response = await handler(signedRequest({
    secret: wakeHmacSecret,
    signature,
  }));
  assert.equal(response.status, 200);
});

test("one signed wake proves Client RLS and reaches only the fixed expired-session target", async () => {
  const { handler, calls } = harness();
  const response = await handler(signedRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    schemaVersion: 1,
    state: "candidate_rejection_observed",
    clientAuthorized: true,
    finalizeStatus: 503,
    correlationId: CORRELATION_ID,
    externalWriteAllowed: false,
    sessionRevoked: true,
  });
  assert.equal(calls.getExistingUser, 1);
  assert.equal(calls.generate, 1);
  assert.deepEqual(calls.verify, [TOKEN_HASH]);
  assert.deepEqual(calls.profiles, [acceptanceAuthProofTarget.userId]);
  assert.deepEqual(calls.memberships, [{
    userId: acceptanceAuthProofTarget.userId,
    restaurantId: acceptanceAuthProofTarget.restaurantId,
  }]);
  assert.equal(calls.finalize.length, 1);
  assert.equal(calls.finalize[0].accessToken, ACCESS_TOKEN);
  assert.equal(calls.finalize[0].correlationId, CORRELATION_ID);
  assert.deepEqual(calls.finalize[0].body, {
    restaurantId: acceptanceAuthProofTarget.restaurantId,
    uploadSessionId: acceptanceAuthProofTarget.uploadSessionId,
    clientIdempotencyKey: acceptanceAuthProofTarget.clientIdempotencyKey,
    storagePath: acceptanceAuthProofTarget.storagePath,
  });
  assert.deepEqual(calls.revoke, [ACCESS_TOKEN]);
  assert.equal(calls.clear, 1);
});

test("the response never exposes the fictional identity, token hash, bearer, or target IDs", async () => {
  const { handler } = harness();
  const response = await handler(signedRequest());
  const text = await response.text();
  for (const secret of [
    acceptanceAuthProofTarget.email,
    acceptanceAuthProofTarget.userId,
    acceptanceAuthProofTarget.restaurantId,
    acceptanceAuthProofTarget.uploadSessionId,
    acceptanceAuthProofTarget.clientIdempotencyKey,
    acceptanceAuthProofTarget.storagePath,
    TOKEN_HASH,
    ACCESS_TOKEN,
  ]) assert.ok(!text.includes(secret));
});

test("an identity mismatch fails before a session is minted", async () => {
  const { handler, calls } = harness({
    existingUser: { ...exactUser, email: "different@example.invalid" },
  });
  const response = await handler(signedRequest());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).state, "identity_invalid");
  assert.equal(calls.generate, 0);
  assert.equal(calls.clear, 1);
});

test("pre-session cleanup failure does not mask the original rejection", async () => {
  const { handler, calls } = harness({
    existingUser: { ...exactUser, email: "different@example.invalid" },
    clearThrows: new Error("no local session"),
  });
  const response = await handler(signedRequest());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).state, "identity_invalid");
  assert.equal(calls.generate, 0);
  assert.deepEqual(calls.revoke, []);
  assert.equal(calls.clear, 1);
});

test("a minted session with the wrong user is revoked before failure is returned", async () => {
  const { handler, calls } = harness({
    session: {
      user: { ...exactUser, id: "33333333-3333-4333-8333-333333333333" },
      accessToken: ACCESS_TOKEN,
      expiresAt: Math.floor(NOW / 1_000) + 3_600,
    },
  });
  const response = await handler(signedRequest());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).state, "session_invalid");
  assert.deepEqual(calls.revoke, [ACCESS_TOKEN]);
  assert.equal(calls.clear, 1);
});

test("RLS scope rejection prevents finalize and still revokes the session", async () => {
  const { handler, calls } = harness({
    profiles: [{ role: "team", status: "active" }],
  });
  const response = await handler(signedRequest());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).state, "client_scope_rejected");
  assert.equal(calls.finalize.length, 0);
  assert.deepEqual(calls.revoke, [ACCESS_TOKEN]);
  assert.equal(calls.clear, 1);
});

test("an Auth rejection from finalize is not misreported as the expected conflict", async () => {
  const { handler, calls } = harness({
    finalizeResponse: Response.json(
      { error: "momo_access_required" },
      {
        status: 403,
        headers: { "x-veroxa-correlation-id": CORRELATION_ID },
      },
    ),
  });
  const response = await handler(signedRequest());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).state, "unexpected_finalize_response");
  assert.deepEqual(calls.revoke, [ACCESS_TOKEN]);
  assert.equal(calls.clear, 1);
});

test("revocation failure overrides an otherwise successful proof", async () => {
  const { handler } = harness({ revokeThrows: new Error("hidden") });
  const response = await handler(signedRequest());
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    schemaVersion: 1,
    state: "session_revocation_unconfirmed",
    externalWriteAllowed: false,
  });
});

test("production wiring mints no user, resets no credential, and stays release-scoped", async () => {
  const [route, environment, releaseManifest] = await Promise.all([
    readFile(new URL(
      "../app/api/internal/veroxa/acceptance-auth-proof/route.ts",
      import.meta.url,
    ), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
    readFile(new URL(
      "../../../scripts/src/release-manifest.ts",
      import.meta.url,
    ), "utf8"),
  ]);
  for (const marker of [
    "SUPABASE_SECRET_KEY",
    "generateLink",
    'type: "magiclink"',
    "verifyOtp",
    "getUserById",
    "data?.user",
    "data?.properties?.hashed_token",
    "data?.session?.access_token",
    "VEROXA_INTERNAL_ACCEPTANCE_AUTH_PROOF_HMAC_SECRET",
    "const HMAC = /^[0-9a-f]{64}$/iu;",
    "function createRequestHandler()",
    "return createRequestHandler()(request);",
  ]) assert.ok(route.includes(marker), `missing route marker: ${marker}`);
  assert.match(route, /signOut\(\s*accessToken,\s*"local"/u);
  for (const forbidden of [
    "inviteUserByEmail",
    "createUser",
    "updateUserById",
    "signInWithPassword",
    "signInWithOtp",
    "resetPasswordForEmail",
    "const handler = createAcceptanceAuthProofHandler",
  ]) assert.ok(!route.includes(forbidden), `forbidden Auth mutation: ${forbidden}`);
  assert.ok(!route.includes("origin: PRODUCTION_ORIGIN"));
  assert.ok(environment.includes(
    "VEROXA_INTERNAL_ACCEPTANCE_AUTH_PROOF_HMAC_SECRET=",
  ));
  for (const path of [
    "artifacts/veroxa-sites/.env.example",
    "artifacts/veroxa-sites/app/api/internal/veroxa/acceptance-auth-proof/core.ts",
    "artifacts/veroxa-sites/app/api/internal/veroxa/acceptance-auth-proof/route.ts",
    "artifacts/veroxa-sites/tests/veroxa-acceptance-auth-proof.test.mjs",
    "scripts/src/release-manifest.ts",
  ]) assert.ok(releaseManifest.includes(path), `release scope missing ${path}`);
});
