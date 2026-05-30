/**
 * clientRepository.ts — read-only adapter that maps demo client
 * fixtures into the `ClientAccount` contract from
 * `veroxaDataContracts.ts`.
 *
 * Read-only. No writes. No network. No mutations.
 */

import {
  demoRestaurants,
  demoRestaurantProfiles,
  type DemoRestaurant,
  type DemoRestaurantProfile,
} from "@/data/demo/demoClients";
import { demoClientHealth, type DemoClientHealth } from "@/data/demo/demoClientHealth";
import { demoMediaRunway } from "@/data/demo/demoMediaAssets";
import type {
  ClientAccount,
  ClientServicePlan,
  ContentHealthStatus,
  LifecycleStatus,
  RiskStatus,
} from "@/lib/data/veroxaDataContracts";

function mapServicePlan(p?: DemoRestaurantProfile["servicePlan"]): ClientServicePlan {
  if (!p) return "Unknown";
  return p;
}

function mapLifecycleStatus(p?: DemoRestaurantProfile): LifecycleStatus {
  switch (p?.accountStatus) {
    case "Active":
      return "active";
    case "Onboarding":
      return "onboarding";
    case "Paused":
      return "paused";
    case "At Risk":
      return "at_risk";
    default:
      return "active";
  }
}

function mapHealthToContentStatus(h?: DemoClientHealth): ContentHealthStatus {
  switch (h?.level) {
    case "healthy":
      return "healthy";
    case "attention":
      return "caution";
    case "critical":
      return "urgent";
    default:
      return "caution";
  }
}

function mapHealthToRisk(h?: DemoClientHealth): RiskStatus {
  switch (h?.level) {
    case "healthy":
      return "good";
    case "attention":
      return "risk";
    case "critical":
      return "at_risk";
    default:
      return "risk";
  }
}

function toClientAccount(r: DemoRestaurant): ClientAccount {
  const profile = demoRestaurantProfiles.find((p) => p.clientId === r.id);
  const health = demoClientHealth.find((h) => h.clientId === r.id);
  const runway = demoMediaRunway.find((m) => m.clientId === r.id);
  return {
    clientId: r.id,
    businessName: r.name,
    cuisineType: r.cuisine,
    servicePlan: mapServicePlan(profile?.servicePlan),
    lifecycleStatus: mapLifecycleStatus(profile),
    contentHealthStatus: mapHealthToContentStatus(health),
    riskStatus: mapHealthToRisk(health),
    assignedTeam: r.assignedTeam,
    assignedInternalReviewer: r.assignedOperator,
    postingFrequencyWeekly: runway?.postsPerWeek ?? 0,
    timezone: "America/Chicago",
  };
}

export function getAllClients(): ClientAccount[] {
  return demoRestaurants.map(toClientAccount);
}

export function getClientById(clientId: string): ClientAccount | undefined {
  const r = demoRestaurants.find((x) => x.id === clientId);
  return r ? toClientAccount(r) : undefined;
}

export function getActiveClients(): ClientAccount[] {
  return getAllClients().filter(
    (c) => c.lifecycleStatus === "active" || c.lifecycleStatus === "onboarding",
  );
}

export function getClientsNeedingAttention(): ClientAccount[] {
  return getAllClients().filter(
    (c) =>
      c.lifecycleStatus === "needs_attention" ||
      c.lifecycleStatus === "at_risk" ||
      c.riskStatus === "at_risk" ||
      c.riskStatus === "risk",
  );
}

export interface ClientLifecycleSummary {
  total: number;
  active: number;
  onboarding: number;
  needsAttention: number;
  atRisk: number;
  paused: number;
  closed: number;
}

export function getClientLifecycleSummary(): ClientLifecycleSummary {
  const all = getAllClients();
  return {
    total: all.length,
    active: all.filter((c) => c.lifecycleStatus === "active").length,
    onboarding: all.filter((c) => c.lifecycleStatus === "onboarding").length,
    needsAttention: all.filter((c) => c.lifecycleStatus === "needs_attention").length,
    atRisk: all.filter((c) => c.lifecycleStatus === "at_risk").length,
    paused: all.filter((c) => c.lifecycleStatus === "paused").length,
    closed: all.filter((c) => c.lifecycleStatus === "closed").length,
  };
}
