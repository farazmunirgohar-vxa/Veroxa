import { assertMomoEvidenceUse, type MomoEvidenceClass } from "./momo-evidence-boundary.ts";
import { momoSha256 } from "./momo-media-workflow.ts";

export const MOMO_AI_PROMPT_VERSION = "momo-content-contract-v1" as const;
export const MOMO_AI_MODEL_CONTRACT = "provider-neutral-structured-output-v1" as const;
export const MOMO_AI_CHANNELS = ["facebook", "instagram", "google_business"] as const;

export type MomoAiChannel = typeof MOMO_AI_CHANNELS[number];

export type MomoAiRehearsalInput = {
  restaurantId: string;
  restaurantName: string;
  objective: string;
  facts: Array<{ key: string; value: string; evidenceClass: MomoEvidenceClass }>;
  channels: MomoAiChannel[];
};

export type MomoAiRehearsal = {
  schemaVersion: "momo-ai-contract-rehearsal-v1";
  promptVersion: typeof MOMO_AI_PROMPT_VERSION;
  modelContract: typeof MOMO_AI_MODEL_CONTRACT;
  executionMode: "rehearsal";
  providerCalled: false;
  externalWriteAllowed: false;
  humanReviewRequired: true;
  inputSnapshot: {
    restaurantId: string;
    restaurantName: string;
    objective: string;
    facts: MomoAiRehearsalInput["facts"];
    channels: MomoAiChannel[];
  };
  outputSnapshot: {
    caption: string;
    altText: string;
    channelVariants: Record<MomoAiChannel, string>;
    claims: string[];
  };
  groundingReport: {
    allClaimsSupported: true;
    unsupportedClaims: [];
    factKeysUsed: string[];
    blockedLiveReasons: string[];
  };
  inputSha256: string;
  outputSha256: string;
  evidenceKeys: string[];
};

const canonical = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
};

const unique = <T,>(items: T[]) => [...new Set(items)];

export function validateMomoAiRehearsalInput(input: MomoAiRehearsalInput): string[] {
  const problems: string[] = [];
  if (!input.restaurantId) problems.push("restaurant_scope_required");
  if (input.restaurantName.trim().length < 3 || input.restaurantName.length > 120) problems.push("restaurant_name_required");
  if (input.objective.trim().length < 10 || input.objective.length > 500) problems.push("bounded_objective_required");
  if (input.facts.length === 0 || input.facts.length > 30) problems.push("bounded_fact_snapshot_required");
  for (const fact of input.facts) {
    if (!/^[a-z0-9_:-]{3,100}$/.test(fact.key) || !fact.value.trim() || fact.value.length > 500) problems.push("valid_fact_required");
    try { assertMomoEvidenceUse(fact.evidenceClass, "preconnection_rehearsal"); } catch { problems.push("classified_fact_required"); }
  }
  if (input.channels.length !== MOMO_AI_CHANNELS.length
    || unique(input.channels).length !== MOMO_AI_CHANNELS.length
    || !MOMO_AI_CHANNELS.every((channel) => input.channels.includes(channel))) problems.push("all_preconnection_channels_required");
  return unique(problems);
}

export async function runMomoAiContractRehearsal(input: MomoAiRehearsalInput): Promise<MomoAiRehearsal> {
  const problems = validateMomoAiRehearsalInput(input);
  if (problems.length) throw new Error(problems.join(","));
  const facts = [...input.facts].sort((left, right) => left.key.localeCompare(right.key));
  const channels = [...MOMO_AI_CHANNELS];
  const inputSnapshot = {
    restaurantId: input.restaurantId,
    restaurantName: input.restaurantName.trim(),
    objective: input.objective.trim(),
    facts,
    channels,
  };
  const caption = `${input.restaurantName.trim()} content workflow rehearsal. Final wording, facts, media, timing, and account actions require Team review and real-owner approval before public use.`;
  const outputSnapshot = {
    caption,
    altText: "Synthetic Momo workflow card used only for Team preconnection testing.",
    channelVariants: {
      facebook: caption,
      instagram: caption,
      google_business: caption,
    },
    claims: [],
  };
  const groundingReport = {
    allClaimsSupported: true as const,
    unsupportedClaims: [] as [],
    factKeysUsed: facts.map((fact) => fact.key),
    blockedLiveReasons: [
      "real_owner_evidence_required",
      "human_review_required",
      "provider_connection_required",
      "exact_action_consent_required",
      "external_writes_disabled",
    ],
  };
  return {
    schemaVersion: "momo-ai-contract-rehearsal-v1",
    promptVersion: MOMO_AI_PROMPT_VERSION,
    modelContract: MOMO_AI_MODEL_CONTRACT,
    executionMode: "rehearsal",
    providerCalled: false,
    externalWriteAllowed: false,
    humanReviewRequired: true,
    inputSnapshot,
    outputSnapshot,
    groundingReport,
    inputSha256: await momoSha256(canonical(inputSnapshot)),
    outputSha256: await momoSha256(canonical(outputSnapshot)),
    evidenceKeys: ["google_people_first_content", "ftc_truthful_advertising"],
  };
}
