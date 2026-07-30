import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  MOMO_MEDIA_AI_AUTOMATIC_PRESET,
  momoMediaAiAccountingLabel,
  momoMediaAiAutomaticAttemptScope,
  momoMediaAiFetch,
  momoMediaAiInspectionAllowsApproval,
} from "../app/momo-media-ai-contract.ts";

const centerUrl = new URL(
  "../app/momo-team-preconnection-center.tsx",
  import.meta.url,
);
const dataUrl = new URL(
  "../app/momo-team-preconnection-data.ts",
  import.meta.url,
);
const routeUrl = new URL(
  "../app/api/team/media-ai/improve/route.ts",
  import.meta.url,
);
const statusUrl = new URL(
  "../app/api/team/media-ai/status/route.ts",
  import.meta.url,
);
const openAiAccessUrl = new URL(
  "../app/momo-media-ai-openai-access.ts",
  import.meta.url,
);

test("high-fidelity Media AI remains an automatic, approval-controlled private path beside the free manual editor", async () => {
  const center = await readFile(centerUrl, "utf8");

  assert.match(
    center,
    /Create private prepared version/,
    "The free manual renderer must remain available.",
  );
  assert.match(
    center,
    /When this Team workspace observes a rights-current, approved Momo image, it starts one fixed server-side OpenAI edit automatically/,
  );
  assert.match(
    center,
    /Automatic authorization[\s\S]*?every active attempt plus the 25 newest terminal attempts[\s\S]*?Each high-fidelity attempt reserves up to[\s\S]*?individual job requiring more than \$20 stops and asks Faraz[\s\S]*?no batch runner/,
  );
  assert.match(
    center,
    /Automatic profile:[\s\S]*?MOMO_MEDIA_AI_AUTOMATIC_GOAL/,
  );
  assert.match(center, /quality: MOMO_MEDIA_AI_AUTOMATIC_QUALITY/);
  assert.match(
    center,
    /The prompt is fixed by Veroxa; free-form instructions are never sent/,
  );
  assert.match(
    center,
    /standingAutomation:\s*true/,
    "Only the fixed standing-automation path may reach the server.",
  );
  assert.match(
    center,
    /at most one automatic attempt[\s\S]*?never be retried automatically/,
  );
  assert.match(
    center,
    /useEffect\(\(\) => \{[\s\S]*?automaticAttemptedKeys\.current\.has\(automaticIdempotencyKey\)[\s\S]*?automaticAttemptedKeys\.current\.add\(automaticIdempotencyKey\)[\s\S]*?startAutomaticAiCandidate/,
  );
  assert.match(center, /Authorize one manual retry/);
  assert.doesNotMatch(center, /aiProcessingConsent|setAiProcessingConsent/);
  assert.match(
    center,
    /externalWriteAllowed|no external write/,
  );
  assert.doesNotMatch(
    center,
    /publishMomo|scheduleMomo|connectProvider/,
    "The Media AI editor must not contain a publishing or provider-connection action.",
  );
});

test("every actionable Media AI attempt remains visible outside the bounded terminal history", async () => {
  const data = await readFile(dataUrl, "utf8");

  assert.match(
    data,
    /rpc\("veroxa_momo_media_ai_operational_window_v1",[\s\S]*?p_restaurant_id: restaurantId[\s\S]*?\.select\(mediaAiCandidateFields\)/,
    "One database snapshot must return every actionable candidate plus bounded terminal history.",
  );
});

test("the paid standing scope is deterministic and independent of the free manual preset", async () => {
  const center = await readFile(centerUrl, "utf8");
  const input = {
    assetId: "10000000-0000-4000-8000-000000000001",
    reviewId: "20000000-0000-4000-8000-000000000002",
    sourceContentSha256: "a".repeat(64),
    retryNonce: 0,
  };
  const standingScope = momoMediaAiAutomaticAttemptScope(input);

  assert.ok(standingScope);
  assert.equal(standingScope.preset, MOMO_MEDIA_AI_AUTOMATIC_PRESET);
  assert.deepEqual(
    momoMediaAiAutomaticAttemptScope(input),
    standingScope,
    "The exact asset and review must always resolve to the same standing job.",
  );
  for (const freeManualPreset of [
    "instagram_square",
    "google_business_square",
    "website_hero",
  ]) {
    assert.equal(
      momoMediaAiAutomaticAttemptScope({
        ...input,
        manualPreset: freeManualPreset,
      })?.idempotencyKey,
      standingScope.idempotencyKey,
      `Changing the free manual preset to ${freeManualPreset} must not change the paid job.`,
    );
  }
  assert.notEqual(
    momoMediaAiAutomaticAttemptScope({ ...input, reviewId: "30000000-0000-4000-8000-000000000003" })?.idempotencyKey,
    standingScope.idempotencyKey,
  );
  assert.notEqual(
    momoMediaAiAutomaticAttemptScope({ ...input, retryNonce: 1 })?.idempotencyKey,
    standingScope.idempotencyKey,
    "Only the explicit retry action may create another request for the fixed format.",
  );
  assert.match(center, /Any future additional AI format requires a separate explicit action/);
  assert.match(center, /The free manual editor preset does not change this paid request/);
  assert.match(
    center,
    /await approveMomoMediaAiCandidate\([\s\S]*?resetAiRequest\(\);/,
  );
  assert.match(
    center,
    /await rejectMomoMediaAiCandidate\([\s\S]*?resetAiRequest\(\);/,
  );
  assert.match(
    center,
    /onChange=\{\(event\) => \{ const next = event\.target\.value; resetAiRequest\(\); setSourceAssetId\(next\)/,
  );
});

test("pre-provider zero accounting is labeled truthfully", () => {
  assert.equal(
    momoMediaAiAccountingLabel({
      reservedMicrousd: 20_000_000,
      accountedMicrousd: 0,
      accountingBasis: "zero_pre_provider",
    }),
    "$0 accounted; provider not called",
  );
  assert.equal(
    momoMediaAiAccountingLabel({
      reservedMicrousd: 20_000_000,
      accountedMicrousd: 1_250_000,
      accountingBasis: "provider_usage_estimate",
    }),
    "$1.25 provider usage estimate",
  );
  assert.equal(
    momoMediaAiAccountingLabel({
      reservedMicrousd: 20_000_000,
      accountedMicrousd: null,
      accountingBasis: null,
    }),
    "$20.00 authorization hold",
  );
});

test("lost Media AI responses preserve the request key and block fresh paid work until readback", async () => {
  const [center, data] = await Promise.all([
    readFile(centerUrl, "utf8"),
    readFile(dataUrl, "utf8"),
  ]);

  assert.match(
    data,
    /momoMediaAiFetch\(fetch,\s*"\/api\/team\/media-ai\/improve"/,
    "A transport failure must never be described as a known zero-provider-call failure.",
  );
  assert.match(
    center,
    /setAiReadbackRequired\(true\)[\s\S]*?await generateMomoMediaAiCandidate\([\s\S]*?catch \(error\) \{[\s\S]*?await refreshData\(\)[\s\S]*?throw error[\s\S]*?await refreshData\(\)/,
  );
  assert.match(
    center,
    /&& !aiReadbackRequired/,
    "A failed authoritative readback must block a fresh request key.",
  );
  assert.match(
    center,
    /original request key is preserved and new paid requests are blocked/,
  );
  assert.match(center, /refreshAfterSuccess: false/);

  await assert.rejects(
    momoMediaAiFetch(
      async () => {
        throw new TypeError("response lost after request send");
      },
      "/api/team/media-ai/improve",
      { method: "POST" },
    ),
    /media_ai_transport_uncertain/,
  );
});

test("the Team UI requires a separately verified server runtime before a paid automatic attempt", async () => {
  const [center, data, status, openAiAccess] = await Promise.all([
    readFile(centerUrl, "utf8"),
    readFile(dataUrl, "utf8"),
    readFile(statusUrl, "utf8"),
    readFile(openAiAccessUrl, "utf8"),
  ]);

  assert.match(data, /momoMediaAiFetch\(fetch, "\/api\/team\/media-ai\/status"/);
  assert.match(data, /modelMetadataVisible:\s*boolean/);
  assert.match(data, /lifecycleAdminHealthy:\s*boolean/);
  assert.match(data, /preflightReady:\s*boolean/);
  assert.doesNotMatch(data, /\bmodelAccessible\b|\bavailable\b/);
  assert.match(
    data,
    /review_id,[\s\S]*?accounting_basis,[\s\S]*?provider_usage/,
  );
  assert.match(center, /getMomoMediaAiRuntimeStatus\(\)/);
  assert.match(center, /const mediaAiPreflightReady = mediaAiDatabaseEnabled[\s\S]*?mediaAiRuntime\.value\?\.preflightReady === true/);
  assert.match(
    center,
    /&& mediaAiPreflightReady[\s\S]*?&& !busy[\s\S]*?&& !activeAiCandidate/,
  );
  assert.match(center, /startAutomaticAiCandidate/);
  assert.match(status, /getServerVeroxaContext/);
  assert.match(status, /VEROXA_MEDIA_AI_ENABLED === "true"/);
  assert.match(status, /process\.env\.OPENAI_API_KEY/);
  assert.match(status, /verifyMomoMediaAiOpenAiAccess/);
  assert.match(status, /modelMetadataVisible/);
  assert.match(status, /lifecycleAdminHealthy/);
  assert.match(status, /preflightReady/);
  assert.match(
    status,
    /admin\.rpc\([\s\S]*?"veroxa_momo_media_ai_lifecycle_preflight_v1"[\s\S]*?p_restaurant_id: restaurantId[\s\S]*?p_actor_id: actorId/,
  );
  assert.doesNotMatch(status, /\bmodelAccessible\b|\bavailable\b|images\/edits/i);
  assert.match(openAiAccess, /https:\/\/api\.openai\.com\/v1\/models\/\$\{MOMO_MEDIA_AI_MODEL\}/);
  assert.match(openAiAccess, /method:\s*"GET"/);
  assert.doesNotMatch(openAiAccess, /images\/edits/);
  assert.doesNotMatch(status, /NEXT_PUBLIC_OPENAI|VITE_OPENAI|authorization:\s*`Bearer/);
});

test("Ready approval is bound to the exact hashed and decoded private candidate", async () => {
  const center = await readFile(centerUrl, "utf8");

  assert.match(
    center,
    /candidatePreviewToken = pendingAiCandidate\?\.storage_path[\s\S]*?pendingAiCandidate\.storage_object_version[\s\S]*?pendingAiCandidate\.content_sha256/,
  );
  assert.match(
    center,
    /expectedContentSha256 && await momoBlobSha256\(blob\) !== expectedContentSha256/,
  );
  assert.match(
    center,
    /onLoad=\{\(\) => \{ setState\("ready"\);[\s\S]*?setRenderedPreviewToken\?\.\(previewToken\)/,
    "Receiving a signed URL is insufficient; the exact image must decode.",
  );
  assert.match(
    center,
    /const aiApprovalReady = momoMediaAiInspectionAllowsApproval\(\{[\s\S]*?candidateToken: candidatePreviewToken[\s\S]*?inspectionToken: aiInspection\.candidateToken/,
  );
  assert.match(
    center,
    /key=\{candidatePreviewToken\}[\s\S]*?previewToken=\{candidatePreviewToken\}/,
  );
  assert.match(
    center,
    /disabled=\{busy \|\| !aiApprovalReady\}/,
  );
  assert.match(
    center,
    /Approve candidate as Ready/,
  );
  assert.match(
    center,
    /Reject candidate[\s\S]{0,300}disabled=\{busy \|\| aiInspectionNotes\.trim\(\)\.length < 10\}|disabled=\{busy \|\| aiInspectionNotes\.trim\(\)\.length < 10\}[\s\S]{0,300}Reject candidate/,
    "A Team member must be able to reject an unsafe or undecodable candidate without attesting approval inspection.",
  );
});

test("inspection state from candidate A cannot approve candidate B", () => {
  const exact = {
    candidateToken: "candidate-b:version-2:hash-b",
    renderedToken: "candidate-b:version-2:hash-b",
    inspectionToken: "candidate-b:version-2:hash-b",
    inspectionConfirmed: true,
    inspectionNotes: "I inspected the exact decoded candidate B.",
  };
  assert.equal(momoMediaAiInspectionAllowsApproval(exact), true);
  assert.equal(momoMediaAiInspectionAllowsApproval({
    ...exact,
    inspectionToken: "candidate-a:version-1:hash-a",
  }), false);
  assert.equal(momoMediaAiInspectionAllowsApproval({
    ...exact,
    renderedToken: "candidate-a:version-1:hash-a",
  }), false);
  assert.equal(momoMediaAiInspectionAllowsApproval({
    ...exact,
    inspectionConfirmed: false,
  }), false);
});

test("human decisions remain actor-checked while provider lifecycle RPCs are server-only", async () => {
  const [data, route] = await Promise.all([
    readFile(dataUrl, "utf8"),
    readFile(routeUrl, "utf8"),
  ]);

  for (const rpc of [
    "veroxa_approve_momo_media_ai_candidate_v1",
    "veroxa_reject_momo_media_ai_candidate_v1",
  ]) {
    assert.match(data, new RegExp(`rpc\\(\\s*"${rpc}"`));
  }
  assert.match(
    data,
    /momoMediaAiFetch\(fetch,\s*"\/api\/team\/media-ai\/improve"/,
  );
  assert.doesNotMatch(data, /service[_-]?role/i);
  assert.match(route, /getServerVeroxaContext/);
  assert.match(route, /process\.env\.SUPABASE_SECRET_KEY/);
  assert.match(route, /providerConfigured: Boolean\(openAiKey && admin\)/);
  assert.match(
    route,
    /admin\.rpc\(\s*"veroxa_start_momo_media_ai_provider_v1"[\s\S]*?p_actor_id: actor\.userId/,
  );
  assert.match(
    route,
    /admin\.rpc\(\s*"veroxa_complete_momo_media_ai_candidate_v1"[\s\S]*?p_actor_id: actor\.userId/,
  );
  assert.match(
    route,
    /admin\.rpc\(\s*"veroxa_fail_momo_media_ai_candidate_v1"[\s\S]*?p_actor_id: actor\.userId/,
  );
  assert.match(route, /VEROXA_MEDIA_AI_ENABLED === "true"/);
  assert.match(route, /process\.env\.OPENAI_API_KEY/);
  assert.doesNotMatch(route, /NEXT_PUBLIC_OPENAI|VITE_OPENAI/);
});
