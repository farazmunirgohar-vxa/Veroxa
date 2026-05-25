import { ReportRepository } from "./repository";

export const ReportService = {
  weeklyFor:   (id: string) => ReportRepository.opsFor(id).filter((r) => r.type === "Weekly"),
  monthlyFor:  (id: string) => ReportRepository.opsFor(id).filter((r) => r.type === "Monthly"),
  pending:     ()           => ReportRepository.pending(),
  publishedCount: (id: string) => ReportRepository.opsFor(id).filter((r) => r.status === "Published").length,
};
