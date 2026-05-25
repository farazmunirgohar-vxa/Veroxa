import { ClientRepository } from "./repository";
import type { ClientLifecycle, RiskLevel } from "./types";

export const ClientService = {
  all:   () => ClientRepository.list(),
  byId:  (id: string) => ClientRepository.byId(id),
  named: (id: string) => ClientRepository.nameOf(id),
};

export const HealthService = {
  forClient: (id: string) => ClientRepository.healthFor(id),
  composite: () => ClientRepository.compositeScores(),
  portfolioAverage(): number {
    const all = ClientRepository.lifecycle();
    if (all.length === 0) return 0;
    return Math.round(all.reduce((s, c) => s + c.healthScore, 0) / all.length);
  },
};

const riskWeight: Record<RiskLevel, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 };

export const RiskService = {
  ranked(): ClientLifecycle[] {
    return [...ClientRepository.lifecycle()].sort(
      (a, b) => riskWeight[b.riskLevel] - riskWeight[a.riskLevel],
    );
  },
  atRisk(): ClientLifecycle[] {
    return ClientRepository.lifecycle().filter(
      (c) => c.riskLevel === "High" || c.riskLevel === "Critical",
    );
  },
};
