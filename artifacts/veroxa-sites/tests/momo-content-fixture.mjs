import assert from "node:assert/strict";
import { buildMomoAllowedHashtags, buildMomoAllowedSeoPhrases } from "../app/momo-content-package-validation.ts";

const IDS = {
  name: "11111111-1111-4111-8111-111111111111",
  address: "22222222-2222-4222-8222-222222222222",
  cuisine: "33333333-3333-4333-8333-333333333333",
  menu: "44444444-4444-4444-8444-444444444444",
};

export const truthFields = [
  { id: IDS.name, fieldKey: "identity.display_name", value: "Momo's House", evidenceClass: "real_owner", ownerConfirmedAt: "2026-07-01T00:00:00Z" },
  { id: IDS.address, fieldKey: "address.primary", value: "San Antonio, Texas", evidenceClass: "real_owner", ownerConfirmedAt: "2026-07-01T00:00:00Z" },
  { id: IDS.cuisine, fieldKey: "identity.cuisine", value: "Nepalese cuisine", evidenceClass: "real_owner", ownerConfirmedAt: "2026-07-01T00:00:00Z" },
  { id: IDS.menu, fieldKey: "menu.primary", value: "Momos and Nepalese snacks", evidenceClass: "real_owner", ownerConfirmedAt: "2026-07-01T00:00:00Z" },
];

const allowed = buildMomoAllowedHashtags(truthFields);
const allowedSeo = buildMomoAllowedSeoPhrases(truthFields);
const byTag = (tag) => allowed.find((item) => item.tag.toLowerCase() === tag.toLowerCase());

export function output() {
  const tags = [byTag("#SanAntonio"), byTag("#MomoHouse"), byTag("#NepaleseFood")];
  assert.ok(tags.every(Boolean), "fixture hashtags must be deterministically allowed");
  return {
    schemaVersion: "momo-content-package-v1",
    assetAssessment: {
      subject: "food",
      visualSummary: "A plated serving is centered against a simple restaurant table setting.",
      qualityScore: 4,
      qualityIssues: ["none"],
    },
    direction: {
      pillar: "Local Discovery",
      objective: "local_discovery",
      angle: "Introduce local diners to a clear Momo's House dining moment.",
      audienceIntent: "Help San Antonio diners recognize the restaurant and cuisine.",
    },
    masterCaption: "Momo's House brings Nepalese cuisine to San Antonio for a local restaurant introduction.",
    altText: "A plated serving centered on a restaurant table with a softly lit background.",
    seoPhrases: [
      { id: "seo-brand", phrase: "Momo's House", kind: "brand", truthFieldIds: [IDS.name] },
      { id: "seo-cuisine", phrase: "Nepalese cuisine", kind: "cuisine", truthFieldIds: [IDS.cuisine] },
      { id: "seo-local", phrase: "San Antonio restaurant", kind: "locality", truthFieldIds: [IDS.address] },
    ],
    hashtags: tags.map((item, index) => ({ id: `tag-${index + 1}`, ...item })),
    claims: [
      { id: "claim-brand", exactText: "Momo's House", source: "owner_truth", category: "restaurant_name", truthFieldIds: [IDS.name], appearsIn: ["master", "instagram", "facebook", "google_business"] },
      { id: "claim-cuisine", exactText: "Nepalese cuisine", source: "owner_truth", category: "cuisine", truthFieldIds: [IDS.cuisine], appearsIn: ["master", "instagram", "facebook", "google_business"] },
      { id: "claim-local", exactText: "San Antonio", source: "owner_truth", category: "location", truthFieldIds: [IDS.address], appearsIn: ["master", "instagram", "facebook", "google_business"] },
      { id: "claim-visible", exactText: "plated serving", source: "visible_media", category: "visual", truthFieldIds: [], appearsIn: ["alt_text"] },
    ],
    variants: [
      {
        platform: "instagram",
        caption: "Momo's House brings Nepalese cuisine to a local table. Discover this San Antonio restaurant introduction for diners.",
        claimIds: ["claim-brand", "claim-cuisine", "claim-local"],
        seoPhraseIds: ["seo-brand", "seo-cuisine", "seo-local"],
        hashtagIds: ["tag-1", "tag-2", "tag-3"],
        cta: { kind: "visit", text: "Plan a visit to Momo's House." },
        scheduleWindow: "unspecified",
      },
      {
        platform: "facebook",
        caption: "Discover Momo's House and Nepalese cuisine at this San Antonio restaurant for a simple local introduction.",
        claimIds: ["claim-brand", "claim-cuisine", "claim-local"],
        seoPhraseIds: ["seo-brand", "seo-cuisine", "seo-local"],
        hashtagIds: ["tag-1"],
        cta: { kind: "visit", text: "Visit Momo's House in San Antonio." },
        scheduleWindow: "unspecified",
      },
      {
        platform: "google_business",
        caption: "Momo's House brings Nepalese cuisine to this San Antonio restaurant for a simple local introduction for area diners.",
        claimIds: ["claim-brand", "claim-cuisine", "claim-local"],
        seoPhraseIds: ["seo-brand", "seo-cuisine", "seo-local"],
        hashtagIds: [],
        cta: { kind: "visit", text: "Plan your visit to Momo's House." },
        scheduleWindow: "unspecified",
      },
    ],
    internalMediaTags: [
      { slug: "food", label: "Food", confidence: 0.96 },
      { slug: "table-setting", label: "Table setting", confidence: 0.83 },
      { slug: "local-discovery", label: "Local discovery", confidence: 0.8 },
    ],
    uncertainties: [],
  };
}

export const context = {
  targetPlatforms: ["instagram", "facebook", "google_business"],
  truthFields,
  allowedSeoPhrases: allowedSeo,
  allowedHashtags: allowed,
};
