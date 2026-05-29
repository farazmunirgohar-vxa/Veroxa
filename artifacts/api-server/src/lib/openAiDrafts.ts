/**
 * openAiDrafts.ts — safe, server-side AI draft helper for Veroxa.
 *
 * SAFETY MODEL:
 *   - OPENAI_API_KEY is read from the environment ONLY. It is never returned
 *     to the client and never logged.
 *   - If the key is missing, every function returns mode "not_configured"
 *     together with a rule-based fallback draft, so the UI always has usable
 *     content without the model.
 *   - If the model call fails or returns unparseable output, we return mode
 *     "error" together with the same rule-based fallback draft.
 *   - When the key is present and the call succeeds, mode is "ai".
 *
 * The model is only ever asked to DRAFT. It must not publish, message clients,
 * invent metrics, or guarantee outcomes. Every draft requires human review.
 *
 * This sits ALONGSIDE the frontend rule-based preview engine — it does not
 * replace it. If AI is not configured, the existing preview engine still
 * powers the UI.
 */

import { logger } from "./logger";

// ---------------------------------------------------------------------------
// Shared contract
// ---------------------------------------------------------------------------

export type AiDraftMode = "ai" | "rule_based_fallback" | "not_configured" | "error";

export type AiDraftType =
  | "content_angle"
  | "caption_drafts"
  | "client_update"
  | "report_summary"
  | "clarification_question"
  | "lead_summary";

export interface AiDraftContext {
  /** Restaurant or client display name. */
  restaurantName?: string;
  clientName?: string;
  /** Free-form, already-known signals only. Never invented downstream. */
  signals?: string[];
  /** Short description of the work item / media / submission. */
  workItemSummary?: string;
  /** Submission or work type, e.g. "media", "menu_update", "reporting". */
  workType?: string;
  /** Reporting cadence when relevant. */
  cadence?: "weekly" | "monthly";
  /** True only when real published posts exist for the period. */
  hasPublishedPosts?: boolean;
  /** True only when real performance metrics are connected. */
  hasMetrics?: boolean;
  /** City/state for lead summaries. */
  location?: string;
  /** Opportunity / grade label for lead summaries. */
  opportunityLabel?: string;
  /** Recommended package label for lead summaries. */
  recommendedPackage?: string;
  /** Presence flags for lead summaries. */
  websiteFound?: boolean;
  menuLinkFound?: boolean;
  socialFound?: boolean;
}

export interface AiDraftPayload {
  /** Headline draft text — present for every draft type. */
  text: string;
  /** Optional list section, e.g. caption variants or talking points. */
  items?: string[];
  /** Optional secondary list, e.g. questions to ask. */
  secondaryItems?: string[];
  /** Optional structured fields used by client-update style drafts. */
  fields?: Record<string, string>;
}

export interface AiDraftResult {
  mode: AiDraftMode;
  draftType: AiDraftType;
  draft: AiDraftPayload;
  warnings: string[];
  humanReviewRequired: true;
  message?: string;
}

export interface GenerateAiDraftInput {
  draftType: AiDraftType;
  context: AiDraftContext;
}

const STANDARD_WARNINGS = [
  "AI-assisted draft — human/team review required before anything is shared.",
  "Performance numbers are never invented; only provided signals are used.",
];

// ---------------------------------------------------------------------------
// Rule-based fallbacks — deterministic, no network. These are the source of
// truth when AI is not configured or fails.
// ---------------------------------------------------------------------------

function nameOf(ctx: AiDraftContext): string {
  return (
    ctx.restaurantName?.trim() ||
    ctx.clientName?.trim() ||
    "this restaurant"
  );
}

function ruleBasedDraft(input: GenerateAiDraftInput): AiDraftPayload {
  const { draftType, context: ctx } = input;
  const name = nameOf(ctx);

  switch (draftType) {
    case "content_angle":
      return {
        text: `Lead with a single strong dish for ${name} — one clear hero shot, owner-voice caption, no hype.`,
        fields: {
          rationale:
            "A focused single-subject post is the most reliable format when only basic signals are available.",
        },
      };

    case "caption_drafts":
      return {
        text: `Caption drafts for ${name} (team review required before use):`,
        items: [
          `Fresh from our kitchen today. Come see what's on at ${name}.`,
          `A little something we're proud of. Stop by ${name} this week.`,
          `Made with care, served with a smile — ${name}.`,
        ],
      };

    case "client_update":
      return {
        text: `Weekly update draft for ${name}.`,
        fields: {
          whatVeroxaReviewed:
            "Reviewed this week's uploads, messages, and open work.",
          whatIsBeingPrepared:
            "Preparing the next batch of content for team review.",
          whatClientNeedsToProvide:
            ctx.signals && ctx.signals.length > 0
              ? "A short note on any new photos helps us caption them accurately."
              : "Nothing required from you right now.",
          nextPlannedAction:
            "Finalize this week's content and keep the posting cadence on track.",
        },
      };

    case "report_summary": {
      const cadence = ctx.cadence ?? "weekly";
      const base =
        cadence === "weekly"
          ? `This week Veroxa reviewed uploads, prepared the next batch of posts, and kept ${name}'s profile current.`
          : `This month Veroxa kept ${name}'s posting cadence on track and aligned content with the strongest dishes.`;
      return {
        text: `${base} Final review by the Veroxa team.`,
        fields: ctx.hasMetrics
          ? {}
          : {
              metricsNote:
                "Performance metrics are not connected yet. This draft is based on workflow activity only.",
            },
      };
    }

    case "clarification_question":
      return {
        text: `Suggested follow-up for ${name}: ask one short, specific question to confirm scope before drafting (for example, the dish name and the occasion).`,
      };

    case "lead_summary": {
      const where = ctx.location ? ` in ${ctx.location}` : "";
      const gaps: string[] = [];
      if (ctx.websiteFound === false) gaps.push("no clear website presence");
      if (ctx.menuLinkFound === false) gaps.push("no easy-to-find menu link");
      if (ctx.socialFound === false) gaps.push("limited social presence");
      const gapLine =
        gaps.length > 0
          ? `Early signals suggest ${gaps.join(", ")}.`
          : "Their online basics look partly in place, with room to tighten consistency.";
      return {
        text: `${name}${where} looks like a fit for Veroxa.${ctx.opportunityLabel ? ` Opportunity level: ${ctx.opportunityLabel}.` : ""} ${gapLine}`,
        items: [
          ctx.recommendedPackage
            ? `Recommended starting point: ${ctx.recommendedPackage}.`
            : "Start with a simple, consistent content + profile plan.",
          "Veroxa handles editing, captions, and timing so the owner can focus on the restaurant.",
          "First 7 days focus on a clean profile and a steady posting rhythm.",
        ],
        secondaryItems: [
          "What does a typical week look like for posting right now?",
          "Which dishes are you most proud of or sell the most?",
          "Who currently handles photos and social, and how much time does it take?",
        ],
      };
    }

    default:
      return { text: `Draft for ${name}.` };
  }
}

// ---------------------------------------------------------------------------
// Prompt construction — strict, draft-only.
// ---------------------------------------------------------------------------

function buildSystemPrompt(draftType: AiDraftType): string {
  return [
    "You are an assistant that helps Veroxa, a restaurant growth agency, prepare owner-friendly DRAFTS.",
    "Rules you MUST follow:",
    "- Use ONLY the data provided in the user message. Do not invent metrics, reviews, revenue, reach, follower counts, rankings, or verification claims.",
    "- Never guarantee outcomes (walk-ins, sales, rankings, reviews, viral posts).",
    "- Do not claim anything was verified, published, or sent unless the provided data says so.",
    "- No medical/health claims. No discounts, specials, halal/authentic/family-owned, or menu items unless explicitly provided.",
    "- Keep language simple and calm — written for a restaurant owner.",
    "- This is a DRAFT for human/team review, never a final or client-sent message.",
    `- The requested draft type is: ${draftType}.`,
    "Respond ONLY with valid JSON matching this shape:",
    '{"text": string, "items"?: string[], "secondaryItems"?: string[], "fields"?: {[key: string]: string}}',
  ].join("\n");
}

function buildUserPrompt(input: GenerateAiDraftInput): string {
  return [
    "Here is the only data you may use:",
    "```json",
    JSON.stringify(
      { draftType: input.draftType, context: input.context },
      null,
      2,
    ),
    "```",
    "Produce the JSON draft now.",
  ].join("\n");
}

function safeParsePayload(raw: string): AiDraftPayload | null {
  const trimmed = raw.trim();
  const candidate = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "")
    : trimmed;
  try {
    const parsed = JSON.parse(candidate) as Partial<AiDraftPayload>;
    if (typeof parsed !== "object" || parsed === null) return null;
    if (typeof parsed.text !== "string" || parsed.text.trim() === "")
      return null;

    const payload: AiDraftPayload = { text: parsed.text };

    if (Array.isArray(parsed.items)) {
      payload.items = parsed.items.filter(
        (v): v is string => typeof v === "string",
      );
    }
    if (Array.isArray(parsed.secondaryItems)) {
      payload.secondaryItems = parsed.secondaryItems.filter(
        (v): v is string => typeof v === "string",
      );
    }
    if (
      parsed.fields &&
      typeof parsed.fields === "object" &&
      !Array.isArray(parsed.fields)
    ) {
      const fields: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed.fields)) {
        if (typeof v === "string") fields[k] = v;
      }
      payload.fields = fields;
    }
    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function generateAiDraft(
  input: GenerateAiDraftInput,
): Promise<AiDraftResult> {
  const fallback = ruleBasedDraft(input);
  const warnings = [...STANDARD_WARNINGS];
  if (input.draftType === "report_summary" && !input.context.hasMetrics) {
    warnings.push(
      "Performance metrics are not connected yet. Draft is based on workflow activity only.",
    );
  }

  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey || apiKey.trim() === "") {
    return {
      mode: "not_configured",
      draftType: input.draftType,
      draft: fallback,
      warnings,
      humanReviewRequired: true,
      message:
        "AI drafting is not configured. Showing the rule-based draft instead.",
    };
  }

  const model = process.env["OPENAI_DRAFT_MODEL"] ?? "gpt-4o-mini";

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
          { role: "system", content: buildSystemPrompt(input.draftType) },
          { role: "user", content: buildUserPrompt(input) },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      logger.warn(
        { status: response.status, draftType: input.draftType },
        "OpenAI draft request failed",
      );
      return {
        mode: "error",
        draftType: input.draftType,
        draft: fallback,
        warnings,
        humanReviewRequired: true,
        message: "AI draft is temporarily unavailable. Showing rule-based draft.",
      };
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content ?? "";
    const payload = safeParsePayload(content);

    if (!payload) {
      logger.warn(
        { draftType: input.draftType },
        "OpenAI draft returned unparseable content",
      );
      return {
        mode: "error",
        draftType: input.draftType,
        draft: fallback,
        warnings,
        humanReviewRequired: true,
        message: "AI draft could not be parsed. Showing rule-based draft.",
      };
    }

    return {
      mode: "ai",
      draftType: input.draftType,
      draft: payload,
      warnings,
      humanReviewRequired: true,
    };
  } catch (err) {
    logger.warn({ err, draftType: input.draftType }, "OpenAI draft threw");
    return {
      mode: "error",
      draftType: input.draftType,
      draft: fallback,
      warnings,
      humanReviewRequired: true,
      message: "AI draft is temporarily unavailable. Showing rule-based draft.",
    };
  }
}
