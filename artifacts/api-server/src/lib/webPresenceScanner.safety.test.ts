import assert from "node:assert/strict";
import { validateScanUrlSafety } from "./webPresenceScanner";

async function expectUnsafe(inputUrl: string, expectedReasonFragment: string) {
  const result = await validateScanUrlSafety(inputUrl);
  assert.equal(result.ok, false, `${inputUrl} should be rejected`);
  assert.match(
    result.reason ?? "",
    new RegExp(expectedReasonFragment, "i"),
    `${inputUrl} should mention ${expectedReasonFragment}; got ${result.reason}`,
  );
}

async function main() {
  await expectUnsafe("http://localhost:3000", "localhost|internal");
  await expectUnsafe("http://10.0.0.5/admin", "private|internal");
  await expectUnsafe("http://169.254.169.254/latest/meta-data", "private|internal");
  await expectUnsafe("http://[::1]/", "private|internal");
  await expectUnsafe("http://[::ffff:127.0.0.1]/", "private|internal");

  const unsafeRedirectDestination = new URL(
    "http://127.0.0.1/secret",
    "https://restaurant.example/redirect-start",
  ).toString();
  await expectUnsafe(unsafeRedirectDestination, "private|internal");

  console.log("validateScanUrlSafety SSRF guardrail tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
