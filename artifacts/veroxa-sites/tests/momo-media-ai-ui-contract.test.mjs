import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
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

test("Media AI remains an approval-controlled private path beside the free manual editor", async () => {
  const center = await readFile(centerUrl, "utf8");

  assert.match(
    center,
    /Create private prepared version/,
    "The free manual renderer must remain available.",
  );
  assert.match(
    center,
    /One server-side OpenAI edit, then mandatory Team inspection/,
  );
  assert.match(
    center,
    /database-enforced \$2\.00 internal reservation ceiling[\s\S]*?provider billing is tracked separately/,
  );
  assert.match(
    center,
    /The prompt is fixed by Veroxa; free-form instructions are not sent/,
  );
  assert.match(
    center,
    /processingConsent:\s*true/,
    "Only the exact checked one-request attestation may reach the server.",
  );
  assert.match(
    center,
    /is never automatically retried/,
  );
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

test("request-shaping changes invalidate consent and bind a fresh idempotency key", async () => {
  const center = await readFile(centerUrl, "utf8");

  assert.match(
    center,
    /const resetAiRequest = \(\) => \{[\s\S]*?setAiProcessingConsent\(false\)[\s\S]*?setAiIdempotencyKey\(newMomoMediaAiIdempotencyKey\(\)\)/,
  );
  assert.match(
    center,
    /await approveMomoMediaAiCandidate\([\s\S]*?resetAiRequest\(\);/,
  );
  assert.match(
    center,
    /await rejectMomoMediaAiCandidate\([\s\S]*?resetAiRequest\(\);/,
  );
  for (const stateChange of [
    /onChange=\{\(event\) => \{ const next = event\.target\.value; resetAiRequest\(\); setSourceAssetId\(next\)/,
    /onChange=\{\(event\) => \{ const next = event\.target\.value as MomoImagePresetKey; resetAiRequest\(\); setPreset\(next\)/,
    /onChange=\{\(event\) => \{ resetAiRequest\(\); setAltText\(event\.target\.value\); \}\}/,
    /onChange=\{\(event\) => \{ resetAiRequest\(\); setAiGoal\(event\.target\.value as MomoMediaAiGoal\); \}\}/,
    /onChange=\{\(event\) => \{ resetAiRequest\(\); setAiQuality\(event\.target\.value as MomoMediaAiQuality\); \}\}/,
  ]) {
    assert.match(center, stateChange);
  }
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
    /setAiReadbackRequired\(true\)[\s\S]*?await generateMomoMediaAiCandidate\([\s\S]*?catch \(error\) \{[\s\S]*?await refreshData\(\)[\s\S]*?throw error[\s\S]*?await refreshData\(\)[\s\S]*?resetAiRequest\(\)/,
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
