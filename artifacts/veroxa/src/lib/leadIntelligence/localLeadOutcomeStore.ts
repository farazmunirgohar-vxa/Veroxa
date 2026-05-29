/**
 * localLeadOutcomeStore.ts — browser-only store for logged outreach outcomes.
 *
 * Mirrors the localAuditLeadStore pattern: localStorage with a sessionStorage
 * fallback, SSR-guarded, errors never bubble to the UI. No network, no Supabase,
 * no fetch. Production-shaped records so a backend table can mirror this 1:1.
 *
 * SAFETY: This only records what a human DID after manual outreach. It never
 * sends, calls, texts, or schedules anything.
 */

import {
  type CreateLeadOutcomeInput,
  type LeadOutcomeRecord,
} from "./leadOutcomeTypes";

const STORAGE_KEY = "veroxa.lead_outcomes.v1";

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function getStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    const test = "__veroxa_outcome_probe__";
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

function safeReadAll(): LeadOutcomeRecord[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as LeadOutcomeRecord[];
  } catch {
    return [];
  }
}

function safeWriteAll(records: LeadOutcomeRecord[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Storage quota or serialization error — fail silently.
  }
}

function generateOutcomeId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `outcome_${Date.now()}_${rand}`;
}

export function getLeadOutcomes(): LeadOutcomeRecord[] {
  return safeReadAll();
}

export function getOutcomesForLead(leadId: string): LeadOutcomeRecord[] {
  return safeReadAll().filter((o) => o.leadId === leadId);
}

export function getLatestOutcomeForLead(
  leadId: string,
): LeadOutcomeRecord | undefined {
  const forLead = getOutcomesForLead(leadId).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  return forLead[0];
}

export function recordLeadOutcome(
  input: CreateLeadOutcomeInput,
): LeadOutcomeRecord {
  const now = new Date().toISOString();
  const record: LeadOutcomeRecord = {
    id: generateOutcomeId(),
    leadId: input.leadId,
    createdAt: now,
    updatedAt: now,
    segment: input.segment,
    outreachAngleId: input.outreachAngleId,
    channel: input.channel,
    responseStatus: input.responseStatus,
    stageReached: input.stageReached,
    objection: input.objection,
    predictedOpportunityAtOutreach: input.predictedOpportunityAtOutreach,
    note: input.note?.trim() || undefined,
    loggedBy: input.loggedBy?.trim() || undefined,
  };
  const all = safeReadAll();
  all.unshift(record);
  safeWriteAll(all);
  return record;
}

export function updateLeadOutcome(
  id: string,
  patch: Partial<CreateLeadOutcomeInput>,
): LeadOutcomeRecord | undefined {
  const all = safeReadAll();
  const idx = all.findIndex((o) => o.id === id);
  if (idx === -1) return undefined;
  const updated: LeadOutcomeRecord = {
    ...all[idx],
    ...patch,
    note: patch.note !== undefined ? patch.note.trim() || undefined : all[idx].note,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = updated;
  safeWriteAll(all);
  return updated;
}

export function deleteLeadOutcome(id: string): void {
  const all = safeReadAll();
  safeWriteAll(all.filter((o) => o.id !== id));
}

export function clearLeadOutcomesForDemo(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
