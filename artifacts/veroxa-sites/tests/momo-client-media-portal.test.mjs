import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const portal = await readFile(new URL("../app/momo-client-portal.tsx", import.meta.url), "utf8");
const media = portal.match(/function Media\([\s\S]*?\n}\n\nfunction ClientMediaCard/)?.[0] || "";

test("restaurant client media intake is one-step and records rights plus current-offering attestation", () => {
  assert.ok(media, "the client media component must remain discoverable");
  assert.equal((media.match(/className="client-file-picker"/g) || []).length, 1);
  assert.equal((media.match(/type="file"/g) || []).length, 1);
  assert.equal((media.match(/type="checkbox"/g) || []).length, 1);
  assert.match(media, /const \[uploadAttested, setUploadAttested\] = useState\(false\)/);
  assert.match(media, /onSubmit=\{\(event\) => \{ event\.preventDefault\(\); if \(!file \|\| !uploadAttested\) return;/);
  assert.match(media, /usageScope: \[\.\.\.MOMO_CLIENT_UPLOAD_SCOPE\]/);
  assert.match(media, /restaurantAssociation: "represents_current_restaurant_offering"/);
  assert.match(media, /associationNote: "Authenticated restaurant uploader attested that this image depicts a current restaurant offering\."/);
  assert.match(media, /rightsAttested: uploadAttested/);
  assert.match(media, /I confirm I own this image or have permission to provide it, and that it depicts a current offering from \{restaurantName\}, for Instagram, Facebook, and Google Business content preparation/);
  assert.match(media, /This attestation applies only to this upload and does not authorize posting or connect any account/);
  assert.match(media, /disabled=\{busy \|\| !file \|\| !uploadAttested\}/);
  assert.match(media, /setUploadAttested\(false\)[\s\S]*?if \(!next\)/);
  assert.doesNotMatch(media, /privateAssessmentRequested|Allowed preparation|Restaurant association<select/);
});
