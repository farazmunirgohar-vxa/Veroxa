export const RESTAURANT_AUDIT_ENGINE_VERSION = "restaurant-audit-v3" as const;
export const RESTAURANT_AUDIT_SCHEMA_VERSION = 3 as const;
export const RESTAURANT_AUDIT_RESEARCH_MODEL = "gpt-5.6-luna" as const;
export const RESTAURANT_AUDIT_RESEARCH_PRICING_VERSION =
  "openai-gpt-5.6-luna-web-2026-07-14-v2" as const;

export const RESTAURANT_AUDIT_SIGNAL_STATUSES = [
  "confirmed_present",
  "confirmed_missing",
  "unknown",
] as const;

export type RestaurantAuditSignalStatus =
  (typeof RESTAURANT_AUDIT_SIGNAL_STATUSES)[number];

export type RestaurantAuditCategoryKey =
  | "google_business_profile"
  | "website_experience"
  | "menu_and_ordering"
  | "social_presence"
  | "reviews_and_trust"
  | "local_search_consistency";

export type RestaurantAuditConfidence = "low" | "medium" | "high";

export type RestaurantAuditCategoryInput = {
  status: RestaurantAuditSignalStatus;
  score?: number | null;
  evidenceUrl?: string | null;
  note?: string | null;
};

export type RestaurantAuditEngineInput = {
  /**
   * Supplied by the caller so the engine stays pure and repeatable. The value is
   * normalized to an ISO string in the resulting snapshot.
   */
  generatedAt: string;
  categories?: Partial<
    Record<RestaurantAuditCategoryKey, RestaurantAuditCategoryInput>
  >;
  researchRef?: RestaurantAuditResearchRef | null;
};

export type RestaurantAuditResearchRef = {
  researchId: string;
  requestHash: string;
  model: typeof RESTAURANT_AUDIT_RESEARCH_MODEL;
  pricingVersion: typeof RESTAURANT_AUDIT_RESEARCH_PRICING_VERSION;
};

export type RestaurantAuditCategorySnapshot = {
  key: RestaurantAuditCategoryKey;
  label: string;
  weight: number;
  status: RestaurantAuditSignalStatus;
  score: number;
  evidenceUrl: string | null;
  note: string | null;
};

export type RestaurantAuditImprovementArea = {
  key: RestaurantAuditCategoryKey;
  label: string;
  kind: "confirmed_gap" | "verification_needed";
  priority: "high" | "medium";
  potentialPoints: number;
  summary: string;
  recommendedAction: string;
};

export type RestaurantAuditFixFirstItem = {
  key: RestaurantAuditCategoryKey;
  title: string;
  reason: string;
  action: string;
};

export type RestaurantAuditPlan = {
  days_0_30: string[];
  days_31_60: string[];
  days_61_90: string[];
};

export type RestaurantAuditSnapshot = {
  engineVersion: typeof RESTAURANT_AUDIT_ENGINE_VERSION;
  schemaVersion: typeof RESTAURANT_AUDIT_SCHEMA_VERSION;
  overallScore: number;
  maxScore: 100;
  evidenceCoverage: number;
  confidence: RestaurantAuditConfidence;
  categories: RestaurantAuditCategorySnapshot[];
  improvementAreas: RestaurantAuditImprovementArea[];
  fixFirst: RestaurantAuditFixFirstItem[];
  plan: RestaurantAuditPlan;
  generatedAt: string;
  honestyNote: string;
  researchRef?: RestaurantAuditResearchRef;
};

type RestaurantAuditCategoryDefinition = {
  key: RestaurantAuditCategoryKey;
  label: string;
  weight: number;
  gapSummary: string;
  firstAction: string;
  days31To60Action: string;
  days61To90Action: string;
};

export const RESTAURANT_AUDIT_CATEGORY_DEFINITIONS: readonly RestaurantAuditCategoryDefinition[] = [
  {
    key: "google_business_profile",
    label: "Google Business Profile",
    weight: 20,
    gapSummary:
      "A material Google Business Profile gap was confirmed in the reviewed signals.",
    firstAction:
      "Prepare the confirmed profile details, hours, primary links, and current photo needs for Team review before any external change.",
    days31To60Action:
      "Recheck the Google profile for approved detail consistency, working links, and current visual evidence.",
    days61To90Action:
      "Compare the Google profile with the baseline audit and retain only evidence-backed follow-up priorities.",
  },
  {
    key: "website_experience",
    label: "Website Experience",
    weight: 15,
    gapSummary:
      "A material website availability, usability, or contact-path gap was confirmed.",
    firstAction:
      "Document the confirmed website gap and prepare the smallest accurate correction for review.",
    days31To60Action:
      "Recheck mobile usability and the menu, order, contact, and direction paths after approved corrections.",
    days61To90Action:
      "Compare website clarity with the baseline and prioritize only verified remaining friction.",
  },
  {
    key: "menu_and_ordering",
    label: "Menu and Ordering Paths",
    weight: 20,
    gapSummary:
      "A material menu, ordering, hours, or service-path gap was confirmed.",
    firstAction:
      "Verify the restaurant-owned menu and ordering details, then prepare a clear path correction for review.",
    days31To60Action:
      "Test the approved menu and ordering paths again and record any remaining dead ends or unclear choices.",
    days61To90Action:
      "Compare menu and ordering access with the baseline and keep only current, verified actions in the plan.",
  },
  {
    key: "social_presence",
    label: "Social Presence",
    weight: 15,
    gapSummary:
      "A material social-profile clarity, consistency, or freshness gap was confirmed.",
    firstAction:
      "Prepare a reviewed social-profile consistency and content-rhythm correction without publishing automatically.",
    days31To60Action:
      "Recheck profile identity and the approved content rhythm using dated evidence rather than assumed performance.",
    days61To90Action:
      "Compare social consistency with the baseline and refine the plan only from observed, documented signals.",
  },
  {
    key: "reviews_and_trust",
    label: "Reviews and Trust",
    weight: 15,
    gapSummary:
      "A material review visibility, response, or trust-signal gap was confirmed.",
    firstAction:
      "Document the verified review gap and prepare a human-reviewed response or trust-maintenance workflow.",
    days31To60Action:
      "Recheck review freshness and response coverage while keeping sensitive language under human review.",
    days61To90Action:
      "Compare review and trust signals with the baseline without claiming causation or guaranteed results.",
  },
  {
    key: "local_search_consistency",
    label: "Local Search Consistency",
    weight: 15,
    gapSummary:
      "A material local identity, location wording, or directions-path gap was confirmed.",
    firstAction:
      "Verify name, address, phone, location wording, and directions evidence before preparing consistency corrections.",
    days31To60Action:
      "Recheck approved local information across the reviewed public sources and document any mismatch.",
    days61To90Action:
      "Compare local-search consistency with the baseline and keep recommendations limited to verified evidence.",
  },
] as const;

export const RESTAURANT_AUDIT_HONESTY_NOTE =
  "This is a provisional online-presence assessment based only on cited public evidence and Team-reviewed signals. Scores may be partial when a system exists but has verified weaknesses. It does not guarantee rankings, customers, orders, revenue, profit, ROI, or any other outcome. Unknown signals require verification before the audit is treated as complete.";

const statusSet = new Set<string>(RESTAURANT_AUDIT_SIGNAL_STATUSES);
const categoryKeySet = new Set<string>(
  RESTAURANT_AUDIT_CATEGORY_DEFINITIONS.map((category) => category.key),
);

function normalizedGeneratedAt(value: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("restaurant_audit_generated_at_required");
  }
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    throw new Error("restaurant_audit_generated_at_invalid");
  }
  return new Date(timestamp).toISOString();
}

function normalizedResearchRef(
  value: RestaurantAuditResearchRef | null | undefined | unknown,
): RestaurantAuditResearchRef | undefined {
  if (value === null || value === undefined) return undefined;
  if (
    !isPlainObject(value)
    || !hasOnlyKeys(value, ["researchId", "requestHash", "model", "pricingVersion"])
    || typeof value.researchId !== "string"
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value.researchId)
    || typeof value.requestHash !== "string"
    || !/^[0-9a-f]{64}$/.test(value.requestHash)
    || value.model !== RESTAURANT_AUDIT_RESEARCH_MODEL
    || value.pricingVersion !== RESTAURANT_AUDIT_RESEARCH_PRICING_VERSION
  ) {
    throw new Error("restaurant_audit_research_reference_invalid");
  }
  return {
    researchId: value.researchId,
    requestHash: value.requestHash,
    model: RESTAURANT_AUDIT_RESEARCH_MODEL,
    pricingVersion: RESTAURANT_AUDIT_RESEARCH_PRICING_VERSION,
  };
}

function normalizedEvidenceUrl(value: string | null | undefined): string | null {
  const candidate = value?.trim();
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      return null;
    }
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function normalizedNote(value: string | null | undefined): string | null {
  const note = value?.trim();
  return note ? note.slice(0, 2_000) : null;
}

function normalizedScore(
  status: RestaurantAuditSignalStatus,
  value: number | null | undefined,
  weight: number,
): number {
  if (status === "unknown") return 0;
  if (status === "confirmed_present") return weight;
  if (value === null || value === undefined) return 0;
  if (!Number.isInteger(value) || value < 0 || value >= weight) {
    throw new Error("restaurant_audit_score_invalid");
  }
  return value;
}

function confidenceForCoverage(coverage: number): RestaurantAuditConfidence {
  if (coverage >= 75) return "high";
  if (coverage >= 40) return "medium";
  return "low";
}

function priorityForWeight(weight: number): RestaurantAuditImprovementArea["priority"] {
  return weight >= 20 ? "high" : "medium";
}

function improvementForCategory(
  category: RestaurantAuditCategorySnapshot,
  definition: RestaurantAuditCategoryDefinition,
): RestaurantAuditImprovementArea | null {
  if (category.status === "confirmed_present") return null;
  if (category.status === "confirmed_missing") {
    return {
      key: category.key,
      label: category.label,
      kind: "confirmed_gap",
      priority: priorityForWeight(category.weight),
      potentialPoints: category.weight - category.score,
      summary: definition.gapSummary,
      recommendedAction: definition.firstAction,
    };
  }
  return {
    key: category.key,
    label: category.label,
    kind: "verification_needed",
    priority: priorityForWeight(category.weight),
    potentialPoints: category.weight,
    summary: `${category.label} is still unknown, so no points are credited and no external condition is assumed.`,
    recommendedAction: `Verify ${category.label.toLowerCase()} and attach dated evidence before treating this part of the audit as complete.`,
  };
}

function planForImprovements(
  improvements: RestaurantAuditImprovementArea[],
): RestaurantAuditPlan {
  if (improvements.length === 0) {
    return {
      days_0_30: [
        "Record the current baseline and confirm that every cited source is still accurate.",
      ],
      days_31_60: [
        "Recheck profile freshness, public links, and business-information consistency before preparing maintenance work.",
      ],
      days_61_90: [
        "Run a comparison audit and keep only evidence-backed maintenance priorities.",
      ],
    };
  }

  const definitions = new Map(
    RESTAURANT_AUDIT_CATEGORY_DEFINITIONS.map((definition) => [
      definition.key,
      definition,
    ]),
  );
  const days_0_30: string[] = [];
  const days_31_60: string[] = [];
  const days_61_90: string[] = [];

  for (const improvement of improvements) {
    const definition = definitions.get(improvement.key);
    if (!definition) continue;
    if (improvement.kind === "confirmed_gap") {
      days_0_30.push(definition.firstAction);
      days_31_60.push(definition.days31To60Action);
      days_61_90.push(definition.days61To90Action);
      continue;
    }
    days_0_30.push(
      `Verify ${improvement.label.toLowerCase()} and attach dated evidence before recommending a change.`,
    );
    days_31_60.push(
      `If ${improvement.label.toLowerCase()} remains unclear, repeat the manual check and document the final known state.`,
    );
    days_61_90.push(
      `Compare ${improvement.label.toLowerCase()} with the baseline and update the audit only from verified evidence.`,
    );
  }

  return {
    days_0_30: [...new Set(days_0_30)],
    days_31_60: [...new Set(days_31_60)],
    days_61_90: [...new Set(days_61_90)],
  };
}

/**
 * Pure, deterministic and offline. This function performs no lookup, network,
 * model, storage, publishing, or other external action.
 */
export function generateRestaurantAuditSnapshot(
  input: RestaurantAuditEngineInput,
): RestaurantAuditSnapshot {
  const generatedAt = normalizedGeneratedAt(input.generatedAt);
  const researchRef = normalizedResearchRef(input.researchRef);
  const categories = RESTAURANT_AUDIT_CATEGORY_DEFINITIONS.map((definition) => {
    const observation = input.categories?.[definition.key];
    const status = observation?.status ?? "unknown";
    if (!statusSet.has(status)) {
      throw new Error(`restaurant_audit_status_invalid:${definition.key}`);
    }
    return {
      key: definition.key,
      label: definition.label,
      weight: definition.weight,
      status,
      score: normalizedScore(status, observation?.score, definition.weight),
      evidenceUrl: normalizedEvidenceUrl(observation?.evidenceUrl),
      note: normalizedNote(observation?.note),
    } satisfies RestaurantAuditCategorySnapshot;
  });

  const overallScore = categories.reduce((total, category) => total + category.score, 0);
  const evidenceCoverage = categories.reduce(
    (total, category) =>
      total + (category.status === "unknown" ? 0 : category.weight),
    0,
  );
  const definitionOrder = new Map(
    RESTAURANT_AUDIT_CATEGORY_DEFINITIONS.map((definition, index) => [
      definition.key,
      index,
    ]),
  );
  const definitions = new Map(
    RESTAURANT_AUDIT_CATEGORY_DEFINITIONS.map((definition) => [
      definition.key,
      definition,
    ]),
  );
  const improvementAreas = categories
    .map((category) => {
      const definition = definitions.get(category.key);
      return definition ? improvementForCategory(category, definition) : null;
    })
    .filter((item): item is RestaurantAuditImprovementArea => item !== null)
    .sort((left, right) => {
      const kindDifference =
        (left.kind === "confirmed_gap" ? 0 : 1) -
        (right.kind === "confirmed_gap" ? 0 : 1);
      if (kindDifference !== 0) return kindDifference;
      if (right.potentialPoints !== left.potentialPoints) {
        return right.potentialPoints - left.potentialPoints;
      }
      return (definitionOrder.get(left.key) ?? 0) - (definitionOrder.get(right.key) ?? 0);
    });
  const fixFirst = improvementAreas.slice(0, 3).map((improvement) => ({
    key: improvement.key,
    title:
      improvement.kind === "confirmed_gap"
        ? `Address ${improvement.label}`
        : `Verify ${improvement.label}`,
    reason: improvement.summary,
    action: improvement.recommendedAction,
  }));

  return {
    engineVersion: RESTAURANT_AUDIT_ENGINE_VERSION,
    schemaVersion: RESTAURANT_AUDIT_SCHEMA_VERSION,
    overallScore,
    maxScore: 100,
    evidenceCoverage,
    confidence: confidenceForCoverage(evidenceCoverage),
    categories,
    improvementAreas,
    fixFirst,
    plan: planForImprovements(improvementAreas),
    generatedAt,
    honestyNote: RESTAURANT_AUDIT_HONESTY_NOTE,
    ...(researchRef ? { researchRef } : {}),
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean {
  const keys = Object.keys(value);
  return keys.length === expectedKeys.length
    && keys.every((key) => expectedKeys.includes(key));
}

function matchesImprovementArea(
  value: unknown,
  expected: RestaurantAuditImprovementArea,
): boolean {
  if (!isPlainObject(value) || !hasOnlyKeys(value, [
    "key",
    "label",
    "kind",
    "priority",
    "potentialPoints",
    "summary",
    "recommendedAction",
  ])) return false;
  return value.key === expected.key
    && value.label === expected.label
    && value.kind === expected.kind
    && value.priority === expected.priority
    && value.potentialPoints === expected.potentialPoints
    && value.summary === expected.summary
    && value.recommendedAction === expected.recommendedAction;
}

function matchesFixFirstItem(
  value: unknown,
  expected: RestaurantAuditFixFirstItem,
): boolean {
  if (!isPlainObject(value) || !hasOnlyKeys(value, [
    "key",
    "title",
    "reason",
    "action",
  ])) return false;
  return value.key === expected.key
    && value.title === expected.title
    && value.reason === expected.reason
    && value.action === expected.action;
}

function matchesStringArray(value: string[], expected: string[]): boolean {
  return value.length === expected.length
    && value.every((item, index) => item === expected[index]);
}

export function isRestaurantAuditSnapshot(
  value: unknown,
): value is RestaurantAuditSnapshot {
  if (!isPlainObject(value)) return false;
  let researchRef: RestaurantAuditResearchRef | undefined;
  try {
    researchRef = normalizedResearchRef(value.researchRef);
  } catch {
    return false;
  }
  if (!hasOnlyKeys(value, [
    "engineVersion",
    "schemaVersion",
    "overallScore",
    "maxScore",
    "evidenceCoverage",
    "confidence",
    "categories",
    "improvementAreas",
    "fixFirst",
    "plan",
    "generatedAt",
    "honestyNote",
    ...(researchRef ? ["researchRef"] : []),
  ])) return false;
  if (
    value.engineVersion !== RESTAURANT_AUDIT_ENGINE_VERSION ||
    value.schemaVersion !== RESTAURANT_AUDIT_SCHEMA_VERSION ||
    !Number.isInteger(value.overallScore) ||
    (value.overallScore as number) < 0 ||
    (value.overallScore as number) > 100 ||
    value.maxScore !== 100 ||
    !Number.isInteger(value.evidenceCoverage) ||
    (value.evidenceCoverage as number) < 0 ||
    (value.evidenceCoverage as number) > 100 ||
    !["low", "medium", "high"].includes(String(value.confidence)) ||
    typeof value.generatedAt !== "string" ||
    !Number.isFinite(Date.parse(value.generatedAt)) ||
    typeof value.honestyNote !== "string"
  ) {
    return false;
  }

  if (!Array.isArray(value.categories) || value.categories.length !== 6) {
    return false;
  }
  const seenKeys = new Set<string>();
  for (const category of value.categories) {
    if (!isPlainObject(category)) return false;
    if (
      !hasOnlyKeys(category, [
        "key",
        "label",
        "weight",
        "status",
        "score",
        "evidenceUrl",
        "note",
      ]) ||
      typeof category.key !== "string" ||
      !categoryKeySet.has(category.key) ||
      seenKeys.has(category.key) ||
      typeof category.label !== "string" ||
      !Number.isInteger(category.weight) ||
      !statusSet.has(String(category.status)) ||
      !Number.isInteger(category.score) ||
      (category.evidenceUrl !== null && typeof category.evidenceUrl !== "string") ||
      (category.note !== null && typeof category.note !== "string")
    ) {
      return false;
    }
    const definition = RESTAURANT_AUDIT_CATEGORY_DEFINITIONS.find(
      (item) => item.key === category.key,
    );
    const categoryScore = category.score as number;
    if (
      !definition ||
      category.label !== definition.label ||
      category.weight !== definition.weight ||
      (category.status === "unknown" && categoryScore !== 0) ||
      (category.status === "confirmed_present" && categoryScore !== definition.weight) ||
      (category.status === "confirmed_missing"
        && (categoryScore < 0 || categoryScore >= definition.weight))
    ) {
      return false;
    }
    seenKeys.add(category.key);
  }

  if (
    !Array.isArray(value.improvementAreas) ||
    !Array.isArray(value.fixFirst) ||
    !isPlainObject(value.plan) ||
    !hasOnlyKeys(value.plan, ["days_0_30", "days_31_60", "days_61_90"]) ||
    !isStringArray(value.plan.days_0_30) ||
    !isStringArray(value.plan.days_31_60) ||
    !isStringArray(value.plan.days_61_90)
  ) {
    return false;
  }

  const categories = value.categories as RestaurantAuditCategorySnapshot[];
  let expected: RestaurantAuditSnapshot;
  try {
    expected = generateRestaurantAuditSnapshot({
      generatedAt: value.generatedAt,
      researchRef,
      categories: Object.fromEntries(
        categories.map((category) => [
          category.key,
          {
            status: category.status,
            score: category.score,
            evidenceUrl: category.evidenceUrl,
            note: category.note,
          },
        ]),
      ),
    });
  } catch {
    return false;
  }

  if (
    value.overallScore !== expected.overallScore ||
    value.evidenceCoverage !== expected.evidenceCoverage ||
    value.confidence !== expected.confidence ||
    value.generatedAt !== expected.generatedAt ||
    value.honestyNote !== expected.honestyNote ||
    categories.some((category, index) => {
      const expectedCategory = expected.categories[index];
      return !expectedCategory
        || category.key !== expectedCategory.key
        || category.label !== expectedCategory.label
        || category.weight !== expectedCategory.weight
        || category.status !== expectedCategory.status
        || category.score !== expectedCategory.score
        || category.evidenceUrl !== expectedCategory.evidenceUrl
        || category.note !== expectedCategory.note;
    }) ||
    value.improvementAreas.length !== expected.improvementAreas.length ||
    value.improvementAreas.some((item, index) =>
      !matchesImprovementArea(item, expected.improvementAreas[index])) ||
    value.fixFirst.length !== expected.fixFirst.length ||
    value.fixFirst.some((item, index) =>
      !matchesFixFirstItem(item, expected.fixFirst[index])) ||
    !matchesStringArray(value.plan.days_0_30, expected.plan.days_0_30) ||
    !matchesStringArray(value.plan.days_31_60, expected.plan.days_31_60) ||
    !matchesStringArray(value.plan.days_61_90, expected.plan.days_61_90)
  ) {
    return false;
  }
  return true;
}

export function parseRestaurantAuditSnapshot(
  value: unknown,
): RestaurantAuditSnapshot | null {
  let candidate = value;
  if (typeof value === "string") {
    try {
      candidate = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  return isRestaurantAuditSnapshot(candidate) ? candidate : null;
}
