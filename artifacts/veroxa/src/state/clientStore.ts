import { ClientRepository, HealthService, RiskService } from "@/domain";
export const ClientStore = {
  list:             () => ClientRepository.list(),
  lifecycle:        () => ClientRepository.lifecycle(),
  atRisk:           () => RiskService.atRisk(),
  portfolioAverage: () => HealthService.portfolioAverage(),
};
