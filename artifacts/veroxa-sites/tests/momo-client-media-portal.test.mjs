import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const portal = await readFile(new URL("../app/momo-client-portal.tsx", import.meta.url), "utf8");
const media = portal.match(/function Media\([\s\S]*?\n}\n\nfunction ClientMediaCard/)?.[0] || "";
const run = portal.slice(portal.indexOf("const run = async"), portal.indexOf("const signOut ="));

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

test("unconfirmed session finalization keeps the selected file and presents a retry", () => {
  const finish = media.slice(
    media.indexOf("const finishUploadOutcome ="),
    media.indexOf("const submitUpload = async"),
  );
  const submit = media.slice(
    media.indexOf("const submitUpload = async"),
    media.indexOf("const newest =", media.indexOf("const submitUpload = async")),
  );
  const defensiveGuard = finish.indexOf("outcome.assetId === null");
  assert.ok(defensiveGuard >= 0,
    "the portal must defensively reject an undurable pre-registration outcome");
  assert.match(finish.slice(defensiveGuard),
    /outcome\.failureReceipt\?\.status !== "team_exception_recorded"[\s\S]*?throw new MomoClientMediaUploadRetryError/);
  assert.ok(defensiveGuard < finish.indexOf("setFile(null)"),
    "the defensive retry guard must run before any upload state is cleared");
  const retry = submit.slice(submit.indexOf("} catch (error) {"));
  assert.match(retry, /error instanceof MomoClientMediaUploadRetryError/);
  assert.match(retry, /setUploadError\(MEDIA_UPLOAD_RETRY_MESSAGE\)/);
  assert.match(retry, /throw error/,
    "the rejected action must skip the parent refresh that would unmount the file input");
  assert.doesNotMatch(retry, /setFile\(null\)|setUploadKey\(|setUploadAttested\(false\)/,
    "retry must preserve the selected file and its upload attestation");
  assert.match(run, /error instanceof MomoClientMediaUploadRetryError[\s\S]*?MEDIA_UPLOAD_RETRY_MESSAGE/);
  assert.match(portal, /Keep this file selected and choose Confirm and upload again/);
});
