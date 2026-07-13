import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  MOMO_MANUAL_CONTENT_PILLARS,
  buildMomoManualContentCycle,
  validateMomoManualContentCycle,
  validateMomoPlatformVariantCaption,
} from "../app/momo-manual-content-cycle.ts";

const validInput = {
  workingTitle: "Steam and sauce close-up",
  pillar: "Momo Cravings",
  internalAngle: "Use a tight food detail and a simple craving-led direction.",
  ownerConfirmedTruth: [
    { id: "truth-name", fieldKey: "identity.display_name", label: "Restaurant name", value: "Confirmed test restaurant" },
    { id: "truth-cuisine", fieldKey: "identity.cuisine", label: "Cuisine", value: "Confirmed momo-focused description" },
  ],
  sensitiveClaims: [],
  requestedPlatforms: ["google_business", "instagram", "facebook"],
  usePublicMedia: true,
  media: {
    id: "media-owner-1",
    label: "Owner-authorized close-up",
    rightsStatus: "confirmed",
    reviewStatus: "approved",
    publicUseApproved: true,
    usageScope: ["facebook", "instagram", "google_business"],
    expiresAt: "2027-01-01T00:00:00.000Z",
  },
  asOf: "2026-07-13T12:00:00.000Z",
};

test("locks the six Momo manual content pillars", () => {
  assert.deepEqual(MOMO_MANUAL_CONTENT_PILLARS, [
    "Momo Cravings",
    "First-Time Education",
    "Behind the Scenes",
    "Customer Reactions",
    "Snack Discovery",
    "Local Discovery",
  ]);
});

test("builds deterministic human-editable skeletons without granting execution state", () => {
  const first = buildMomoManualContentCycle(validInput);
  const second = buildMomoManualContentCycle(validInput);
  assert.deepEqual(first, second);
  assert.equal(first.state, "internal_hypothesis");
  assert.equal(first.inputsVerified, true);
  assert.equal(first.canApprove, false);
  assert.equal(first.canPublish, false);
  assert.equal(first.canMarkReady, false);
  assert.ok(first.brief);
  assert.deepEqual(
    first.brief.variants.map((variant) => variant.platform),
    ["facebook", "instagram", "google_business"],
  );
  assert.ok(first.brief.variants.every((variant) => variant.state === "internal_hypothesis"));
  assert.ok(first.brief.variants.every((variant) => variant.mediaAssetId === "media-owner-1"));
  assert.match(first.brief.variants[0].editableCaption, /human editor writes this/i);
  assert.doesNotMatch(first.brief.variants[0].editableCaption, /Confirmed test restaurant/);
});

test("blocks sensitive claims that do not cite matching owner-confirmed truth", () => {
  const result = buildMomoManualContentCycle({
    ...validInput,
    internalAngle: "Announce 50% off, the best halal menu in town, and open until 11 PM.",
  });
  assert.equal(result.inputsVerified, false);
  assert.equal(result.brief, null);
  const messages = result.issues.map((issue) => issue.message).join("\n");
  assert.match(messages, /offer/i);
  assert.match(messages, /ranking/i);
  assert.match(messages, /halal/i);
  assert.match(messages, /menu/i);
  assert.match(messages, /hours/i);

  const supportedPrice = buildMomoManualContentCycle({
    ...validInput,
    internalAngle: "Use the owner-confirmed price language only.",
    ownerConfirmedTruth: [
      ...validInput.ownerConfirmedTruth,
      { id: "truth-price", fieldKey: "menu.price", label: "Confirmed price", value: "Priced at $12" },
    ],
    sensitiveClaims: [
      { category: "price", text: "Priced at $12", supportingTruthId: "truth-price" },
    ],
  });
  assert.equal(supportedPrice.inputsVerified, true);
});

test("blocks a sensitive claim backed by an unrelated truth field", () => {
  const result = buildMomoManualContentCycle({
    ...validInput,
    internalAngle: "Use the owner-confirmed price language only.",
    sensitiveClaims: [
      { category: "price", text: "Priced at $12", supportingTruthId: "truth-name" },
    ],
  });
  assert.equal(result.inputsVerified, false);
  assert.ok(result.issues.some((issue) =>
    issue.code === "unsupported_sensitive_claim" &&
    issue.field === "sensitiveClaims.price"
  ));
});

test("blocks sensitive values that conflict with a matching truth category", () => {
  const cases = [
    {
      category: "price",
      caption: "Priced at $99.",
      claim: "Priced at $99",
      truth: { id: "truth-price", fieldKey: "menu.price", label: "Price", value: "$12" },
    },
    {
      category: "offer",
      caption: "Get a free order today.",
      claim: "Free order",
      truth: { id: "truth-offer", fieldKey: "offers.current", label: "Offer", value: "10% off" },
    },
    {
      category: "hours",
      caption: "Open until 10 PM.",
      claim: "Open until 10 PM",
      truth: { id: "truth-hours", fieldKey: "hours.regular", label: "Hours", value: "Open until 11 PM" },
    },
    {
      category: "halal",
      caption: "Halal.",
      claim: "Halal",
      truth: { id: "truth-halal", fieldKey: "claims.halal", label: "Halal status", value: "No, not halal" },
    },
    {
      category: "service",
      caption: "We deliver.",
      claim: "We deliver",
      truth: { id: "truth-delivery", fieldKey: "services.delivery", label: "Delivery", value: "Pickup only" },
    },
    {
      category: "dietary",
      caption: "Vegan options available.",
      claim: "Vegan options",
      truth: { id: "truth-dietary", fieldKey: "claims.dietary", label: "Dietary", value: "Vegetarian only" },
    },
    {
      category: "address",
      caption: "Visit us at 999 Main Street.",
      claim: "Visit us at 999 Main Street",
      truth: { id: "truth-address", fieldKey: "address.primary", label: "Address", value: "123 Main Street" },
    },
    {
      category: "phone",
      caption: "Call 210-555-9999.",
      claim: "Call 210-555-9999",
      truth: { id: "truth-phone", fieldKey: "phone.primary", label: "Phone", value: "210-555-1111" },
    },
  ];

  for (const item of cases) {
    const issues = validateMomoPlatformVariantCaption({
      caption: item.caption,
      ownerConfirmedTruth: [item.truth],
      sensitiveClaims: [{ category: item.category, text: item.claim, supportingTruthId: item.truth.id }],
    });
    assert.ok(issues.some((issue) => issue.code === "unsupported_sensitive_claim"), item.category);
  }
});

test("does not turn dietary free text or a yes/no halal fact into broader public claims", () => {
  const freeOffer = validateMomoPlatformVariantCaption({
    caption: "Free delivery today.",
    ownerConfirmedTruth: [
      { id: "truth-dietary", fieldKey: "claims.dietary", label: "Dietary", value: "Gluten-free options" },
      { id: "truth-delivery", fieldKey: "services.delivery", label: "Delivery", value: "Delivery available" },
    ],
  });
  assert.ok(freeOffer.some((issue) => issue.code === "unsupported_sensitive_claim" && issue.message.includes("offer")));

  const certifiedHalal = validateMomoPlatformVariantCaption({
    caption: "100% certified halal.",
    ownerConfirmedTruth: [
      { id: "truth-halal", fieldKey: "claims.halal", label: "Halal", value: "yes" },
    ],
  });
  assert.ok(certifiedHalal.some((issue) => issue.code === "unsupported_sensitive_claim" && issue.message.includes("halal")));

  const legitimateDietary = validateMomoPlatformVariantCaption({
    caption: "Gluten-free noodles are available.",
    ownerConfirmedTruth: [
      { id: "truth-dietary", fieldKey: "claims.dietary", label: "Dietary", value: "Gluten-free noodles" },
    ],
  });
  assert.deepEqual(legitimateDietary, []);
});

test("blocks reassociated hours, scoped delivery promises, and multiple phone numbers", () => {
  const cases = [
    {
      caption: "Monday open until 11 PM.",
      truth: { id: "truth-hours", fieldKey: "hours.regular", label: "Hours", value: "Monday open until 5 PM; Tuesday open until 11 PM" },
    },
    {
      caption: "Delivery across San Antonio within 20 minutes.",
      truth: { id: "truth-delivery", fieldKey: "services.delivery", label: "Delivery", value: "Delivery available" },
    },
    {
      caption: "Call 210-555-9999 or 210-555-1111.",
      truth: { id: "truth-phone", fieldKey: "phone.primary", label: "Phone", value: "210-555-1111" },
    },
  ];

  for (const item of cases) {
    const issues = validateMomoPlatformVariantCaption({ caption: item.caption, ownerConfirmedTruth: [item.truth] });
    assert.ok(issues.some((issue) => issue.code === "unsupported_sensitive_claim"), item.caption);
  }
});

test("lints platform captions so later edits cannot bypass sensitive-claim support", () => {
  const bypass = validateMomoPlatformVariantCaption({
    caption: "Open until 11 PM — the best halal menu in town.",
    ownerConfirmedTruth: validInput.ownerConfirmedTruth,
  });
  assert.ok(bypass.some((issue) => issue.field === "variantCaption"));
  assert.match(bypass.map((issue) => issue.message).join("\n"), /hours/i);
  assert.match(bypass.map((issue) => issue.message).join("\n"), /ranking/i);
  assert.match(bypass.map((issue) => issue.message).join("\n"), /halal/i);
  assert.match(bypass.map((issue) => issue.message).join("\n"), /menu/i);

  const supported = validateMomoPlatformVariantCaption({
    caption: "Open until 11 PM.",
    ownerConfirmedTruth: [
      ...validInput.ownerConfirmedTruth,
      { id: "truth-hours", fieldKey: "hours.regular", label: "Regular hours", value: "Open until 11 PM" },
    ],
    sensitiveClaims: [
      { category: "hours", text: "Open until 11 PM", supportingTruthId: "truth-hours" },
    ],
  });
  assert.deepEqual(supported, []);
});

test("fails closed when confirmed truth or permissioned media is missing", () => {
  const noTruth = validateMomoManualContentCycle({
    ...validInput,
    ownerConfirmedTruth: [],
  });
  assert.ok(noTruth.some((issue) => issue.code === "owner_confirmed_truth_required"));

  const missingFieldKey = validateMomoManualContentCycle({
    ...validInput,
    ownerConfirmedTruth: [
      { id: "truth-without-field-key", label: "Unscoped truth", value: "Cannot support claims" },
    ],
  });
  assert.ok(missingFieldKey.some((issue) => issue.code === "owner_confirmed_truth_invalid"));

  const noMedia = validateMomoManualContentCycle({ ...validInput, media: null });
  assert.ok(noMedia.some((issue) => issue.code === "media_required"));

  const wrongScope = validateMomoManualContentCycle({
    ...validInput,
    media: { ...validInput.media, usageScope: ["instagram"] },
  });
  assert.ok(wrongScope.some((issue) => issue.code === "media_scope_missing"));

  const expired = validateMomoManualContentCycle({
    ...validInput,
    media: { ...validInput.media, expiresAt: "2026-07-01T00:00:00.000Z" },
  });
  assert.ok(expired.some((issue) => issue.code === "media_rights_expired"));
});

test("allows a truth-backed text-only internal direction without granting publication state", () => {
  const result = buildMomoManualContentCycle({
    ...validInput,
    usePublicMedia: false,
    media: null,
  });
  assert.equal(result.inputsVerified, true);
  assert.equal(result.canApprove, false);
  assert.equal(result.canPublish, false);
  assert.ok(result.brief);
  assert.equal(result.brief.media, null);
  assert.ok(result.brief.variants.every((variant) => variant.mediaAssetId === null));
});

test("contains no external-service, credential, or execution implementation", async () => {
  const source = await readFile(
    new URL("../app/momo-manual-content-cycle.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /\b(?:XMLHttpRequest|WebSocket|EventSource)\b/);
  assert.doesNotMatch(source, /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret)\b/i);
  assert.doesNotMatch(source, /\b(?:openai|supabase|meta graph|google api)\b/i);
  assert.doesNotMatch(source, /\b(?:insert|update|delete)\s*\(/i);
  assert.match(source, /canApprove:\s*false/);
  assert.match(source, /canPublish:\s*false/);
  assert.match(source, /canMarkReady:\s*false/);
});
