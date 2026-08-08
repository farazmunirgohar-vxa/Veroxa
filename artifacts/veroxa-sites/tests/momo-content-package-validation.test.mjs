import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMomoCanonicalVisualDescription,
  buildMomoAllowedHashtags,
  buildMomoAllowedSeoPhrases,
  validateMomoContentPackage,
} from "../app/momo-content-package-validation.ts";
import { context, output } from "./momo-content-fixture.mjs";

test("validates a grounded, platform-specific Momo package", () => {
  const result = validateMomoContentPackage(output(), context);
  assert.equal(result.ok, true, result.ok ? "" : result.blockers.join(","));
});

test("accepts an authorized generic food photo without identifying it as a Momo dish", () => {
  const value = output();
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, true, result.ok ? "" : result.blockers.join(","));
  assert.doesNotMatch(value.assetAssessment.visualSummary, /momo|nepalese|ingredient|menu/iu);
});

test("requires one exact neutral visual description for assessment and alt text", () => {
  const mismatch = output();
  mismatch.assetAssessment.visualSummary = "Food presentation: Food; Plated food; Table setting.";
  const mismatchResult = validateMomoContentPackage(mismatch, context);
  assert.equal(mismatchResult.ok, false);
  assert.ok(mismatchResult.blockers.includes("visual_assessment_alt_text_mismatch"));
  assert.ok(mismatchResult.blockers.includes("visual_description_not_canonical"));

  for (const injected of ["Falafel", "KFC food", "Quinoa patty", "Quux blorf"]) {
    const value = output();
    const description = `Food presentation: Food; Table setting; Plated food; ${injected}.`;
    value.assetAssessment.visualSummary = description;
    value.altText = description;
    value.claims.find((claim) => claim.id === "claim-visible").exactText = description;
    const result = validateMomoContentPackage(value, context);
    assert.equal(result.ok, false, injected);
    assert.ok(result.blockers.includes("visual_description_not_canonical"), injected);
  }
});

test("accepts exact tag-derived visual descriptions for three and ten safe tags", () => {
  const three = output();
  assert.equal(
    buildMomoCanonicalVisualDescription(three.internalMediaTags),
    "Food presentation: Food; Table setting; Plated food.",
  );
  const threeResult = validateMomoContentPackage(three, context);
  assert.equal(threeResult.ok, true, threeResult.ok ? "" : threeResult.blockers.join(","));

  const ten = output();
  ten.internalMediaTags = [
    { slug: "food", label: "Food", confidence: 0.99 },
    { slug: "plated-food", label: "Plated food", confidence: 0.98 },
    { slug: "serving", label: "Serving", confidence: 0.97 },
    { slug: "plate", label: "Plate", confidence: 0.96 },
    { slug: "bowl", label: "Bowl", confidence: 0.95 },
    { slug: "tray", label: "Tray", confidence: 0.94 },
    { slug: "table-setting", label: "Table setting", confidence: 0.93 },
    { slug: "close-up", label: "Close-up", confidence: 0.92 },
    { slug: "multiple-items", label: "Multiple items", confidence: 0.91 },
    { slug: "people-present", label: "People present", confidence: 0.9 },
  ];
  const description = buildMomoCanonicalVisualDescription(ten.internalMediaTags);
  ten.assetAssessment.visualSummary = description;
  ten.altText = description;
  ten.claims.find((claim) => claim.id === "claim-visible").exactText = description;
  const tenResult = validateMomoContentPackage(ten, context);
  assert.equal(tenResult.ok, true, tenResult.ok ? "" : tenResult.blockers.join(","));
  assert.ok(description.length <= 180);
});

test("rejects reordered labels, extra prose, and missing or extra visual claims", () => {
  for (const description of [
    "Food presentation: Plated food; Food; Table setting.",
    "Food presentation: Food; Table setting; Plated food. Falafel on a plate.",
  ]) {
    const value = output();
    value.assetAssessment.visualSummary = description;
    value.altText = description;
    value.claims.find((claim) => claim.id === "claim-visible").exactText = description;
    const result = validateMomoContentPackage(value, context);
    assert.equal(result.ok, false, description);
    assert.ok(result.blockers.includes("visual_description_not_canonical"), description);
  }

  const missing = output();
  missing.claims = missing.claims.filter((claim) => claim.id !== "claim-visible");
  const missingResult = validateMomoContentPackage(missing, context);
  assert.equal(missingResult.ok, false);
  assert.ok(missingResult.blockers.includes("canonical_visual_claim_required"));

  const extra = output();
  extra.claims.push({
    ...extra.claims.find((claim) => claim.id === "claim-visible"),
    id: "claim-visible-extra",
  });
  const extraResult = validateMomoContentPackage(extra, context);
  assert.equal(extraResult.ok, false);
  assert.ok(extraResult.blockers.includes("canonical_visual_claim_required"));
});

test("accurately records but rejects non-food subjects before Ready", () => {
  for (const subject of ["drink", "interior", "other"]) {
    const value = output();
    value.assetAssessment.subject = subject;
    const result = validateMomoContentPackage(value, context);
    assert.equal(result.ok, false, subject);
    assert.ok(result.blockers.includes("media_subject_not_food"), subject);
    assert.ok(!result.blockers.includes("schema_invalid"), "the provider may accurately classify non-food pixels");
  }
});

test("rejects low-confidence, mismatched, missing, or visually incoherent internal tags", () => {
  const lowConfidence = output();
  lowConfidence.internalMediaTags[0].confidence = 0.69;
  const lowResult = validateMomoContentPackage(lowConfidence, context);
  assert.equal(lowResult.ok, false);
  assert.ok(lowResult.blockers.includes("internal_tag_confidence_too_low"));

  const mismatchedPair = output();
  mismatchedPair.internalMediaTags[0].label = "Plate";
  const pairResult = validateMomoContentPackage(mismatchedPair, context);
  assert.equal(pairResult.ok, false);
  assert.ok(pairResult.blockers.includes("internal_tag_not_allowlisted"));

  const missingFood = output();
  missingFood.internalMediaTags[0] = { slug: "plate", label: "Plate", confidence: 0.9 };
  const missingResult = validateMomoContentPackage(missingFood, context);
  assert.equal(missingResult.ok, false);
  assert.ok(missingResult.blockers.includes("internal_tag_food_required"));

  const incoherent = output();
  incoherent.internalMediaTags[1] = { slug: "bowl", label: "Bowl", confidence: 0.9 };
  const incoherentResult = validateMomoContentPackage(incoherent, context);
  assert.equal(incoherentResult.ok, false);
  assert.ok(incoherentResult.blockers.includes("internal_tag_semantic_mismatch"));
});

test("blocks every free-form dish, cuisine, brand, ingredient, and owner-identity visual description", () => {
  for (const summary of [
    "A pizza is centered on a white plate against a blue table setting.",
    "A Nepalese cuisine serving is centered on a white plate at a table.",
    "A Coca-Cola branded food item is centered on a white plate at a table.",
    "A chicken ingredient appears in the plated food serving at the table.",
    "A Momo's House serving is centered on a white plate at a table.",
  ]) {
    const value = output();
    value.assetAssessment.visualSummary = summary;
    value.altText = summary;
    value.claims.find((claim) => claim.id === "claim-visible").exactText = summary;
    const result = validateMomoContentPackage(value, context);
    assert.equal(result.ok, false, summary);
    assert.ok(result.blockers.includes("visual_description_not_canonical"), summary);
  }
});

test("keeps visible-media claims out of owner-grounded public copy", () => {
  const value = output();
  const visible = value.claims.find((claim) => claim.id === "claim-visible");
  assert.ok(visible);
  visible.appearsIn = ["master", "alt_text", "instagram", "facebook", "google_business"];
  value.masterCaption = value.masterCaption.replace(
    "brings Nepalese cuisine",
    "serves this plated serving with Nepalese cuisine",
  );
  for (const variant of value.variants) {
    variant.caption = variant.caption.replace(
      "Nepalese cuisine",
      "this plated serving with Nepalese cuisine",
    );
    variant.claimIds.push(visible.id);
  }
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("visual_claim_not_alt_only"));
});

test("keeps owner-truth claims out of visual alt text", () => {
  const value = output();
  const ownerClaim = value.claims.find((claim) => claim.id === "claim-brand");
  assert.ok(ownerClaim);
  ownerClaim.appearsIn.push("alt_text");
  value.altText += " Momo's House.";
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("owner_truth_claim_in_alt_text"));
});

test("does not confuse generic presentation words in owner menu truth with food identity", () => {
  const broadMenuContext = {
    ...context,
    truthFields: context.truthFields.map((field) => field.fieldKey === "menu.primary"
      ? { ...field, value: "Snacks, dishes, meals, plates, and servings" }
      : field),
  };
  const result = validateMomoContentPackage(output(), broadMenuContext);
  assert.equal(result.ok, true, result.ok ? "" : result.blockers.join(","));
});

test("canonical tag descriptions cannot inherit accented owner identity", () => {
  const accentedContext = {
    ...context,
    truthFields: context.truthFields.map((field) =>
      field.fieldKey === "identity.display_name"
        ? { ...field, value: "Café Verde" }
        : field),
  };
  const value = output();
  const leaked = "Food presentation: Food; Table setting; Plated food; Cafe Verde.";
  value.assetAssessment.visualSummary = leaked;
  value.altText = leaked;
  value.claims.find((claim) => claim.id === "claim-visible").exactText = leaked;
  const result = validateMomoContentPackage(value, accentedContext);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("visual_description_not_canonical"));
});

test("rejects every posting-time recommendation before immutable staging", () => {
  for (const scheduleWindow of ["lunch", "afternoon", "dinner"]) {
    const value = output();
    value.variants[0].scheduleWindow = scheduleWindow;
    const result = validateMomoContentPackage(value, context);
    assert.equal(result.ok, false);
    assert.ok(result.blockers.includes("schema_invalid"));
  }
});

test("rejects spam hashtags and hashtags outside the deterministic allowlist", () => {
  const value = output();
  value.hashtags[0].tag = "#viral";
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("spam_hashtag"));
  assert.ok(result.blockers.includes("hashtag_not_truth_backed"));
});

test("requires the complete deterministic evidence set for combined local hashtags", () => {
  const value = output();
  const combined = context.allowedHashtags.find((item) => item.tag === "#MomosSanAntonio");
  assert.ok(combined);
  value.hashtags[0] = {
    id: value.hashtags[0].id,
    ...combined,
    truthFieldIds: [context.truthFields[3].id],
  };
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("hashtag_truth_mismatch"));
});

test("rejects hashtags in Google Business copy", () => {
  const value = output();
  value.variants[2].caption += " #SanAntonio";
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("google_hashtag_forbidden"));
});

test("rejects promotional alt text and blocking uncertainty", () => {
  const value = output();
  value.altText = "Photo of the best and most delicious plated serving at the restaurant today.";
  value.uncertainties.push({ field: "dish", reason: "The exact menu item cannot be confirmed from pixels.", severity: "blocking" });
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("alt_text_invalid"));
  assert.ok(result.blockers.includes("blocking_uncertainty"));
});

test("rejects unsupported visual claims about halal status", () => {
  const value = output();
  value.claims.push({ id: "claim-halal", exactText: "halal", source: "visible_media", category: "halal", truthFieldIds: [], appearsIn: ["instagram"] });
  value.variants[0].caption += " This is halal.";
  value.variants[0].claimIds.push("claim-halal");
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("claim_inferred_from_pixels"));
});

test("rejects unsupported visual marketing claims in public copy", () => {
  for (const exactText of [
    "popular choice",
    "freshly made",
    "authentic flavor",
    "customer favorite",
    "crowd favorite",
  ]) {
    const value = output();
    const id = `visual-${exactText.replaceAll(" ", "-")}`;
    value.claims.push({
      id,
      exactText,
      source: "visible_media",
      category: "visual",
      truthFieldIds: [],
      appearsIn: ["facebook"],
    });
    value.variants[1].caption += ` ${exactText}.`;
    value.variants[1].claimIds.push(id);
    const result = validateMomoContentPackage(value, context);
    assert.equal(result.ok, false, exactText);
    assert.ok(result.blockers.includes("visual_claim_not_objective"), exactText);
    assert.ok(result.blockers.includes("unsupported_marketing_claim"), exactText);
  }
});

test("rejects unledgered marketing assertions made only from editorial-safe words", () => {
  for (const exactText of [
    "Offers dining.",
    "Made today.",
    "Offers a warm dining setting.",
    "The restaurant offers something made today.",
  ]) {
    const value = output();
    value.variants[1].caption += ` ${exactText}`;
    const result = validateMomoContentPackage(value, context);
    assert.equal(result.ok, false, exactText);
    assert.ok(result.blockers.includes("facebook_unsupported_ungrounded_claim"), exactText);
  }
});

test("rejects an unledgered warm dining assertion in alt text", () => {
  const value = output();
  value.altText = "A plated serving centered on a warm dining setting with a softly lit background.";
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("alt_unsupported_ungrounded_claim"));
});

test("rejects subjective words hidden inside an otherwise visual claim", () => {
  const value = output();
  value.claims.push({
    id: "visual-spectacular-plate",
    exactText: "spectacular plate",
    source: "visible_media",
    category: "visual",
    truthFieldIds: [],
    appearsIn: ["facebook"],
  });
  value.variants[1].caption += " A spectacular plate.";
  value.variants[1].claimIds.push("visual-spectacular-plate");
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("visual_claim_not_objective"));
});

test("allows the fixture's canonical whole-string visual observation only in alt text", () => {
  const value = output();
  const visual = value.claims.find((claim) => claim.id === "claim-visible");
  assert.deepEqual(visual?.appearsIn, ["alt_text"]);
  assert.equal(visual?.exactText, "Food presentation: Food; Table setting; Plated food.");
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, true, result.ok ? "" : result.blockers.join(","));
});

test("rejects a business claim cited to the wrong owner-truth category", () => {
  const value = output();
  value.claims[2].exactText = "Open 24 hours";
  value.claims[2].category = "hours";
  value.claims[2].truthFieldIds = [context.truthFields[0].id];
  value.variants.forEach((variant) => { variant.caption += " Open 24 hours."; });
  value.masterCaption += " Open 24 hours.";
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("claim_truth_category_or_value_mismatch"));
});

test("rejects unledgered sensitive copy", () => {
  const value = output();
  value.variants[1].caption += " Open every day for delivery.";
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("facebook_sensitive_claim_unsupported"));
});

test("rejects inline spam hashtags even when the public tag array is clean", () => {
  const value = output();
  value.variants[1].caption += " #fyp";
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("facebook_inline_hashtag_forbidden"));
});

test("rejects SEO evidence from the wrong truth category", () => {
  const value = output();
  value.seoPhrases[2].truthFieldIds = [context.truthFields[0].id];
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("seo_truth_category_mismatch"));
});

test("rejects online-order calls to action without explicit service truth", () => {
  const value = output();
  value.variants[0].cta = { kind: "order_online", text: "Order online today." };
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("cta_truth_missing"));
});

test("rejects invalid media-analysis issue enums and mixed none states", () => {
  const invalid = output();
  invalid.assetAssessment.qualityIssues = ["fabricated_issue"];
  assert.equal(validateMomoContentPackage(invalid, context).ok, false);
  const mixed = output();
  mixed.assetAssessment.qualityIssues = ["none", "blur"];
  assert.equal(validateMomoContentPackage(mixed, context).ok, false);
});

test("blocks any material media issue or quality score below four", () => {
  const lowScore = output();
  lowScore.assetAssessment.qualityScore = 3;
  const lowResult = validateMomoContentPackage(lowScore, context);
  assert.equal(lowResult.ok, false);
  assert.ok(lowResult.blockers.includes("media_quality_too_low"));

  const issue = output();
  issue.assetAssessment.qualityIssues = ["blur"];
  const issueResult = validateMomoContentPackage(issue, context);
  assert.equal(issueResult.ok, false);
  assert.ok(issueResult.blockers.includes("media_quality_issue_detected"));
});

test("requires three truth-backed local SEO phrases on every platform", () => {
  const value = output();
  value.variants[0].seoPhraseIds = [];
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("schema_invalid"));
});

test("requires each selected SEO phrase to appear contiguously in platform copy", () => {
  const value = output();
  value.variants[0].caption = value.variants[0].caption.replace(
    "San Antonio restaurant",
    "San Antonio diners can discover this restaurant",
  );
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("instagram_seo_not_applied"));
});

test("does not join an SEO phrase across punctuation or sentence boundaries", () => {
  for (const brokenPhrase of [
    "San Antonio. Restaurant",
    "San Antonio! Restaurant",
    "San Antonio — restaurant",
  ]) {
    const value = output();
    value.variants[0].caption = value.variants[0].caption.replace("San Antonio restaurant", brokenPhrase);
    const result = validateMomoContentPackage(value, context);
    assert.equal(result.ok, false, brokenPhrase);
    assert.ok(result.blockers.includes("instagram_seo_not_applied"), brokenPhrase);
  }
});

test("rejects editorial claims about restaurant identity, location, cuisine, or menu", () => {
  for (const [category, exactText] of [["restaurant_name", "Another Restaurant"], ["location", "New York"], ["cuisine", "Italian cuisine"], ["menu", "pizza"]]) {
    const value = output();
    const id = `editorial-${category}`;
    value.claims.push({ id, exactText, source: "editorial", category, truthFieldIds: [], appearsIn: ["facebook"] });
    value.variants[1].caption += ` ${exactText}.`;
    value.variants[1].claimIds.push(id);
    const result = validateMomoContentPackage(value, context);
    assert.equal(result.ok, false, category);
    assert.ok(result.blockers.includes("editorial_business_claim"), category);
  }
});

test("rejects unledgered identity, cuisine, and locality language", () => {
  for (const extra of [" Italian cuisine in New York.", " Another Restaurant welcomes New York diners.", " Another Restaurant is here.", " Italian dishes await.", " Pizza is available.", " Dallas diners are welcome."]) {
    const value = output();
    value.variants[1].caption += extra;
    const result = validateMomoContentPackage(value, context);
    assert.equal(result.ok, false, extra);
    assert.ok(result.blockers.includes("facebook_business_claim_unledgered"), extra);
  }
});

test("rejects CTA text that invents a location, restaurant, or street address", () => {
  for (const text of ["Visit us in New York.", "Visit Another Restaurant today.", "Plan a visit at 123 Fake Street."]) {
    const value = output();
    value.variants[0].cta = { kind: "visit", text };
    const result = validateMomoContentPackage(value, context);
    assert.equal(result.ok, false, text);
    assert.ok(result.blockers.includes("cta_truth_missing"), text);
  }
});

test("rejects generic SEO placeholders even when they cite real truth IDs", () => {
  const value = output();
  value.seoPhrases[0].phrase = "restaurant";
  value.seoPhrases[1].phrase = "food";
  value.seoPhrases[2].phrase = "San Antonio";
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("seo_not_truth_backed"));
});

test("curated hashtag allowlist excludes generic fragments", () => {
  const allowed = context.allowedHashtags.map((item) => item.tag.toLowerCase());
  for (const generic of ["#house", "#cuisine", "#antonio", "#texas", "#snacks", "#food", "#restaurant"]) {
    assert.equal(allowed.includes(generic), false, generic);
  }
  assert.ok(allowed.includes("#momohouse"));
  assert.ok(allowed.includes("#sanantonio"));
  assert.ok(allowed.includes("#nepalesefood"));
});

test("requires every platform caption to apply its selected SEO concepts", () => {
  const value = output();
  const generic = {
    instagram: "Discover this warm, inviting, softly lit restaurant setting and plan your visit with us today. Come discover this local dining moment.",
    facebook: "Discover this warm, inviting, softly lit restaurant setting and plan your visit with us today. Discover something new.",
    google_business: "Discover this warm, inviting, softly lit restaurant setting and plan your visit with us today. Explore this local dining moment.",
  };
  for (const claim of value.claims) {
    claim.appearsIn = claim.appearsIn.filter((destination) => destination === "master" || destination === "alt_text");
  }
  for (const variant of value.variants) {
    variant.caption = generic[variant.platform];
    variant.claimIds = [];
    variant.cta = { kind: "none", text: "" };
  }
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  if (result.ok) return;
  for (const platform of ["instagram", "facebook", "google_business"]) {
    assert.ok(result.blockers.includes(`${platform}_seo_not_applied`), platform);
  }
});

test("requires brand, locality, and cuisine-or-dish SEO coverage per platform", () => {
  const value = output();
  value.seoPhrases.push({
    id: "seo-dish",
    phrase: "Momos",
    kind: "dish",
    truthFieldIds: [context.truthFields[3].id],
  });
  value.variants[0].seoPhraseIds = ["seo-brand", "seo-cuisine", "seo-dish"];
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("instagram_seo_kind_coverage"));
});

test("rejects unsupported words embedded in an otherwise truth-backed SEO phrase", () => {
  const value = output();
  value.seoPhrases[0].phrase = "Momo New York";
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("seo_not_truth_backed"));
});

test("uses deterministic SEO candidates instead of unordered token bags", () => {
  const candidates = context.allowedSeoPhrases.map((item) => item.phrase);
  for (const expected of [
    "Momo's House",
    "San Antonio restaurant",
    "Nepalese cuisine",
    "Nepalese food",
    "Momos",
    "Momo's House San Antonio",
    "Nepalese food in San Antonio",
    "Momos in San Antonio",
  ]) assert.ok(candidates.includes(expected), expected);

  for (const phrase of ["House Momo's", "San Antonio Antonio"]) {
    const value = output();
    value.seoPhrases[phrase.startsWith("House") ? 0 : 2].phrase = phrase;
    const result = validateMomoContentPackage(value, context);
    assert.equal(result.ok, false, phrase);
    assert.ok(result.blockers.includes("seo_not_allowlisted"), phrase);
  }
});

test("requires the exact canonical alt text to have one whole-string visible-media claim", () => {
  const value = output();
  value.claims = value.claims.filter((claim) => claim.id !== "claim-visible");
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("canonical_visual_claim_required"));
});

test("negative owner truth cannot authorize an online-order CTA", () => {
  for (const negativeValue of [
    "Order online is unavailable",
    "No order online",
    "Order online: false",
    "Online order disabled",
  ]) {
    const serviceTruth = {
      id: "55555555-5555-4555-8555-555555555555",
      fieldKey: "services.delivery",
      value: negativeValue,
      evidenceClass: "real_owner",
      ownerConfirmedAt: "2026-07-01T00:00:00Z",
    };
    const truthFields = [...context.truthFields, serviceTruth];
    const negativeContext = {
      ...context,
      truthFields,
      allowedSeoPhrases: buildMomoAllowedSeoPhrases(truthFields),
      allowedHashtags: buildMomoAllowedHashtags(truthFields),
    };
    const value = output();
    value.variants[0].cta = { kind: "order_online", text: "Order online." };
    const result = validateMomoContentPackage(value, negativeContext);
    assert.equal(result.ok, false, negativeValue);
    assert.ok(result.blockers.includes("cta_truth_value_mismatch"), negativeValue);
  }
});

test("affirmative owner truth can authorize a concise online-order CTA", () => {
  const serviceTruth = {
    id: "55555555-5555-4555-8555-555555555555",
    fieldKey: "services.delivery",
    value: "Order online available",
    evidenceClass: "real_owner",
    ownerConfirmedAt: "2026-07-01T00:00:00Z",
  };
  const truthFields = [...context.truthFields, serviceTruth];
  const positiveContext = {
    ...context,
    truthFields,
    allowedSeoPhrases: buildMomoAllowedSeoPhrases(truthFields),
    allowedHashtags: buildMomoAllowedHashtags(truthFields),
  };
  const value = output();
  value.variants[0].cta = { kind: "order_online", text: "Order online." };
  const result = validateMomoContentPackage(value, positiveContext);
  assert.equal(result.ok, true, result.ok ? "" : result.blockers.join(","));
});

test("keeps the append-only CTA out of the platform caption", () => {
  const value = output();
  value.variants[0].caption += " Plan a visit to Momo's House.";
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("cta_duplicated_in_caption"));
});

test("claim spans are case-exact, occur once where declared, and never elsewhere", () => {
  const wrongCase = output();
  wrongCase.claims[0].exactText = "momo's house";
  const wrongCaseResult = validateMomoContentPackage(wrongCase, context);
  assert.equal(wrongCaseResult.ok, false);
  assert.ok(wrongCaseResult.blockers.includes("claim_appearance_mismatch"));

  const repeated = output();
  repeated.variants[0].caption += " Momo's House welcomes local diners.";
  const repeatedResult = validateMomoContentPackage(repeated, context);
  assert.equal(repeatedResult.ok, false);
  assert.ok(repeatedResult.blockers.includes("claim_appearance_mismatch"));

  const undeclared = output();
  undeclared.claims[0].appearsIn = undeclared.claims[0].appearsIn.filter((destination) => destination !== "facebook");
  undeclared.variants[1].claimIds = undeclared.variants[1].claimIds.filter((id) => id !== "claim-brand");
  const undeclaredResult = validateMomoContentPackage(undeclared, context);
  assert.equal(undeclaredResult.ok, false);
  assert.ok(undeclaredResult.blockers.includes("claim_appearance_mismatch"));
});

test("rejects repeated grounded copy even when every repeated fact is true", () => {
  const value = output();
  value.variants[0].caption = [
    "Momo's House brings Nepalese cuisine to San Antonio.",
    "Momo's House brings Nepalese cuisine to San Antonio.",
    "Momo's House brings Nepalese cuisine to San Antonio.",
  ].join(" ");
  const result = validateMomoContentPackage(value, context);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("instagram_copy_stuffed"));
  assert.ok(result.blockers.includes("claim_appearance_mismatch"));
});
