/**
 * aiMediaPipelineContracts.ts — type-only contracts for the FUTURE AI media
 * pipeline (see docs/AI_MEDIA_PIPELINE_PLAN.md).
 *
 * IMPORTANT — these are planning contracts ONLY:
 *   - No runtime code. No network. No OpenAI SDK import.
 *   - Not wired into any page, route, or call site.
 *   - They exist so future AI media work has a stable, documented shape.
 *
 * Hard guardrails captured by these types (enforced later, in server code):
 *   - All AI output is a DRAFT requiring team approval before any client sees it.
 *   - OPENAI_API_KEY is server-side only (Vercel environment variables / local env); never in VITE_*,
 *     never in frontend code, never committed.
 */

/** The staged rollout from the plan (Stage A → H). */
export type AiMediaStage =
  | "config_check" // A — server-only health/config check
  | "caption_from_text" // B — team-only caption draft from metadata/text
  | "storage_upload" // C — real file bytes to object storage
  | "image_quality_analysis" // D
  | "caption_from_image" // E
  | "image_enhancement" // F — faithful correction only
  | "team_approval" // G
  | "scheduling"; // H — later

/** The planned AI agents. */
export type AiMediaAgent =
  | "media_review"
  | "image_enhancement"
  | "creative_variant"
  | "caption"
  | "brand_voice_compliance"
  | "team_approval_gate";

/** Every AI artifact is a draft until a human approves it. */
export type AiDraftState =
  | "draft" // produced by an agent, not yet seen by the team
  | "team_reviewing"
  | "approved" // team-approved; only now may it reach a client/channel
  | "rejected";

/**
 * Food-image ethics flags. Enhancement may only faithfully correct the real
 * photographed dish — never misrepresent it.
 */
export interface FoodImageEthicsCheck {
  enhancesRealFoodOnly: boolean;
  noFakeIngredients: boolean;
  noFakePortionSize: boolean;
  noFalseHealthOrDietaryClaims: boolean; // halal / organic / health
  noInventedPromotions: boolean;
  noMisleadingEdits: boolean;
}

/** Result of the server-only config/health check (Stage A). */
export interface AiConfigCheckResult {
  /** Whether OPENAI_API_KEY is present server-side. Never the key itself. */
  serverKeyConfigured: boolean;
  reachable: boolean;
  checkedAt: string;
  note: string;
}

/** A caption draft — never auto-posted, never shown raw to the client. */
export interface CaptionDraft {
  id: string;
  agent: Extract<AiMediaAgent, "caption">;
  text: string;
  state: AiDraftState;
  /** Internal-only rationale; never surfaced to clients. */
  internalNote?: string;
}

/** An image-quality assessment draft (Stage D). */
export interface ImageQualityAssessment {
  id: string;
  agent: Extract<AiMediaAgent, "media_review">;
  usable: boolean;
  /** Internal score; never shown to the client. */
  qualityScore: number;
  issues: string[];
  state: AiDraftState;
}

/** An image-enhancement proposal (Stage F) — faithful correction only. */
export interface ImageEnhancementProposal {
  id: string;
  agent: Extract<AiMediaAgent, "image_enhancement">;
  /** Storage reference to the enhanced asset (no bytes here). */
  enhancedAssetRef: string;
  ethics: FoodImageEthicsCheck;
  state: AiDraftState;
}

/** The team approval decision — the single human gate (Stage G). */
export interface TeamApprovalDecision {
  submissionId: string;
  approvedCaptionId: string | null;
  approvedImageRef: string | null;
  decidedByLabel: string;
  decidedAt: string;
  /** Internal-only note; never surfaced to the client. */
  internalNote?: string;
}
