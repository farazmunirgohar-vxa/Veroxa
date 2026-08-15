import assert from "node:assert/strict";
import test from "node:test";
import jpegJs from "jpeg-js";
import { encode as encodePng } from "fast-png";
import {
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MODEL,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_PROMPT_VERSION,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_SCHEMA_VERSION,
  buildVeroxaPrivateMediaAssessmentProviderBody,
  canProceedFromAssessmentToRestaurantContent,
  canRunVeroxaPrivateMediaAssessment,
  duplicateAssessmentReuseKeepsAuthoritySeparate,
  parseVeroxaPrivateMediaAssessment,
  parseVeroxaPrivateMediaProviderResponse,
} from "../app/veroxa-private-media-assessment.ts";
import {
  decodeVeroxaPrivateMediaImage,
  fullyDecodeVeroxaPrivateMediaImage,
  veroxaPrivateMediaImageVerificationMode,
} from "../app/veroxa-private-media-image-decode.ts";
import {
  decodeVeroxaPrivateMediaImageWithHost,
  inspectVeroxaPrivateMediaImageWithHost,
} from "../app/veroxa-private-media-host-image-decode.ts";

const ASSESSMENT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function validAssessment() {
  return {
    schemaVersion: VEROXA_PRIVATE_MEDIA_ASSESSMENT_SCHEMA_VERSION,
    subject: "food",
    visualSummary: "Visible: several browned food pieces arranged on a white plate.",
    qualityScore: 4,
    qualityIssues: ["none"],
    tags: [
      {
        slug: "food-visible",
        label: "Food visible",
        evidenceClass: "objective",
        category: "scene",
        confidence: 0.99,
        uncertainty: null,
      },
      {
        slug: "possible-dumpling-like-items",
        label: "Possible dumpling-like items",
        evidenceClass: "visual_hypothesis",
        category: "dish_hypothesis",
        confidence: 0.72,
        uncertainty: "Pixels alone cannot confirm the exact dish or its ingredients.",
      },
    ],
    uncertainties: [
      "The image cannot confirm dish identity, ingredients, menu status, or business association.",
    ],
  };
}

test("private assessment provider body is synchronous, non-retained, and receives no restaurant facts", () => {
  const body = buildVeroxaPrivateMediaAssessmentProviderBody({
    assessmentId: ASSESSMENT_ID,
    requestHash: "1".repeat(64),
    sourceContentSha256: "2".repeat(64),
    sourceMimeType: "image/jpeg",
    sourceBytes: Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]),
    safetyIdentifier: "veroxa-media-safe-test",
  });
  assert.equal(body.model, VEROXA_PRIVATE_MEDIA_ASSESSMENT_MODEL);
  assert.equal(body.store, false);
  assert.equal(body.service_tier, "default");
  assert.deepEqual(body.prompt_cache_options, { mode: "explicit" });
  assert.equal(body.background, false);
  assert.equal(body.metadata.veroxa_prompt_version, VEROXA_PRIVATE_MEDIA_ASSESSMENT_PROMPT_VERSION);
  const serialized = JSON.stringify(body);
  assert.doesNotMatch(serialized, /Momo(?:'s|’s)? House|San Antonio|truthSnapshot|restaurantId|menu\.primary/iu);
  assert.match(serialized, /visual_hypothesis/u);
  assert.match(serialized, /pixels alone cannot confirm/iu);
  assert.match(serialized, /food-visible \/ Food visible with category scene/u);
  assert.doesNotMatch(serialized, /prompt_cache_breakpoint/u);
  assert.equal(body.input[0].content.filter((item) => item.type === "input_image").length, 1);
});

test("assessment parser accepts neutral objective tags and confidence-aware hypotheses", () => {
  const output = validAssessment();
  const parsed = parseVeroxaPrivateMediaAssessment(output);
  assert.equal(
    parsed?.visualSummary,
    "Visible subject: food. Objective visual tags: Food visible.",
  );
  assert.deepEqual(parsed?.uncertainties, [
    "Pixels alone cannot confirm exact dish, ingredient, menu, business, ownership, or restaurant identity.",
  ]);
  assert.equal(
    parsed?.tags[1].uncertainty,
    "Pixels alone cannot confirm this possible visual identity.",
  );
  assert.deepEqual(parsed?.tags[1], {
    slug: "possible-dumpling-like-items",
    label: "Possible dumpling-like items",
    evidenceClass: "visual_hypothesis",
    category: "dish_hypothesis",
    confidence: 0.72,
    uncertainty: "Pixels alone cannot confirm this possible visual identity.",
  });
  const sanitizedClaim = parseVeroxaPrivateMediaAssessment({
    ...output,
    visualSummary: "Momo's House dumplings are a current restaurant menu offering.",
    uncertainties: [
      "This image definitely belongs to the Momo restaurant menu and current business.",
    ],
  });
  assert.ok(sanitizedClaim);
  assert.doesNotMatch(JSON.stringify(sanitizedClaim), /Momo(?:'s|’s)? House|San Antonio/iu);
  assert.equal(sanitizedClaim.visualSummary, parsed?.visualSummary);
  assert.equal(parseVeroxaPrivateMediaAssessment({
    ...output,
    tags: [{
      slug: "dumplings",
      label: "Dumplings",
      evidenceClass: "objective",
      category: "object",
      confidence: 1,
      uncertainty: null,
    }],
  }), null, "dish identity cannot be promoted to an objective tag");
  assert.equal(parseVeroxaPrivateMediaAssessment({
    ...output,
    tags: [{
      ...output.tags[1],
      confidence: 0.96,
      uncertainty: null,
    }],
  }), null, "a visual hypothesis must stay bounded and uncertain");
  for (const [slug, hypothesis] of [
    ["possible-restaurant-offering", "Possible restaurant offering"],
    ["possible-halal", "Possible halal"],
    ["possible-authentic-cuisine", "Possible authentic cuisine"],
    ["possible-fresh-food", "Possible fresh food"],
    ["possible-tasty-meal", "Possible tasty meal"],
    ["possible-momos-house-signature-dish", "Possible momos house signature dish"],
    ["possible-san-antonio-favorite", "Possible san-antonio favorite"],
  ]) {
    const rejected = parseVeroxaPrivateMediaAssessment({
      ...output,
      tags: [{
        ...output.tags[1],
        slug,
        label: hypothesis,
        category: "other_hypothesis",
      }],
    });
    assert.equal(rejected, null, `${hypothesis} is not a private food-identity tag`);
  }
  for (const [slug, label, category] of [
    ["possible-falafel", "Possible falafel", "dish_hypothesis"],
    ["possible-quinoa-patty", "Possible quinoa patty", "dish_hypothesis"],
    ["possible-chickpeas", "Possible chickpeas", "ingredient_hypothesis"],
  ]) {
    const recognized = parseVeroxaPrivateMediaAssessment({
      ...output,
      tags: [{ ...output.tags[1], slug, label, category }],
    });
    assert.equal(recognized?.tags[0].slug, slug);
    assert.equal(recognized?.tags[0].label, label);
    assert.match(recognized?.tags[0].uncertainty || "", /cannot confirm/iu);
  }
  assert.equal(parseVeroxaPrivateMediaAssessment({
    ...output,
    tags: [{
      ...output.tags[1],
      slug: "possible-pizza",
      label: "Possible burger",
    }],
  }), null, "hypothesis slug and label must describe the same visible candidate");
  assert.equal(parseVeroxaPrivateMediaAssessment({
    ...output,
    tags: [{ ...output.tags[1], confidence: 0.34 }],
  }), null, "low-confidence identity guesses are not retained as tags");
  assert.equal(parseVeroxaPrivateMediaAssessment({
    ...output,
    tags: [{
      ...output.tags[1],
      slug: "possible-san-antonio-tacos",
      label: "Possible san-antonio tacos",
    }],
  }), null, "location phrases cannot enter private food-identity tags");
  assert.equal(parseVeroxaPrivateMediaAssessment({
    ...output,
    tags: Array.from({ length: 6 }, (_, index) => ({
      ...output.tags[1],
      slug: `possible-food-item-${index}`,
      label: `Possible food item ${index}`,
    })),
  }), null, "private identity hypotheses stay bounded to five");
});

test("trusted bounded decoders accept real portrait JPEG and PNG bytes", () => {
  const width = 128;
  const height = 160;
  const data = new Uint8Array(width * height * 4);
  let state = 0x12345678;
  for (let offset = 0; offset < data.length; offset += 4) {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    data[offset] = state;
    data[offset + 1] = state >>> 8;
    data[offset + 2] = state >>> 16;
    data[offset + 3] = 255;
  }
  const jpeg = new Uint8Array(
    jpegJs.encode({ data, width, height }, 85).data,
  );
  const png = encodePng({ data, width, height });
  assert.equal(fullyDecodeVeroxaPrivateMediaImage({
    bytes: jpeg,
    mimeType: "image/jpeg",
    expectedWidth: width,
    expectedHeight: height,
  }), true);
  assert.equal(fullyDecodeVeroxaPrivateMediaImage({
    bytes: png,
    mimeType: "image/png",
    expectedWidth: width,
    expectedHeight: height,
  }), true);
});

test("high-resolution originals require a bounded host decode instead of upload rejection", async () => {
  assert.equal(
    veroxaPrivateMediaImageVerificationMode(8064, 6048),
    "host_bounded_decode",
  );
  assert.equal(
    veroxaPrivateMediaImageVerificationMode(1200, 900),
    "in_process_full_decode",
  );
  const bytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]);
  assert.equal(await decodeVeroxaPrivateMediaImage({
    bytes,
    mimeType: "image/jpeg",
    expectedWidth: 8064,
    expectedHeight: 6048,
  }), false, "high-resolution input fails closed without a host decoder");
  assert.equal(await decodeVeroxaPrivateMediaImage({
    bytes,
    mimeType: "image/jpeg",
    expectedWidth: 8064,
    expectedHeight: 6048,
    hostDecoder: async () => true,
  }), true);
});

test("the host decoder binds native dimensions and consumes only a bounded one-pixel result", async () => {
  const source = Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]);
  const output = Uint8Array.from([
    0xff, 0xd8,
    ...new Uint8Array(20),
    0xff, 0xd9,
  ]);
  const transforms = [];
  globalThis.__VEROXA_IMAGES__ = {
    async info() {
      return {
        width: 8064,
        height: 6048,
        format: "image/jpeg",
        fileSize: source.byteLength,
      };
    },
    input() {
      return {
        transform(options) {
          transforms.push(options);
          return this;
        },
        async output() {
          return {
            response() {
              return new Response(output, {
                status: 200,
                headers: { "content-type": "image/jpeg" },
              });
            },
          };
        },
      };
    },
  };
  try {
    const inspected = await inspectVeroxaPrivateMediaImageWithHost({
      bytes: source,
      mimeType: "image/jpeg",
    });
    assert.deepEqual(inspected.inspection, {
      width: 8064,
      height: 6048,
      fileSize: source.byteLength,
    });
    assert.deepEqual(inspected.diagnostics, {
      schemaVersion: 1,
      status: "passed",
      stage: "complete",
      failureCode: null,
      bindingAvailable: true,
      info: {
        width: 8064,
        height: 6048,
        fileSize: source.byteLength,
        format: "image/jpeg",
      },
      output: {
        httpStatus: 200,
        contentType: "image/jpeg",
        declaredContentLength: null,
        byteLength: output.byteLength,
      },
    });
    assert.equal(await decodeVeroxaPrivateMediaImageWithHost({
      bytes: source,
      mimeType: "image/jpeg",
      expectedWidth: 8064,
      expectedHeight: 6048,
    }), true);
    assert.deepEqual(transforms, [
      { width: 1, height: 1, fit: "fill" },
      { width: 1, height: 1, fit: "fill" },
    ]);
    assert.equal(await decodeVeroxaPrivateMediaImageWithHost({
      bytes: source,
      mimeType: "image/jpeg",
      expectedWidth: 6048,
      expectedHeight: 8064,
    }), false, "host dimensions must match the immutable reservation");
  } finally {
    delete globalThis.__VEROXA_IMAGES__;
  }
});

test("host inspection reports bounded stage diagnostics without raw errors", async () => {
  const source = Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]);
  const jpegOutput = Uint8Array.from([
    0xff, 0xd8,
    ...new Uint8Array(20),
    0xff, 0xd9,
  ]);
  const validInfo = {
    width: 1200,
    height: 900,
    format: "image/jpeg",
    fileSize: source.byteLength,
  };
  const binding = (options = {}) => ({
    async info() {
      if (options.infoError) throw new Error("provider-secret-detail");
      return options.info ?? validInfo;
    },
    input() {
      if (options.inputError) throw new Error("provider-secret-detail");
      return {
        transform() {
          if (options.transformError) {
            throw new Error("provider-secret-detail");
          }
          return this;
        },
        async output() {
          if (options.outputError) throw new Error("provider-secret-detail");
          return {
            response() {
              if (options.responseError) {
                throw new Error("provider-secret-detail");
              }
              return new Response(options.body ?? jpegOutput, {
                status: options.status ?? 200,
                headers: {
                  "content-type": options.contentType ?? "image/jpeg",
                },
              });
            },
          };
        },
      };
    },
  });
  const scenarios = [
    {
      binding: undefined,
      stage: "binding",
      failureCode: "images_binding_unavailable",
      bindingAvailable: false,
    },
    {
      binding: binding({ infoError: true }),
      stage: "info",
      failureCode: "images_info_failed",
      bindingAvailable: true,
    },
    {
      binding: binding({ info: { ...validInfo, fileSize: 3 } }),
      stage: "info",
      failureCode: "images_info_file_size_mismatch",
      bindingAvailable: true,
    },
    {
      binding: binding({ transformError: true }),
      stage: "transform",
      failureCode: "images_transform_failed",
      bindingAvailable: true,
    },
    {
      binding: binding({ outputError: true }),
      stage: "output",
      failureCode: "images_output_failed",
      bindingAvailable: true,
    },
    {
      binding: binding({ status: 502 }),
      stage: "response",
      failureCode: "images_response_status_invalid",
      bindingAvailable: true,
    },
    {
      binding: binding({ contentType: "text/plain" }),
      stage: "response",
      failureCode: "images_response_content_type_invalid",
      bindingAvailable: true,
    },
    {
      binding: binding({ body: new Uint8Array(24) }),
      stage: "response",
      failureCode: "images_response_magic_invalid",
      bindingAvailable: true,
    },
  ];
  try {
    for (const scenario of scenarios) {
      if (scenario.binding) {
        globalThis.__VEROXA_IMAGES__ = scenario.binding;
      } else {
        delete globalThis.__VEROXA_IMAGES__;
      }
      const result = await inspectVeroxaPrivateMediaImageWithHost({
        bytes: source,
        mimeType: "image/jpeg",
      });
      assert.equal(result.inspection, null);
      assert.equal(result.diagnostics.status, "failed");
      assert.equal(result.diagnostics.stage, scenario.stage);
      assert.equal(result.diagnostics.failureCode, scenario.failureCode);
      assert.equal(
        result.diagnostics.bindingAvailable,
        scenario.bindingAvailable,
      );
      assert.doesNotMatch(
        JSON.stringify(result.diagnostics),
        /provider-secret-detail/u,
      );
    }
  } finally {
    delete globalThis.__VEROXA_IMAGES__;
  }
});

test("development proxy can assess privately but only current real-owner authority can proceed", () => {
  assert.equal(canRunVeroxaPrivateMediaAssessment({
    evidenceClass: "development_proxy",
    currentRightsReserved: true,
    perRequestIntent: true,
  }), true);
  const eligible = {
    assessmentStatus: "completed",
    assessment: validAssessment(),
    sourceMimeType: "image/jpeg",
    platformReady: true,
    rightsCurrent: true,
    rightsEvidenceClass: "real_owner",
    association: "represents_current_restaurant_offering",
    associationEvidenceClass: "real_owner",
  };
  assert.equal(canProceedFromAssessmentToRestaurantContent(eligible), true);
  for (const override of [
    { sourceMimeType: "image/png" },
    { assessment: { ...validAssessment(), subject: "drink" } },
    { assessment: { ...validAssessment(), subject: "food_and_drink" } },
    { assessment: { ...validAssessment(), subject: "dining_scene" } },
    { assessment: { ...validAssessment(), subject: "non_food" } },
    { assessment: { ...validAssessment(), subject: "unclear" } },
    { assessment: { ...validAssessment(), tags: [] } },
    { assessment: { ...validAssessment(), tags: [{ ...validAssessment().tags[0], confidence: 0.69 }] } },
    { assessment: { ...validAssessment(), tags: [{ ...validAssessment().tags[0], label: "Food maybe" }] } },
    { assessment: { ...validAssessment(), tags: [{ ...validAssessment().tags[0], category: "object" }] } },
    { rightsEvidenceClass: "development_proxy" },
    { association: "licensed_generic_only" },
    { associationEvidenceClass: "development_proxy" },
    { platformReady: false },
  ]) {
    assert.equal(canProceedFromAssessmentToRestaurantContent({ ...eligible, ...override }), false);
  }
});

test("duplicate assessment reuse never authorizes copied rights or association", () => {
  assert.equal(duplicateAssessmentReuseKeepsAuthoritySeparate({
    reusedFromAssessmentId: ASSESSMENT_ID,
    currentAssetRightsId: "rights-current",
    currentAssetAssociationId: null,
    reusedAssetRightsId: "rights-canonical",
    reusedAssetAssociationId: "association-canonical",
  }), true);
  assert.equal(duplicateAssessmentReuseKeepsAuthoritySeparate({
    reusedFromAssessmentId: ASSESSMENT_ID,
    currentAssetRightsId: "rights-canonical",
    currentAssetAssociationId: "association-canonical",
    reusedAssetRightsId: "rights-canonical",
    reusedAssetAssociationId: "association-canonical",
  }), false);
});

test("provider response parsing requires the completed configured model", async () => {
  const providerPayload = {
    id: "resp_private_assessment_0001",
    status: "completed",
    model: VEROXA_PRIVATE_MEDIA_ASSESSMENT_MODEL,
    metadata: {
      veroxa_assessment_id: ASSESSMENT_ID,
      veroxa_prompt_version: VEROXA_PRIVATE_MEDIA_ASSESSMENT_PROMPT_VERSION,
      veroxa_request_hash: "1".repeat(64),
      veroxa_source_sha256: "2".repeat(64),
    },
    output: [{
      type: "message",
      content: [{ type: "output_text", text: JSON.stringify(validAssessment()) }],
    }],
    usage: { input_tokens: 500, output_tokens: 200, total_tokens: 700 },
  };
  const response = (override = {}) => new Response(JSON.stringify({
    ...providerPayload,
    ...override,
  }), { status: 200, headers: { "content-type": "application/json" } });
  const binding = {
    assessmentId: ASSESSMENT_ID,
    requestHash: "1".repeat(64),
    sourceContentSha256: "2".repeat(64),
  };
  assert.ok(await parseVeroxaPrivateMediaProviderResponse(response(), binding));
  assert.equal(await parseVeroxaPrivateMediaProviderResponse(response({
    status: "incomplete",
  }), binding), null);
  assert.equal(await parseVeroxaPrivateMediaProviderResponse(response({
    model: "unapproved-model",
  }), binding), null);
  assert.equal(await parseVeroxaPrivateMediaProviderResponse(response({
    metadata: {
      ...providerPayload.metadata,
      veroxa_source_sha256: "3".repeat(64),
    },
  }), binding), null);
  const overrun = await parseVeroxaPrivateMediaProviderResponse(response({
    usage: { input_tokens: 200_000, output_tokens: 3_000, total_tokens: 203_000 },
  }), binding);
  assert.equal(overrun?.exceedsReservation, true);
  assert.equal(overrun?.accountedMicrousd, 1_090_000);
  assert.equal(overrun?.providerResponseId, "resp_private_assessment_0001");
  const conservative = await parseVeroxaPrivateMediaProviderResponse(response({
    usage: null,
  }), binding);
  assert.equal(conservative?.accountingBasis, "conservative_reservation");
  assert.equal(conservative?.accountedMicrousd, 1_000_000);
});
