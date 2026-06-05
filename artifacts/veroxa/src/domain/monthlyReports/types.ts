export type MonthlyReportStatus = "not_enough_data_yet" | "preparing_report" | "needs_media" | "needs_confirmations" | "ready_for_veroxa_review" | "ready_to_share" | "shared_preview";
export interface MonthlyReportRecord {
  id: string;
  clientId: string;
  monthLabel: string;
  restaurantName: string;
  status: MonthlyReportStatus;
  whatVeroxaHandled: string[];
  googleMapsLocalProgress: string[];
  websiteAlignmentProgress: string[];
  facebookInstagramProgress: string[];
  mediaUsed: string[];
  whatMediaWorked: string[];
  whatMediaDidNotWork: string[];
  mediaNeededNext: string[];
  reachActionSignals: string[];
  limitations: string[];
  nextMonthFocus: string[];
  clientSafeSummary: string;
  createdAt: string;
}
export interface MonthlyReportReadiness { status: MonthlyReportStatus; label: string; nextAction: string; blockers: string[]; }
