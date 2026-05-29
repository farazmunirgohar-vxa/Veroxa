/**
 * aiDraftClient.ts — frontend helper for the server-side `/api/ai/draft`
 * endpoint.
 *
 * SAFETY:
 *   - This file NEVER sees OPENAI_API_KEY. The key stays server-side only.
 *   - If the endpoint reports "not_configured" / "error", or the network call
 *     fails entirely, callers should keep using the local rule-based preview
 *     engine. The returned `draft` is still a usable rule-based fallback when
 *     the server provides one.
 *
 * This client sits ALONGSIDE the existing aiAgentPreviewEngine — it does not
 * replace it.
 */

export type AiDraftMode =
  | "ai"
  | "rule_based_fallback"
  | "not_configured"
  | "error";

export type AiDraftType =
  | "content_angle"
  | "caption_drafts"
  | "client_update"
  | "report_summary"
  | "clarification_question"
  | "lead_summary"
  | "lead_outreach_email"
  | "lead_follow_up_email"
  | "lead_call_script"
  | "lead_meeting_agenda";

export interface AiDraftContext {
  restaurantName?: string;
  clientName?: string;
  signals?: string[];
  workItemSummary?: string;
  workType?: string;
  cadence?: "weekly" | "monthly";
  hasPublishedPosts?: boolean;
  hasMetrics?: boolean;
  location?: string;
  opportunityLabel?: string;
  recommendedPackage?: string;
  websiteFound?: boolean;
  menuLinkFound?: boolean;
  socialFound?: boolean;
  /** Lead outreach context (cautious, value-based drafts only). */
  segmentLabel?: string;
  recommendedSalesAngle?: string;
  topReasons?: string[];
  contactMethod?: string;
}

export interface AiDraftPayload {
  text: string;
  items?: string[];
  secondaryItems?: string[];
  fields?: Record<string, string>;
}

export interface AiDraftResponse {
  mode: AiDraftMode;
  draftType: AiDraftType;
  draft: AiDraftPayload | null;
  warnings: string[];
  humanReviewRequired: true;
  message?: string;
}

const MODES: AiDraftMode[] = [
  "ai",
  "rule_based_fallback",
  "not_configured",
  "error",
];

/** Human-friendly label for the AI draft mode, safe for team surfaces. */
export function aiDraftModeLabel(mode: AiDraftMode): string {
  switch (mode) {
    case "ai":
      return "AI";
    case "rule_based_fallback":
      return "Fallback";
    case "not_configured":
      return "Not configured";
    case "error":
      return "Fallback (error)";
  }
}

export interface GenerateAiDraftRequest {
  draftType: AiDraftType;
  context: AiDraftContext;
}

export async function generateAiDraftClient(
  request: GenerateAiDraftRequest,
): Promise<AiDraftResponse> {
  try {
    const response = await fetch("/api/ai/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return {
        mode: "rule_based_fallback",
        draftType: request.draftType,
        draft: null,
        warnings: [
          "AI draft service is unavailable. Showing the rule-based preview.",
        ],
        humanReviewRequired: true,
        message: "AI draft is temporarily unavailable.",
      };
    }

    const data = (await response.json()) as AiDraftResponse;
    if (data && MODES.includes(data.mode)) {
      return data;
    }
    return {
      mode: "rule_based_fallback",
      draftType: request.draftType,
      draft: null,
      warnings: ["AI draft response was not understood."],
      humanReviewRequired: true,
      message: "AI draft response was not understood.",
    };
  } catch {
    return {
      mode: "rule_based_fallback",
      draftType: request.draftType,
      draft: null,
      warnings: ["Could not reach the AI draft service."],
      humanReviewRequired: true,
      message:
        "Could not reach the AI draft service. The rule-based preview is still active.",
    };
  }
}
