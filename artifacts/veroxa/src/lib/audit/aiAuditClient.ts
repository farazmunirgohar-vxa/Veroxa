/**
 * aiAuditClient.ts — AI Audit Report Assistant V1
 *
 * Client helper for calling the server-side `/api/audit/ai-draft` endpoint.
 * The endpoint reads OPENAI_API_KEY server-side only; this file never sees
 * the key. If the endpoint reports "not_configured" or "error", callers
 * keep showing the existing rule-based report.
 */

import type {
  GrowthReportSection,
  RestaurantAuditReport,
} from "./auditTypes";

export interface AiAuditDraft {
  executiveSummary: string;
  topOpportunities: string[];
  veroxaFixPlan: string;
  manualReviewNeeded: string[];
  ownerFriendlyClosing: string;
}

export type AiAuditDraftMode = "ai" | "not_configured" | "error";

export interface AiAuditDraftResponse {
  mode: AiAuditDraftMode;
  aiDraft: AiAuditDraft | null;
  message?: string;
}

export interface AiAuditDraftPayload {
  restaurantProfile: {
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
  };
  growthReportSections: GrowthReportSection[];
  auditSummary: {
    totalScore: number;
    maxScore: number;
    gradeLabel: string;
    gradeDescription: string;
    confidenceLabel: string;
    confidenceExplanation: string;
    recommendationPackageLabel: string;
    recommendationReason: string;
    topWeakSpots: { title: string; whyItMatters: string }[];
    topOpportunities: { title: string; whyItMatters: string }[];
  };
}

export function buildAiAuditDraftPayload(
  report: RestaurantAuditReport,
): AiAuditDraftPayload {
  return {
    restaurantProfile: {
      restaurantName: report.input.restaurantName,
      city: report.input.city,
      state: report.input.state,
      cuisineType: report.input.cuisineType,
      googleListingUrl: report.input.googleListingUrl,
      websiteUrl: report.input.websiteUrl,
      instagramUrl: report.input.instagramUrl,
      facebookUrl: report.input.facebookUrl,
      tiktokUrl: report.input.tiktokUrl,
      menuOrderingUrl: report.input.menuOrderingUrl,
      otherUrl: report.input.otherUrl,
    },
    growthReportSections: report.growthReportSections,
    auditSummary: {
      totalScore: report.totalScore,
      maxScore: report.maxScore,
      gradeLabel: report.gradeLabel,
      gradeDescription: report.gradeDescription,
      confidenceLabel: report.confidenceLabel,
      confidenceExplanation: report.confidenceExplanation,
      recommendationPackageLabel: report.recommendation.packageLabel,
      recommendationReason: report.recommendation.reason,
      topWeakSpots: report.weakSpots.slice(0, 5).map((w) => ({
        title: w.title,
        whyItMatters: w.whyItMatters,
      })),
      topOpportunities: report.opportunities.slice(0, 5).map((o) => ({
        title: o.title,
        whyItMatters: o.whyItMatters,
      })),
    },
  };
}

export async function generateAiAuditDraftClient(
  payload: AiAuditDraftPayload,
): Promise<AiAuditDraftResponse> {
  try {
    const response = await fetch("/api/audit/ai-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // No protected API secret in browser code.
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        mode: "error",
        aiDraft: null,
        message:
          "AI draft is temporarily unavailable. The rule-based report is still available below.",
      };
    }

    const data = (await response.json()) as AiAuditDraftResponse;
    if (data && (data.mode === "ai" || data.mode === "not_configured" || data.mode === "error")) {
      return data;
    }
    return {
      mode: "error",
      aiDraft: null,
      message: "AI draft response was not understood. Please try again.",
    };
  } catch {
    return {
      mode: "error",
      aiDraft: null,
      message:
        "Could not reach the AI draft service. The rule-based report is still available below.",
    };
  }
}
