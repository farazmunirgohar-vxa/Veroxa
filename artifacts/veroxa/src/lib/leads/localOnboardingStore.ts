/**
 * localOnboardingStore.ts — browser-only store for Audit Lead → onboarding
 * handoff state. Mirrors localAuditLeadStore: localStorage with a
 * sessionStorage fallback, SSR-safe, errors never bubble.
 *
 * LOCAL / SESSION ONLY. No network, no Supabase, no provisioning.
 */

import {
  HANDOFF_STATUS_ORDER,
  type HandoffStatus,
  type OnboardingChecklistKey,
  type OnboardingHandoffState,
} from "./onboardingHandoffTypes";

const STORAGE_KEY = "veroxa.onboarding_handoff.v1";

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function getStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    const test = "__veroxa_handoff_probe__";
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

type HandoffMap = Record<string, OnboardingHandoffState>;

function readAll(): HandoffMap {
  const storage = getStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as HandoffMap;
  } catch {
    return {};
  }
}

function writeAll(map: HandoffMap): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function defaultState(leadId: string): OnboardingHandoffState {
  return {
    leadId,
    status: "not_started",
    checklist: {},
    simulatedOnly: true,
  };
}

export function getOnboardingHandoff(leadId: string): OnboardingHandoffState {
  return readAll()[leadId] ?? defaultState(leadId);
}

export function setHandoffStatus(
  leadId: string,
  status: HandoffStatus,
): OnboardingHandoffState {
  const map = readAll();
  const current = map[leadId] ?? defaultState(leadId);
  const next: OnboardingHandoffState = { ...current, status };
  map[leadId] = next;
  writeAll(map);
  return next;
}

export function toggleChecklistItem(
  leadId: string,
  key: OnboardingChecklistKey,
): OnboardingHandoffState {
  const map = readAll();
  const current = map[leadId] ?? defaultState(leadId);
  const checklist = { ...current.checklist, [key]: !current.checklist[key] };
  const next: OnboardingHandoffState = { ...current, checklist };
  map[leadId] = next;
  writeAll(map);
  return next;
}

export function setFirstSevenDayFocus(
  leadId: string,
  focus: string,
): OnboardingHandoffState {
  const map = readAll();
  const current = map[leadId] ?? defaultState(leadId);
  const next: OnboardingHandoffState = {
    ...current,
    firstSevenDayFocus: focus,
  };
  map[leadId] = next;
  writeAll(map);
  return next;
}

/** Advance to the next handoff status (clamped at the final state). */
export function advanceHandoffStatus(
  leadId: string,
): OnboardingHandoffState {
  const current = getOnboardingHandoff(leadId);
  const idx = HANDOFF_STATUS_ORDER.indexOf(current.status);
  const next = HANDOFF_STATUS_ORDER[
    Math.min(idx + 1, HANDOFF_STATUS_ORDER.length - 1)
  ] as HandoffStatus;
  return setHandoffStatus(leadId, next);
}
