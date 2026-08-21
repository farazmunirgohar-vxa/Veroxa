import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function functionVerifyJwt(config, slug) {
  const section = `[functions.${slug}]`;
  const sectionStart = config.indexOf(section);
  if (sectionStart < 0) return null;
  const nextSection = config.indexOf("\n[functions.", sectionStart + section.length);
  const block = config.slice(sectionStart, nextSection < 0 ? undefined : nextSection);
  const match = block.match(/(?:^|\n)verify_jwt = (true|false)(?:\n|$)/u);
  return match?.[1] ?? null;
}

test("content lifecycle bypasses only the platform JWT precheck while preserving dual handler authorization", async () => {
  const [rootConfig, sitesConfig, source] = await Promise.all([
    readFile(new URL("../../../supabase/config.toml", import.meta.url), "utf8"),
    readFile(new URL("../supabase/config.toml", import.meta.url), "utf8"),
    readFile(new URL(
      "../supabase/functions/momo-content-ai-lifecycle/index.ts",
      import.meta.url,
    ), "utf8"),
  ]);

  assert.equal(rootConfig, sitesConfig, "root and deployable Supabase config must remain byte-identical");
  assert.equal(functionVerifyJwt(rootConfig, "momo-content-ai-lifecycle"), "false");
  assert.equal(functionVerifyJwt(rootConfig, "momo-media-ai-lifecycle"), "true");

  const bearerGate = source.indexOf('authorization.startsWith("Bearer ")');
  const bridgeSignatureGate = source.indexOf("verifyMomoContentAiBridgeSignature(");
  const userGate = source.indexOf("userClient.auth.getUser(accessToken)");
  const adminClient = source.indexOf("const admin = createClient");

  assert.ok(bearerGate >= 0, "handler must require a bearer user session");
  assert.ok(bridgeSignatureGate >= 0, "handler must invoke the dedicated Ed25519 bridge signature verifier");
  assert.ok(userGate >= 0, "handler must validate the access token through Supabase Auth");
  assert.ok(adminClient >= 0, "handler must retain an explicit privileged client boundary");
  assert.ok(bearerGate < adminClient, "bearer gate must run before privileged access");
  assert.ok(bridgeSignatureGate < userGate, "bridge signature must fail closed before user lookup");
  assert.ok(bridgeSignatureGate < adminClient, "bridge signature invocation must run before privileged access");
  assert.ok(userGate < adminClient, "Supabase Auth validation must run before privileged access");
  assert.match(source, /if \(!verified\) return response\(\{ error: "bridge_access_required" \}, 403\)/u);
  assert.match(source, /if \(userError \|\| !userData\.user/u);
});
