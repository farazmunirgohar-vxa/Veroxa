import { MOMO_BRAND_AI_RULE_ITEMS } from "@/lib/momoBrandAi/momoBrandAiRules";
import { MOMO_BUSINESS_TRUTH_REVIEW_ITEMS } from "@/lib/momoBusinessTruth/momoBusinessTruthReview";
import { MOMO_MEDIA_CONTENT_INVENTORY_ITEMS } from "@/lib/momoMediaContent/momoMediaContentInventory";

export type IntelligenceVerificationStatus = "Verified" | "Needs Owner Confirmation" | "Unknown";
export type IntelligenceReadinessStatus = "Ready" | "Needs Review" | "Blocked" | "Internal Only";

export interface RestaurantIdentityFact {
  label: string;
  value: string;
  status: IntelligenceVerificationStatus;
}

export interface IntelligenceSummarySection {
  title: string;
  href?: string;
  items: string[];
}

export interface OperationalReadinessItem {
  label: string;
  status: IntelligenceReadinessStatus;
  note: string;
}

const businessTruthItems = MOMO_BUSINESS_TRUTH_REVIEW_ITEMS;
const mediaItems = MOMO_MEDIA_CONTENT_INVENTORY_ITEMS;
const brandRules = MOMO_BRAND_AI_RULE_ITEMS;

const labelsFor = (matches: (value: string) => boolean) =>
  businessTruthItems.filter((item) => matches(`${item.category} ${item.label} ${item.status}`)).map((item) => item.label);

export const momoRestaurantIdentityFacts: RestaurantIdentityFact[] = [
  {
    label: "Restaurant name",
    value: "Momo's House / Momo House San Antonio appears in internal pilot context.",
    status: "Needs Owner Confirmation",
  },
  {
    label: "Address",
    value: "Prefilled from earlier internal Momo work where available; not owner-confirmed for public use.",
    status: "Needs Owner Confirmation",
  },
  {
    label: "Phone",
    value: "Prefilled if present in internal profile context; unconfirmed for public use.",
    status: "Needs Owner Confirmation",
  },
  {
    label: "Hours",
    value: "Unconfirmed.",
    status: "Needs Owner Confirmation",
  },
  {
    label: "Cuisine",
    value: "Momo / internal niche-craving positioning only until owner-confirmed.",
    status: "Needs Owner Confirmation",
  },
  {
    label: "Website status",
    value: "Unconfirmed website/domain state.",
    status: "Needs Owner Confirmation",
  },
];

export const momoBusinessTruthIntelligence: IntelligenceSummarySection = {
  title: "Business Truth",
  href: "/team/momo-business-truth",
  items: [
    `Confirmed facts: ${businessTruthItems.filter((item) => item.status === "owner_confirmed").length} owner-confirmed items are documented for public use.`,
    `Unconfirmed facts: ${businessTruthItems.filter((item) => ["prefilled_unconfirmed", "needs_owner_confirmation", "internally_known_only"].includes(item.status)).length} items need owner confirmation or remain internal-only.`,
    `Blocked public claims: ${businessTruthItems.filter((item) => item.status === "blocked" || item.status === "unsafe_for_public_use").length} items are blocked for public/customer-visible use.`,
    `Sensitive claims: ${labelsFor((value) => value.includes("Sensitive Claims")).join(", ") || "None verified for public use."}`,
  ],
};

export const momoMediaInventoryIntelligence: IntelligenceSummarySection = {
  title: "Media Inventory",
  href: "/team/momo-media-content",
  items: [
    `Available: ${mediaItems.filter((item) => item.status === "available_internal_context_only").length} items are available only as internal context.`,
    `Missing: ${mediaItems.filter((item) => item.status === "missing").length} required media inputs are missing.`,
    `Needs usage rights: ${mediaItems.filter((item) => item.status === "needs_usage_rights_confirmation").length} media items need rights confirmation.`,
    `Blocked: ${mediaItems.filter((item) => item.status === "blocked_for_public_use").length} media items are blocked for public use.`,
  ],
};

export const momoBrandVoiceIntelligence: IntelligenceSummarySection = {
  title: "Brand Voice",
  href: "/team/momo-brand-ai-rules",
  items: [
    "Current brand personality: warm, simple, crave-focused, local, approachable, first-timer friendly, and food-forward.",
    `Content pillars: ${brandRules.filter((item) => item.category === "Content Pillar Prompt Rules").map((item) => item.title).join(", ")}.`,
    "AI restrictions: no final customer-facing copy, no publish-ready output, no invented menu, prices, offers, hours, claims, availability, reviews, metrics, or media descriptions.",
    "Tone rules: friendly and helpful is allowed internally; fake urgency, guarantees, sensitive claims, exaggerated promises, and pressure language are blocked.",
  ],
};

export const momoOperationalReadiness: OperationalReadinessItem[] = [
  { label: "Business Truth", status: "Blocked", note: "Owner confirmation is still required for public/customer-visible use." },
  { label: "Media", status: "Blocked", note: "Missing assets and usage-rights confirmation block public use." },
  { label: "Brand Rules", status: "Internal Only", note: "Static internal rules exist; they do not approve public copy." },
  { label: "AI", status: "Blocked", note: "No AI generation is activated and no AI output is generated here." },
  { label: "Reports", status: "Needs Review", note: "Reports remain internal review surfaces until safe verified inputs exist." },
  { label: "Dry Run", status: "Internal Only", note: "Dry run remains Team-only and does not activate the pilot." },
  { label: "Readiness", status: "Blocked", note: "Activation and owner walkthrough remain blocked without explicit Faraz approval." },
];

export const momoCurrentRisks = [
  "Business truth incomplete",
  "Media rights incomplete",
  "Sensitive claims blocked",
  "Owner confirmation pending",
  "Real auth disabled",
  "Activation blocked",
];

export const momoSafeNextActions = {
  allowed: [
    { label: "Review business truth", href: "/team/momo-business-truth" },
    { label: "Review media", href: "/team/momo-media-content" },
    { label: "Review brand rules", href: "/team/momo-brand-ai-rules" },
    { label: "Review readiness", href: "/team/momo/readiness" },
    { label: "Review reports", href: "/team/momo" },
    { label: "Review dry run", href: "/team/momo-pilot-prep" },
  ],
  blocked: ["Contact owner", "Publish", "Generate AI", "Activate pilot", "Connect platforms"],
};

export const momoRestaurantIntelligenceBoard = {
  route: "/team/momo/intelligence",
  safetyCopy: [
    "Restaurant Intelligence is internal only.",
    "No activation.",
    "No publishing.",
    "No AI generation.",
    "Business truth requires owner confirmation.",
    "Media requires usage rights.",
    "Sensitive claims remain blocked.",
    "Owner walkthrough remains blocked.",
    "Future activation requires explicit Faraz approval.",
  ],
  identity: momoRestaurantIdentityFacts,
  businessTruth: momoBusinessTruthIntelligence,
  mediaInventory: momoMediaInventoryIntelligence,
  brandVoice: momoBrandVoiceIntelligence,
  operationalReadiness: momoOperationalReadiness,
  currentRisks: momoCurrentRisks,
  safeNextActions: momoSafeNextActions,
};
