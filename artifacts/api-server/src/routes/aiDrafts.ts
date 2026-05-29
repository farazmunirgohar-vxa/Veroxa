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
  restaurantName?: string;
  clientName?: string;
  context?: AiDraftContext;
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

  const context: AiDraftContext = {
    ...(body.context ?? {}),
  };
  if (body.restaurantName && !context.restaurantName) {
    context.restaurantName = body.restaurantName;
  }
  if (body.clientName && !context.clientName) {
    context.clientName = body.clientName;
  }

  const result = await generateAiDraft({
    draftType: body.draftType as AiDraftType,
    context,
  });

  res.json(result);
});

export default router;
