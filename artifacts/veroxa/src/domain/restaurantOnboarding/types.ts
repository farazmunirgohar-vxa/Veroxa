export type OnboardingPackageId = "complete_online_presence" | "starter" | "growth" | "premium";

export type OnboardingStatus =
  | "not_started"
  | "client_info_needed"
  | "media_needed"
  | "platform_links_needed"
  | "business_truth_needed"
  | "team_review_needed"
  | "first_week_setup_needed"
  | "ready_for_manual_service"
  | "blocked"
  | "paused";

export type ChecklistClientLabel =
  | "Complete"
  | "Needs your input"
  | "Veroxa team review"
  | "Optional"
  | "Not needed right now";

export type ChecklistTeamLabel =
  | "Missing business info"
  | "Ready for review"
  | "Needs verification"
  | "Use in first-week setup"
  | "Missing platform link"
  | "Media request needed"
  | "Confirm before public copy"
  | "Not needed for this package";

export type ChecklistItemStatus = "complete" | "needed" | "review" | "optional" | "not_needed";
export type ReadinessLevel = "not_ready" | "partial" | "ready";
export type MediaSupplyStatus = "not_started" | "low" | "usable" | "strong" | "inconsistent";
export type PlatformAccessStatus = "not_started" | "links_needed" | "partial" | "ready_for_review";
export type BusinessTruthStatus = "not_started" | "confirmation_needed" | "ready_for_team_review" | "confirmed";
export type FirstWeekSetupStatus = "not_started" | "blocked" | "needs_team_setup" | "ready";
export type ProofInputStatus = "not_started" | "client_inputs_needed" | "partial" | "ready_for_internal_review";
export type MostWantedAction = "calls" | "visits" | "orders" | "catering" | "repeat_customers";

export interface PostingPreferences {
  cadencePreference: string;
  preferredDays: string[];
  toneNotes: string;
  contentBoundaries: string[];
  communicationPreference: string;
}

export interface BusinessTruthInputs {
  hoursConfirmed: boolean;
  holidayHoursConfirmed: boolean;
  phoneConfirmed: boolean;
  addressConfirmed: boolean;
  menuItemsConfirmed: boolean;
  menuPricesMentioned: boolean;
  menuPricesConfirmed: boolean;
  existingOfferProvided: boolean;
  existingOfferConfirmed: boolean;
  cateringAvailabilityConfirmed: boolean;
  dietaryClaimsConfirmed: boolean;
  orderingReservationLinksConfirmed: boolean;
  futureAdsAcknowledged: boolean;
  futureReadinessAssessmentAcknowledged: boolean;
}

export interface ProofInputs {
  averageTicket?: string;
  currentMonthlyCustomerGoal?: string;
  mainCustomerType?: string;
  mostWantedAction?: MostWantedAction;
  currentWeakPoints: string[];
  orderLinkAvailable: boolean;
  menuLinkAvailable: boolean;
  googleConfidence?: string;
  socialConfidence?: string;
  ownerReportedBaselineNotes?: string;
  trackingSignalsAvailableLater: boolean;
}

export interface RestaurantOnboardingProfile {
  clientId: string;
  restaurantName: string;
  packageId: OnboardingPackageId;
  contactName: string;
  contactRole: string;
  phone: string;
  email: string;
  address: string;
  websiteUrl: string;
  googleBusinessProfileUrl: string;
  googleMapsUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  menuUrl: string;
  orderingUrl: string;
  reservationUrl: string;
  cateringUrl: string;
  cuisineType: string;
  bestSellers: string[];
  foodCategories: string[];
  customerTypes: string[];
  busyDays: string[];
  busyTimes: string[];
  brandTone: string;
  postingPreferences: PostingPreferences;
  mediaSupplyStatus: MediaSupplyStatus;
  platformAccessStatus: PlatformAccessStatus;
  businessTruthStatus: BusinessTruthStatus;
  firstWeekSetupStatus: FirstWeekSetupStatus;
  proofInputStatus: ProofInputStatus;
  overallStatus: OnboardingStatus;
  nextClientAction: string;
  nextTeamAction: string;
  blockers: string[];
  warnings: string[];
  readySignals: string[];
  mediaAvailable: string[];
  businessTruth: BusinessTruthInputs;
  proofInputs: ProofInputs;
  updatedAt: string;
}

export interface OnboardingChecklistItem {
  id: string;
  label: string;
  description: string;
  status: ChecklistItemStatus;
  clientLabel: ChecklistClientLabel;
  teamLabel: ChecklistTeamLabel;
  requiredFor: OnboardingPackageId[];
  value?: string;
}

export interface OnboardingReadiness {
  level: ReadinessLevel;
  completed: number;
  totalRequired: number;
  missing: string[];
  nextAction: string;
}

export interface TeamOnboardingQueueGroup {
  id: string;
  label: string;
  profiles: RestaurantOnboardingProfile[];
}

export interface TeamOnboardingQueueSummary {
  total: number;
  needsBusinessInfo: number;
  needsMedia: number;
  needsPlatformLinks: number;
  needsConfirmation: number;
  needsFirstWeekSetup: number;
  readyForManualService: number;
  blockedOrPaused: number;
}
