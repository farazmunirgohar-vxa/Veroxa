import { Router, type IRouter } from "express";
import {
  generateAiAuditDraft,
  type AiAuditGrowthReportSection,
  type AiAuditRestaurantProfile,
  type AiAuditSummary,
} from "../lib/aiAuditAssistant";

const router: IRouter = Router();

interface AiDraftRequestBody {
  restaurantProfile?: AiAuditRestaurantProfile;
  growthReportSections?: AiAuditGrowthReportSection[];
  auditSummary?: AiAuditSummary;
}

function boundedString(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

router.post("/audit/ai-draft", async (req, res) => {
  const body = (req.body ?? {}) as AiDraftRequestBody;

  if (
    !body.restaurantProfile ||
    typeof body.restaurantProfile.restaurantName !== "string" ||
    body.restaurantProfile.restaurantName.trim() === ""
  ) {
    res.status(400).json({
      mode: "error",
      aiDraft: null,
      message: "Restaurant profile is required.",
    });
    return;
  }

  const restaurantProfile = {
    ...body.restaurantProfile,
    restaurantName: boundedString(body.restaurantProfile.restaurantName, 200),
  };

  const result = await generateAiAuditDraft({
    restaurantProfile,
    growthReportSections: Array.isArray(body.growthReportSections)
      ? body.growthReportSections
      : [],
    auditSummary: body.auditSummary ?? {},
  });

  res.json(result);
});

export default router;
