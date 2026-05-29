/**
 * workflowStorage.ts — the persistence boundary for the workflow foundation.
 *
 * The repository talks to this interface, never to a concrete store. Today the
 * backend is pending, so the default implementation is a temporary browser
 * persistence layer (sessionStorage, metadata only — no raw file blobs). When
 * Supabase is activated, a `SupabaseWorkflowStorage` can implement the same
 * `WorkflowStorage` interface and the repository/pages stay unchanged.
 *
 * This is intentionally NOT surfaced in product UI as "local" or "demo" — to
 * users this is the Veroxa OS workflow; the implementation detail is documented
 * honestly in docs/REAL_WORKFLOW_FOUNDATION.md as "backend pending".
 */

import type { WorkflowItem } from "./workflowTypes";

export interface WorkflowStorage {
  readAll(): WorkflowItem[];
  writeAll(items: WorkflowItem[]): void;
  isInitialized(): boolean;
  markInitialized(): void;
  subscribe(listener: (items: WorkflowItem[]) => void): () => void;
}

const ITEMS_KEY = "veroxa.workflow.items.v1";
const INIT_KEY = "veroxa.workflow.initialized.v1";

type Listener = (items: WorkflowItem[]) => void;

/**
 * Browser-backed temporary persistence. Used while the real backend is
 * pending. sessionStorage keeps the workflow scoped to the active session.
 */
class BrowserWorkflowStorage implements WorkflowStorage {
  private listeners = new Set<Listener>();
  /** In-memory mirror so the store works in non-browser contexts (SSR/tests). */
  private memory: WorkflowItem[] = [];
  private memoryInitialized = false;

  private getStorage(): Storage | null {
    if (typeof window === "undefined") return null;
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  }

  readAll(): WorkflowItem[] {
    const storage = this.getStorage();
    if (!storage) return this.memory;
    try {
      const raw = storage.getItem(ITEMS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (x): x is WorkflowItem =>
          !!x &&
          typeof x === "object" &&
          typeof (x as WorkflowItem).workflowItemId === "string",
      );
    } catch {
      return [];
    }
  }

  writeAll(items: WorkflowItem[]): void {
    const storage = this.getStorage();
    this.memory = items;
    if (storage) {
      try {
        storage.setItem(ITEMS_KEY, JSON.stringify(items));
      } catch {
        // Quota/serialization failure — keep the in-memory mirror.
      }
    }
    for (const fn of this.listeners) {
      try {
        fn(items);
      } catch {
        // ignore listener errors
      }
    }
  }

  isInitialized(): boolean {
    const storage = this.getStorage();
    if (!storage) return this.memoryInitialized;
    try {
      return storage.getItem(INIT_KEY) === "true";
    } catch {
      return this.memoryInitialized;
    }
  }

  markInitialized(): void {
    this.memoryInitialized = true;
    const storage = this.getStorage();
    if (!storage) return;
    try {
      storage.setItem(INIT_KEY, "true");
    } catch {
      // ignore
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

/** The active storage implementation. Swap here when the backend activates. */
export const workflowStorage: WorkflowStorage = new BrowserWorkflowStorage();
