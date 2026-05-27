// demoOnboarding.ts — future: onboarding_items table
// Covers onboarding step definitions, per-client status, and helper functions.

import { demoRestaurants } from "./demoClients";

export type OnboardingStatus  = "Complete" | "In Progress" | "Missing";
export type OnboardingOwner   = "Client" | "Veroxa Team" | "Operator";
export type OnboardingPriority = "High" | "Medium" | "Low";

export interface DemoOnboardingStep {
  id:          string;
  clientId:    string;
  step:        string;
  description: string;
  status:      OnboardingStatus;
  owner:       OnboardingOwner;
  dueDate:     string;
  priority:    OnboardingPriority;
}

const onboardingTemplate: Omit<DemoOnboardingStep, "id" | "clientId" | "status">[] = [
  { step: "Restaurant Information",  description: "Address, hours, contact, and basic account details.",       owner: "Client",      dueDate: "Week 1", priority: "High"   },
  { step: "Menu Information",        description: "Featured, popular, and seasonal items with descriptions.",   owner: "Client",      dueDate: "Week 1", priority: "High"   },
  { step: "Brand Guidelines",        description: "Voice, content style, colors, and tone examples.",           owner: "Veroxa Team", dueDate: "Week 2", priority: "High"   },
  { step: "Initial Media Submitted", description: "At least 10 photos and 3 short clips to seed the library.",  owner: "Client",      dueDate: "Week 2", priority: "High"   },
  { step: "Google Business Profile", description: "Hours, photos, and category confirmed on Google.",           owner: "Operator",    dueDate: "Week 2", priority: "Medium" },
  { step: "Social Media Access",     description: "Instagram, Facebook, and TikTok access confirmed.",          owner: "Client",      dueDate: "Week 2", priority: "High"   },
  { step: "Reporting Preferences",   description: "Weekly vs monthly cadence, delivery channel, recipients.",   owner: "Operator",    dueDate: "Week 3", priority: "Medium" },
  { step: "Portal Access Active",    description: "Client portal account live and tested.",                     owner: "Veroxa Team", dueDate: "Week 3", priority: "Low"    },
];

const onboardingStatusMap: Record<string, OnboardingStatus[]> = {
  "demo-a": ["Complete","Complete","Complete","Complete","Complete",    "Complete",    "Complete",    "Complete"],
  "demo-b":    ["Complete","Complete","Complete","Complete","In Progress", "Complete",    "In Progress", "Complete"],
  "demo-c": ["Complete","Complete","Complete","Complete","Complete",    "Complete",    "Complete",    "Complete"],
  "demo-d":   ["Complete","In Progress","Missing","Missing","Missing",   "In Progress", "Missing",     "Complete"],
};

export const demoOnboardingSteps: DemoOnboardingStep[] = demoRestaurants.flatMap((r) =>
  onboardingTemplate.map((t, idx) => ({
    id:       `${r.id}-onb-${idx + 1}`,
    clientId: r.id,
    step:     t.step,
    description: t.description,
    owner:    t.owner,
    dueDate:  t.dueDate,
    priority: t.priority,
    status:   onboardingStatusMap[r.id][idx] ?? "Missing",
  }))
);

export function getOnboardingSummary(clientId: string) {
  const steps      = demoOnboardingSteps.filter((s) => s.clientId === clientId);
  const total      = steps.length;
  const complete   = steps.filter((s) => s.status === "Complete").length;
  const inProgress = steps.filter((s) => s.status === "In Progress").length;
  const missing    = steps.filter((s) => s.status === "Missing").length;
  const pct        = total === 0 ? 0 : Math.round(((complete + inProgress * 0.5) / total) * 100);
  const nextAction = steps.find((s) => s.status !== "Complete");
  return { steps, total, complete, inProgress, missing, pct, nextAction };
}

export function getVeroxaNextNeeds(clientId: string): string[] {
  const summary = getOnboardingSummary(clientId);
  const needs = summary.steps
    .filter((s) => s.status !== "Complete")
    .slice(0, 3)
    .map((s) => `${s.status === "Missing" ? "Provide" : "Finish"}: ${s.step}`);
  if (needs.length === 0) {
    return ["Onboarding complete — no outstanding items."];
  }
  return needs;
}
