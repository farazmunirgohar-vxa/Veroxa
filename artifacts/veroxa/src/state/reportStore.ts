import { ReportRepository, ReportService } from "@/domain";
export const ReportStore = {
  ops:       () => ReportRepository.ops(),
  pending:   () => ReportService.pending(),
  forClient: (id: string) => ReportRepository.opsFor(id),
};
