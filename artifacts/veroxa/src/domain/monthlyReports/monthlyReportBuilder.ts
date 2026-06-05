import { monthlyReportSeedData } from "./monthlyReportSeedData";
import { buildMonthlyReportReadiness } from "./reportReadinessEngine";
import type { MonthlyReportRecord } from "./types";
export function getLatestMonthlyReport(clientId = "preview-client"): MonthlyReportRecord { return monthlyReportSeedData.find((report) => report.clientId === clientId) ?? monthlyReportSeedData[0]; }
export function buildClientMonthlyReportPreview(report: MonthlyReportRecord = getLatestMonthlyReport()) { return { report, readiness: buildMonthlyReportReadiness(report) }; }
