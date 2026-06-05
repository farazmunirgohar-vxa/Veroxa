import type { ClientReportSummary } from "@/domain/saas/repositoryContracts";
import type { ReportRecord } from "@/domain/saas/saasTypes";
import type { MonthlyReportRecord } from "./types";

const defaultSignals = [
  "Calls, directions, website/menu/order clicks, profile actions, content reach, and customer mentions are reviewed as signals when available.",
];

export function buildMonthlyReportFromClientSummary(
  summary: ClientReportSummary,
  restaurantName = "Your restaurant",
): MonthlyReportRecord {
  const isDemo = summary.sourceLabel === "demo";
  return {
    id: summary.id,
    clientId: summary.id.split("-monthly")[0] || "loaded-client",
    monthLabel: summary.title,
    restaurantName,
    status: summary.status === "published_to_client" ? "shared_preview" : "ready_for_veroxa_review",
    whatVeroxaHandled: [summary.summary],
    googleMapsLocalProgress: [
      "Google Business Profile, Maps, and local visibility basics are reviewed manually when access and links are available.",
    ],
    websiteAlignmentProgress: [
      "Website alignment can cover name, address, phone, hours, menu/order/contact links, social links, and simple local wording if access is provided.",
    ],
    facebookInstagramProgress: [
      "Facebook and Instagram picture-based content progress is summarized when usable media is available.",
    ],
    mediaUsed: [
      isDemo ? "Sample media references only." : "Media usage appears after Veroxa reviews available client media.",
    ],
    whatMediaWorked: ["Clear best-seller and restaurant-space photos are usually the strongest picture-based inputs."],
    whatMediaDidNotWork: ["Blurry, dark, repeated, or unconfirmed media limits what Veroxa can prepare."],
    mediaNeededNext: ["Best-seller photos", "Clear food photos", "Storefront or dining-room photos", "Menu/contact/order-link context"],
    reachActionSignals: defaultSignals,
    limitations: [
      isDemo ? "This is sample report data, not a live client account." : "Recommendations are not guarantees and live analytics are not connected here.",
    ],
    nextMonthFocus: ["Keep media supply consistent, confirm business details, and review online presence signals honestly."],
    clientSafeSummary: isDemo
      ? "This sample monthly report shows how Veroxa explains work handled, signal quality, limitations, and next focus."
      : "This report is prepared from loaded portal data and remains subject to Veroxa team review.",
    createdAt: new Date().toISOString(),
  };
}

export function buildMonthlyReportFromReportRecord(
  report: ReportRecord,
  restaurantName = "Your restaurant",
): MonthlyReportRecord {
  return {
    id: report.id,
    clientId: report.restaurantId,
    monthLabel: `${report.reportType === "weekly" ? "Weekly" : "Monthly"} report · ${report.periodStart} to ${report.periodEnd}`,
    restaurantName,
    status: report.status === "published_to_client" ? "shared_preview" : "ready_for_veroxa_review",
    whatVeroxaHandled: report.workCompleted.length > 0 ? report.workCompleted : [report.summary ?? "Report prepared for review."],
    googleMapsLocalProgress: report.visibilityNotes.length > 0 ? report.visibilityNotes : ["Google/Maps/local visibility progress is reviewed manually."],
    websiteAlignmentProgress: ["Website alignment progress is included when access and confirmed details are available."],
    facebookInstagramProgress: ["Facebook/Instagram picture-based content progress is included when usable media is available."],
    mediaUsed: report.mediaUsed.length > 0 ? report.mediaUsed : ["No reviewed media is listed for this report yet."],
    whatMediaWorked: ["Clear confirmed photos are prioritized for picture-based content."],
    whatMediaDidNotWork: ["Unclear or unconfirmed media is held for later."],
    mediaNeededNext: report.clientNeeds.length > 0 ? report.clientNeeds : ["Best-seller photos and confirmed business details."],
    reachActionSignals: defaultSignals,
    limitations: report.honestLimitations.length > 0 ? report.honestLimitations : ["Recommendations are not guarantees."],
    nextMonthFocus: report.clientNeeds.length > 0 ? report.clientNeeds : ["Continue review and prepare the next presence update."],
    clientSafeSummary: report.summary ?? "Report prepared for Veroxa review.",
    createdAt: report.createdAt,
  };
}
