/**
 * localAuditLeadStore.ts — M028
 *
 * Browser-only audit lead store. Uses localStorage with a sessionStorage
 * fallback. No network. No Supabase. No fetch. Safe in SSR (all access
 * is guarded). Errors never bubble to the UI.
 */

import type { RestaurantAuditReport } from "@/lib/audit/auditTypes";
import { generateInternalLeadAudit } from "./internalLeadScoring";
import type {
  AuditLeadContact,
  AuditLeadInternalFlags,
  AuditLeadLinks,
  AuditLeadRecord,
  AuditLeadSelectedRestaurant,
  AuditLeadSummary,
  LeadFollowUpStatus,
  LeadSource,
  LeadStage,
} from "./leadTypes";

const STORAGE_KEY = "veroxa.audit_leads.v1";

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function getStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    const test = "__veroxa_lead_probe__";
    window.localStorage.setItem(test, "1");
    window.localStorage.removeItem(test);
    return window.localStorage;
  } catch {
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  }
}

function safeReadAll(): AuditLeadRecord[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as AuditLeadRecord[];
  } catch {
    return [];
  }
}

function safeWriteAll(leads: AuditLeadRecord[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(leads));
  } catch {
    // Storage quota or serialization error — fail silently.
  }
}

function generateLeadId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `lead_${Date.now()}_${rand}`;
}

function extractLinks(report: RestaurantAuditReport): AuditLeadLinks {
  return {
    googleListingUrl: report.input.googleListingUrl || undefined,
    websiteUrl: report.input.websiteUrl || undefined,
    instagramUrl: report.input.instagramUrl || undefined,
    facebookUrl: report.input.facebookUrl || undefined,
    tiktokUrl: report.input.tiktokUrl || undefined,
    menuOrderingUrl: report.input.menuOrderingUrl || undefined,
    otherUrl: report.input.otherUrl || undefined,
  };
}

function deriveFollowUpStatus(stage: LeadStage): LeadFollowUpStatus {
  switch (stage) {
    case "walkthrough_requested":
    case "needs_manual_review":
    case "ready_to_contact":
      return "follow_up_due";
    case "contacted":
    case "walkthrough_booked":
    case "proposal_sent":
      return "awaiting_restaurant";
    case "won":
    case "lost":
      return "closed";
    case "nurture_later":
    case "new_audit":
      return "no_follow_up_needed";
  }
}

export interface CreateAuditLeadOptions {
  source?: LeadSource;
  contact?: AuditLeadContact;
  internalFlags?: AuditLeadInternalFlags;
  initialStage?: LeadStage;
  selectedRestaurant?: AuditLeadSelectedRestaurant;
}

export function createAuditLeadFromReport(
  report: RestaurantAuditReport,
  options: CreateAuditLeadOptions = {},
): AuditLeadRecord {
  const source: LeadSource = options.source ?? "free_audit";
  const initialStage: LeadStage =
    options.initialStage ??
    (options.contact ? "walkthrough_requested" : "new_audit");
  const walkthroughRequested = initialStage === "walkthrough_requested";
  const links = extractLinks(report);

  const internal = generateInternalLeadAudit({
    report,
    links,
    contact: options.contact,
    internalFlags: options.internalFlags,
    source,
    walkthroughRequested,
  });

  const now = new Date().toISOString();
  const lead: AuditLeadRecord = {
    id: generateLeadId(),
    source,
    createdAt: now,
    updatedAt: now,
    restaurantName: report.input.restaurantName,
    city: report.input.city,
    state: report.input.state,
    cuisineType: report.input.cuisineType,
    links,
    publicAudit: {
      totalScore: report.totalScore,
      gradeLabel: report.gradeLabel,
      auditConfidence: report.auditConfidence,
      confidenceLabel: report.confidenceLabel,
      recommendedPackageId: report.recommendation.packageId,
      recommendedPackageLabel: report.recommendation.packageLabel,
      standardPriceDisplay: report.recommendation.standardPriceDisplay,
      foundingPriceDisplay: report.recommendation.foundingPriceDisplay,
      weakSpotTitles: report.weakSpots.slice(0, 3).map((w) => w.title),
    },
    contact: options.contact,
    internalFlags: options.internalFlags,
    selectedRestaurant: options.selectedRestaurant,
    leadStage: initialStage,
    leadPriority: internal.priority,
    internalLeadScore: internal.score,
    projectedMonthlyMrr: internal.projectedFoundingMonthlyMrr,
    projectedStandardMonthlyMrr: internal.projectedStandardMonthlyMrr,
    nextAction: internal.nextAction,
    followUpStatus: deriveFollowUpStatus(initialStage),
    internalNotes: [],
  };
  return lead;
}

export function saveAuditLead(lead: AuditLeadRecord): void {
  const all = safeReadAll();
  // De-dupe by id (replace if exists).
  const next = all.filter((l) => l.id !== lead.id);
  next.unshift(lead);
  safeWriteAll(next);
}

export function getAuditLeads(): AuditLeadRecord[] {
  return safeReadAll();
}

export function getAuditLeadById(id: string): AuditLeadRecord | undefined {
  return safeReadAll().find((l) => l.id === id);
}

export function updateAuditLeadStage(
  id: string,
  nextStage: LeadStage,
): AuditLeadRecord | undefined {
  const all = safeReadAll();
  const idx = all.findIndex((l) => l.id === id);
  if (idx === -1) return undefined;
  const updated: AuditLeadRecord = {
    ...all[idx],
    leadStage: nextStage,
    followUpStatus: deriveFollowUpStatus(nextStage),
    updatedAt: new Date().toISOString(),
  };
  all[idx] = updated;
  safeWriteAll(all);
  return updated;
}

export function updateAuditLeadContact(
  id: string,
  contact: AuditLeadContact,
): AuditLeadRecord | undefined {
  const all = safeReadAll();
  const idx = all.findIndex((l) => l.id === id);
  if (idx === -1) return undefined;
  const updated: AuditLeadRecord = {
    ...all[idx],
    contact: { ...all[idx].contact, ...contact },
    updatedAt: new Date().toISOString(),
  };
  all[idx] = updated;
  safeWriteAll(all);
  return updated;
}

export function updateAuditLeadNotes(
  id: string,
  note: string,
): AuditLeadRecord | undefined {
  const trimmed = note.trim();
  if (!trimmed) return getAuditLeadById(id);
  const all = safeReadAll();
  const idx = all.findIndex((l) => l.id === id);
  if (idx === -1) return undefined;
  const updated: AuditLeadRecord = {
    ...all[idx],
    internalNotes: [...all[idx].internalNotes, trimmed],
    updatedAt: new Date().toISOString(),
  };
  all[idx] = updated;
  safeWriteAll(all);
  return updated;
}

export function clearAuditLeadsForDemo(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function summarizeAuditLeads(
  leads: AuditLeadRecord[],
): AuditLeadSummary {
  let walkthroughRequested = 0;
  let priorityACount = 0;
  let priorityBCount = 0;
  let nurtureCount = 0;
  let followUpNeeded = 0;
  let wonCount = 0;
  let lostCount = 0;
  let projectedFoundingMrr = 0;
  let projectedStandardMrr = 0;
  for (const l of leads) {
    if (l.leadStage === "walkthrough_requested") walkthroughRequested += 1;
    if (l.leadPriority === "priority_a") priorityACount += 1;
    if (l.leadPriority === "priority_b") priorityBCount += 1;
    if (l.leadPriority === "nurture") nurtureCount += 1;
    if (
      l.followUpStatus === "follow_up_due" ||
      l.followUpStatus === "follow_up_overdue"
    ) {
      followUpNeeded += 1;
    }
    if (l.leadStage === "won") {
      wonCount += 1;
      projectedFoundingMrr += l.projectedMonthlyMrr;
      projectedStandardMrr += l.projectedStandardMonthlyMrr;
    } else if (l.leadStage === "lost") {
      lostCount += 1;
    } else {
      projectedFoundingMrr += l.projectedMonthlyMrr;
      projectedStandardMrr += l.projectedStandardMonthlyMrr;
    }
  }
  return {
    totalLeads: leads.length,
    walkthroughRequested,
    priorityACount,
    priorityBCount,
    nurtureCount,
    followUpNeeded,
    wonCount,
    lostCount,
    projectedFoundingMrr,
    projectedStandardMrr,
  };
}
