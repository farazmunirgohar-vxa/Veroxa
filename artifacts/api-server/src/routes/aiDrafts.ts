import { Router, type IRouter } from "express";
import {
  generateAiDraft,
  type AiDraftContext,
  type AiDraftType,
} from "../lib/openAiDrafts";

const router: IRouter = Router();

const VALID_DRAFT_TYPES: AiDraftType[] = [
  "content_angle",
  "caption_drafts",
  "client_update",
  "report_summary",
  "clarification_question",
  "lead_summary",
  "lead_outreach_email",
  "lead_follow_up_email",
  "lead_call_script",
  "lead_meeting_agenda",
];

interface AiDraftRequestBody {
  draftType?: string;
  restaurantName?: unknown;
  clientName?: unknown;
  context?: unknown;
}

function boundedOptionalString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

function boundedStringArray(value: unknown, maxItems: number, maxLength: number): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function boundAiDraftContext(value: unknown): AiDraftContext {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const context: AiDraftContext = {};

  for (const key of [
    "restaurantName",
    "clientName",
    "workItemSummary",
    "workType",
    "location",
    "opportunityLabel",
    "recommendedPackage",
    "segmentLabel",
    "recommendedSalesAngle",
    "contactMethod",
  ] as const) {
    const bounded = boundedOptionalString(raw[key], 500);
    if (bounded) {
      (context as Record<string, string>)[key] = bounded;
    }
  }

  if (raw.cadence === "weekly" || raw.cadence === "monthly") {
    context.cadence = raw.cadence;
  }
  for (const key of ["hasPublishedPosts", "hasMetrics", "websiteFound", "menuLinkFound", "socialFound"] as const) {
    if (typeof raw[key] === "boolean") {
      (context as Record<string, boolean>)[key] = raw[key];
    }
  }
  context.signals = boundedStringArray(raw.signals, 20, 300);
  context.topReasons = boundedStringArray(raw.topReasons, 10, 300);

  return context;
}

router.post("/ai/draft", async (req, res) => {
  const body = (req.body ?? {}) as AiDraftRequestBody;

  if (
    typeof body.draftType !== "string" ||
    !VALID_DRAFT_TYPES.includes(body.draftType as AiDraftType)
  ) {
    res.status(400).json({
      mode: "error",
      draft: { text: "" },
      warnings: ["A valid draftType is required."],
      humanReviewRequired: true,
      message: "A valid draftType is required.",
    });
    return;
  }

  const context: AiDraftContext = boundAiDraftContext(body.context);
  const restaurantName = boundedOptionalString(body.restaurantName, 200);
  const clientName = boundedOptionalString(body.clientName, 200);
  if (restaurantName && !context.restaurantName) {
    context.restaurantName = restaurantName;
  }
  if (clientName && !context.clientName) {
    context.clientName = clientName;
  }

  const result = await generateAiDraft({
    draftType: body.draftType as AiDraftType,
    context,
  });

  res.json(result);
});

export default router;
