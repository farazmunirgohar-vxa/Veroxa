import { demoWeeklyReports, demoMonthlyReports, demoReportingOps } from "@/data/demoData";
export const ReportRepository = {
  weekly:    () => demoWeeklyReports,
  monthly:   () => demoMonthlyReports,
  ops:       () => demoReportingOps,
  opsFor:    (id: string) => demoReportingOps.filter((r) => r.clientId === id),
  pending:   () => demoReportingOps.filter((r) => r.status === "Validation Needed" || r.status === "Needs Revision"),
  published: () => demoReportingOps.filter((r) => r.status === "Published"),
};
