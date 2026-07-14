import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  RESTAURANT_AUDIT_CATEGORY_DEFINITIONS,
  RESTAURANT_AUDIT_ENGINE_VERSION,
  RESTAURANT_AUDIT_RESEARCH_MODEL,
  RESTAURANT_AUDIT_RESEARCH_PRICING_VERSION,
  RESTAURANT_AUDIT_SCHEMA_VERSION,
  generateRestaurantAuditSnapshot,
  isRestaurantAuditSnapshot,
  parseRestaurantAuditSnapshot,
} from "../app/restaurant-audit-engine.ts";

const GENERATED_AT = "2026-07-13T20:00:00.000Z";

test("locks six neutral weighted categories to a 100-point maximum", () => {
  assert.equal(RESTAURANT_AUDIT_CATEGORY_DEFINITIONS.length, 6);
  assert.equal(
    RESTAURANT_AUDIT_CATEGORY_DEFINITIONS.reduce(
      (total, category) => total + category.weight,
      0,
    ),
    100,
  );
  assert.equal(
    new Set(RESTAURANT_AUDIT_CATEGORY_DEFINITIONS.map((category) => category.key)).size,
    6,
  );
});

test("treats omitted signals as unknown without inventing evidence", () => {
  const snapshot = generateRestaurantAuditSnapshot({ generatedAt: GENERATED_AT });
  assert.equal(snapshot.engineVersion, "restaurant-audit-v3");
  assert.equal(snapshot.schemaVersion, 3);
  assert.equal(snapshot.overallScore, 0);
  assert.equal(snapshot.maxScore, 100);
  assert.equal(snapshot.evidenceCoverage, 0);
  assert.equal(snapshot.confidence, "low");
  assert.ok(snapshot.categories.every((category) => category.status === "unknown"));
  assert.ok(snapshot.categories.every((category) => category.evidenceUrl === null));
  assert.equal(snapshot.improvementAreas.length, 6);
  assert.ok(snapshot.improvementAreas.every((item) => item.kind === "verification_needed"));
});

test("credits only confirmed-present categories and separates gaps from unknowns", () => {
  const snapshot = generateRestaurantAuditSnapshot({
    generatedAt: GENERATED_AT,
    categories: {
      google_business_profile: {
        status: "confirmed_present",
        evidenceUrl: "https://example.com/google#details",
        note: "  Team checked the current profile.  ",
      },
      website_experience: {
        status: "confirmed_missing",
        evidenceUrl: "https://example.com/",
        note: "Mobile contact path was not usable.",
      },
      menu_and_ordering: {
        status: "confirmed_missing",
        note: "The menu path was manually checked.",
      },
      social_presence: { status: "confirmed_present" },
    },
  });

  assert.equal(snapshot.overallScore, 35);
  assert.equal(snapshot.evidenceCoverage, 70);
  assert.equal(snapshot.confidence, "medium");
  assert.deepEqual(
    snapshot.improvementAreas.map((item) => [item.key, item.kind]),
    [
      ["menu_and_ordering", "confirmed_gap"],
      ["website_experience", "confirmed_gap"],
      ["reviews_and_trust", "verification_needed"],
      ["local_search_consistency", "verification_needed"],
    ],
  );
  assert.equal(
    snapshot.categories[0].evidenceUrl,
    "https://example.com/google",
  );
  assert.equal(snapshot.categories[0].note, "Team checked the current profile.");
});

test("credits evidence-backed partial points without treating a weak system as complete", () => {
  const snapshot = generateRestaurantAuditSnapshot({
    generatedAt: GENERATED_AT,
    categories: {
      google_business_profile: {
        status: "confirmed_missing",
        score: 14,
        evidenceUrl: "https://example.com/google",
        note: "The profile exists, but important details conflict with other public sources.",
      },
      website_experience: {
        status: "confirmed_missing",
        score: 12,
        evidenceUrl: "https://example.com/",
        note: "The website works, but contains a visible location-state warning.",
      },
    },
  });

  assert.equal(snapshot.overallScore, 26);
  assert.equal(snapshot.evidenceCoverage, 35);
  assert.equal(snapshot.categories[0].score, 14);
  assert.equal(snapshot.improvementAreas[0].potentialPoints, 6);
  assert.equal(isRestaurantAuditSnapshot(snapshot), true);
  assert.throws(
    () => generateRestaurantAuditSnapshot({
      generatedAt: GENERATED_AT,
      categories: {
        website_experience: { status: "confirmed_missing", score: 15 },
      },
    }),
    /score_invalid/,
  );
});

test("retains every weakness while limiting fix-first priorities to three", () => {
  const snapshot = generateRestaurantAuditSnapshot({
    generatedAt: GENERATED_AT,
    categories: Object.fromEntries(
      RESTAURANT_AUDIT_CATEGORY_DEFINITIONS.map((category) => [
        category.key,
        { status: "confirmed_missing", note: `${category.label} manually reviewed.` },
      ]),
    ),
  });

  assert.equal(snapshot.overallScore, 0);
  assert.equal(snapshot.evidenceCoverage, 100);
  assert.equal(snapshot.confidence, "high");
  assert.equal(snapshot.improvementAreas.length, 6);
  assert.equal(snapshot.fixFirst.length, 3);
  assert.equal(snapshot.plan.days_0_30.length, 6);
  assert.equal(snapshot.plan.days_31_60.length, 6);
  assert.equal(snapshot.plan.days_61_90.length, 6);
  assert.ok(snapshot.plan.days_0_30.length > 0);
  assert.ok(snapshot.plan.days_31_60.length > 0);
  assert.ok(snapshot.plan.days_61_90.length > 0);
  assert.notDeepEqual(snapshot.plan.days_0_30, snapshot.plan.days_31_60);
  assert.notDeepEqual(snapshot.plan.days_31_60, snapshot.plan.days_61_90);
  assert.match(snapshot.honestyNote, /provisional/i);
  assert.match(snapshot.honestyNote, /does not guarantee/i);
  assert.match(snapshot.honestyNote, /rankings, customers, orders, revenue, profit, ROI/i);
});

test("returns a maintenance comparison plan when all six foundations are confirmed", () => {
  const snapshot = generateRestaurantAuditSnapshot({
    generatedAt: GENERATED_AT,
    categories: Object.fromEntries(
      RESTAURANT_AUDIT_CATEGORY_DEFINITIONS.map((category) => [
        category.key,
        { status: "confirmed_present", note: `${category.label} manually reviewed.` },
      ]),
    ),
  });

  assert.equal(snapshot.overallScore, 100);
  assert.equal(snapshot.evidenceCoverage, 100);
  assert.equal(snapshot.confidence, "high");
  assert.deepEqual(snapshot.improvementAreas, []);
  assert.deepEqual(snapshot.fixFirst, []);
  assert.equal(snapshot.plan.days_0_30.length, 1);
  assert.equal(snapshot.plan.days_31_60.length, 1);
  assert.equal(snapshot.plan.days_61_90.length, 1);
});

test("is deterministic, versioned, JSON-safe, and parseable", () => {
  const input = {
    generatedAt: "2026-07-13T15:00:00-05:00",
    categories: {
      google_business_profile: {
        status: "confirmed_present",
        evidenceUrl: "https://example.com/profile#hours",
      },
      website_experience: { status: "unknown" },
    },
  };
  const first = generateRestaurantAuditSnapshot(input);
  const second = generateRestaurantAuditSnapshot(input);
  assert.deepEqual(first, second);
  assert.equal(first.engineVersion, RESTAURANT_AUDIT_ENGINE_VERSION);
  assert.equal(first.schemaVersion, RESTAURANT_AUDIT_SCHEMA_VERSION);
  assert.equal(first.generatedAt, GENERATED_AT);

  const serialized = JSON.stringify(first);
  assert.doesNotMatch(serialized, /undefined/);
  assert.deepEqual(JSON.parse(serialized), first);
  assert.equal(isRestaurantAuditSnapshot(first), true);
  assert.deepEqual(parseRestaurantAuditSnapshot(serialized), first);
  assert.equal(parseRestaurantAuditSnapshot("not-json"), null);
  assert.equal(
    isRestaurantAuditSnapshot({ ...first, overallScore: 101 }),
    false,
  );
});

test("retains only a strictly validated optional AI research ledger reference", () => {
  const researchRef = {
    researchId: "11111111-1111-4111-8111-111111111111",
    requestHash: "a".repeat(64),
    model: RESTAURANT_AUDIT_RESEARCH_MODEL,
    pricingVersion: RESTAURANT_AUDIT_RESEARCH_PRICING_VERSION,
  };
  const snapshot = generateRestaurantAuditSnapshot({
    generatedAt: GENERATED_AT,
    researchRef,
  });
  assert.deepEqual(snapshot.researchRef, researchRef);
  assert.deepEqual(parseRestaurantAuditSnapshot(JSON.stringify(snapshot)), snapshot);

  for (const invalid of [
    { ...researchRef, researchId: "not-a-uuid" },
    { ...researchRef, requestHash: "A".repeat(64) },
    { ...researchRef, model: "different-model" },
    { ...researchRef, pricingVersion: "mutable-pricing" },
    { ...researchRef, extra: "not-allowed" },
  ]) {
    assert.throws(
      () => generateRestaurantAuditSnapshot({ generatedAt: GENERATED_AT, researchRef: invalid }),
      /research_reference_invalid/,
    );
    assert.equal(parseRestaurantAuditSnapshot({ ...snapshot, researchRef: invalid }), null);
  }
  assert.equal(parseRestaurantAuditSnapshot({ ...snapshot, unexpected: true }), null);
});

test("parser rejects snapshots whose derived score, confidence, priorities, or plan were altered", () => {
  const snapshot = generateRestaurantAuditSnapshot({
    generatedAt: GENERATED_AT,
    categories: {
      google_business_profile: {
        status: "confirmed_present",
        evidenceUrl: "https://example.com/google",
        note: "Profile details were reviewed.",
      },
      menu_and_ordering: {
        status: "confirmed_missing",
        evidenceUrl: "https://example.com/menu",
        note: "The menu path was not usable.",
      },
    },
  });
  assert.equal(isRestaurantAuditSnapshot(snapshot), true);

  const mutations = [
    { ...snapshot, overallScore: snapshot.overallScore + 1 },
    { ...snapshot, evidenceCoverage: snapshot.evidenceCoverage + 1 },
    { ...snapshot, confidence: "high" },
    {
      ...snapshot,
      improvementAreas: snapshot.improvementAreas.map((item, index) =>
        index === 0 ? { ...item, kind: "verification_needed" } : item),
    },
    {
      ...snapshot,
      fixFirst: snapshot.fixFirst.map((item, index) =>
        index === 0 ? { ...item, action: "Altered action." } : item),
    },
    {
      ...snapshot,
      plan: { ...snapshot.plan, days_31_60: ["Altered plan stage."] },
    },
    { ...snapshot, honestyNote: "Altered honesty note." },
  ];
  for (const mutation of mutations) {
    assert.equal(parseRestaurantAuditSnapshot(mutation), null);
  }
});

test("rejects invalid timestamps and invalid runtime signal states", () => {
  assert.throws(
    () => generateRestaurantAuditSnapshot({ generatedAt: "not-a-date" }),
    /generated_at_invalid/,
  );
  assert.throws(
    () =>
      generateRestaurantAuditSnapshot({
        generatedAt: GENERATED_AT,
        categories: {
          google_business_profile: { status: "assumed_present" },
        },
      }),
    /status_invalid/,
  );
});

test("engine stays offline and keeps research metadata out of scoring or billing logic", async () => {
  const source = await readFile(
    new URL("../app/restaurant-audit-engine.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /XMLHttpRequest|anthropic|gemini|model call|responses\.create|chat\.completions/i);
  assert.doesNotMatch(source, /actualMicrousd|reservedMicrousd|inputTokens|outputTokens|webSearchCalls|\bpackage\b|\bclient\b/i);
  assert.doesNotMatch(source, /\bmomo\b|\bhalal\b|\buzbek\b|\bnepali\b|\bmediterranean\b/i);
  assert.doesNotMatch(source, /Date\.now\(|Math\.random\(|crypto\.randomUUID\(/);
});
