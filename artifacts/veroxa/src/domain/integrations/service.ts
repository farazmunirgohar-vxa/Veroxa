import { integrationRegistry } from "./registry";
import type { Integration, IntegrationCategory, IntegrationStatus } from "./types";

export const IntegrationService = {
  list(): Integration[]                              { return integrationRegistry; },
  byCategory(c: IntegrationCategory): Integration[]  { return integrationRegistry.filter((i) => i.category === c); },
  byStatus(s: IntegrationStatus): Integration[]      { return integrationRegistry.filter((i) => i.status === s); },
  categories(): IntegrationCategory[]                { return Array.from(new Set(integrationRegistry.map((i) => i.category))); },
  countByStatus(): Record<IntegrationStatus, number> {
    const acc: Record<IntegrationStatus, number> = { "Not Connected": 0, "Planned": 0, "Ready": 0, "Future": 0 };
    integrationRegistry.forEach((i) => { acc[i.status]++; });
    return acc;
  },
};
