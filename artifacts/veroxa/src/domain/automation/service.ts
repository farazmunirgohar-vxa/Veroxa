import type { AutomationCategory, AutomationRule, AutomationStatus } from "./types";
import { automationRegistry } from "./registry";

/** Read-only registry today. Future: persist toggles per tenant. */
export const AutomationService = {
  list(): AutomationRule[]                                 { return automationRegistry; },
  byCategory(c: AutomationCategory): AutomationRule[]      { return automationRegistry.filter((r) => r.category === c); },
  byStatus(s: AutomationStatus): AutomationRule[]          { return automationRegistry.filter((r) => r.status === s); },
  categories(): AutomationCategory[]                       { return Array.from(new Set(automationRegistry.map((r) => r.category))); },
  /** Demo-only — does not persist. */
  setStatus(_id: string, _status: AutomationStatus): void  { /* no-op */ },
};
