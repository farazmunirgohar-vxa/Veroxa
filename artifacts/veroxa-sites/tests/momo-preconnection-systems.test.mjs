import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  assertMomoEvidenceUse,
  evaluateMomoEvidenceUse,
} from "../app/momo-evidence-boundary.ts";
import {
  MOMO_IMAGE_PRESETS,
  buildMomoImageEditPlan,
  deriveMomoCenterCoverCrop,
  momoImageCropMatchesOutputAspect,
  normalizeMomoImageRecipe,
  validateMomoImageEdit,
} from "../app/momo-media-workflow.ts";
import {
  runMomoPublicationRehearsal,
  validateMomoPublicationRehearsal,
} from "../app/momo-publication-rehearsal.ts";
import {
  analyzeMomoSeoEvidence,
  buildMomoSeoChangePlan,
} from "../app/momo-seo-workbench.ts";
import { evaluateMomoPreconnectionReadiness } from "../app/momo-preconnection-readiness.ts";
import { MOMO_GROWTH_EVIDENCE } from "../app/momo-growth-evidence.ts";
import { parseMomoClientSnapshot } from "../app/momo-client-data.ts";
import {
  MOMO_AI_CHANNELS,
  MOMO_AI_MODEL_CONTRACT,
  MOMO_AI_PROMPT_VERSION,
  runMomoAiContractRehearsal,
  validateMomoAiRehearsalInput,
} from "../app/momo-ai-automation-rehearsal.ts";
import {
  normalizeMomoMetricsRehearsal,
  summarizeMomoMetrics,
  validateMomoMetricsRehearsal,
} from "../app/momo-metrics-rehearsal.ts";
import { detectMomoImageMimeType } from "../app/momo-image-renderer.ts";

const HASH = "a".repeat(64);
const source = {
  restaurantId: "00000000-0000-4000-8000-000000000010",
  assetId: "00000000-0000-4000-8000-000000000001",
  sourceKind: "owner_asset",
  mimeType: "image/jpeg",
  width: 3024,
  height: 4032,
  contentSha256: HASH,
  rightsStatus: "confirmed",
  reviewStatus: "approved",
  publicUseApproved: true,
  usageScope: ["instagram", "facebook", "google_business", "website"],
  evidenceClass: "development_proxy",
};

test("development evidence is rehearsal-only and unknown evidence fails closed", () => {
  assert.equal(evaluateMomoEvidenceUse("development_proxy", "preconnection_rehearsal").allowed, true);
  assert.equal(evaluateMomoEvidenceUse("synthetic", "preconnection_rehearsal").allowed, true);
  assert.equal(evaluateMomoEvidenceUse("public_evidence", "preconnection_rehearsal").allowed, true);
  assert.equal(evaluateMomoEvidenceUse("development_proxy", "live").allowed, false);
  assert.equal(evaluateMomoEvidenceUse("unknown", "preconnection_rehearsal").allowed, false);
  assert.doesNotThrow(() => assertMomoEvidenceUse("real_owner", "live"));
  assert.throws(() => assertMomoEvidenceUse("synthetic", "live"), /non_owner_evidence_live_blocked/);
});

test("locks real image output presets and produces a deterministic immutable edit plan", async () => {
  assert.deepEqual(MOMO_IMAGE_PRESETS.instagram_portrait, {
    label: "Instagram portrait", width: 1080, height: 1350, intendedUse: "instagram",
  });
  assert.deepEqual(MOMO_IMAGE_PRESETS.google_business_square, {
    label: "Google Business square", width: 720, height: 720, intendedUse: "google_business",
  });
  const recipe = {
    preset: "instagram_portrait",
    crop: { x: 0.2, y: 0, width: 0.6, height: 1 },
    rotation: 90,
    brightness: 104,
    contrast: 108,
    saturation: 112,
    outputFormat: "image/webp",
    quality: 0.88,
    altText: "Steamed momos plated with dipping sauce.",
  };
  const first = await buildMomoImageEditPlan(source, recipe);
  const second = await buildMomoImageEditPlan(source, recipe);
  assert.deepEqual(first, second);
  assert.equal(first.outputWidth, 1080);
  assert.equal(first.outputHeight, 1350);
  assert.equal(first.externalWriteAllowed, false);
  assert.match(first.fingerprint, /^[a-f0-9]{64}$/);
  assert.match(first.storagePath, new RegExp(`${first.fingerprint}\\.webp$`));
});

test("center-cover crops preserve aspect deterministically for 4:3 sources and account for rotation", async () => {
  const portrait = deriveMomoCenterCoverCrop({
    sourceWidth: 1600, sourceHeight: 1200, outputWidth: 1200, outputHeight: 1500, rotation: 0,
  });
  const square = deriveMomoCenterCoverCrop({
    sourceWidth: 1600, sourceHeight: 1200, outputWidth: 720, outputHeight: 720, rotation: 0,
  });
  const rotatedPortrait = deriveMomoCenterCoverCrop({
    sourceWidth: 1600, sourceHeight: 1200, outputWidth: 1200, outputHeight: 1500, rotation: 90,
  });
  assert.deepEqual(portrait, { x: 0.2, y: 0, width: 0.6, height: 1 });
  assert.deepEqual(square, { x: 0.125, y: 0, width: 0.75, height: 1 });
  assert.deepEqual(rotatedPortrait, { x: 0, y: 0.03125, width: 1, height: 0.9375 });
  assert.equal(momoImageCropMatchesOutputAspect({
    sourceWidth: 1600, sourceHeight: 1200, outputWidth: 1200, outputHeight: 1500, rotation: 0,
  }, portrait), true);
  const autoPlan = await buildMomoImageEditPlan({ ...source, width: 1600, height: 1200 }, {
    preset: "instagram_portrait",
    outputFormat: "image/webp",
    altText: "Aspect-safe Momo image rehearsal.",
  });
  assert.deepEqual(autoPlan.recipe.crop, portrait);
});

test("TypeScript and SQL image recipe boundaries reject crops that would stretch output", async () => {
  const fourByThreeSource = { ...source, width: 1600, height: 1200 };
  const mismatched = normalizeMomoImageRecipe({
    preset: "instagram_portrait",
    crop: { x: 0, y: 0, width: 1, height: 1 },
    outputFormat: "image/webp",
    altText: "A crop that must be rejected instead of stretched.",
  });
  assert.ok(validateMomoImageEdit(fourByThreeSource, mismatched).includes("output_aspect_crop_required"));
  await assert.rejects(
    buildMomoImageEditPlan(fourByThreeSource, mismatched),
    /output_aspect_crop_required/,
  );

  const root = fileURLToPath(new URL("..", import.meta.url));
  const migration = await readFile(`${root}/supabase/migrations/20260716035027_momo_preconnection_foundation.sql`, "utf8");
  assert.match(migration, /momo_image_recipe_valid_v1\([\s\S]*p_source_width integer[\s\S]*p_output_width integer/);
  assert.match(migration, /width_value \* oriented_width \* p_output_height[\s\S]*height_value \* oriented_height \* p_output_width/);
  assert.match(migration, /momo_image_recipe_valid_v1\([\s\S]*source_width, source_height, p_width, p_height[\s\S]*invalid_momo_rendition_recipe/);

  const center = await readFile(`${root}/app/momo-team-preconnection-center.tsx`, "utf8");
  assert.doesNotMatch(center, /crop:\s*\{\s*x:\s*0,\s*y:\s*0,\s*width:\s*1,\s*height:\s*1\s*\}/);
  assert.ok((center.match(/deriveMomoCenterCoverCrop\(/g) || []).length >= 1);
  assert.ok((center.match(/deriveMomoCoverCropAtFocalPoint\(/g) || []).length >= 1);
  assert.match(center, /min=\{0\}[\s\S]*max=\{100\}[\s\S]*value=\{focalX\}/);
  assert.match(center, /min=\{0\}[\s\S]*max=\{100\}[\s\S]*value=\{focalY\}/);
});

test("image recipe normalization clamps unsafe controls and edit validation rejects unsupported video", () => {
  const recipe = normalizeMomoImageRecipe({
    preset: "website_hero",
    crop: { x: -5, y: 0.8, width: 4, height: 4 },
    brightness: 999,
    contrast: -4,
    quality: 0.1,
    altText: "x".repeat(400),
  });
  assert.deepEqual(recipe.crop, { x: 0, y: 0.8, width: 1, height: 0.19999999999999996 });
  assert.equal(recipe.brightness, 120);
  assert.equal(recipe.contrast, 80);
  assert.equal(recipe.quality, 0.5);
  assert.equal(recipe.altText.length, 280);
  const problems = validateMomoImageEdit({ ...source, mimeType: "video/mp4" }, recipe);
  assert.ok(problems.includes("editable_image_type_required"));
  const googleRecipe = normalizeMomoImageRecipe({
    preset: "google_business_square", outputFormat: "image/webp", altText: "Momos on a plate.",
  });
  assert.ok(validateMomoImageEdit(source, googleRecipe).includes("google_business_jpg_or_png_required"));
});

test("Team rendition persistence requires authenticated byte and dimension readback before registration", async () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const persistence = await readFile(`${root}/app/momo-team-preconnection-data.ts`, "utf8");
  const downloadIndex = persistence.indexOf("storage.download(");
  const infoIndex = persistence.indexOf("storage.info(storagePath)");
  const hashIndex = persistence.indexOf("storedSha256 !== outputSha256");
  const dimensionsIndex = persistence.indexOf("stored.width !== input.plan.outputWidth");
  const registrationIndex = persistence.indexOf('client.rpc("veroxa_register_momo_rendition_v1"');
  assert.ok(infoIndex > 0);
  assert.ok(downloadIndex > infoIndex);
  assert.ok(hashIndex > downloadIndex);
  assert.ok(dimensionsIndex > hashIndex);
  assert.ok(registrationIndex > dimensionsIndex);
  assert.match(persistence, /storage\.remove\(\[storagePath\]\)/);
  assert.match(persistence, /uploadedByThisAttempt/);
  assert.match(persistence, /if \(registrationAttempted\)[\s\S]*throw new Error\("rendition_registration_state_unknown"/);
  const registrationCatchStart = persistence.indexOf("if (registrationAttempted)");
  const registrationCatch = persistence.slice(registrationCatchStart, persistence.indexOf("if (uploadedByThisAttempt)", registrationCatchStart));
  assert.doesNotMatch(registrationCatch, /storage\.remove/);
});

test("image MIME evidence comes from JPEG, PNG, and WebP bytes rather than response headers", () => {
  assert.equal(detectMomoImageMimeType(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
  assert.equal(detectMomoImageMimeType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
  assert.equal(detectMomoImageMimeType(Uint8Array.from([
    0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    0x56, 0x50, 0x38, 0x58,
  ])), "image/webp");
  assert.equal(detectMomoImageMimeType(Uint8Array.from([
    0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    0x4e, 0x4f, 0x50, 0x45,
  ])), null);
  assert.equal(detectMomoImageMimeType(Uint8Array.from([0x00, 0x01, 0x02, 0x03])), null);
});

test("one-click channel fixtures use the cross-browser JPEG path and validate output before prepare", async () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const center = await readFile(`${root}/app/momo-team-preconnection-center.tsx`, "utf8");
  const persistence = await readFile(`${root}/app/momo-team-preconnection-data.ts`, "utf8");
  assert.doesNotMatch(center.slice(center.indexOf("const fixtures"), center.indexOf("for (const fixture")), /image\/webp/);
  assert.match(center, /useState<"image\/jpeg" \| "image\/png" \| "image\/webp">\("image\/jpeg"\)/);
  assert.match(center, /Team-only stage:/);
  assert.ok(persistence.indexOf("inspectMomoImageBlob(input.output)") < persistence.indexOf('client.rpc("veroxa_prepare_momo_rendition_v1"'));
  assert.match(persistence, /cacheNonce: outputSha256/);
  assert.match(persistence, /cache: "no-store"/);
});

const rehearsalInput = {
  restaurantId: "00000000-0000-4000-8000-000000000010",
  variantId: "00000000-0000-4000-8000-000000000011",
  channel: "instagram",
  caption: "A reviewed Momo content rehearsal.",
  scheduledFor: "2026-08-01T18:00:00.000Z",
  timezone: "America/Chicago",
  media: [{ renditionId: "00000000-0000-4000-8000-000000000012", contentSha256: HASH, altText: "Momos on a plate." }],
  approvalSnapshotSha256: "b".repeat(64),
  evidenceClass: "development_proxy",
};

test("publication rehearsal is deterministic, idempotent, and incapable of a public write", async () => {
  const first = await runMomoPublicationRehearsal(rehearsalInput);
  const second = await runMomoPublicationRehearsal(rehearsalInput);
  assert.deepEqual(first, second);
  assert.equal(first.state, "completed");
  assert.equal(first.externalWriteAllowed, false);
  assert.equal(first.payloadSnapshot.caption, rehearsalInput.caption);
  assert.equal(first.payloadSnapshot.media[0].renditionId, rehearsalInput.media[0].renditionId);
  assert.equal(first.simulatedReceipt.externalId, null);
  assert.equal(first.simulatedReceipt.published, false);
  assert.equal(first.simulatedReceipt.readbackVerified, false);
});

test("publication rehearsal exercises bounded retry and dead-letter behavior", async () => {
  const retried = await runMomoPublicationRehearsal({ ...rehearsalInput, scenario: "transient_then_success" });
  assert.deepEqual(retried.attempts.map((item) => item.state), ["retryable_failure", "succeeded"]);
  assert.equal(retried.state, "completed");
  const rejected = await runMomoPublicationRehearsal({ ...rehearsalInput, scenario: "permanent_failure" });
  assert.equal(rejected.state, "dead_letter");
  assert.equal(rejected.attempts.length, 1);
  assert.ok(validateMomoPublicationRehearsal({ ...rehearsalInput, evidenceClass: "unknown" }).includes("classified_evidence_required"));
});

const aiRehearsalInput = {
  restaurantId: "00000000-0000-4000-8000-000000000010",
  restaurantName: "Momo House",
  objective: "Prepare a safe, reviewable three-channel content draft.",
  facts: [
    { key: "restaurant_name", value: "Momo House", evidenceClass: "development_proxy" },
    { key: "workflow_mode", value: "Preconnection rehearsal", evidenceClass: "synthetic" },
  ],
  channels: ["instagram", "google_business", "facebook"],
};

test("AI contract rehearsal is canonical, deterministic, provider-neutral, and review-gated", async () => {
  const first = await runMomoAiContractRehearsal(aiRehearsalInput);
  const reordered = await runMomoAiContractRehearsal({
    ...aiRehearsalInput,
    restaurantName: "  Momo House  ",
    objective: `  ${aiRehearsalInput.objective}  `,
    facts: [...aiRehearsalInput.facts].reverse(),
    channels: [...aiRehearsalInput.channels].reverse(),
  });

  assert.deepEqual(first, reordered);
  assert.equal(first.schemaVersion, "momo-ai-contract-rehearsal-v1");
  assert.equal(first.promptVersion, MOMO_AI_PROMPT_VERSION);
  assert.equal(first.modelContract, MOMO_AI_MODEL_CONTRACT);
  assert.equal(first.executionMode, "rehearsal");
  assert.equal(first.providerCalled, false);
  assert.equal(first.externalWriteAllowed, false);
  assert.equal(first.humanReviewRequired, true);
  assert.deepEqual(first.inputSnapshot.channels, [...MOMO_AI_CHANNELS]);
  assert.deepEqual(first.groundingReport.factKeysUsed, ["restaurant_name", "workflow_mode"]);
  assert.match(first.inputSha256, /^[a-f0-9]{64}$/);
  assert.match(first.outputSha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(first.evidenceKeys, ["google_people_first_content", "ftc_truthful_advertising"]);
});

test("AI rehearsal emits no unreviewed claims and does not turn objectives or facts into copy", async () => {
  const unsupportedClaim = "Momo House is definitively the number one restaurant in Texas.";
  const rehearsal = await runMomoAiContractRehearsal({
    ...aiRehearsalInput,
    objective: "Write the strongest possible promotional content for this rehearsal.",
    facts: [
      ...aiRehearsalInput.facts,
      { key: "unverified_marketing_note", value: unsupportedClaim, evidenceClass: "development_proxy" },
    ],
  });

  assert.deepEqual(rehearsal.outputSnapshot.claims, []);
  assert.equal(rehearsal.groundingReport.allClaimsSupported, true);
  assert.deepEqual(rehearsal.groundingReport.unsupportedClaims, []);
  assert.equal(JSON.stringify(rehearsal.outputSnapshot).includes(unsupportedClaim), false);
  assert.equal(JSON.stringify(rehearsal.outputSnapshot).includes("strongest possible"), false);
  for (const channel of MOMO_AI_CHANNELS) {
    assert.equal(rehearsal.outputSnapshot.channelVariants[channel], rehearsal.outputSnapshot.caption);
  }
  assert.deepEqual(rehearsal.groundingReport.blockedLiveReasons, [
    "real_owner_evidence_required",
    "human_review_required",
    "provider_connection_required",
    "exact_action_consent_required",
    "external_writes_disabled",
  ]);
});

test("AI rehearsal validation fails closed for malformed scope, facts, evidence, and channel coverage", async () => {
  const problems = validateMomoAiRehearsalInput({
    restaurantId: "",
    restaurantName: " x ",
    objective: "too short",
    facts: [
      { key: "bad key", value: "", evidenceClass: "unknown" },
      { key: "valid_key", value: "x".repeat(501), evidenceClass: "development_proxy" },
    ],
    channels: ["instagram"],
  });

  assert.deepEqual(problems.sort(), [
    "all_preconnection_channels_required",
    "bounded_objective_required",
    "classified_fact_required",
    "restaurant_name_required",
    "restaurant_scope_required",
    "valid_fact_required",
  ]);
  await assert.rejects(
    runMomoAiContractRehearsal({ ...aiRehearsalInput, channels: ["facebook", "instagram"] }),
    /all_preconnection_channels_required/,
  );
  await assert.rejects(
    runMomoAiContractRehearsal({ ...aiRehearsalInput, channels: ["facebook", "instagram", "google_business", "facebook"] }),
    /all_preconnection_channels_required/,
  );
});

const facebookMetrics = {
  restaurantId: "00000000-0000-4000-8000-000000000010",
  source: "facebook",
  periodStart: "2026-07-01",
  periodEnd: "2026-07-07",
  metrics: { reach: 800, clicks: 40, impressions: 1_000, engagements: 125 },
};

test("metrics normalization is canonical and supplies a stable semantic deduplication fingerprint", async () => {
  const first = await normalizeMomoMetricsRehearsal(facebookMetrics);
  const reordered = await normalizeMomoMetricsRehearsal({
    ...facebookMetrics,
    metrics: { impressions: 1_000, engagements: 125, clicks: 40, reach: 800 },
  });
  const nextPeriod = await normalizeMomoMetricsRehearsal({ ...facebookMetrics, periodEnd: "2026-07-08" });

  assert.deepEqual(first, reordered);
  assert.notEqual(first.snapshotSha256, nextPeriod.snapshotSha256);
  assert.match(first.snapshotSha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(Object.keys(first.metrics), ["clicks", "engagements", "impressions", "reach"]);
  assert.equal(first.evidenceClass, "synthetic");
  assert.equal(first.executionMode, "rehearsal");
  assert.equal(first.externalWriteAllowed, false);
});

test("metrics validation rejects unsupported, malformed, identifying, fractional, and unbounded inputs", async () => {
  const invalid = validateMomoMetricsRehearsal({
    restaurantId: "",
    source: "email_campaign",
    periodStart: "07/01/2026",
    periodEnd: "2026-06-30",
    metrics: {
      "customer_email:test@example.com": 1,
      "customer_phone_2105551212": 1,
      clicks: -1,
      reach: 2.5,
      impressions: Number.POSITIVE_INFINITY,
      engagements: 1_000_000_001,
    },
  });

  for (const expected of [
    "restaurant_scope_required",
    "supported_source_required",
    "valid_period_required",
    "allowlisted_metrics_required",
    "nonnegative_integer_metrics_required",
    "bounded_metric_value_required",
    "metrics_pii_forbidden",
  ]) assert.ok(invalid.includes(expected), expected);

  assert.ok(validateMomoMetricsRehearsal({ ...facebookMetrics, metrics: {} }).includes("bounded_metrics_required"));
  assert.ok(validateMomoMetricsRehearsal({ ...facebookMetrics, periodStart: "2026-07-08" }).includes("valid_period_required"));
  assert.ok(validateMomoMetricsRehearsal({ ...facebookMetrics, periodStart: "2026-02-30" }).includes("valid_period_required"));
  await assert.rejects(
    normalizeMomoMetricsRehearsal({ ...facebookMetrics, metrics: { impressions: Number.NaN } }),
    /nonnegative_integer_metrics_required/,
  );
});

test("metrics summary keeps sources separate, derives only denominator-backed rates, and makes no causal or ROI claim", () => {
  const summary = summarizeMomoMetrics([
    facebookMetrics,
    {
      restaurantId: facebookMetrics.restaurantId,
      source: "instagram",
      periodStart: facebookMetrics.periodStart,
      periodEnd: facebookMetrics.periodEnd,
      metrics: { impressions: 0, reach: 0, engagements: 0, clicks: 0 },
    },
    {
      restaurantId: facebookMetrics.restaurantId,
      source: "google_business",
      periodStart: facebookMetrics.periodStart,
      periodEnd: facebookMetrics.periodEnd,
      metrics: { views: 900, calls: 20, directions: 35, website_clicks: 50 },
    },
    {
      restaurantId: facebookMetrics.restaurantId,
      source: "website",
      periodStart: facebookMetrics.periodStart,
      periodEnd: facebookMetrics.periodEnd,
      metrics: { sessions: 500, engaged_sessions: 300, conversions: 15 },
    },
  ]);

  assert.deepEqual(summary.rates.facebook, { engagementRate: 0.125, clickThroughRate: 0.04 });
  assert.deepEqual(summary.rates.instagram, { engagementRate: null, clickThroughRate: null });
  assert.deepEqual(summary.rates.google_business, { engagementRate: null, clickThroughRate: null });
  assert.deepEqual(summary.rates.website, { engagementRate: null, clickThroughRate: null });
  assert.deepEqual(summary.bySource.google_business, { views: 900, calls: 20, directions: 35, website_clicks: 50 });
  assert.equal(summary.combinedReach, null);
  assert.equal(summary.causalClaim, null);
  assert.equal(summary.roi, null);
  assert.throws(() => summarizeMomoMetrics([facebookMetrics, facebookMetrics]), /duplicate_metric_source_forbidden/);
});

const publicPages = [
  {
    url: "https://momohousesa.com/",
    observedAt: "2026-07-16T00:00:00.000Z",
    title: "Best Momos in Town | Momo House San Antonio (Nepali Style Dumplings) | Momos near me",
    text: "THIS IS A NON LIVE LOCATION",
    listedAddress: "4447 De Zavala Rd, San Antonio, TX",
    listedHours: ["Sun 11–8; Mon–Thu 11–7; Fri–Sat 11–9"],
  },
  {
    url: "https://momohousesa.com/menu",
    observedAt: "2026-07-16T00:00:00.000Z",
    title: "Menu",
    text: "THIS IS A NON LIVE LOCATION",
    menuPrices: ["$0.00", "$0.00"],
    orderingClosed: true,
  },
  {
    url: "https://momohousesa.com/catering",
    observedAt: "2026-07-16T00:00:00.000Z",
    title: "Catering",
    text: "THIS IS A NON LIVE LOCATION",
    listedHours: ["Sun–Thu 11–9; Fri–Sat 11–10:30"],
  },
];

test("SEO engine finds current public blockers from explicit page evidence", () => {
  const findings = analyzeMomoSeoEvidence(publicPages);
  const codes = findings.map((item) => item.code);
  assert.ok(codes.includes("non_live_location_banner"));
  assert.ok(codes.includes("zero_price_menu_items"));
  assert.ok(codes.includes("ordering_closed"));
  assert.ok(codes.includes("unsupported_title_superlative"));
  assert.ok(codes.includes("long_page_title"));
  assert.ok(codes.includes("conflicting_hours"));
  assert.equal(findings[0].severity, "critical");
});

test("SEO change plan is reversible and remains rehearsal-only", async () => {
  const plan = await buildMomoSeoChangePlan({
    pages: publicPages,
    evidenceClass: "public_evidence",
    restaurantName: "Momo House",
    locality: "San Antonio",
    cuisine: "Nepali-Style Dumplings",
    address: "4447 De Zavala Rd",
  });
  assert.equal(plan.externalWriteAllowed, false);
  assert.equal(plan.executionMode, "rehearsal");
  assert.match(plan.baselineSha256, /^[a-f0-9]{64}$/);
  assert.match(plan.proposedSha256, /^[a-f0-9]{64}$/);
  assert.ok(plan.rollbackSnapshot.pageEvidence);
  assert.ok(plan.blockedLiveReasons.includes("real_owner_evidence_required"));
});

test("preconnection gate can pass while activation always remains false", () => {
  const values = {
    clientBundleIsolated: true,
    clientSnapshotAllowlisted: true,
    releaseTestsAttested: true,
    imageEditRendered: true,
    renditionLineagePersisted: true,
    mediaPlacementContractReady: true,
    aiContractRehearsed: true,
    multiChannelPublicationRehearsed: true,
    publicationFailureMatrixRehearsed: true,
    seoBaselinePersisted: true,
    seoChangePlanPersisted: true,
    trackingMatrixRehearsed: true,
    metricsContractRehearsed: true,
    automationLifecycleTested: true,
    developmentEvidenceIsolated: true,
    specificConsentBoundaryReady: true,
    growthEvidenceManifestExact: true,
    cacheTtlAutomationReady: true,
    ownerHandoffContractReady: true,
    runtimeControlsLocked: true,
    externalConnectionsInactive: true,
    activationRemainsBlocked: true,
  };
  const result = evaluateMomoPreconnectionReadiness(values);
  assert.equal(result.status, "pass");
  assert.equal(result.canRequestOwnerAccess, true);
  assert.equal(result.canActivate, false);
  const blocked = evaluateMomoPreconnectionReadiness({ ...values, imageEditRendered: false });
  assert.equal(blocked.status, "blocked");
  assert.deepEqual(blocked.blockers, ["An image edit was rendered and its private stored bytes were verified"]);
});

test("growth evidence registry is official, complete, versioned, and synchronized with SQL", async () => {
  assert.equal(new Set(MOMO_GROWTH_EVIDENCE.map((item) => item.key)).size, MOMO_GROWTH_EVIDENCE.length);
  assert.deepEqual(
    [...new Set(MOMO_GROWTH_EVIDENCE.map((item) => item.area))].sort(),
    ["claims", "experiments", "google_business", "media", "meta", "reviews", "seo", "tracking"],
  );
  for (const item of MOMO_GROWTH_EVIDENCE) {
    assert.match(item.url, /^https:\/\//);
    assert.equal(item.retrievedOn, "2026-07-16");
    assert.ok(item.productRequirement.length >= 20);
    assert.ok(item.guardrails.length > 0);
  }
  const consent = MOMO_GROWTH_EVIDENCE.find((item) => item.key === "google_api_specific_consent");
  assert.match(consent.productRequirement, /specific express consent/i);
  assert.ok(consent.guardrails.some((item) => /30 days/i.test(item)));
  const claims = MOMO_GROWTH_EVIDENCE.find((item) => item.key === "ftc_truthful_advertising");
  assert.match(claims.productRequirement, /support/i);
  const root = fileURLToPath(new URL("..", import.meta.url));
  const migration = await readFile(`${root}/supabase/migrations/20260716035027_momo_preconnection_foundation.sql`, "utf8");
  const seed = migration.slice(
    migration.indexOf("insert into public.veroxa_growth_evidence_sources"),
    migration.indexOf("on conflict (evidence_key)", migration.indexOf("insert into public.veroxa_growth_evidence_sources")),
  );
  const sqlString = "'((?:[^']|'')*)'";
  const sqlRow = new RegExp(`\\(${Array(7).fill(sqlString).join(",")},${sqlString}::jsonb\\)`, "g");
  const unescapeSql = (value) => value.replaceAll("''", "'");
  const sqlEvidence = [...seed.matchAll(sqlRow)].map((match) => ({
    key: unescapeSql(match[1]),
    area: unescapeSql(match[2]),
    title: unescapeSql(match[3]),
    publisher: unescapeSql(match[4]),
    url: unescapeSql(match[5]),
    retrievedOn: unescapeSql(match[6]),
    productRequirement: unescapeSql(match[7]),
    guardrails: JSON.parse(unescapeSql(match[8])),
  }));
  assert.deepEqual(sqlEvidence, MOMO_GROWTH_EVIDENCE);
  assert.match(migration, /evidence_version text not null default '2026-07-16-v1'/);
  assert.match(migration, /09ec19d9517ed3b9bb3162c9c5599bde3b0a485362cc24bbadc138e09891c4b1/);
});

test("client consent parser allowlists plain decisions and rejects technical or malformed rows", () => {
  const parsed = parseMomoClientSnapshot({
    actionConsents: [
      {
        id: "consent-1",
        actionKind: "business_profile_change",
        description: "Update the confirmed holiday hours shown on Google.",
        scope: { target: "Google Business Profile hours", operation: "Replace holiday hours", before: "Closed", after: "11 AM–7 PM", batchSize: 1 },
        status: "pending",
        requestedAt: "2026-07-16T00:00:00.000Z",
        expiresAt: "2026-07-30T00:00:00.000Z",
        scopeSnapshot: { secret: "must not be hydrated" },
        scopeSha256: "must not be hydrated",
        requestedBy: "must not be hydrated",
      },
      { id: "consent-2", actionKind: "provider_runtime", description: "Technical control", status: "pending" },
      { id: "consent-3", actionKind: "social_post", description: "Malformed state", status: "queued" },
    ],
    connections: [{ provider: "google_business", credentials: "must not be hydrated" }],
    readiness: { blockers: ["must not be hydrated"] },
  });
  assert.equal(parsed.actionConsents.length, 1);
  assert.deepEqual(Object.keys(parsed.actionConsents[0]).sort(), [
    "actionKind", "decidedAt", "decisionNotes", "description", "expiresAt", "id", "requestedAt", "revocationNotes", "revokedAt", "scope", "status",
  ]);
  assert.equal("connections" in parsed, false);
  assert.equal("readiness" in parsed, false);
});

test("client parser fails closed for malformed dates, calendar states, reports, and consent scope", () => {
  const parsed = parseMomoClientSnapshot({
    contentCalendar: [
      { contentItemId: "one", itemId: "one", channel: "instagram", caption: "Missing state", timezone: "America/Chicago", scheduledFor: "2026-08-01T00:00:00Z" },
      { contentItemId: "two", itemId: "two", channel: "instagram", caption: "Failed", calendarStatus: "failed", timezone: "America/Chicago", scheduledFor: "2026-08-01T00:00:00Z" },
      { contentItemId: "three", itemId: "three", channel: "instagram", caption: "Valid", calendarStatus: "scheduled", timezone: "America/Chicago", scheduledFor: "2026-08-01T00:00:00Z" },
      { contentItemId: "four", itemId: "four", channel: "instagram", caption: "Bad date", calendarStatus: "published", timezone: "America/Chicago", publishedAt: "not-a-date" },
    ],
    reports: [
      { id: "missing-status", periodStart: "2026-07-01", periodEnd: "2026-07-07", approvedAt: "2026-07-08T00:00:00Z" },
      { id: "bad-date", status: "approved", periodStart: "2026-07-01", periodEnd: "2026-07-07", approvedAt: "invalid" },
      { id: "valid", status: "approved", periodStart: "2026-07-01", periodEnd: "2026-07-07", approvedAt: "2026-07-08T00:00:00Z" },
    ],
    actionConsents: [
      { id: "bad-consent", actionKind: "social_post", description: "Post exact content", scope: { target: "Instagram" }, status: "pending", requestedAt: "bad", expiresAt: "bad" },
    ],
  });
  assert.deepEqual(parsed.schedule.map((item) => item.itemId), ["three"]);
  assert.deepEqual(parsed.reports.map((item) => item.id), ["valid"]);
  assert.deepEqual(parsed.actionConsents, []);
});

test("Momo client source graph excludes Team operating modules and labels", async () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const files = [
    "app/client/[[...slug]]/page.tsx",
    "app/momo-client-portal.tsx",
    "app/momo-client-data.ts",
    "app/account-security.tsx",
    "app/account/security/page.tsx",
  ];
  const sourceText = (await Promise.all(files.map((file) => readFile(`${root}/${file}`, "utf8")))).join("\n");
  for (const forbidden of [
    "momo-operating-center",
    "momo-data",
    "Prepare AI",
    "Provider-neutral AI job",
    "Prepare dormant queue metadata",
    "eligible_capabilities",
    "readinessGate",
    "publishQueue",
    "veroxa_provider_preflight_v1",
    "Run all free Momo readiness rehearsals",
    "AI + AUTOMATION · TEAM ONLY",
  ]) assert.equal(sourceText.includes(forbidden), false, forbidden);

  const assetDirectory = `${root}/dist/client/assets`;
  const clientAssets = (await readdir(assetDirectory)).filter((name) =>
    name.startsWith("momo-client-portal-") || name.startsWith("momo-client-data-") || name.startsWith("account-security-"));
  assert.ok(clientAssets.length >= 3, "role-specific client assets were emitted");
  const compiledText = (await Promise.all(clientAssets.map((name) => readFile(`${assetDirectory}/${name}`, "utf8")))).join("\n");
  for (const forbidden of [
    "Prepare deferred AI classification",
    "Provider-neutral AI job",
    "Prepare dormant queue metadata",
    "No readiness percentage",
    "media_classification",
    "eligible_capabilities",
    "veroxa_provider_preflight_v1",
    "Run all free Momo readiness rehearsals",
    "AI + AUTOMATION · TEAM ONLY",
  ]) assert.equal(compiledText.includes(forbidden), false, `compiled: ${forbidden}`);

  const teamSource = await readFile(`${root}/app/momo-team-preconnection-center.tsx`, "utf8");
  assert.match(teamSource, /Run all free Momo readiness rehearsals/);
  assert.match(teamSource, /persistMomoSyntheticChannelFixtures[\s\S]*persistMomoAiContractRehearsal[\s\S]*persistMomoMetricsRehearsalSuite[\s\S]*persistMomoSeoWorkspace[\s\S]*persistMomoPublicationRehearsalSuite[\s\S]*runMomoPreconnectionGate/);
});
