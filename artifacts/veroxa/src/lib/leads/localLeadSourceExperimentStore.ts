/**
 * localLeadSourceExperimentStore.ts — M036
 *
 * Browser-only store for lead source experiments. Uses localStorage with a
 * sessionStorage fallback. No network. No Supabase. No fetch.
 */

import type { LeadSource } from "./leadTypes";
import type { LeadSourceExperiment, LeadSourceExperimentStatus } from "./leadSourceTypes";

const STORAGE_KEY = "veroxa.lead_source_experiments.v1";

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function getStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    const test = "__veroxa_exp_probe__";
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

function safeReadAll(): LeadSourceExperiment[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as LeadSourceExperiment[];
  } catch {
    return [];
  }
}

function safeWriteAll(experiments: LeadSourceExperiment[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(experiments));
  } catch {
    // Storage quota or serialization error — fail silently.
  }
}

function generateExperimentId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `exp_${Date.now()}_${rand}`;
}

export interface CreateLeadSourceExperimentInput {
  source: LeadSource;
  title: string;
  hypothesis: string;
  startDate: string;
  endDate?: string;
  status: LeadSourceExperimentStatus;
  targetLeadCount: number;
  targetWalkthroughs: number;
  notes: string;
  resultSummary?: string;
}

export function createLeadSourceExperiment(
  input: CreateLeadSourceExperimentInput,
): LeadSourceExperiment {
  const now = new Date().toISOString();
  const experiment: LeadSourceExperiment = {
    id: generateExperimentId(),
    source: input.source,
    title: input.title.trim(),
    hypothesis: input.hypothesis.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status,
    targetLeadCount: input.targetLeadCount,
    targetWalkthroughs: input.targetWalkthroughs,
    notes: input.notes.trim(),
    resultSummary: input.resultSummary?.trim(),
    createdAt: now,
    updatedAt: now,
  };
  const all = safeReadAll();
  all.unshift(experiment);
  safeWriteAll(all);
  return experiment;
}

export function getLeadSourceExperiments(): LeadSourceExperiment[] {
  return safeReadAll();
}

export function updateLeadSourceExperiment(
  id: string,
  patch: Partial<Omit<LeadSourceExperiment, "id" | "createdAt">>,
): LeadSourceExperiment | undefined {
  const all = safeReadAll();
  const idx = all.findIndex((e) => e.id === id);
  if (idx === -1) return undefined;
  const updated: LeadSourceExperiment = {
    ...all[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = updated;
  safeWriteAll(all);
  return updated;
}

export function deleteLeadSourceExperiment(id: string): void {
  const all = safeReadAll().filter((e) => e.id !== id);
  safeWriteAll(all);
}

export function clearLeadSourceExperimentsForDemo(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
