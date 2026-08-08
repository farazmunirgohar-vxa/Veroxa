export const MOMO_AI_CONTROL_POLICY_VERSION =
  "momo-ai-control-2026-08-08-v1" as const;
export const MOMO_AI_TOOL_REGISTRY_VERSION =
  "momo-ai-tools-2026-08-08-v1" as const;
export const MOMO_AI_MAX_AUTOMATIC_MICROUSD = 20_000_000 as const;

export const MOMO_AI_TOOLS = [
  "openai.responses.create",
  "openai.web_search",
  "openai.images.edit",
  "external.publish",
  "external.schedule",
  "external.account.connect",
] as const;

export type MomoAiTool = typeof MOMO_AI_TOOLS[number];
export type MomoAiTaskKind =
  | "content_package_generation"
  | "private_media_assessment"
  | "restaurant_research"
  | "media_improvement"
  | "private_evaluation";
export type MomoAiActorRole = "team" | "system" | "client" | "anonymous";
export type MomoAiConsequence =
  | "read_only_research"
  | "private_draft"
  | "private_media_candidate"
  | "private_evaluation"
  | "external_write";

export type MomoAiTaskPreflightInput = {
  taskKind: string;
  actorRole: string;
  restaurantId: string | null;
  authorizedRestaurantId: string | null;
  requestedTools: readonly string[];
  consequence: string;
  estimatedMicrousd: number;
  authorizedMicrousd: number;
  untrustedDataBoundary: boolean;
  humanReviewRequired: boolean;
  externalActionAuthorized: boolean;
};

export type MomoAiTaskPreflightResult = {
  allowed: boolean;
  decision: "allow" | "deny" | "approval_required";
  reasonCodes: string[];
  policyVersion: typeof MOMO_AI_CONTROL_POLICY_VERSION;
  toolRegistryVersion: typeof MOMO_AI_TOOL_REGISTRY_VERSION;
};

type TaskPolicy = {
  actorRoles: readonly MomoAiActorRole[];
  tools: readonly MomoAiTool[];
  consequence: MomoAiConsequence;
  humanReviewRequired: boolean;
};

const TASK_POLICIES: Record<MomoAiTaskKind, TaskPolicy> = {
  content_package_generation: {
    actorRoles: ["system"],
    tools: ["openai.responses.create"],
    consequence: "private_draft",
    humanReviewRequired: true,
  },
  private_media_assessment: {
    actorRoles: ["team", "client"],
    tools: ["openai.responses.create"],
    consequence: "private_draft",
    humanReviewRequired: true,
  },
  restaurant_research: {
    actorRoles: ["team"],
    tools: ["openai.responses.create", "openai.web_search"],
    consequence: "read_only_research",
    humanReviewRequired: true,
  },
  media_improvement: {
    actorRoles: ["team"],
    tools: ["openai.images.edit"],
    consequence: "private_media_candidate",
    humanReviewRequired: true,
  },
  private_evaluation: {
    actorRoles: ["system"],
    tools: ["openai.responses.create"],
    consequence: "private_evaluation",
    humanReviewRequired: true,
  },
};

const TOOL_REGISTRY = new Set<string>(MOMO_AI_TOOLS);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function exactSet(actual: readonly string[], expected: readonly string[]): boolean {
  return actual.length === expected.length
    && actual.every((value) => expected.includes(value as MomoAiTool));
}

export function evaluateMomoAiTaskPreflight(
  input: MomoAiTaskPreflightInput,
): MomoAiTaskPreflightResult {
  const reasons = new Set<string>();
  const policy = TASK_POLICIES[input.taskKind as MomoAiTaskKind];
  if (!policy) reasons.add("unknown_task");
  if (policy && !policy.actorRoles.includes(input.actorRole as MomoAiActorRole)) {
    reasons.add("actor_role_denied");
  }
  const restaurantId = input.restaurantId?.toLowerCase() || "";
  const authorizedRestaurantId = input.authorizedRestaurantId?.toLowerCase() || "";
  if (!UUID_PATTERN.test(restaurantId) || restaurantId !== authorizedRestaurantId) {
    reasons.add("restaurant_scope_denied");
  }
  if (new Set(input.requestedTools).size !== input.requestedTools.length) {
    reasons.add("duplicate_tool");
  }
  if (input.requestedTools.some((tool) => !TOOL_REGISTRY.has(tool))) {
    reasons.add("unknown_tool");
  }
  if (policy && !exactSet(input.requestedTools, policy.tools)) {
    reasons.add("tool_scope_denied");
  }
  if (policy && input.consequence !== policy.consequence) {
    reasons.add("consequence_denied");
  }
  if (input.consequence === "external_write" || input.externalActionAuthorized) {
    reasons.add("external_action_denied");
  }
  if (!input.untrustedDataBoundary) reasons.add("untrusted_data_boundary_missing");
  if (policy?.humanReviewRequired && !input.humanReviewRequired) {
    reasons.add("human_review_boundary_missing");
  }
  if (!Number.isSafeInteger(input.estimatedMicrousd) || input.estimatedMicrousd < 0
    || !Number.isSafeInteger(input.authorizedMicrousd) || input.authorizedMicrousd < 0
    || input.authorizedMicrousd > MOMO_AI_MAX_AUTOMATIC_MICROUSD) {
    reasons.add("budget_contract_invalid");
  } else if (input.estimatedMicrousd > input.authorizedMicrousd
    || input.estimatedMicrousd > MOMO_AI_MAX_AUTOMATIC_MICROUSD) {
    reasons.add("budget_approval_required");
  }

  const reasonCodes = [...reasons].sort();
  const approvalOnly = reasonCodes.length === 1
    && reasonCodes[0] === "budget_approval_required";
  return {
    allowed: reasonCodes.length === 0,
    decision: reasonCodes.length === 0
      ? "allow"
      : approvalOnly
        ? "approval_required"
        : "deny",
    reasonCodes,
    policyVersion: MOMO_AI_CONTROL_POLICY_VERSION,
    toolRegistryVersion: MOMO_AI_TOOL_REGISTRY_VERSION,
  };
}
