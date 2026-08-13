import assert from "node:assert/strict";
import {
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify,
} from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { verifyExactBridgePublicKeyTransition } from
  "../supabase/functions/_shared/bridge-public-key-transition.ts";

const bridges = [
  [
    "../app/momo-content-ai-lifecycle-bridge.ts",
    "VEROXA_MOMO_CONTENT_AI_LIFECYCLE_BRIDGE_PRIVATE_KEY",
  ],
  [
    "../app/momo-content-ai-dispatch-bridge.ts",
    "VEROXA_MOMO_CONTENT_AI_DISPATCH_BRIDGE_PRIVATE_KEY",
  ],
  [
    "../app/momo-content-ai-webhook-bridge.ts",
    "VEROXA_MOMO_CONTENT_AI_WEBHOOK_BRIDGE_PRIVATE_KEY",
  ],
  [
    "../app/momo-media-ai-lifecycle-bridge.ts",
    "VEROXA_MOMO_MEDIA_AI_LIFECYCLE_BRIDGE_PRIVATE_KEY",
  ],
];

const edgeFunctions = [
  [
    "../supabase/functions/momo-content-ai-lifecycle/index.ts",
    "MCowBQYDK2VwAyEArmlgiwbW474YydgB3L+rvFjzMVQWb06tKBDU73mmPEk=",
    "MCowBQYDK2VwAyEAjBm4vQK6tntQcZu4E4qp+2uDef9fLSCwhoJ6i1D626M=",
  ],
  [
    "../supabase/functions/momo-content-ai-dispatch-lifecycle/index.ts",
    "MCowBQYDK2VwAyEA4h4SHwqYQT6NXcv5GrwzGwaSXXFNTaCO1soi88j1lIo=",
    "MCowBQYDK2VwAyEAg/XOvj5uPdmqMKfWyh0jChnrtIoCHuaHODprsPRGo50=",
  ],
  [
    "../supabase/functions/momo-content-ai-webhook-lifecycle/index.ts",
    "MCowBQYDK2VwAyEA239rWPqMXC9X1l/w2AzXZUhrl68Sd3Jjh0TYI5jjjCQ=",
    "MCowBQYDK2VwAyEAg/XOvj5uPdmqMKfWyh0jChnrtIoCHuaHODprsPRGo50=",
  ],
  [
    "../supabase/functions/momo-media-ai-lifecycle/index.ts",
    "MCowBQYDK2VwAyEApQwivBwLHZudO4CJIyOHOuvikKrlGwdf26gQJ2MPQDM=",
    "MCowBQYDK2VwAyEAg/XOvj5uPdmqMKfWyh0jChnrtIoCHuaHODprsPRGo50=",
  ],
];

test("each lifecycle bridge requires its own private-key setting", async () => {
  for (const [path, setting] of bridges) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    assert.match(source, new RegExp(`environment\\s*\\.\\s*${setting}`));
    assert.doesNotMatch(source, /environment\.VEROXA_MEDIA_AI_BRIDGE_PRIVATE_KEY/u);
  }
});

test("each lifecycle Edge boundary has a distinct valid Ed25519 public key", async () => {
  const publicKeys = [];
  for (const [path] of edgeFunctions) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    const match = source.match(
      /const BRIDGE_PUBLIC_KEY_SPKI_BASE64\s*=\s*\n?\s*"([A-Za-z0-9+/=]+)"/u,
    );
    assert.ok(match, `${path} must expose one committed public verification key`);
    const der = Buffer.from(match[1], "base64");
    const key = createPublicKey({ key: der, format: "der", type: "spki" });
    assert.equal(key.asymmetricKeyType, "ed25519");
    publicKeys.push(match[1]);
  }
  assert.equal(new Set(publicKeys).size, edgeFunctions.length);
});

test("each Edge verifier accepts exactly its old and new transition keys", async () => {
  for (const [path, expectedCurrent, expectedPrevious] of edgeFunctions) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    const current = source.match(
      /const BRIDGE_PUBLIC_KEY_SPKI_BASE64\s*=\s*\n?\s*"([A-Za-z0-9+/=]+)"/u,
    )?.[1];
    const previous = source.match(
      /const BRIDGE_PREVIOUS_PUBLIC_KEY_SPKI_BASE64\s*=\s*\n?\s*"([A-Za-z0-9+/=]+)"/u,
    )?.[1];
    assert.equal(current, expectedCurrent, `${path} must keep the new key first`);
    assert.equal(
      previous,
      expectedPrevious,
      `${path} must retain only its pre-change key during transition`,
    );
    assert.notEqual(current, previous, `${path} transition keys must be distinct`);
    assert.match(
      source,
      /const BRIDGE_TRANSITION_PUBLIC_KEYS_SPKI_BASE64\s*=\s*\[\s*BRIDGE_PUBLIC_KEY_SPKI_BASE64,\s*BRIDGE_PREVIOUS_PUBLIC_KEY_SPKI_BASE64,\s*\] as const;/u,
    );
    assert.match(
      source,
      /verifyExactBridgePublicKeyTransition\(\s*BRIDGE_TRANSITION_PUBLIC_KEYS_SPKI_BASE64,/u,
    );
  }
});

test("transition verification accepts either key and rejects a third or ambiguity", async () => {
  const pairs = Array.from({ length: 3 }, () => generateKeyPairSync("ed25519"));
  const publicKeys = pairs.map((pair) => pair.publicKey.export({
    type: "spki",
    format: "der",
  }).toString("base64"));
  const message = Buffer.from("veroxa:bridge-public-key-transition:test:v1");
  const verifySignature = (signature) => (publicKeyBase64) => {
    const publicKey = createPublicKey({
      key: Buffer.from(publicKeyBase64, "base64"),
      type: "spki",
      format: "der",
    });
    return Promise.resolve(verify(null, message, publicKey, signature));
  };
  const transitionKeys = publicKeys.slice(0, 2);
  for (const pair of pairs.slice(0, 2)) {
    assert.equal(await verifyExactBridgePublicKeyTransition(
      transitionKeys,
      verifySignature(sign(null, message, pair.privateKey)),
    ), true);
  }
  assert.equal(await verifyExactBridgePublicKeyTransition(
    transitionKeys,
    verifySignature(sign(null, message, pairs[2].privateKey)),
  ), false, "a random third signing key must be rejected");
  assert.equal(await verifyExactBridgePublicKeyTransition(
    [publicKeys[0], publicKeys[0]],
    async () => true,
  ), false, "duplicate transition keys are ambiguous");
  assert.equal(await verifyExactBridgePublicKeyTransition(
    transitionKeys,
    async () => true,
  ), false, "a signature matching more than one key is ambiguous");
  assert.equal(await verifyExactBridgePublicKeyTransition(
    publicKeys,
    async () => false,
  ), false, "a third configured verifier key must fail closed");
});
