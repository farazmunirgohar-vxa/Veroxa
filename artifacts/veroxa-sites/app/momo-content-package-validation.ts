import {
  MOMO_CONTENT_AI_SCHEMA_VERSION,
  MOMO_CONTENT_PLATFORMS,
  type MomoContentAiPackageOutput,
  type MomoContentPlatform,
  type MomoContentTruthSnapshotField,
} from "./momo-content-ai-contract.ts";
import {
  momoTruthFieldSupportsSensitiveClaim,
  momoTruthValueSupportsSensitiveClaim,
  validateMomoPlatformVariantCaption,
  type MomoSensitiveClaimCategory,
} from "./momo-manual-content-cycle.ts";

const HASHTAG_PATTERN = /^#[A-Za-z][A-Za-z0-9_]{1,39}$/u;
const TAG_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+){0,5}$/u;
const SPAM_HASHTAGS = new Set([
  "#fyp", "#viral", "#follow4follow", "#like4like", "#explorepage",
  "#foodporn", "#giveaway", "#contest", "#trending",
]);
const BLOCKED_DISCOVERY_PATTERNS = [
  /\bnear me\b/iu,
  /\b(best|#1|number one|top[- ]rated|award[- ]winning|most popular)\b/iu,
  /\b(cheap|cheapest|lowest price)\b/iu,
  /\b(trending|viral)\b/iu,
];
const BLOCKED_MARKETING_PATTERNS = [
  ...BLOCKED_DISCOVERY_PATTERNS,
  /\b(act now|hurry|limited time|don't miss out|while supplies last)\b/iu,
  /\b(follow for follow|like and share|tag (?:all|three|your) friends)\b/iu,
];
const UNSUPPORTED_UNGROUNDED_CLAIM_PATTERNS = [
  /\b(?:popular|most[- ]loved|beloved|best[- ]selling|bestseller|signature)\b/iu,
  /\b(?:customer|crowd|fan|guest)\s+(?:favorite|favourite|choice|pick)\b/iu,
  /\b(?:favorite|favourite)\b/iu,
  /\b(?:fresh|freshly|house[- ]made|homemade|handmade)\b/iu,
  /\b(?:made|prepared|cooked|baked)\s+(?:today|daily|fresh|freshly|in[- ]house|to order)\b/iu,
  /\b(?:authentic|traditional|genuine|original)\b/iu,
  /\b(?:delicious|tasty|savou?ry|flavou?rful|flavou?r|crispy|creamy|juicy|tender)\b/iu,
  /\b(?:offers?|provides?)\b/iu,
  /\b(?:warm|welcoming|inviting)\s+(?:dining|restaurant|setting|space|atmosphere|environment)\b/iu,
];
const NON_OBJECTIVE_VISUAL_CLAIM_PATTERNS = [
  ...BLOCKED_MARKETING_PATTERNS,
  ...UNSUPPORTED_UNGROUNDED_CLAIM_PATTERNS,
  /\b(?:amazing|appealing|appetizing|beautiful|gorgeous|mouthwatering|perfect|premium|stunning|tempting|high[- ]quality|quality|experience)\b/iu,
  /\b(?:customers?|crowd|fans?|guests?|diners?|locals?)\b/iu,
  /\b(?:serves?|available|menu|offer|service)\b/iu,
];
const OBJECTIVE_VISUAL_ANCHORS = new Set([
  "background", "bowl", "counter", "cup", "dish", "door", "exterior", "food",
  "foreground", "glass", "hand", "hands", "interior", "light", "lighting", "person",
  "people", "plate", "plated", "restaurant", "serving", "sign", "table", "tray", "window",
]);
const OBJECTIVE_VISUAL_WORDS = new Set([
  "an", "and", "at", "background", "beside", "bowl", "centered", "counter", "cup",
  "dish", "door", "exterior", "food", "foreground", "glass", "hand", "hands", "in",
  "interior", "light", "lighting", "near", "on", "person", "people", "plate", "plated",
  "restaurant", "serving", "sign", "softly", "table", "the", "tray", "window", "with",
]);
const ALT_BLOCKED_PATTERNS = [
  /^(?:an? )?(?:image|photo|picture) of\b/iu,
  /\b(best|delicious|mouthwatering|must[- ]try|irresistible)\b/iu,
  /https?:\/\//iu,
  /#[A-Za-z]/u,
];
const VISUAL_ONLY_BLOCKED_CATEGORIES = new Set([
  "restaurant_name", "location", "cuisine", "menu", "hours", "service",
  "dietary", "halal", "offer", "price", "phone", "ranking", "sensory",
]);
const QUALITY_ISSUES = new Set([
  "blur", "dark", "overexposed", "glare", "cropped_subject",
  "busy_background", "readable_text", "possible_logo_or_watermark", "none",
]);
const CLAIM_FIELD_PATTERNS: Record<string, readonly RegExp[]> = {
  restaurant_name: [/^identity\.display_name$/iu],
  location: [/^address\./iu],
  cuisine: [/^identity\.cuisine$/iu],
  menu: [/^menu\./iu],
  hours: [/^hours\./iu],
  service: [/^services\./iu],
  dietary: [/^claims\.dietary$/iu],
  halal: [/^claims\.halal$/iu],
  offer: [/^(?:offers?|promotions?)\./iu, /^claims\.(?:offer|promotion)$/iu],
  price: [/^(?:price|prices)\./iu, /^menu\.prices?$/iu, /^claims\.price$/iu],
  phone: [/^phone\./iu],
};
const SEO_FIELD_PATTERNS: Record<"brand" | "cuisine" | "locality" | "dish", readonly RegExp[]> = {
  brand: [/^identity\.display_name$/iu],
  cuisine: [/^identity\.cuisine$/iu],
  locality: [/^address\./iu],
  dish: [/^menu\./iu],
};
const SEO_GENERIC_WORDS: Record<"brand" | "cuisine" | "locality" | "dish", ReadonlySet<string>> = {
  brand: new Set(["the", "house", "restaurant"]),
  cuisine: new Set(["cuisine", "food", "restaurant"]),
  locality: new Set(["street", "st", "road", "rd", "avenue", "ave", "suite", "tx", "restaurant", "food", "dining", "local"]),
  dish: new Set(["and", "menu", "snack", "snacks", "food", "dish", "dishes"]),
};
const CLAIM_STOPWORDS = new Set([
  "a", "an", "and", "are", "at", "available", "brings", "discover", "for", "from",
  "in", "is", "local", "of", "on", "our", "restaurant", "serves", "the", "to", "we", "with",
]);
const EDITORIAL_SAFE_WORDS = new Set([
  "a", "an", "and", "are", "area", "as", "at", "await", "background", "brings", "centered",
  "clear", "come", "discover", "discovering", "diners", "dining", "explore", "find", "for", "from",
  "here", "in", "introduction", "inviting", "is", "lit", "local", "made", "moment", "new", "no",
  "of", "offers", "on", "our", "plan", "restaurant", "see", "serves", "setting", "simple", "softly", "something", "table",
  "the", "this", "to", "today", "us", "view", "visit", "warm", "welcoming", "with", "your",
]);
const SENSITIVE_CATEGORY_MAP: Partial<Record<string, MomoSensitiveClaimCategory>> = {
  menu: "menu", hours: "hours", service: "service", dietary: "dietary", halal: "halal",
  offer: "offer", price: "price", phone: "phone", ranking: "ranking",
};
const PLATFORM_LIMITS: Record<MomoContentPlatform, {
  min: number;
  max: number;
  maxEmoji: number;
  minHashtags: number;
  maxHashtags: number;
}> = {
  instagram: { min: 80, max: 900, maxEmoji: 3, minHashtags: 3, maxHashtags: 5 },
  facebook: { min: 80, max: 1_500, maxEmoji: 2, minHashtags: 0, maxHashtags: 3 },
  google_business: { min: 80, max: 800, maxEmoji: 1, minHashtags: 0, maxHashtags: 0 },
};

type PlainRecord = Record<string, unknown>;

export type MomoAllowedHashtag = {
  tag: string;
  kind: "brand" | "cuisine" | "locality" | "dish";
  truthFieldIds: string[];
};

export type MomoAllowedSeoPhrase = {
  phrase: string;
  kind: "brand" | "cuisine" | "locality" | "dish";
  truthFieldIds: string[];
};

export type MomoContentValidationContext = {
  targetPlatforms: readonly MomoContentPlatform[];
  truthFields: readonly MomoContentTruthSnapshotField[];
  allowedSeoPhrases: readonly MomoAllowedSeoPhrase[];
  allowedHashtags: readonly MomoAllowedHashtag[];
};

export type MomoContentValidationResult =
  | { ok: true; value: MomoContentAiPackageOutput; warnings: string[] }
  | {
      ok: false;
      blockers: string[];
      warnings: string[];
      qualityAssessment?: MomoContentAiPackageOutput["assetAssessment"];
    };

function isRecord(value: unknown): value is PlainRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: PlainRecord, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length &&
    actual.every((key, index) => key === wanted[index]);
}

function isString(value: unknown, min: number, max: number): value is string {
  return typeof value === "string" && value === value.trim() &&
    value.length >= min && value.length <= max;
}

function uniqueStrings(value: unknown, min: number, max: number): value is string[] {
  return Array.isArray(value) && value.length >= min && value.length <= max &&
    value.every((item) => isString(item, 1, 100)) &&
    new Set(value.map((item) => item.toLowerCase())).size === value.length;
}

function canonicalText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(canonicalText).join(" ");
  if (isRecord(value)) return Object.values(value).map(canonicalText).join(" ");
  return value === null || value === undefined ? "" : String(value);
}

function words(value: string): string[] {
  return value.toLowerCase().normalize("NFKD")
    .replace(/[^a-z0-9]+/gu, " ").trim().split(/\s+/u)
    .filter((word) => word.length > 1);
}

function normalizeSimilarity(value: string): string {
  return words(value).join(" ");
}

function emojiCount(value: string): number {
  return Array.from(value.matchAll(/\p{Extended_Pictographic}/gu)).length;
}

function uppercaseMarketing(value: string): boolean {
  const tokens = value.match(/\b[A-Z]{4,}\b/gu) ?? [];
  return tokens.length >= 2;
}

function repeatedCopy(value: string): boolean {
  const normalizedSentences = value
    .split(/[.!?]+/u)
    .map(normalizeSimilarity)
    .filter((sentence) => sentence.length >= 12);
  if (new Set(normalizedSentences).size !== normalizedSentences.length) return true;
  const tokens = words(value);
  const bigrams = new Map<string, number>();
  for (let index = 0; index + 1 < tokens.length; index += 1) {
    const bigram = `${tokens[index]} ${tokens[index + 1]}`;
    const count = (bigrams.get(bigram) ?? 0) + 1;
    if (count > 2) return true;
    bigrams.set(bigram, count);
  }
  return false;
}

function duplicateIds<T extends { id: string }>(items: T[]): boolean {
  return new Set(items.map((item) => item.id.toLowerCase())).size !== items.length;
}

function truthFieldMatches(fieldKey: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(fieldKey));
}

function sameStringSet(left: readonly string[], right: readonly string[]): boolean {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return leftSet.size === rightSet.size && [...leftSet].every((item) => rightSet.has(item));
}

function seoConceptTokens(
  kind: keyof typeof SEO_GENERIC_WORDS,
  value: string,
): string[] {
  return [...new Set(words(value).filter((word) => !SEO_GENERIC_WORDS[kind].has(word)))];
}

function seoConceptAppears(
  caption: string,
  phrase: Pick<MomoContentAiPackageOutput["seoPhrases"][number], "kind" | "phrase">,
): boolean {
  const literal = phrase.phrase.trim().split(/\s+/u).map(regexEscape).join("\\s+");
  return literal.length > 0 && new RegExp(`(?:^|[^A-Za-z0-9])${literal}(?=$|[^A-Za-z0-9])`, "iu").test(caption);
}

function ordinaryClaimValueSupported(truthValue: unknown, claimText: string): boolean {
  const truthTokens = new Set(words(canonicalText(truthValue)));
  const material = words(claimText).filter((token) => !CLAIM_STOPWORDS.has(token));
  return material.length > 0 && material.every((token) => truthTokens.has(token));
}

function ownerClaimSupported(
  claim: MomoContentAiPackageOutput["claims"][number],
  cited: readonly MomoContentTruthSnapshotField[],
): boolean {
  const patterns = CLAIM_FIELD_PATTERNS[claim.category];
  if (!patterns || !cited.some((field) => truthFieldMatches(field.fieldKey, patterns))) return false;
  const sensitive = SENSITIVE_CATEGORY_MAP[claim.category];
  if (sensitive) return cited.some((field) =>
    momoTruthFieldSupportsSensitiveClaim(field.fieldKey, sensitive) &&
    momoTruthValueSupportsSensitiveClaim(canonicalText(field.value), claim.exactText, sensitive));
  return cited.some((field) => truthFieldMatches(field.fieldKey, patterns) && ordinaryClaimValueSupported(field.value, claim.exactText));
}

function destinationText(
  output: MomoContentAiPackageOutput,
  destination: MomoContentAiPackageOutput["claims"][number]["appearsIn"][number],
): string | null {
  if (destination === "master") return output.masterCaption;
  if (destination === "alt_text") return output.altText;
  return output.variants.find((variant) => variant.platform === destination)?.caption ?? null;
}

function regexEscape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function exactOccurrenceCount(value: string, exactText: string): number {
  if (!exactText) return 0;
  let count = 0;
  let offset = 0;
  while (offset <= value.length - exactText.length) {
    const found = value.indexOf(exactText, offset);
    if (found < 0) break;
    count += 1;
    offset = found + exactText.length;
  }
  return count;
}

function textWithoutLedgeredClaims(
  output: MomoContentAiPackageOutput,
  destination: MomoContentAiPackageOutput["claims"][number]["appearsIn"][number],
): string {
  let remainder = destinationText(output, destination) ?? "";
  for (const claim of output.claims.filter((item) => item.appearsIn.includes(destination))) {
    remainder = remainder.replace(new RegExp(regexEscape(claim.exactText), "giu"), " ");
  }
  return remainder;
}

function uncoveredEditorialTokens(
  output: MomoContentAiPackageOutput,
  destination: MomoContentAiPackageOutput["claims"][number]["appearsIn"][number],
): string[] {
  return [...new Set(words(textWithoutLedgeredClaims(output, destination))
    .filter((token) => !EDITORIAL_SAFE_WORDS.has(token)))];
}

function containsUnsupportedUngroundedClaim(
  output: MomoContentAiPackageOutput,
  destination: MomoContentAiPackageOutput["claims"][number]["appearsIn"][number],
): boolean {
  const remainder = textWithoutLedgeredClaims(output, destination);
  return UNSUPPORTED_UNGROUNDED_CLAIM_PATTERNS.some((pattern) => pattern.test(remainder));
}

function isObjectiveVisualClaim(claim: MomoContentAiPackageOutput["claims"][number]): boolean {
  if (claim.source !== "visible_media" || claim.category !== "visual") return false;
  const claimWords = words(claim.exactText);
  return claimWords.length > 0 && claimWords.length <= 12 &&
    claimWords.some((word) => OBJECTIVE_VISUAL_ANCHORS.has(word)) &&
    claimWords.every((word) => OBJECTIVE_VISUAL_WORDS.has(word)) &&
    !NON_OBJECTIVE_VISUAL_CLAIM_PATTERNS.some((pattern) => pattern.test(claim.exactText));
}

function ctaGroundingValid(
  cta: MomoContentAiPackageOutput["variants"][number]["cta"],
  truthFields: readonly MomoContentTruthSnapshotField[],
): boolean {
  if (cta.kind === "none") return cta.text === "";
  const required: Record<Exclude<typeof cta.kind, "none">, { key: string; action: RegExp }> = {
    visit: { key: "address.primary", action: /\b(?:visit|plan|come|find)\b/iu },
    explore_menu: { key: "menu.primary", action: /\b(?:menu|explore|browse|see)\b/iu },
    order_online: { key: "services.delivery", action: /\border\b[\s\S]*\bonline\b/iu },
    call: { key: "phone.primary", action: /\bcall\b/iu },
  };
  const contract = required[cta.kind];
  const support = truthFields.find((field) => field.fieldKey === contract.key);
  if (!support || !contract.action.test(cta.text)) return false;
  const truthTokens = new Set(truthFields.flatMap((field) => words(canonicalText(field.value))));
  const uncovered = words(cta.text).filter((token) => !EDITORIAL_SAFE_WORDS.has(token) && !truthTokens.has(token));
  return uncovered.length === 0 && !BLOCKED_MARKETING_PATTERNS.some((pattern) => pattern.test(cta.text));
}

function structuralOutput(value: unknown): value is MomoContentAiPackageOutput {
  if (!isRecord(value) || !exactKeys(value, [
    "schemaVersion", "assetAssessment", "direction", "masterCaption",
    "altText", "seoPhrases", "hashtags", "claims", "variants",
    "internalMediaTags", "uncertainties",
  ]) || value.schemaVersion !== MOMO_CONTENT_AI_SCHEMA_VERSION) return false;
  const assessment = value.assetAssessment;
  const direction = value.direction;
  if (!isRecord(assessment) || !exactKeys(assessment, ["subject", "visualSummary", "qualityScore", "qualityIssues"]) ||
    !["food", "drink", "interior", "exterior", "team", "menu", "other"].includes(String(assessment.subject)) ||
    !isString(assessment.visualSummary, 20, 400) ||
    !Number.isInteger(assessment.qualityScore) || Number(assessment.qualityScore) < 1 || Number(assessment.qualityScore) > 5 ||
    !uniqueStrings(assessment.qualityIssues, 1, 6) ||
    !(assessment.qualityIssues as string[]).every((item) => QUALITY_ISSUES.has(item)) ||
    ((assessment.qualityIssues as string[]).includes("none") && (assessment.qualityIssues as string[]).length !== 1)) return false;
  if (!isRecord(direction) || !exactKeys(direction, ["pillar", "objective", "angle", "audienceIntent"]) ||
    !["Momo Cravings", "First-Time Education", "Behind the Scenes", "Customer Reactions", "Snack Discovery", "Local Discovery"].includes(String(direction.pillar)) ||
    !["craving", "education", "local_discovery", "brand_trust", "visit_intent"].includes(String(direction.objective)) ||
    !isString(direction.angle, 20, 400) || !isString(direction.audienceIntent, 10, 240) ||
    !isString(value.masterCaption, 40, 1_200) || !isString(value.altText, 30, 180)) return false;
  if (!Array.isArray(value.seoPhrases) || value.seoPhrases.length < 3 || value.seoPhrases.length > 8 ||
    !value.seoPhrases.every((item) => isRecord(item) && exactKeys(item, ["id", "phrase", "kind", "truthFieldIds"]) && isString(item.id, 1, 80) && isString(item.phrase, 3, 80) && ["brand", "cuisine", "locality", "dish"].includes(String(item.kind)) && uniqueStrings(item.truthFieldIds, 1, 3))) return false;
  if (!Array.isArray(value.hashtags) || value.hashtags.length < 3 || value.hashtags.length > 10 ||
    !value.hashtags.every((item) => isRecord(item) && exactKeys(item, ["id", "tag", "kind", "truthFieldIds"]) && isString(item.id, 1, 80) && typeof item.tag === "string" && HASHTAG_PATTERN.test(item.tag) && ["brand", "cuisine", "locality", "dish"].includes(String(item.kind)) && uniqueStrings(item.truthFieldIds, 1, 3))) return false;
  if (!Array.isArray(value.claims) || value.claims.length < 1 || value.claims.length > 30 ||
    !value.claims.every((item) => isRecord(item) && exactKeys(item, ["id", "exactText", "source", "category", "truthFieldIds", "appearsIn"]) && isString(item.id, 1, 80) && isString(item.exactText, 1, 300) && ["owner_truth", "visible_media", "editorial"].includes(String(item.source)) && ["restaurant_name", "location", "cuisine", "menu", "hours", "service", "dietary", "halal", "offer", "price", "phone", "ranking", "visual", "sensory", "other"].includes(String(item.category)) && uniqueStrings(item.truthFieldIds, 0, 3) && uniqueStrings(item.appearsIn, 1, 5) && (item.appearsIn as string[]).every((destination) => ["master", "alt_text", ...MOMO_CONTENT_PLATFORMS].includes(destination as "master" | "alt_text" | MomoContentPlatform)))) return false;
  if (!Array.isArray(value.variants) || value.variants.length < 1 || value.variants.length > 3 ||
    !value.variants.every((item) => isRecord(item) && exactKeys(item, ["platform", "caption", "claimIds", "seoPhraseIds", "hashtagIds", "cta", "scheduleWindow"]) && MOMO_CONTENT_PLATFORMS.includes(item.platform as MomoContentPlatform) && isString(item.caption, 80, 1_500) && uniqueStrings(item.claimIds, 0, 30) && uniqueStrings(item.seoPhraseIds, 3, 8) && uniqueStrings(item.hashtagIds, 0, 5) && isRecord(item.cta) && exactKeys(item.cta, ["kind", "text"]) && ["none", "visit", "explore_menu", "order_online", "call"].includes(String(item.cta.kind)) && isString(item.cta.text, 0, 160) && item.scheduleWindow === "unspecified")) return false;
  if (!Array.isArray(value.internalMediaTags) || value.internalMediaTags.length < 3 || value.internalMediaTags.length > 10 ||
    !value.internalMediaTags.every((item) => isRecord(item) && exactKeys(item, ["slug", "label", "confidence"]) && typeof item.slug === "string" && TAG_SLUG_PATTERN.test(item.slug) && item.slug.length <= 80 && isString(item.label, 1, 80) && typeof item.confidence === "number" && Number.isFinite(item.confidence) && item.confidence >= 0 && item.confidence <= 1)) return false;
  return Array.isArray(value.uncertainties) && value.uncertainties.length <= 8 &&
    value.uncertainties.every((item) => isRecord(item) && exactKeys(item, ["field", "reason", "severity"]) && isString(item.field, 1, 100) && isString(item.reason, 10, 300) && ["warning", "blocking"].includes(String(item.severity)));
}

export function buildMomoAllowedHashtags(
  truthFields: readonly MomoContentTruthSnapshotField[],
): MomoAllowedHashtag[] {
  const result = new Map<string, MomoAllowedHashtag>();
  const brand = truthFields.find((field) => field.fieldKey === "identity.display_name");
  const cuisine = truthFields.find((field) => field.fieldKey === "identity.cuisine");
  const locality = truthFields.find((field) => field.fieldKey === "address.primary");
  const menu = truthFields.find((field) => field.fieldKey === "menu.primary");
  const pascal = (tokens: readonly string[]) => tokens.map((token) => token[0]?.toUpperCase() + token.slice(1)).join("");
  const concept = (field: MomoContentTruthSnapshotField | undefined, ignored: ReadonlySet<string>) =>
    field ? words(canonicalText(field.value)).filter((word) => !ignored.has(word)) : [];
  const add = (tag: string, kind: MomoAllowedHashtag["kind"], fields: Array<MomoContentTruthSnapshotField | undefined>) => {
    const ids = fields.filter((field): field is MomoContentTruthSnapshotField => Boolean(field)).map((field) => field.id);
    if (!ids.length || !HASHTAG_PATTERN.test(tag) || SPAM_HASHTAGS.has(tag.toLowerCase())) return;
    result.set(tag.toLowerCase(), { tag, kind, truthFieldIds: [...new Set(ids)].slice(0, 3) });
  };
  const brandWords = concept(brand, new Set(["the"]));
  const cuisineWords = concept(cuisine, new Set(["cuisine", "food", "restaurant", "the"]));
  const localityWords = locality && /san\s+antonio/iu.test(canonicalText(locality.value))
    ? ["san", "antonio"] : concept(locality, new Set(["street", "road", "avenue", "suite", "texas", "tx"])).slice(0, 2);
  const dishWords = concept(menu, new Set(["and", "menu", "snack", "snacks", "food", "cuisine", "the"])).slice(0, 2);
  if (brandWords.length) add(`#${pascal(brandWords.slice(0, 4))}`, "brand", [brand]);
  if (localityWords.length) add(`#${pascal(localityWords)}`, "locality", [locality]);
  if (cuisineWords.length) add(`#${pascal(cuisineWords.slice(0, 2))}Food`, "cuisine", [cuisine]);
  if (dishWords.length) add(`#${pascal(dishWords.slice(0, 1))}`, "dish", [menu]);
  if (dishWords.length && localityWords.length) add(`#${pascal(dishWords.slice(0, 1))}${pascal(localityWords)}`, "dish", [menu, locality]);
  if (cuisineWords.length && localityWords.length) add(`#${pascal(cuisineWords.slice(0, 1))}Food${pascal(localityWords)}`, "cuisine", [cuisine, locality]);
  if (brandWords.length && localityWords.length) add(`#${pascal(brandWords.slice(0, 3))}${pascal(localityWords)}`, "brand", [brand, locality]);
  return [...result.values()].slice(0, 40);
}

export function buildMomoAllowedSeoPhrases(
  truthFields: readonly MomoContentTruthSnapshotField[],
): MomoAllowedSeoPhrase[] {
  const result = new Map<string, MomoAllowedSeoPhrase>();
  const brand = truthFields.find((field) => field.fieldKey === "identity.display_name");
  const cuisine = truthFields.find((field) => field.fieldKey === "identity.cuisine");
  const locality = truthFields.find((field) => field.fieldKey === "address.primary");
  const menu = truthFields.find((field) => field.fieldKey === "menu.primary");
  const safeOwnerPhrase = (value: unknown): string | null => {
    const phrase = canonicalText(value).trim().replace(/\s+/gu, " ");
    return phrase.length >= 3 && phrase.length <= 80 &&
      /^[A-Za-z0-9][A-Za-z0-9&'’.\- ]+$/u.test(phrase) &&
      !BLOCKED_DISCOVERY_PATTERNS.some((pattern) => pattern.test(phrase))
      ? phrase
      : null;
  };
  const title = (tokens: readonly string[]) => tokens
    .map((token) => token[0]?.toUpperCase() + token.slice(1))
    .join(" ");
  const add = (
    phrase: string | null,
    kind: MomoAllowedSeoPhrase["kind"],
    fields: Array<MomoContentTruthSnapshotField | undefined>,
  ) => {
    if (!phrase) return;
    const clean = phrase.trim().replace(/\s+/gu, " ");
    const ids = fields
      .filter((field): field is MomoContentTruthSnapshotField => Boolean(field))
      .map((field) => field.id);
    if (!ids.length || clean.length < 3 || clean.length > 80 ||
      BLOCKED_DISCOVERY_PATTERNS.some((pattern) => pattern.test(clean))) return;
    result.set(`${kind}:${clean.toLowerCase()}`, {
      phrase: clean,
      kind,
      truthFieldIds: [...new Set(ids)].slice(0, 3),
    });
  };

  const brandPhrase = brand ? safeOwnerPhrase(brand.value) : null;
  const localityPhrase = locality && /\bsan\s+antonio\b/iu.test(canonicalText(locality.value))
    ? "San Antonio"
    : null;
  const cuisineTokens = cuisine
    ? words(canonicalText(cuisine.value)).filter((word) => !new Set(["cuisine", "food", "restaurant", "the"]).has(word)).slice(0, 3)
    : [];
  const menuFirstSegment = menu
    ? canonicalText(menu.value).split(/\s+(?:and|or)\s+|[,/&]/iu, 1)[0]
    : "";
  const dishTokens = words(menuFirstSegment)
    .filter((word) => !new Set(["menu", "snack", "snacks", "food", "cuisine", "the"]).has(word))
    .slice(0, 3);
  const cuisinePhrase = cuisineTokens.length ? title(cuisineTokens) : null;
  const dishPhrase = dishTokens.length ? title(dishTokens) : null;

  add(brandPhrase, "brand", [brand]);
  add(localityPhrase ? `${localityPhrase} restaurant` : null, "locality", [locality]);
  add(localityPhrase ? `${localityPhrase} dining` : null, "locality", [locality]);
  add(cuisinePhrase ? `${cuisinePhrase} cuisine` : null, "cuisine", [cuisine]);
  add(cuisinePhrase ? `${cuisinePhrase} food` : null, "cuisine", [cuisine]);
  add(dishPhrase, "dish", [menu]);
  add(brandPhrase && localityPhrase ? `${brandPhrase} ${localityPhrase}` : null, "brand", [brand, locality]);
  add(cuisinePhrase && localityPhrase ? `${cuisinePhrase} food in ${localityPhrase}` : null, "cuisine", [cuisine, locality]);
  add(dishPhrase && localityPhrase ? `${dishPhrase} in ${localityPhrase}` : null, "dish", [menu, locality]);
  return [...result.values()].slice(0, 24);
}

export function validateMomoContentPackage(
  raw: unknown,
  context: MomoContentValidationContext,
): MomoContentValidationResult {
  const blockers = new Set<string>();
  const warnings = new Set<string>();
  if (!structuralOutput(raw)) {
    return { ok: false, blockers: ["schema_invalid"], warnings: [] };
  }
  const output = raw;
  const truth = new Map(context.truthFields.map((field) => [field.id, field]));
  const truthForSensitiveValidation = context.truthFields.map((field) => ({
    id: field.id, fieldKey: field.fieldKey, label: field.fieldKey, value: canonicalText(field.value),
  }));
  const targetPlatforms = [...new Set(context.targetPlatforms)].sort();
  const actualPlatforms = output.variants.map((variant) => variant.platform).sort();
  if (targetPlatforms.length !== actualPlatforms.length ||
    targetPlatforms.some((platform, index) => platform !== actualPlatforms[index])) blockers.add("platform_scope_mismatch");
  if (new Set(actualPlatforms).size !== actualPlatforms.length) blockers.add("duplicate_platform");

  if (duplicateIds(output.seoPhrases) || duplicateIds(output.hashtags) || duplicateIds(output.claims)) blockers.add("duplicate_identifier");
  const seoIds = new Set(output.seoPhrases.map((item) => item.id));
  const hashtagIds = new Set(output.hashtags.map((item) => item.id));
  const claimIds = new Set(output.claims.map((item) => item.id));

  const allowedHashtags = new Map(context.allowedHashtags.map((item) => [item.tag.toLowerCase(), item]));
  const usedHashtagText = new Set<string>();
  for (const item of output.hashtags) {
    const tag = item.tag.toLowerCase();
    if (usedHashtagText.has(tag)) blockers.add("duplicate_hashtag");
    usedHashtagText.add(tag);
    const allowed = allowedHashtags.get(tag);
    if (!allowed || allowed.kind !== item.kind) blockers.add("hashtag_not_truth_backed");
    if (SPAM_HASHTAGS.has(tag)) blockers.add("spam_hashtag");
    if (item.truthFieldIds.some((id) => !truth.has(id)) ||
      !allowed || !sameStringSet(allowed.truthFieldIds, item.truthFieldIds)) blockers.add("hashtag_truth_mismatch");
  }

  const allowedSeoPhrases = new Map(context.allowedSeoPhrases.map((item) => [
    `${item.kind}:${item.phrase.toLowerCase()}`,
    item,
  ]));
  const usedSeo = new Set<string>();
  for (const item of output.seoPhrases) {
    const phrase = item.phrase.toLowerCase();
    const allowed = allowedSeoPhrases.get(`${item.kind}:${phrase}`);
    if (usedSeo.has(phrase)) blockers.add("duplicate_seo_phrase");
    usedSeo.add(phrase);
    if (BLOCKED_DISCOVERY_PATTERNS.some((pattern) => pattern.test(item.phrase))) blockers.add("unsafe_seo_phrase");
    const sources = item.truthFieldIds.map((id) => truth.get(id));
    if (sources.some((field) => !field)) blockers.add("seo_truth_missing");
    if (!sources.some((field) => field && truthFieldMatches(field.fieldKey, SEO_FIELD_PATTERNS[item.kind]))) blockers.add("seo_truth_category_mismatch");
    const matchingSources = sources.filter((field): field is MomoContentTruthSnapshotField => Boolean(
      field && truthFieldMatches(field.fieldKey, SEO_FIELD_PATTERNS[item.kind]),
    ));
    const sourceWords = new Set(matchingSources.flatMap((field) => seoConceptTokens(item.kind, canonicalText(field.value))));
    const phraseWords = seoConceptTokens(item.kind, item.phrase);
    const minimum = item.kind === "locality" ? Math.min(2, sourceWords.size) : 1;
    if (!allowed && (sourceWords.size === 0 || phraseWords.length < minimum || phraseWords.some((word) => !sourceWords.has(word)))) blockers.add("seo_not_truth_backed");
    if (!allowed || !sameStringSet(allowed.truthFieldIds, item.truthFieldIds)) blockers.add("seo_not_allowlisted");
  }

  if (/\r|\n/u.test(output.altText) || emojiCount(output.altText) > 0 ||
    ALT_BLOCKED_PATTERNS.some((pattern) => pattern.test(output.altText))) blockers.add("alt_text_invalid");
  if (!output.claims.some((claim) => isObjectiveVisualClaim(claim) && claim.appearsIn.includes("alt_text"))) blockers.add("alt_visual_claim_required");
  if (BLOCKED_MARKETING_PATTERNS.some((pattern) => pattern.test(output.masterCaption)) || uppercaseMarketing(output.masterCaption)) blockers.add("master_copy_unsafe");
  if (repeatedCopy(output.masterCaption)) blockers.add("master_copy_stuffed");
  if (validateMomoPlatformVariantCaption({ caption: output.masterCaption, ownerConfirmedTruth: truthForSensitiveValidation }).length) blockers.add("master_sensitive_claim_unsupported");
  if (containsUnsupportedUngroundedClaim(output, "master")) blockers.add("master_unsupported_ungrounded_claim");
  if (validateMomoPlatformVariantCaption({ caption: output.altText, ownerConfirmedTruth: truthForSensitiveValidation }).length) blockers.add("alt_sensitive_claim_unsupported");
  if (containsUnsupportedUngroundedClaim(output, "alt_text")) blockers.add("alt_unsupported_ungrounded_claim");
  if (uncoveredEditorialTokens(output, "master").length) blockers.add("master_business_claim_unledgered");
  if (uncoveredEditorialTokens(output, "alt_text").length) blockers.add("alt_business_claim_unledgered");

  for (const claim of output.claims) {
    if (claim.category === "ranking") blockers.add("ranking_claim");
    if (claim.source === "owner_truth") {
      if (!claim.truthFieldIds.length || claim.truthFieldIds.some((id) => !truth.has(id))) blockers.add("claim_truth_missing");
      const cited = claim.truthFieldIds.map((id) => truth.get(id)).filter((field): field is MomoContentTruthSnapshotField => Boolean(field));
      if (!ownerClaimSupported(claim, cited)) blockers.add("claim_truth_category_or_value_mismatch");
    } else if (claim.truthFieldIds.length) blockers.add("claim_source_mismatch");
    if (claim.source === "visible_media" && VISUAL_ONLY_BLOCKED_CATEGORIES.has(claim.category)) blockers.add("claim_inferred_from_pixels");
    if (claim.source === "editorial" && (claim.category !== "other" || words(claim.exactText).some((token) => !EDITORIAL_SAFE_WORDS.has(token)))) blockers.add("editorial_business_claim");
    if (claim.source === "visible_media" && claim.category !== "visual") blockers.add("visual_claim_category_mismatch");
    if (claim.source === "visible_media" && claim.category === "visual" && !isObjectiveVisualClaim(claim)) blockers.add("visual_claim_not_objective");
    if (claim.source !== "owner_truth" && UNSUPPORTED_UNGROUNDED_CLAIM_PATTERNS.some((pattern) => pattern.test(claim.exactText))) blockers.add("unsupported_marketing_claim");
    const destinations = ["master", "alt_text", ...actualPlatforms] as Array<
      "master" | "alt_text" | MomoContentPlatform
    >;
    for (const destination of destinations) {
      const text = destinationText(output, destination);
      const expected = claim.appearsIn.includes(destination) ? 1 : 0;
      if (!text || exactOccurrenceCount(text, claim.exactText) !== expected) {
        blockers.add("claim_appearance_mismatch");
      }
    }
  }

  for (const variant of output.variants) {
    const limits = PLATFORM_LIMITS[variant.platform];
    if (variant.caption.length < limits.min || variant.caption.length > limits.max || emojiCount(variant.caption) > limits.maxEmoji) blockers.add(`${variant.platform}_copy_invalid`);
    if (BLOCKED_MARKETING_PATTERNS.some((pattern) => pattern.test(variant.caption)) || uppercaseMarketing(variant.caption)) blockers.add(`${variant.platform}_copy_unsafe`);
    if (repeatedCopy(variant.caption)) blockers.add(`${variant.platform}_copy_stuffed`);
    if (/#[A-Za-z]/u.test(variant.caption)) blockers.add(`${variant.platform}_inline_hashtag_forbidden`);
    if (validateMomoPlatformVariantCaption({ caption: variant.caption, ownerConfirmedTruth: truthForSensitiveValidation }).length) blockers.add(`${variant.platform}_sensitive_claim_unsupported`);
    if (containsUnsupportedUngroundedClaim(output, variant.platform)) blockers.add(`${variant.platform}_unsupported_ungrounded_claim`);
    if (uncoveredEditorialTokens(output, variant.platform).length) blockers.add(`${variant.platform}_business_claim_unledgered`);
    if (variant.claimIds.some((id) => !claimIds.has(id)) || variant.seoPhraseIds.some((id) => !seoIds.has(id)) || variant.hashtagIds.some((id) => !hashtagIds.has(id))) blockers.add("variant_reference_invalid");
    const selectedSeo = variant.seoPhraseIds
      .map((id) => output.seoPhrases.find((item) => item.id === id))
      .filter((item): item is MomoContentAiPackageOutput["seoPhrases"][number] => Boolean(item));
    const hasBrand = selectedSeo.some((item) => item.kind === "brand");
    const hasLocality = selectedSeo.some((item) => item.kind === "locality");
    const hasCuisineOrDish = selectedSeo.some((item) => item.kind === "cuisine" || item.kind === "dish");
    if (!hasBrand || !hasLocality || !hasCuisineOrDish) blockers.add(`${variant.platform}_seo_kind_coverage`);
    if (selectedSeo.length !== variant.seoPhraseIds.length || selectedSeo.some((item) => !seoConceptAppears(variant.caption, item))) {
      blockers.add(`${variant.platform}_seo_not_applied`);
    }
    if (variant.hashtagIds.length < limits.minHashtags || variant.hashtagIds.length > limits.maxHashtags) blockers.add(`${variant.platform}_hashtag_count`);
    if (variant.platform === "google_business" && (variant.hashtagIds.length || /#[A-Za-z]/u.test(variant.caption))) blockers.add("google_hashtag_forbidden");
    const selectedTags = variant.hashtagIds.map((id) => output.hashtags.find((item) => item.id === id)).filter(Boolean);
    if (variant.platform === "instagram" && !selectedTags.some((item) => item?.kind === "locality")) blockers.add("instagram_local_hashtag_required");
    if (variant.platform === "instagram" && !selectedTags.some((item) => item?.kind === "brand" || item?.kind === "cuisine")) blockers.add("instagram_brand_or_cuisine_hashtag_required");
    for (const claim of output.claims) {
      const appears = claim.appearsIn.includes(variant.platform);
      const selected = variant.claimIds.includes(claim.id);
      if (appears !== selected) blockers.add("variant_claim_ledger_mismatch");
    }
    if (!ctaGroundingValid(variant.cta, context.truthFields)) blockers.add("cta_truth_missing");
    if (variant.cta.kind !== "none" && validateMomoPlatformVariantCaption({ caption: variant.cta.text, ownerConfirmedTruth: truthForSensitiveValidation }).length) blockers.add("cta_truth_value_mismatch");
    if (variant.cta.kind !== "none" && variant.caption.includes(variant.cta.text)) blockers.add("cta_duplicated_in_caption");
  }

  for (let left = 0; left < output.variants.length; left += 1) {
    for (let right = left + 1; right < output.variants.length; right += 1) {
      const leftText = normalizeSimilarity(output.variants[left].caption);
      const rightText = normalizeSimilarity(output.variants[right].caption);
      if (leftText === rightText) blockers.add("duplicate_platform_copy");
      const leftWords = new Set(leftText.split(" "));
      const rightWords = new Set(rightText.split(" "));
      const intersection = [...leftWords].filter((word) => rightWords.has(word)).length;
      const union = new Set([...leftWords, ...rightWords]).size;
      if (union && intersection / union > 0.9) blockers.add("platform_copy_too_similar");
    }
  }

  const tagSlugs = output.internalMediaTags.map((item) => item.slug);
  if (new Set(tagSlugs).size !== tagSlugs.length) blockers.add("duplicate_internal_tag");
  if (output.uncertainties.some((item) => item.severity === "blocking")) blockers.add("blocking_uncertainty");
  if (Number(output.assetAssessment.qualityScore) < 4) blockers.add("media_quality_too_low");
  if (output.assetAssessment.qualityIssues.some((issue) => issue !== "none")) blockers.add("media_quality_issue_detected");

  return blockers.size
    ? {
        ok: false,
        blockers: [...blockers].sort(),
        warnings: [...warnings].sort(),
        qualityAssessment: {
          ...output.assetAssessment,
          qualityIssues: [...output.assetAssessment.qualityIssues],
        },
      }
    : { ok: true, value: output, warnings: [...warnings].sort() };
}
