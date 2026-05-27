/**
 * localUploadStore.ts — M018
 *
 * Browser sessionStorage-backed demo store for restaurant upload
 * submissions made through the in-app /upload flow. Demo-only.
 *
 * Why sessionStorage:
 *   - Uploads are demo/session scoped; nothing should outlive the tab.
 *   - Avoids accidental persistence of demo content across sessions.
 *
 * Strictly metadata only:
 *   - No raw file blobs.
 *   - No base64.
 *   - No image data.
 *   - No PII beyond restaurant name (already public demo data).
 */

import type { DemoUploadSubmission, DemoUploadStatus } from "@/data/uploadKeys/demoUploadSubmissions";

export const LOCAL_UPLOAD_STORE_KEY = "veroxa.demo.localUploads.v2";

const MAX_NOTE_LEN = 140;

/**
 * Strip user-provided text down to a PII-safe summary before persisting.
 *
 * Demo-only protection — not a substitute for real validation. Removes
 * email addresses, phone-number-like digit runs, and @handles, then
 * truncates length. Anything that still looks risky collapses to "—".
 */
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

/**
 * Replace user-supplied filenames with a generic category-based label.
 * User filenames may contain real names, locations, or dates — never
 * persist them.
 */
function safeFileLabel(fileKind: "image" | "video", count: number): string {
  const noun = fileKind === "video" ? "video clip" : "photo";
  if (count <= 1) return `1 ${noun}`;
  return `${count} ${noun}s`;
}

type Listener = (items: DemoUploadSubmission[]) => void;
const listeners = new Set<Listener>();

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function readAll(): DemoUploadSubmission[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(LOCAL_UPLOAD_STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is DemoUploadSubmission =>
        !!x &&
        typeof x === "object" &&
        typeof (x as DemoUploadSubmission).id === "string" &&
        (x as DemoUploadSubmission).demoOnly === true,
    );
  } catch {
    return [];
  }
}

function writeAll(items: DemoUploadSubmission[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(LOCAL_UPLOAD_STORE_KEY, JSON.stringify(items));
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

export function getLocalUploadSubmissions(): DemoUploadSubmission[] {
  return readAll();
}

export type LocalUploadInput = Omit<
  DemoUploadSubmission,
  "id" | "demoOnly" | "status" | "fileLabel" | "note"
> & {
  id?: string;
  status?: DemoUploadStatus;
  /** Raw user note — will be sanitized before persisting. */
  note?: string;
  /** Number of files selected — used to build a generic safe label. */
  fileCount?: number;
};

export function addLocalUploadSubmission(input: LocalUploadInput): DemoUploadSubmission {
  const submission: DemoUploadSubmission = {
    id: input.id ?? `UP-DEMO-${String(Math.floor(100 + Math.random() * 900))}`,
    restaurantId: input.restaurantId,
    restaurantName: input.restaurantName,
    category: input.category,
    priority: input.priority,
    note: sanitizeNote(input.note ?? ""),
    fileLabel: safeFileLabel(input.fileKind, Math.max(1, input.fileCount ?? 1)),
    fileKind: input.fileKind,
    submittedAtLabel: input.submittedAtLabel,
    status: input.status ?? "received",
    demoOnly: true,
  };
  const next = [submission, ...readAll()];
  writeAll(next);
  return submission;
}

export function updateLocalUploadSubmissionStatus(
  id: string,
  status: DemoUploadStatus,
): boolean {
  const all = readAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  const next = [...all];
  next[idx] = { ...next[idx], status };
  writeAll(next);
  return true;
}

export function clearLocalUploadSubmissions(): void {
  writeAll([]);
}

export function isLocalUploadSubmission(id: string): boolean {
  return readAll().some((s) => s.id === id);
}

export function subscribeToLocalUploadSubmissions(callback: Listener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
