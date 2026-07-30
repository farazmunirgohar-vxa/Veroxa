import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  MOMO_MEDIA_AI_PRESETS,
  momoMediaAiAccountingLabel,
  momoMediaAiAutomaticAttemptCanStart,
  momoMediaAiAttemptNeedsManualRetry,
  momoMediaAiAutomaticAttemptScope,
  momoMediaAiFailedAttemptScopeKey,
  momoMediaAiFetch,
  momoMediaAiInspectionAllowsApproval,
  momoMediaAiNextUnattemptedRetryScope,
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
const lifecycleBridgeUrl = new URL(
  "../app/momo-media-ai-lifecycle-bridge.ts",
  import.meta.url,
);
const lifecycleEdgeFunctionUrl = new URL(
  "../supabase/functions/momo-media-ai-lifecycle/index.ts",
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
    /When this Team workspace observes a rights-current, approved Momo image, it starts one server-side OpenAI edit for the selected output destination/,
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

test("active attempts remain visible and an authoritative omitted failure still unlocks only a manual retry", async () => {
  const [center, data] = await Promise.all([
    readFile(centerUrl, "utf8"),
    readFile(dataUrl, "utf8"),
  ]);

  assert.match(
    data,
    /rpc\("veroxa_momo_media_ai_operational_window_v1",[\s\S]*?p_restaurant_id: restaurantId[\s\S]*?\.select\(mediaAiCandidateFields\)/,
    "One database snapshot must return every actionable candidate plus bounded terminal history.",
  );
  const scopeKey = "momo-ai-v2:10000000-0000-4000-8000-000000000001:20000000-0000-4000-8000-000000000002:aaaaaaaaaaaaaaaa:website_hero:0";
  assert.equal(
    momoMediaAiFailedAttemptScopeKey(
      new Error("media_ai_previous_attempt_failed"),
      scopeKey,
    ),
    scopeKey,
  );
  for (const error of [
    new Error("media_ai_transport_uncertain"),
    new Error("media_ai_readback_required"),
    "media_ai_previous_attempt_failed",
  ]) {
    assert.equal(momoMediaAiFailedAttemptScopeKey(error, scopeKey), "");
  }
  assert.equal(
    momoMediaAiFailedAttemptScopeKey(
      new Error("media_ai_previous_attempt_failed"),
      "invalid key",
    ),
    "",
  );
  assert.match(
    center,
    /const failedScopeKey = momoMediaAiFailedAttemptScopeKey\([\s\S]*?await refreshData\(\)[\s\S]*?setAuthoritativeFailedAttemptKeys/,
    "Only an exact authoritative failed-replay response followed by a successful readback may unlock retry.",
  );
  assert.match(
    center,
    /momoMediaAiAttemptNeedsManualRetry\(\{[\s\S]*?matchingStatus: matchingAutomaticAttempt\?\.status,[\s\S]*?authoritativeFailedAttemptKeys\.has\(automaticIdempotencyKey\)/,
  );
  assert.equal(momoMediaAiAttemptNeedsManualRetry({
    matchingStatus: undefined,
    exactFailedReplayKeyKnown: true,
  }), true);
  assert.equal(momoMediaAiAttemptNeedsManualRetry({
    matchingStatus: "failed",
    exactFailedReplayKeyKnown: false,
  }), true);
  for (const matchingStatus of ["approved", "rejected", "pending_review"]) {
    assert.equal(momoMediaAiAttemptNeedsManualRetry({
      matchingStatus,
      exactFailedReplayKeyKnown: true,
    }), false, `${matchingStatus} database state must outrank a stale fallback key`);
  }
  const retryScopeInput = {
    assetId: "10000000-0000-4000-8000-000000000001",
    reviewId: "20000000-0000-4000-8000-000000000002",
    sourceContentSha256: "a".repeat(64),
    preset: "website_hero",
    currentNonce: 0,
    retryIssuing: false,
    retryAllowed: true,
    attemptedKeys: new Set(),
  };
  const firstRetry = momoMediaAiNextUnattemptedRetryScope(retryScopeInput);
  assert.equal(firstRetry?.retryNonce, 1);
  assert.equal(momoMediaAiNextUnattemptedRetryScope({
    ...retryScopeInput,
    retryIssuing: true,
  }), null, "A rapid second click cannot issue another retry scope.");
  assert.equal(momoMediaAiNextUnattemptedRetryScope({
    ...retryScopeInput,
    retryIssuing: false,
    retryAllowed: false,
  }), null);
  const nonceZero = momoMediaAiAutomaticAttemptScope({
    ...retryScopeInput,
    retryNonce: 0,
  });
  assert.ok(nonceZero);
  assert.ok(firstRetry);
  const afterReset = momoMediaAiNextUnattemptedRetryScope({
    ...retryScopeInput,
    currentNonce: 0,
    attemptedKeys: new Set([
      nonceZero.idempotencyKey,
      firstRetry.idempotencyKey,
    ]),
  });
  assert.equal(
    afterReset?.retryNonce,
    2,
    "Reselecting a destination after nonce 0 and 1 failed must choose a fresh local key.",
  );
  assert.match(
    center,
    /authorizeAiRetry[\s\S]*?momoMediaAiNextUnattemptedRetryScope\(\{[\s\S]*?attemptedKeys: automaticAttemptedKeys\.current[\s\S]*?aiRetryIssuingRef\.current = true;[\s\S]*?next\.delete\(automaticIdempotencyKey\)[\s\S]*?setAiRetryNonce\(nextRetryScope\.retryNonce\)/,
  );
  assert.match(
    center,
    /automaticAttemptKnownFailed && !activeAiCandidate && !aiRetryIssuing[\s\S]*?onClick=\{authorizeAiRetry\}/,
  );
  assert.match(
    center,
    /await refreshData\(\);[\s\S]*?aiRetryIssuingRef\.current = false;[\s\S]*?setAiRetryIssuing\(false\)/,
  );
});

test("the paid standing scope is deterministic for the exact Team-selected destination", async () => {
  const center = await readFile(centerUrl, "utf8");
  const base = {
    assetId: "10000000-0000-4000-8000-000000000001",
    reviewId: "20000000-0000-4000-8000-000000000002",
    sourceContentSha256: "a".repeat(64),
    retryNonce: 0,
  };
  const scopes = new Map();
  for (const selectedPreset of Object.keys(MOMO_MEDIA_AI_PRESETS)) {
    const input = { ...base, preset: selectedPreset };
    const standingScope = momoMediaAiAutomaticAttemptScope(input);
    assert.ok(standingScope);
    assert.equal(standingScope.preset, selectedPreset);
    assert.deepEqual(
      momoMediaAiAutomaticAttemptScope(input),
      standingScope,
      "The exact asset, review, and destination must resolve to one stable job.",
    );
    scopes.set(selectedPreset, standingScope.idempotencyKey);
  }
  assert.equal(new Set(scopes.values()).size, Object.keys(MOMO_MEDIA_AI_PRESETS).length);
  const standingScope = momoMediaAiAutomaticAttemptScope({
    ...base,
    preset: "instagram_portrait",
  });
  assert.ok(standingScope);
  assert.notEqual(
    momoMediaAiAutomaticAttemptScope({
      ...base,
      preset: "instagram_portrait",
      reviewId: "30000000-0000-4000-8000-000000000003",
    })?.idempotencyKey,
    standingScope.idempotencyKey,
  );
  assert.notEqual(
    momoMediaAiAutomaticAttemptScope({
      ...base,
      preset: "instagram_portrait",
      retryNonce: 1,
    })?.idempotencyKey,
    standingScope.idempotencyKey,
    "Only the explicit retry action may create another request for that destination.",
  );
  assert.equal(
    momoMediaAiAutomaticAttemptScope({
      ...base,
      preset: "not_a_destination",
    }),
    null,
  );
  assert.equal(
    momoMediaAiAutomaticAttemptScope({
      ...base,
      preset: undefined,
    }),
    null,
    "No paid scope exists before the Team explicitly selects an AI destination.",
  );
  assert.match(
    center,
    /automaticAttemptScope = selectedAsset && selectedReview && aiPreset[\s\S]*?momoMediaAiAutomaticAttemptScope\(\{[\s\S]*?sourceContentSha256:[\s\S]*?preset: aiPreset,[\s\S]*?retryNonce: aiRetryNonce/,
  );
  assert.match(
    center,
    /item\.preset_key === selectedAutomaticPreset/,
  );
  assert.match(
    center,
    /generateMomoMediaAiCandidate\(\{[\s\S]*?preset: selectedAutomaticPreset/,
  );
  assert.match(
    center,
    /AI output destination<select[\s\S]*?setAiDestinationSelection\(next && selectedAsset && selectedReview && selectedAsset\.content_sha256/,
  );
  assert.doesNotMatch(
    center,
    /preset:\s*MOMO_MEDIA_AI_(?:AUTOMATIC|DEFAULT)_PRESET/,
  );
  assert.match(
    center,
    /Output preset<select[\s\S]{0,500}?setPreset\(next\)/,
    "The free manual output control remains separate.",
  );
  assert.doesNotMatch(
    center.match(/Output preset<select[\s\S]{0,500}?<\/select>/)?.[0] || "",
    /setAiDestinationSelection|resetAiRequest/,
    "Changing the free manual preset must never authorize a paid job.",
  );
  assert.match(center, /Choosing another AI destination is the explicit action for one different format/);
  assert.match(center, /The free manual-editor preset never authorizes a paid request/);
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
    /onChange=\{\(event\) => \{ const next = event\.target\.value; resetAiRequest\(\); setAiDestinationSelection\(null\); setSourceAssetId\(next\)/,
  );
});

test("automatic dispatch requires explicit AI destination scope and runs once per exact key", () => {
  const ready = {
    idempotencyKey: "momo-ai-v2:10000000-0000-4000-8000-000000000001:20000000-0000-4000-8000-000000000002:aaaaaaaaaaaaaaaa:website_hero:0",
    retryNonce: 0,
    sourceEligible: true,
    reviewApproved: true,
    rightsScopeAllowsPreset: true,
    sourceFits: true,
    preflightReady: true,
    busy: false,
    hasActiveCandidate: false,
    matchingAttemptExists: false,
    attemptKnownFailed: false,
    readbackRequired: false,
    withinAuthorization: true,
    alreadyAttempted: false,
  };
  assert.equal(momoMediaAiAutomaticAttemptCanStart({
    ...ready,
    idempotencyKey: "",
  }), false, "No explicit AI destination means no paid request key.");
  assert.equal(momoMediaAiAutomaticAttemptCanStart(ready), true);
  assert.equal(momoMediaAiAutomaticAttemptCanStart({
    ...ready,
    alreadyAttempted: true,
  }), false, "A rerender cannot dispatch the exact key twice.");
  assert.equal(momoMediaAiAutomaticAttemptCanStart({
    ...ready,
    hasActiveCandidate: true,
  }), false);
  assert.equal(momoMediaAiAutomaticAttemptCanStart({
    ...ready,
    readbackRequired: true,
  }), false);
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
  const [center, data, status, openAiAccess, bridge] = await Promise.all([
    readFile(centerUrl, "utf8"),
    readFile(dataUrl, "utf8"),
    readFile(statusUrl, "utf8"),
    readFile(openAiAccessUrl, "utf8"),
    readFile(lifecycleBridgeUrl, "utf8"),
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
    /momoMediaAiAutomaticAttemptCanStart\(\{[\s\S]*?preflightReady: mediaAiPreflightReady,[\s\S]*?busy,[\s\S]*?hasActiveCandidate: Boolean\(activeAiCandidate\)/,
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
    /invokeMomoMediaAiLifecycleBridge[\s\S]*?operation: "preflight"[\s\S]*?restaurantId/,
  );
  assert.match(bridge, /VEROXA_MEDIA_AI_BRIDGE_PRIVATE_KEY/);
  assert.match(bridge, /authorization: `Bearer \$\{accessToken\}`/);
  assert.match(bridge, /crypto\.subtle\.sign/);
  assert.match(bridge, /"x-veroxa-media-ai-signature": signature/);
  assert.match(bridge, /"x-veroxa-media-ai-nonce": nonce/);
  assert.match(bridge, /"x-veroxa-media-ai-timestamp-ms": timestampMs/);
  assert.match(bridge, /AbortSignal\.timeout\(20_000\)/);
  assert.doesNotMatch(bridge, /SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY/);
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

test("human decisions remain actor-checked while provider lifecycle RPCs cross only the protected Edge bridge", async () => {
  const [data, route, bridge, edgeFunction] = await Promise.all([
    readFile(dataUrl, "utf8"),
    readFile(routeUrl, "utf8"),
    readFile(lifecycleBridgeUrl, "utf8"),
    readFile(lifecycleEdgeFunctionUrl, "utf8"),
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
  assert.match(
    route,
    /providerConfigured: Boolean\(openAiKey && bridgeConfig\)/,
  );
  assert.match(
    route,
    /invokeMomoMediaAiLifecycleBridge[\s\S]*?operation: "start"[\s\S]*?candidateId: input\.candidateId[\s\S]*?requestHash: input\.requestHash/,
  );
  assert.match(
    route,
    /reconcileMomoMediaAiTerminalLifecycleBridge[\s\S]*?operation: "complete"[\s\S]*?providerRequestId: input\.providerRequestId/,
  );
  assert.match(
    route,
    /reconcileMomoMediaAiTerminalLifecycleBridge[\s\S]*?operation: "fail"[\s\S]*?errorCode: input\.errorCode/,
  );
  assert.match(bridge, /client\.auth\.getSession\(\)/);
  assert.match(bridge, /redirect: "error"/);
  assert.match(edgeFunction, /BRIDGE_PUBLIC_KEY_SPKI_BASE64/);
  assert.match(edgeFunction, /verifyMomoMediaAiBridgeSignature/);
  assert.match(edgeFunction, /userClient\.auth\.getUser/);
  assert.match(edgeFunction, /p_actor_id: userData\.user\.id/g);
  for (const rpc of [
    "veroxa_momo_media_ai_lifecycle_preflight_v1",
    "veroxa_start_momo_media_ai_provider_v1",
    "veroxa_complete_momo_media_ai_candidate_v1",
    "veroxa_fail_momo_media_ai_candidate_v1",
  ]) {
    assert.match(edgeFunction, new RegExp(`"${rpc}"`));
  }
  assert.doesNotMatch(route, /SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(bridge, /SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(route, /VEROXA_MEDIA_AI_ENABLED === "true"/);
  assert.match(route, /process\.env\.OPENAI_API_KEY/);
  assert.doesNotMatch(route, /NEXT_PUBLIC_OPENAI|VITE_OPENAI/);
});
