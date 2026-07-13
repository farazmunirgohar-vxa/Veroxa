export const MOMO_MANUAL_CONTENT_PILLARS = [
  "Momo Cravings",
  "First-Time Education",
  "Behind the Scenes",
  "Customer Reactions",
  "Snack Discovery",
  "Local Discovery",
] as const;

export const MOMO_MANUAL_PLATFORMS = [
  "facebook",
  "instagram",
  "google_business",
] as const;

export type MomoManualContentPillar =
  (typeof MOMO_MANUAL_CONTENT_PILLARS)[number];
export type MomoManualPlatform = (typeof MOMO_MANUAL_PLATFORMS)[number];

export type MomoConfirmedTruth = {
  id: string;
  fieldKey: string;
  label: string;
  value: string;
};

export type MomoSensitiveClaimCategory =
  | "offer"
  | "price"
  | "ranking"
  | "halal"
  | "menu"
  | "hours"
  | "service"
  | "dietary"
  | "address"
  | "phone";

export type MomoSensitiveClaim = {
  category: MomoSensitiveClaimCategory;
  text: string;
  supportingTruthId: string;
};

export type MomoPlatformVariantCaptionInput = {
  caption: string;
  ownerConfirmedTruth: readonly MomoConfirmedTruth[];
  sensitiveClaims?: readonly MomoSensitiveClaim[];
};

export type MomoPermissionedMedia = {
  id: string;
  label: string;
  rightsStatus: "confirmed" | "pending" | "restricted" | "expired" | "revoked";
  reviewStatus: "approved" | "pending" | "in_review" | "changes_requested" | "rejected";
  publicUseApproved: boolean;
  usageScope: readonly MomoManualPlatform[];
  expiresAt?: string | null;
};

export type MomoManualContentCycleInput = {
  workingTitle: string;
  pillar: MomoManualContentPillar;
  internalAngle: string;
  ownerConfirmedTruth: readonly MomoConfirmedTruth[];
  sensitiveClaims?: readonly MomoSensitiveClaim[];
  requestedPlatforms?: readonly MomoManualPlatform[];
  usePublicMedia?: boolean;
  media?: MomoPermissionedMedia | null;
  asOf: string;
};

export type MomoManualContentIssue = {
  code:
    | "working_title_required"
    | "internal_angle_required"
    | "owner_confirmed_truth_required"
    | "owner_confirmed_truth_invalid"
    | "requested_platform_required"
    | "as_of_invalid"
    | "unsupported_sensitive_claim"
    | "media_required"
    | "media_rights_unconfirmed"
    | "media_rights_expired"
    | "media_review_unapproved"
    | "media_public_use_unapproved"
    | "media_scope_missing";
  field: string;
  message: string;
};

export type MomoManualVariantSkeleton = {
  platform: MomoManualPlatform;
  state: "internal_hypothesis";
  mediaAssetId: string | null;
  editableCaption: string;
  editorChecks: string[];
};

export type MomoManualContentBrief = {
  state: "internal_hypothesis";
  workingTitle: string;
  pillar: MomoManualContentPillar;
  internalAngle: string;
  confirmedTruth: MomoConfirmedTruth[];
  supportedSensitiveClaims: MomoSensitiveClaim[];
  media: Pick<MomoPermissionedMedia, "id" | "label"> | null;
  variants: MomoManualVariantSkeleton[];
  editorChecklist: string[];
};

export type MomoManualContentCycleResult = {
  state: "internal_hypothesis";
  inputsVerified: boolean;
  canApprove: false;
  canPublish: false;
  canMarkReady: false;
  issues: MomoManualContentIssue[];
  brief: MomoManualContentBrief | null;
};

const platformLabels: Record<MomoManualPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  google_business: "Google Business Profile",
};

const sensitivePatterns: Record<MomoSensitiveClaimCategory, readonly RegExp[]> = {
  offer: [
    /\b(?:discount|bogo|buy one get one|limited-time (?:deal|offer)|special offer|complimentary)\b/i,
    /\b\d{1,3}%\s*off\b/i,
  ],
  price: [/(?:^|\s)\$\s*\d/i, /\b(?:costs?|priced at|for only)\s+\$?\d/i],
  ranking: [
    /\b(?:best|top-rated|number one|ranked first)\b/i,
    /(?:^|\s)#1\b/i,
  ],
  halal: [/\bhalal\b/i],
  menu: [
    /\b(?:menu|we serve|now serving|available to order)\b/i,
  ],
  hours: [
    /\b(?:open daily|open today|open until|open from|business hours|24\s*\/\s*7)\b/i,
    /\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b/i,
  ],
  service: [
    /\b(?:delivery|deliver(?:s|y|ed|ing)?|catering|cater(?:s|ed|ing)?|takeout|take-out|pickup|pick-up|dine-in|order online)\b/i,
  ],
  dietary: [
    /\b(?:vegan|vegetarian|gluten[- ]?free|dairy[- ]?free|nut[- ]?free|kosher)\b/i,
  ],
  address: [
    /\b(?:located at|visit us at|our address|find us at)\b/i,
  ],
  phone: [
    /\b(?:call|phone|text us)\b/i,
    /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/,
  ],
};

const sensitiveTruthFieldPatterns: Record<
  MomoSensitiveClaimCategory,
  readonly RegExp[]
> = {
  offer: [
    /^(?:offers?|promotions?)\./i,
    /^claims\.(?:offer|promotion)$/i,
  ],
  price: [
    /^(?:price|prices)\./i,
    /^menu\.prices?$/i,
    /^claims\.price$/i,
  ],
  ranking: [/^rankings?\./i, /^claims\.ranking$/i],
  halal: [/^claims\.halal$/i],
  menu: [/^menu\./i],
  hours: [/^hours\./i],
  service: [/^services\./i],
  dietary: [/^claims\.dietary$/i],
  address: [/^address\./i],
  phone: [/^phone\./i],
};

const compareText = (left: string, right: string) =>
  left < right ? -1 : left > right ? 1 : 0;

const clean = (value: string | null | undefined) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

export const momoTruthFieldSupportsSensitiveClaim = (
  fieldKey: string,
  category: MomoSensitiveClaimCategory,
) =>
  sensitiveTruthFieldPatterns[category].some((pattern) =>
    pattern.test(clean(fieldKey)),
  );

const semanticTokens = (value: string) =>
  clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9%$]+/g, " ")
    .trim();

const numericTokens = (value: string) =>
  semanticTokens(value).match(/\d+(?:\.\d+)?/g) ?? [];

export const momoTruthValueSupportsSensitiveClaim = (
  truthValue: string,
  claimText: string,
  category: MomoSensitiveClaimCategory,
): boolean => {
  const truth = semanticTokens(truthValue);
  const claim = semanticTokens(claimText);
  if (!truth || !claim) return false;

  if (category === "halal") {
    if (/\b(?:no|not|false|unknown|unverified|unconfirmed)\b/.test(truth)) return false;
    if (numericTokens(claim).length > 0 || /\b(?:all|certified|certification|fully|zabiha)\b/.test(claim)) return false;
    const plainClaim = claim.replace(/\b(?:we|are|is)\b/g, " ").replace(/\s+/g, " ").trim();
    return plainClaim === "halal" && /\b(?:true|yes|halal)\b/.test(truth);
  }

  if (category === "price") {
    const numbers = numericTokens(claim);
    return numbers.length > 0
      && numbers.every((token) => numericTokens(truth).includes(token))
      && (truth.includes(claim) || claim.includes(truth));
  }

  if (category === "hours") {
    const claimTimeTokens = claim.match(/\b(?:\d+|am|pm|monday|tuesday|wednesday|thursday|friday|saturday|sunday|daily)\b/g) ?? [];
    return claimTimeTokens.length > 0 && (truth.includes(claim) || claim.includes(truth));
  }

  if (category === "offer") {
    if (/\b(?:free|complimentary)\b/.test(claim) && !/\b(?:free|complimentary)\b/.test(truth)) return false;
    const numbers = numericTokens(claim);
    if (numbers.length > 0 && !numbers.every((token) => numericTokens(truth).includes(token))) return false;
    return truth.includes(claim) || claim.includes(truth);
  }

  if (category === "service") {
    if (numericTokens(claim).length > 0) return false;
    const canonicalize = (value: string) => value
      .replace(/\b(?:delivers?|delivery)\b/g, "delivery")
      .replace(/\b(?:caters?|catering)\b/g, "catering")
      .replace(/\b(?:take out|takeout)\b/g, "takeout")
      .replace(/\b(?:pick up|pickup)\b/g, "pickup");
    const canonicalClaim = canonicalize(claim);
    const canonicalTruth = canonicalize(truth);
    const generic = new Set(["a", "an", "and", "are", "available", "for", "is", "now", "offer", "offers", "our", "the", "to", "we"]);
    const claimTokens = canonicalClaim.split(" ").filter((token) => token.length >= 2 && !generic.has(token));
    const serviceTerms = claimTokens.filter((token) => ["delivery", "catering", "takeout", "pickup", "dine", "order", "online"].includes(token));
    return serviceTerms.length > 0 && claimTokens.every((token) => canonicalTruth.includes(token));
  }

  if (category === "dietary") {
    if (numericTokens(claim).length > 0) return false;
    const generic = new Set(["a", "an", "and", "are", "available", "for", "is", "options", "option", "our", "the", "to", "we"]);
    const claimTerms = claim.split(" ").filter((token) => token.length >= 2 && !generic.has(token));
    return claimTerms.length > 0 && claimTerms.every((token) => truth.includes(token));
  }

  if (category === "phone") {
    const phoneValues = claimText.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g) ?? [];
    if (phoneValues.length !== 1) return false;
    const claimDigits = claimText.replace(/\D/g, "");
    const truthDigits = truthValue.replace(/\D/g, "");
    const phoneDigits = phoneValues[0].replace(/\D/g, "");
    return phoneDigits.length >= 10 && truthDigits.endsWith(phoneDigits.slice(-10)) && claimDigits.endsWith(phoneDigits);
  }

  if (category === "address") {
    const claimNumbers = numericTokens(claim);
    return claimNumbers.length > 0
      && claimNumbers.every((token) => numericTokens(truth).includes(token))
      && claim.includes(truth);
  }

  if (category === "menu") {
    const genericMenuTerms = new Set(["a", "an", "and", "are", "at", "available", "for", "from", "is", "menu", "on", "order", "our", "serve", "serves", "serving", "the", "to", "try", "we"]);
    const claimTerms = claim.split(" ").filter((token) => token.length >= 2 && !genericMenuTerms.has(token));
    return claimTerms.length > 0 && claimTerms.every((token) => truth.includes(token));
  }

  return truth.includes(claim);
};

const uniquePlatforms = (
  platforms: readonly MomoManualPlatform[] | undefined,
): MomoManualPlatform[] => {
  const requested = new Set(platforms ?? MOMO_MANUAL_PLATFORMS);
  return MOMO_MANUAL_PLATFORMS.filter((platform) => requested.has(platform));
};

const detectedSensitiveCategories = (
  value: string,
): MomoSensitiveClaimCategory[] =>
  (Object.entries(sensitivePatterns) as Array<
    [MomoSensitiveClaimCategory, readonly RegExp[]]
  >)
    .filter(([category, patterns]) => {
      if (patterns.some((pattern) => pattern.test(value))) return true;
      if (category !== "offer") return false;
      const withoutDietaryFree = clean(value).toLowerCase().replace(/\b(?:gluten|dairy|nut)[- ]free\b/g, "");
      return /\bfree\b/.test(withoutDietaryFree);
    })
    .map(([category]) => category);

const validIsoDate = (value: string) => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const uniqueIssues = (
  issues: readonly MomoManualContentIssue[],
): MomoManualContentIssue[] => {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.code}:${issue.field}:${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const indexOwnerConfirmedTruth = (
  truthInputs: readonly MomoConfirmedTruth[],
  issues: MomoManualContentIssue[],
) => {
  const truthById = new Map<string, MomoConfirmedTruth>();
  for (const truth of truthInputs) {
    const id = clean(truth.id);
    const fieldKey = clean(truth.fieldKey);
    if (
      !id ||
      !fieldKey ||
      !clean(truth.label) ||
      !clean(truth.value) ||
      truthById.has(id)
    ) {
      issues.push({
        code: "owner_confirmed_truth_invalid",
        field: "ownerConfirmedTruth",
        message:
          "Each owner-confirmed truth input needs a unique id, canonical field key, label, and non-empty value.",
      });
      continue;
    }
    truthById.set(id, { ...truth, id, fieldKey });
  }
  return truthById;
};

const validateSensitiveLanguage = (
  content: string,
  claims: readonly MomoSensitiveClaim[],
  truthById: ReadonlyMap<string, MomoConfirmedTruth>,
  contentField: string,
): MomoManualContentIssue[] => {
  const issues: MomoManualContentIssue[] = [];
  for (const claim of claims) {
    const supportingTruth = truthById.get(clean(claim.supportingTruthId));
    const supported =
      Boolean(clean(claim.text)) &&
      Boolean(supportingTruth) &&
      momoTruthFieldSupportsSensitiveClaim(
        supportingTruth?.fieldKey ?? "",
        claim.category,
      ) &&
      momoTruthValueSupportsSensitiveClaim(
        supportingTruth?.value ?? "",
        claim.text,
        claim.category,
      );
    if (!supported) {
      issues.push({
        code: "unsupported_sensitive_claim",
        field: `sensitiveClaims.${claim.category}`,
        message: `${claim.category} language is blocked until it cites an owner-confirmed truth field that supports the same claim category.`,
      });
      continue;
    }
  }

  const segments = [content, ...claims.map((claim) => clean(claim.text))]
    .flatMap((value) => value.split(/(?:\r?\n|[.!?]+)\s*/))
    .map(clean)
    .filter(Boolean);
  const detectedCategories = new Set(segments.flatMap(detectedSensitiveCategories));
  for (const category of detectedCategories) {
    const categorySegments = segments.filter((segment) => detectedSensitiveCategories(segment).includes(category));
    const exactTruthSupport = categorySegments.length > 0 && categorySegments.every((segment) =>
      [...truthById.values()].some((truth) =>
        momoTruthFieldSupportsSensitiveClaim(truth.fieldKey, category) &&
        momoTruthValueSupportsSensitiveClaim(truth.value, segment, category)
      )
    );
    if (!exactTruthSupport) {
      issues.push({
        code: "unsupported_sensitive_claim",
        field: contentField,
        message: `${category} language was detected without matching owner-confirmed support.`,
      });
    }
  }
  return uniqueIssues(issues);
};

export function validateMomoPlatformVariantCaption(
  input: MomoPlatformVariantCaptionInput,
): MomoManualContentIssue[] {
  const issues: MomoManualContentIssue[] = [];
  const truthById = indexOwnerConfirmedTruth(input.ownerConfirmedTruth, issues);
  issues.push(
    ...validateSensitiveLanguage(
      clean(input.caption),
      input.sensitiveClaims ?? [],
      truthById,
      "variantCaption",
    ),
  );
  return uniqueIssues(issues);
}

export function validateMomoManualContentCycle(
  input: MomoManualContentCycleInput,
): MomoManualContentIssue[] {
  const issues: MomoManualContentIssue[] = [];
  const title = clean(input.workingTitle);
  const angle = clean(input.internalAngle);
  if (!title) {
    issues.push({
      code: "working_title_required",
      field: "workingTitle",
      message: "Add an internal working title before preparing a brief.",
    });
  }
  if (!angle) {
    issues.push({
      code: "internal_angle_required",
      field: "internalAngle",
      message: "Add a human-written internal angle before preparing a brief.",
    });
  }

  const truthById = indexOwnerConfirmedTruth(input.ownerConfirmedTruth, issues);
  if (truthById.size === 0) {
    issues.push({
      code: "owner_confirmed_truth_required",
      field: "ownerConfirmedTruth",
      message:
        "At least one owner-confirmed truth id is required. Internal hypotheses cannot replace owner confirmation.",
    });
  }

  const platforms = uniquePlatforms(input.requestedPlatforms);
  if (platforms.length === 0) {
    issues.push({
      code: "requested_platform_required",
      field: "requestedPlatforms",
      message: "Choose at least one supported platform for the internal skeleton.",
    });
  }

  const asOf = validIsoDate(input.asOf);
  if (asOf === null) {
    issues.push({
      code: "as_of_invalid",
      field: "asOf",
      message: "Use a valid fixed timestamp when evaluating media rights.",
    });
  }

  issues.push(
    ...validateSensitiveLanguage(
      [title, angle].join("\n"),
      input.sensitiveClaims ?? [],
      truthById,
      "contentLanguage",
    ),
  );

  const usePublicMedia = input.usePublicMedia ?? true;
  if (usePublicMedia && platforms.length > 0) {
    const media = input.media;
    if (!media) {
      issues.push({
        code: "media_required",
        field: "media",
        message:
          "Permissioned media is required for any public-media platform skeleton.",
      });
    } else {
      if (media.rightsStatus !== "confirmed") {
        issues.push({
          code: "media_rights_unconfirmed",
          field: "media.rightsStatus",
          message: "Media rights must be confirmed before public-media preparation.",
        });
      }
      const expiresAt = media.expiresAt ? validIsoDate(media.expiresAt) : null;
      if (media.expiresAt && (expiresAt === null || (asOf !== null && expiresAt <= asOf))) {
        issues.push({
          code: "media_rights_expired",
          field: "media.expiresAt",
          message: "Media rights are expired or have an invalid expiry timestamp.",
        });
      }
      if (media.reviewStatus !== "approved") {
        issues.push({
          code: "media_review_unapproved",
          field: "media.reviewStatus",
          message: "The current Team media review must be approved.",
        });
      }
      if (!media.publicUseApproved) {
        issues.push({
          code: "media_public_use_unapproved",
          field: "media.publicUseApproved",
          message: "The current media review has not approved public use.",
        });
      }
      for (const platform of platforms) {
        if (!media.usageScope.includes(platform)) {
          issues.push({
            code: "media_scope_missing",
            field: `media.usageScope.${platform}`,
            message: `Media rights do not include ${platformLabels[platform]}.`,
          });
        }
      }
    }
  }

  return uniqueIssues(issues);
}

const captionSkeleton = (
  platform: MomoManualPlatform,
  truthIds: readonly string[],
  usesMedia: boolean,
) =>
  [
    `[${platformLabels[platform]} hook — human editor writes this]`,
    `[Confirmed fact — cite only: ${truthIds.join(", ")}]`,
    usesMedia
      ? "[Media description — describe only what is visibly shown in the selected asset]"
      : "[Text-only direction — do not imply that a photo or video is attached]",
    "[Call to action — do not add an unconfirmed offer, price, ranking, halal claim, menu claim, or hours]",
  ].join("\n\n");

export function buildMomoManualContentCycle(
  input: MomoManualContentCycleInput,
): MomoManualContentCycleResult {
  const issues = validateMomoManualContentCycle(input);
  if (issues.length > 0) {
    return {
      state: "internal_hypothesis",
      inputsVerified: false,
      canApprove: false,
      canPublish: false,
      canMarkReady: false,
      issues,
      brief: null,
    };
  }

  const platforms = uniquePlatforms(input.requestedPlatforms);
  const confirmedTruth = input.ownerConfirmedTruth
    .map((truth) => ({
      id: clean(truth.id),
      fieldKey: clean(truth.fieldKey),
      label: clean(truth.label),
      value: clean(truth.value),
    }))
    .sort((left, right) => compareText(left.id, right.id));
  const supportedSensitiveClaims = [...(input.sensitiveClaims ?? [])]
    .map((claim) => ({
      category: claim.category,
      text: clean(claim.text),
      supportingTruthId: clean(claim.supportingTruthId),
    }))
    .sort((left, right) =>
      compareText(
        `${left.category}:${left.supportingTruthId}:${left.text}`,
        `${right.category}:${right.supportingTruthId}:${right.text}`,
      ),
    );
  const usePublicMedia = input.usePublicMedia ?? true;
  const media = usePublicMedia && input.media
    ? { id: clean(input.media.id), label: clean(input.media.label) }
    : null;
  const truthIds = confirmedTruth.map((truth) => truth.id);
  const variants = platforms.map<MomoManualVariantSkeleton>((platform) => ({
    platform,
    state: "internal_hypothesis",
    mediaAssetId: media?.id ?? null,
    editableCaption: captionSkeleton(platform, truthIds, Boolean(media)),
    editorChecks: [
      "Keep every factual statement traceable to the confirmed truth ids in this brief.",
      "Describe only what is actually visible in the selected media.",
      "Run the sensitive-claim lint again after human edits.",
      "Route the finished draft through the separate human review workflow.",
    ],
  }));

  return {
    state: "internal_hypothesis",
    inputsVerified: true,
    canApprove: false,
    canPublish: false,
    canMarkReady: false,
    issues: [],
    brief: {
      state: "internal_hypothesis",
      workingTitle: clean(input.workingTitle),
      pillar: input.pillar,
      internalAngle: clean(input.internalAngle),
      confirmedTruth,
      supportedSensitiveClaims,
      media,
      variants,
      editorChecklist: [
        "This is a human-editable internal hypothesis, not approved public copy.",
        "Do not add facts that are absent from the owner-confirmed truth list.",
        "Do not add offers, prices, rankings, halal, menu, or hours language without matching confirmed support.",
        "Do not represent this brief as published, scheduled, approved, or readiness evidence.",
      ],
    },
  };
}
