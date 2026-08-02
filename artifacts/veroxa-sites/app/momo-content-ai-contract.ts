export const MOMO_CONTENT_AI_MODEL = "gpt-5.6-sol" as const;
export const MOMO_CONTENT_AI_PROMPT_VERSION =
  "momo-content-package-2026-08-01-v4" as const;
export const MOMO_CONTENT_AI_SCHEMA_VERSION =
  "momo-content-package-v1" as const;
export const MOMO_CONTENT_AI_VALIDATOR_VERSION =
  "momo-content-validator-2026-08-01-v4" as const;
export const MOMO_CONTENT_AI_PRICING_VERSION =
  "openai-gpt-5.6-sol-2026-08-01-v2" as const;
export const MOMO_CONTENT_AI_MAX_BODY_BYTES = 4_096;
export const MOMO_CONTENT_AI_MAX_SOURCE_BYTES = 5 * 1024 * 1024;
export const MOMO_CONTENT_AI_MAX_SOURCE_WIDTH = 12_000;
export const MOMO_CONTENT_AI_MAX_SOURCE_HEIGHT = 12_000;
export const MOMO_CONTENT_AI_VISION_PATCH_EDGE = 32;
export const MOMO_CONTENT_AI_MAX_VISION_PATCHES = 140_625;
export const MOMO_CONTENT_AI_MAX_TRUTH_BYTES = 32 * 1024;
export const MOMO_CONTENT_AI_MAX_NON_IMAGE_INPUT_BYTES = 128 * 1024;
export const MOMO_CONTENT_AI_MAX_PROVIDER_BYTES = 256 * 1024;
export const MOMO_CONTENT_AI_RESERVATION_MICROUSD = 6_000_000;
export const MOMO_CONTENT_AI_LONG_CONTEXT_INPUT_TOKENS = 272_000;
export const MOMO_CONTENT_AI_STANDARD_INPUT_MICROUSD_PER_TOKEN = 5;
export const MOMO_CONTENT_AI_STANDARD_OUTPUT_MICROUSD_PER_TOKEN = 30;
export const MOMO_CONTENT_AI_LONG_INPUT_MICROUSD_PER_TOKEN = 10;
export const MOMO_CONTENT_AI_LONG_OUTPUT_MICROUSD_PER_TOKEN = 45;
// Reserved headroom for request framing and provider-side message protocol.
// The actual static wrapper is much smaller; this margin ensures the formal
// ceiling safely accounts for provider framing beyond the bounded request.
export const MOMO_CONTENT_AI_PROTOCOL_OVERHEAD_TOKENS = 64 * 1024;
// This limit includes hidden reasoning and visible structured output. OpenAI's
// reasoning guidance recommends reserving at least 25,000 tokens when first
// evaluating a reasoning model so useful JSON is not crowded out by reasoning.
export const MOMO_CONTENT_AI_MAX_OUTPUT_TOKENS = 25_000;
// UTF-8 tokenization cannot produce more tokens than input bytes. GPT-5.6
// original-detail images use one token per 32 px patch. The explicit protocol
// margin covers framing outside the bounded text and image components.
export const MOMO_CONTENT_AI_MAX_INPUT_TOKENS =
  MOMO_CONTENT_AI_MAX_NON_IMAGE_INPUT_BYTES + MOMO_CONTENT_AI_MAX_VISION_PATCHES +
  MOMO_CONTENT_AI_PROTOCOL_OVERHEAD_TOKENS;
export const MOMO_CONTENT_AI_MAX_REQUEST_MICROUSD =
  MOMO_CONTENT_AI_MAX_INPUT_TOKENS * (MOMO_CONTENT_AI_MAX_INPUT_TOKENS > MOMO_CONTENT_AI_LONG_CONTEXT_INPUT_TOKENS
    ? MOMO_CONTENT_AI_LONG_INPUT_MICROUSD_PER_TOKEN
    : MOMO_CONTENT_AI_STANDARD_INPUT_MICROUSD_PER_TOKEN) +
  MOMO_CONTENT_AI_MAX_OUTPUT_TOKENS * (MOMO_CONTENT_AI_MAX_INPUT_TOKENS > MOMO_CONTENT_AI_LONG_CONTEXT_INPUT_TOKENS
    ? MOMO_CONTENT_AI_LONG_OUTPUT_MICROUSD_PER_TOKEN
    : MOMO_CONTENT_AI_STANDARD_OUTPUT_MICROUSD_PER_TOKEN);
export const MOMO_CONTENT_AI_MAX_CACHE_WRITE_REQUEST_MICROUSD = Math.ceil(
  MOMO_CONTENT_AI_MAX_INPUT_TOKENS * (MOMO_CONTENT_AI_MAX_INPUT_TOKENS > MOMO_CONTENT_AI_LONG_CONTEXT_INPUT_TOKENS
    ? MOMO_CONTENT_AI_LONG_INPUT_MICROUSD_PER_TOKEN
    : MOMO_CONTENT_AI_STANDARD_INPUT_MICROUSD_PER_TOKEN) * 1.25 +
  MOMO_CONTENT_AI_MAX_OUTPUT_TOKENS * (MOMO_CONTENT_AI_MAX_INPUT_TOKENS > MOMO_CONTENT_AI_LONG_CONTEXT_INPUT_TOKENS
    ? MOMO_CONTENT_AI_LONG_OUTPUT_MICROUSD_PER_TOKEN
    : MOMO_CONTENT_AI_STANDARD_OUTPUT_MICROUSD_PER_TOKEN),
);
export const MOMO_READY_TEAM_INSPECTION_ATTESTATION =
  "Team Faraz reviewed the final media, factual claims, platform copy, SEO phrases, hashtags, alt text, calls to action, and future America/Chicago plan. This package is ready for manual posting only; no external publishing is authorized." as const;

export const MOMO_CONTENT_PLATFORMS = [
  "facebook",
  "instagram",
  "google_business",
] as const;

export type MomoContentPlatform = typeof MOMO_CONTENT_PLATFORMS[number];

export type MomoContentTruthSnapshotField = {
  id: string;
  fieldKey: string;
  value: unknown;
  evidenceClass: "real_owner";
  ownerConfirmedAt: string;
};

export type MomoContentAiPackageOutput = {
  schemaVersion: typeof MOMO_CONTENT_AI_SCHEMA_VERSION;
  assetAssessment: {
    subject: "food" | "drink" | "interior" | "exterior" | "team" | "menu" | "other";
    visualSummary: string;
    qualityScore: number;
    qualityIssues: Array<
      "blur" | "dark" | "overexposed" | "glare" | "cropped_subject" |
      "busy_background" | "readable_text" | "possible_logo_or_watermark" | "none"
    >;
  };
  direction: {
    pillar: "Momo Cravings" | "First-Time Education" | "Behind the Scenes" |
      "Customer Reactions" | "Snack Discovery" | "Local Discovery";
    objective: "craving" | "education" | "local_discovery" | "brand_trust" | "visit_intent";
    angle: string;
    audienceIntent: string;
  };
  masterCaption: string;
  altText: string;
  seoPhrases: Array<{
    id: string;
    phrase: string;
    kind: "brand" | "cuisine" | "locality" | "dish";
    truthFieldIds: string[];
  }>;
  hashtags: Array<{
    id: string;
    tag: string;
    kind: "brand" | "cuisine" | "locality" | "dish";
    truthFieldIds: string[];
  }>;
  claims: Array<{
    id: string;
    exactText: string;
    source: "owner_truth" | "visible_media" | "editorial";
    category: "restaurant_name" | "location" | "cuisine" | "menu" | "hours" |
      "service" | "dietary" | "halal" | "offer" | "price" | "phone" |
      "ranking" | "visual" | "sensory" | "other";
    truthFieldIds: string[];
    appearsIn: Array<"master" | "alt_text" | MomoContentPlatform>;
  }>;
  variants: Array<{
    platform: MomoContentPlatform;
    caption: string;
    claimIds: string[];
    seoPhraseIds: string[];
    hashtagIds: string[];
    cta: {
      kind: "none" | "visit" | "explore_menu" | "order_online" | "call";
      text: string;
    };
    scheduleWindow: "lunch" | "afternoon" | "dinner" | "unspecified";
  }>;
  internalMediaTags: Array<{
    slug: string;
    label: string;
    confidence: number;
  }>;
  uncertainties: Array<{
    field: string;
    reason: string;
    severity: "warning" | "blocking";
  }>;
};

const stringSchema = (minLength: number, maxLength: number) => ({
  type: "string",
  minLength,
  maxLength,
});

const idArraySchema = (maxItems: number) => ({
  type: "array",
  minItems: 0,
  maxItems,
  items: stringSchema(1, 80),
});

export const MOMO_CONTENT_PACKAGE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion", "assetAssessment", "direction", "masterCaption",
    "altText", "seoPhrases", "hashtags", "claims", "variants",
    "internalMediaTags", "uncertainties",
  ],
  properties: {
    schemaVersion: { type: "string", const: MOMO_CONTENT_AI_SCHEMA_VERSION },
    assetAssessment: {
      type: "object",
      additionalProperties: false,
      required: ["subject", "visualSummary", "qualityScore", "qualityIssues"],
      properties: {
        subject: { enum: ["food", "drink", "interior", "exterior", "team", "menu", "other"] },
        visualSummary: stringSchema(20, 400),
        qualityScore: { type: "integer", minimum: 1, maximum: 5 },
        qualityIssues: {
          type: "array", minItems: 1, maxItems: 6,
          items: { enum: ["blur", "dark", "overexposed", "glare", "cropped_subject", "busy_background", "readable_text", "possible_logo_or_watermark", "none"] },
        },
      },
    },
    direction: {
      type: "object",
      additionalProperties: false,
      required: ["pillar", "objective", "angle", "audienceIntent"],
      properties: {
        pillar: { enum: ["Momo Cravings", "First-Time Education", "Behind the Scenes", "Customer Reactions", "Snack Discovery", "Local Discovery"] },
        objective: { enum: ["craving", "education", "local_discovery", "brand_trust", "visit_intent"] },
        angle: stringSchema(20, 400),
        audienceIntent: stringSchema(10, 240),
      },
    },
    masterCaption: stringSchema(40, 1_200),
    altText: stringSchema(30, 180),
    seoPhrases: {
      type: "array", minItems: 3, maxItems: 8,
      items: {
        type: "object", additionalProperties: false,
        required: ["id", "phrase", "kind", "truthFieldIds"],
        properties: {
          id: stringSchema(1, 80),
          phrase: {
            ...stringSchema(3, 80),
            description: "An exact phrase selected from the supplied allowedSeoPhrases list; do not rewrite, reorder, or extend it.",
          },
          kind: { enum: ["brand", "cuisine", "locality", "dish"] },
          truthFieldIds: { ...idArraySchema(3), minItems: 1 },
        },
      },
    },
    hashtags: {
      type: "array", minItems: 3, maxItems: 10,
      items: {
        type: "object", additionalProperties: false,
        required: ["id", "tag", "kind", "truthFieldIds"],
        properties: {
          id: stringSchema(1, 80),
          tag: { type: "string", pattern: "^#[A-Za-z][A-Za-z0-9_]{1,39}$" },
          kind: { enum: ["brand", "cuisine", "locality", "dish"] },
          truthFieldIds: { ...idArraySchema(3), minItems: 1 },
        },
      },
    },
    claims: {
      type: "array", minItems: 1, maxItems: 30,
      description: "Exhaustive factual and visual claim ledger. Every non-neutral business or visual span used in masterCaption, altText, or a platform caption must appear here verbatim with its exact evidence and destinations.",
      items: {
        type: "object", additionalProperties: false,
        required: ["id", "exactText", "source", "category", "truthFieldIds", "appearsIn"],
        properties: {
          id: stringSchema(1, 80),
          exactText: {
            ...stringSchema(1, 300),
            description: "An exact contiguous, verbatim span copied from every destination named in appearsIn; never a paraphrase or inferred fact.",
          },
          source: { enum: ["owner_truth", "visible_media", "editorial"] },
          category: { enum: ["restaurant_name", "location", "cuisine", "menu", "hours", "service", "dietary", "halal", "offer", "price", "phone", "ranking", "visual", "sensory", "other"] },
          truthFieldIds: idArraySchema(3),
          appearsIn: {
            type: "array", minItems: 1, maxItems: 5,
            description: "The complete exact set of destinations containing exactText. Platform claimIds must mirror this set.",
            items: { enum: ["master", "alt_text", ...MOMO_CONTENT_PLATFORMS] },
          },
        },
      },
    },
    variants: {
      type: "array", minItems: 1, maxItems: 3,
      items: {
        type: "object", additionalProperties: false,
        required: ["platform", "caption", "claimIds", "seoPhraseIds", "hashtagIds", "cta", "scheduleWindow"],
        properties: {
          platform: { enum: MOMO_CONTENT_PLATFORMS },
          caption: {
            ...stringSchema(80, 1_500),
            description: "Natural platform copy whose non-neutral factual or visual spans are exhaustively ledgered. It must use every selected approved SEO phrase verbatim and contiguously without crossing punctuation or sentence boundaries.",
          },
          claimIds: {
            ...idArraySchema(30),
            description: "Exactly the claim IDs whose appearsIn includes this platform; no missing or extra claim IDs.",
          },
          seoPhraseIds: {
            ...idArraySchema(8), minItems: 3,
            description: "Select only phrases actually used in this caption. Must include and naturally apply at least one brand, one locality, and one cuisine-or-dish phrase.",
          },
          hashtagIds: idArraySchema(5),
          cta: {
            type: "object", additionalProperties: false,
            required: ["kind", "text"],
            properties: {
              kind: { enum: ["none", "visit", "explore_menu", "order_online", "call"] },
              text: stringSchema(0, 160),
            },
          },
          scheduleWindow: { enum: ["unspecified"] },
        },
      },
    },
    internalMediaTags: {
      type: "array", minItems: 3, maxItems: 10,
      items: {
        type: "object", additionalProperties: false,
        required: ["slug", "label", "confidence"],
        properties: {
          slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+){0,5}$", maxLength: 80 },
          label: stringSchema(1, 80),
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
      },
    },
    uncertainties: {
      type: "array", minItems: 0, maxItems: 8,
      items: {
        type: "object", additionalProperties: false,
        required: ["field", "reason", "severity"],
        properties: {
          field: stringSchema(1, 100),
          reason: stringSchema(10, 300),
          severity: { enum: ["warning", "blocking"] },
        },
      },
    },
  },
} as const;

export const isMomoContentUuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const isMomoContentHash = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{64}$/u.test(value);

export const isMomoContentIdempotencyKey = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/u.test(value);
