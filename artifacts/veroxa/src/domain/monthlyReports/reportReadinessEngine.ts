import type { MonthlyReportReadiness, MonthlyReportRecord, MonthlyReportStatus } from "./types";
export function getMonthlyReportStatusLabel(status: MonthlyReportStatus): string {
  return ({ not_enough_data_yet: "Not enough data yet", preparing_report: "Preparing report", needs_media: "Needs media", needs_confirmations: "Needs confirmations", ready_for_veroxa_review: "Ready for Veroxa review", ready_to_share: "Ready to share", shared_preview: "Shared in preview" })[status];
}
export function buildMonthlyReportReadiness(report: MonthlyReportRecord): MonthlyReportReadiness {
  const blockers = [...report.mediaNeededNext, ...report.limitations];
  if (report.status === "ready_to_share" || report.status === "shared_preview") return { status: report.status, label: getMonthlyReportStatusLabel(report.status), nextAction: "Review the monthly report preview.", blockers: [] };
  if (report.status === "not_enough_data_yet") return { status: report.status, label: getMonthlyReportStatusLabel(report.status), nextAction: "Keep sending media and confirmations so the first report has enough context.", blockers };
  if (report.status === "needs_media") return { status: report.status, label: getMonthlyReportStatusLabel(report.status), nextAction: "Send clearer photos and best-seller media.", blockers };
  if (report.status === "needs_confirmations") return { status: report.status, label: getMonthlyReportStatusLabel(report.status), nextAction: "Confirm exact details before public-facing work is summarized.", blockers };
  return { status: report.status, label: getMonthlyReportStatusLabel(report.status), nextAction: "Wait for Veroxa team review.", blockers: [] };
}
