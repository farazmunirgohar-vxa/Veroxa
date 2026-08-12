import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const [
  portal,
  finalize,
  assessmentRoute,
  migration,
  privilegeRepair,
  imageBytes,
  hostDecoder,
] = await Promise.all([
  readFile(new URL("../app/momo-client-portal.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/api/media/finalize/core.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/media/assessment/route.ts", import.meta.url), "utf8"),
  readFile(new URL(
    "../supabase/migrations/20260812214257_high_resolution_private_media_v1.sql",
    import.meta.url,
  ), "utf8"),
  readFile(new URL(
    "../supabase/migrations/20260812221509_restore_high_resolution_media_finalize_service_role_v1.sql",
    import.meta.url,
  ), "utf8"),
  readFile(new URL("../app/momo-image-bytes.ts", import.meta.url), "utf8"),
  readFile(new URL(
    "../app/veroxa-private-media-host-image-decode.ts",
    import.meta.url,
  ), "utf8"),
]);

test("the client and intake APIs no longer reject by total pixel count", () => {
  assert.match(portal, /high-resolution originals supported/u);
  assert.doesNotMatch(portal, /16,777,216|MAX_DECODED_PIXELS|total pixels/u);
  assert.doesNotMatch(finalize, /MAX_DECODED_PIXELS|16777216/u);
  assert.doesNotMatch(assessmentRoute, /MAX_DECODED_PIXELS|16777216/u);
  assert.doesNotMatch(imageBytes, /MAX_MOMO_DECODED_PNG_BYTES|134217728/u);
  assert.match(hostDecoder, /transform\(\{ width: 1, height: 1/u);
});

test("the forward migration removes only the total-pixel database ceiling", () => {
  assert.match(
    migration,
    /drop constraint veroxa_private_media_assessment_intakes_v1_check1/u,
  );
  assert.doesNotMatch(migration, /16777216/u);
  assert.match(migration, /p_file_size between 10240 and 10485760/u);
  assert.match(migration, /p_width between 128 and 12000/u);
  assert.match(migration, /p_height between 128 and 12000/u);
  assert.match(
    migration,
    /p_width::numeric \/ p_height::numeric between 0\.4 and 2\.5/u,
  );
});

test("the forward privilege repair restores service-role finalization only", () => {
  assert.match(privilegeRepair, /from public, anon, authenticated/u);
  assert.match(privilegeRepair, /to service_role/u);
  assert.doesNotMatch(privilegeRepair, /to (?:public|anon|authenticated)/u);
});
