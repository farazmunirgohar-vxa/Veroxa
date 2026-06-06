// Dormant readiness only — no live AI call is made here.

export type AiReadinessAssistantType =
  | "media_review"
  | "caption_draft"
  | "weekly_update_draft"
  | "monthly_report_draft"
  | "request_classification"
  | "internal_qa";

export type AiReadinessStatus =
  | "dormant"
  | "draft_only"
  | "needs_human_review"
  | "approved_for_future_build"
  | "blocked_until_live_systems";

export type AiSuggestionConfidence = "low" | "medium" | "high" | "not_applicable";

export type AiReviewRequirement =
  | "veroxa_team_review"
  | "faraz_review"
  | "business_truth_confirmation"
  | "client_confirmation"
  | "blocked";

export type AiSuggestionVisibility =
  | "internal_only"
  | "client_visible_after_review"
  | "never_client_visible";

export interface AiSuggestionBase {
  id: string;
  assistantType: AiReadinessAssistantType;
  status: AiReadinessStatus;
  visibility: AiSuggestionVisibility;
  confidence: AiSuggestionConfidence;
  requiredReviews: AiReviewRequirement[];
  clientSafeSummary: string;
  internalNotes: string;
  blockedReasons: string[];
  createdAt: string;
}

export interface MediaReviewPromptInput {
  mediaType: string;
  category: string;
  qualityNotes: string[];
  bestUse: string;
  warnings: string[];
  clientSafeSummary: string;
}

export interface CaptionDraftPromptInput {
  restaurantName: string;
  confirmedItem: string;
  confirmedOffer?: string;
  offerConfirmed: boolean;
  brandTone: string;
  platform: "google" | "facebook" | "instagram";
  mediaContext: string;
  businessTruthConfirmed: boolean;
}

export interface WeeklyUpdateDraftPromptInput {
  completedWork: string[];
  preparedWork: string[];
  pendingItems: string[];
  requestsAnswered: string[];
  mediaNeeded: string[];
  confirmationsNeeded: string[];
  nextWeekFocus: string[];
}

export interface MonthlyReportDraftPromptInput {
  handledByVeroxa: string[];
  googleMapsLocalSearchProgress: string[];
  websiteAlignment: string[];
  facebookInstagramProgress: string[];
  mediaUsed: string[];
  mediaLearnings: string[];
  reachActionSignals: string[];
  limitations: string[];
  nextMonthFocus: string[];
  hasEnoughData: boolean;
}

export interface RequestClassificationPromptInput {
  requestTitle: string;
  requestMessage: string;
  currentPlan: string;
}

export interface InternalQaPromptInput {
  draftCopy: string;
  targetSurface: "public" | "client" | "team" | "internal_doc";
  riskFlags: string[];
  policyBoundaries: string[];
}

export interface AiMediaReviewSuggestion extends AiSuggestionBase {
  assistantType: "media_review";
  usefulnessSuggestion: string;
  nextClientAsk: string;
  contentDirection: string;
}

export interface AiCaptionDraftSuggestion extends AiSuggestionBase {
  assistantType: "caption_draft";
  captions: string[];
  businessTruthNeeds: string[];
}

export interface AiWeeklyUpdateDraftSuggestion extends AiSuggestionBase {
  assistantType: "weekly_update_draft";
  updateDraft: string;
  missingInputs: string[];
}

export interface AiMonthlyReportDraftSuggestion extends AiSuggestionBase {
  assistantType: "monthly_report_draft";
  reportDraft: string;
  dataLimitations: string[];
}

export interface AiRequestClassificationSuggestion extends AiSuggestionBase {
  assistantType: "request_classification";
  suggestedClassification:
    | "included"
    | "add_on"
    | "coming_soon"
    | "not_included"
    | "needs_confirmation"
    | "needs_review";
  packageBoundaryRule: string;
}

export interface AiInternalQaSuggestion extends AiSuggestionBase {
  assistantType: "internal_qa";
  checklist: string[];
  riskSummary: string;
}

export type AiReadinessSuggestion =
  | AiMediaReviewSuggestion
  | AiCaptionDraftSuggestion
  | AiWeeklyUpdateDraftSuggestion
  | AiMonthlyReportDraftSuggestion
  | AiRequestClassificationSuggestion
  | AiInternalQaSuggestion;

export interface AiPromptBlueprint {
  assistantType: AiReadinessAssistantType;
  purpose: string;
  allowedInputs: string[];
  forbiddenInputs: string[];
  requiredContext: string[];
  outputShape: string[];
  reviewGate: AiReviewRequirement[];
  blockedClaims: string[];
  clientSafeLanguageRules: string[];
  businessTruthRules: string[];
  futureActivationNotes: string[];
  existingServerRouteMapping: string;
}

export interface AiAssistantCatalogItem {
  assistantType: AiReadinessAssistantType;
  label: string;
  status: AiReadinessStatus;
  futureTrigger: string;
  humanReviewGate: AiReviewRequirement[];
  blockedBehavior: string[];
  failureMode: string;
  requiredLogsLater: string[];
  rollbackRequirementLater: string;
  existingServerRouteMapping: string;
}

export interface AiClientVisibilityValidationResult {
  canShowToClient: boolean;
  reasons: string[];
  requiredNextReview: AiReviewRequirement | null;
}
