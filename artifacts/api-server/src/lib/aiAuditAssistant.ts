import { logger } from "./logger";

export interface AiAuditRestaurantProfile {
  restaurantName: string;
  city?: string;
  state?: string;
  cuisineType?: string;
  googleListingUrl?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  menuOrderingUrl?: string;
  otherUrl?: string;
}

export interface AiAuditGrowthReportSection {
  id: string;
  title: string;
  currentSignal: string;
  whyItMatters: string;
  veroxaRecommendation: string;
  sourceLabel: string;
}

export interface AiAuditSummary {
  totalScore?: number;
  maxScore?: number;
  gradeLabel?: string;
  gradeDescription?: string;
  confidenceLabel?: string;
  confidenceExplanation?: string;
  recommendationPackageLabel?: string;
  recommendationReason?: string;
  topWeakSpots?: { title: string; whyItMatters: string }[];
  topOpportunities?: { title: string; whyItMatters: string }[];
}

export interface AiAuditDraft {
  executiveSummary: string;
  topOpportunities: string[];
  veroxaFixPlan: string;
  manualReviewNeeded: string[];
  ownerFriendlyClosing: string;
}

export type AiAuditDraftMode = "ai" | "not_configured" | "error";

export interface AiAuditDraftResult {
  mode: AiAuditDraftMode;
  aiDraft: AiAuditDraft | null;
  message?: string;
}

export interface GenerateAiAuditDraftInput {
  restaurantProfile: AiAuditRestaurantProfile;
  growthReportSections: AiAuditGrowthReportSection[];
  auditSummary: AiAuditSummary;
}

const EMPTY_DRAFT: AiAuditDraft = {
  executiveSummary: "",
  topOpportunities: [],
  veroxaFixPlan: "",
  manualReviewNeeded: [],
  ownerFriendlyClosing: "",
};

function buildSystemPrompt(): string {
  return [
    "You are an assistant that helps Veroxa, a restaurant growth agency, turn a rule-based restaurant audit into a clearer, owner-friendly DRAFT summary.",
    "Rules you MUST follow:",
    "- Use ONLY the audit signals provided in the user message. Do not invent metrics, rankings, ad spend, reviews, revenue, traffic, follower counts, or verification claims.",
    "- If a fact is not in the provided signals, do NOT state it. Instead, add a line to 'manualReviewNeeded'.",
    "- Never guarantee outcomes (walk-ins, revenue, rankings, reviews, viral posts, sales). Preserve uncertainty.",
    "- Separate 'found', 'not found', and 'manual review needed' signals — never blur them together.",
    "- Tone: consultative, lenient, supportive. Plain language a restaurant owner can follow. No hype.",
    "- This is a DRAFT for human review, not a final report.",
    "- You do not have access to ChatGPT history, the live internet, or anything beyond the JSON payload in the user message.",
    "Respond ONLY with valid JSON matching this shape:",
    '{"executiveSummary": string, "topOpportunities": string[3], "veroxaFixPlan": string, "manualReviewNeeded": string[], "ownerFriendlyClosing": string}',
    "topOpportunities must contain exactly 3 short items. manualReviewNeeded can be empty if everything is covered.",
  ].join("\n");
}

function buildUserPrompt(input: GenerateAiAuditDraftInput): string {
  return [
    "Here is the Veroxa audit data. Use only this:",
    "```json",
    JSON.stringify(
      {
        restaurantProfile: input.restaurantProfile,
        auditSummary: input.auditSummary,
        growthReportSections: input.growthReportSections,
      },
      null,
      2,
    ),
    "```",
    "Produce the JSON draft now.",
  ].join("\n");
}

function safeParseDraft(raw: string): AiAuditDraft | null {
  const trimmed = raw.trim();
  const candidate = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "")
    : trimmed;
  try {
    const parsed = JSON.parse(candidate) as Partial<AiAuditDraft>;
    if (typeof parsed !== "object" || parsed === null) return null;
    return {
      executiveSummary:
        typeof parsed.executiveSummary === "string"
          ? parsed.executiveSummary
          : "",
      topOpportunities: Array.isArray(parsed.topOpportunities)
        ? parsed.topOpportunities
            .filter((v): v is string => typeof v === "string")
            .slice(0, 3)
        : [],
      veroxaFixPlan:
        typeof parsed.veroxaFixPlan === "string" ? parsed.veroxaFixPlan : "",
      manualReviewNeeded: Array.isArray(parsed.manualReviewNeeded)
        ? parsed.manualReviewNeeded.filter(
            (v): v is string => typeof v === "string",
          )
        : [],
      ownerFriendlyClosing:
        typeof parsed.ownerFriendlyClosing === "string"
          ? parsed.ownerFriendlyClosing
          : "",
    };
  } catch {
    return null;
  }
}

export async function generateAiAuditDraft(
  input: GenerateAiAuditDraftInput,
): Promise<AiAuditDraftResult> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey || apiKey.trim() === "") {
    return {
      mode: "not_configured",
      aiDraft: null,
      message:
        "AI summary is not configured yet. The rule-based report is still available.",
    };
  }

  const model = process.env["OPENAI_AUDIT_MODEL"] ?? "gpt-4o-mini";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: buildUserPrompt(input) },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      logger.warn(
        { status: response.status },
        "OpenAI audit draft request failed",
      );
      return {
        mode: "error",
        aiDraft: { ...EMPTY_DRAFT },
        message: "AI draft is temporarily unavailable. Please try again later.",
      };
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content ?? "";
    const draft = safeParseDraft(content);

    if (!draft) {
      logger.warn("OpenAI audit draft returned unparseable content");
      return {
        mode: "error",
        aiDraft: { ...EMPTY_DRAFT },
        message: "AI draft could not be parsed. Please try again.",
      };
    }

    return { mode: "ai", aiDraft: draft };
  } catch (err) {
    logger.warn({ err }, "OpenAI audit draft threw");
    return {
      mode: "error",
      aiDraft: { ...EMPTY_DRAFT },
      message: "AI draft is temporarily unavailable. Please try again later.",
    };
  }
}
