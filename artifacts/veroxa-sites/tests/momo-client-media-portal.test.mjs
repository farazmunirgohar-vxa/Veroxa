import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const portal = await readFile(new URL("../app/momo-client-portal.tsx", import.meta.url), "utf8");
const media = portal.match(/function Media\([\s\S]*?\n}\n\nfunction ClientMediaCard/)?.[0] || "";

test("Momo client media intake is one-step and has one upload control", () => {
  assert.ok(media, "the client media component must remain discoverable");
  assert.equal((media.match(/className="client-file-picker"/g) || []).length, 1);
  assert.equal((media.match(/type="file"/g) || []).length, 1);
  assert.match(media, /onSubmit=\{\(event\) => \{ event\.preventDefault\(\); if \(!file\) return;/);
  assert.match(media, /usageScope: \[\.\.\.MOMO_CLIENT_UPLOAD_SCOPE\]/);
  assert.match(media, /restaurantAssociation: "not_for_restaurant"/);
  assert.match(media, /disabled=\{busy \|\| !file\}/);
  assert.doesNotMatch(media, /privateAssessmentRequested|Allowed preparation|Restaurant association<select/);
  assert.doesNotMatch(media, /type="checkbox"/);
});
