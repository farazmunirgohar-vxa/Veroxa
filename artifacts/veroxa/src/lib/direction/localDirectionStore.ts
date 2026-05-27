/**
 * localDirectionStore.ts — M020
 *
 * Browser sessionStorage-backed demo store for client direction
 * requests submitted through `/demo/client/direction`. Demo-only.
 *
 * Why sessionStorage:
 *   - Direction submissions are demo/session scoped; nothing should
 *     outlive the tab.
 *   - Avoids accidental persistence of demo content across sessions.
 *
 * Strictly metadata only:
 *   - No raw private details.
 *   - No PII beyond fictional restaurant name.
 *   - Notes are sanitized before persisting (email/phone/handle
 *     redaction, length cap).
 *   - No database writes, no API calls, no network.
 */

import type {
  DirectionRequest,
  DirectionStatus,
} from "@/data/direction/demoClientDirection";

export const LOCAL_DIRECTION_STORE_KEY = "veroxa.demo.localDirection.v1";

const MAX_NOTE_LEN = 180;

function sanitizeNote(raw: string): string {
  if (!raw) return "—";
  let s = raw
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/gi, "[redacted]")
    .replace(/(?:\+?\d[\d\s().-]{6,}\d)/g, "[redacted]")
    .replace(/(^|\s)@[\w.-]+/g, "$1[redacted]")
    .replace(/\s+/g, " ")
    .trim();
  if (s.length > MAX_NOTE_LEN) s = s.slice(0, MAX_NOTE_LEN - 1) + "…";
  return s || "—";
}

type Listener = (items: DirectionRequest[]) => void;
const listeners = new Set<Listener>();

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function readAll(): DirectionRequest[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(LOCAL_DIRECTION_STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is DirectionRequest =>
        !!x &&
        typeof x === "object" &&
        typeof (x as DirectionRequest).id === "string" &&
        (x as DirectionRequest).demoOnly === true,
    );
  } catch {
    return [];
  }
}

function writeAll(items: DirectionRequest[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(LOCAL_DIRECTION_STORE_KEY, JSON.stringify(items));
  } catch {
    // Quota or serialization failure — silently no-op for demo.
  }
  for (const fn of listeners) {
    try {
      fn(items);
    } catch {
      // ignore listener errors
    }
  }
}

export function getLocalDirectionRequests(): DirectionRequest[] {
  return readAll();
}

export type LocalDirectionInput = Omit<
  DirectionRequest,
  "id" | "demoOnly" | "status" | "clientNote"
> & {
  id?: string;
  status?: DirectionStatus;
  /** Raw user note — will be sanitized before persisting. */
  clientNote?: string;
};

export function addLocalDirectionRequest(
  input: LocalDirectionInput,
): DirectionRequest {
  const item: DirectionRequest = {
    id: input.id ?? `DIR-DEMO-${String(Math.floor(100 + Math.random() * 900))}`,
    clientId: input.clientId,
    restaurantName: input.restaurantName,
    focus: input.focus,
    channel: input.channel,
    urgency: input.urgency,
    title: input.title,
    clientNote: sanitizeNote(input.clientNote ?? ""),
    preferredTimingLabel: input.preferredTimingLabel,
    relatedMediaId: input.relatedMediaId,
    avoidItem: input.avoidItem,
    status: input.status ?? "received",
    submittedAtLabel: input.submittedAtLabel,
    demoOnly: true,
  };
  const next = [item, ...readAll()];
  writeAll(next);
  return item;
}

export function updateLocalDirectionRequestStatus(
  id: string,
  status: DirectionStatus,
): boolean {
  const all = readAll();
  const idx = all.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  const next = [...all];
  next[idx] = { ...next[idx], status };
  writeAll(next);
  return true;
}

export function clearLocalDirectionRequests(): void {
  writeAll([]);
}

export function isLocalDirectionRequest(id: string): boolean {
  return readAll().some((d) => d.id === id);
}

export function subscribeToLocalDirectionRequests(
  callback: Listener,
): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
