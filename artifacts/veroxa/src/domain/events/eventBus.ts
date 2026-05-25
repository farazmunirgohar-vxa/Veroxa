import type { AppEvent, AppEventKind } from "./types";

type Listener = (event: AppEvent) => void;

const listeners = new Map<AppEventKind | "*", Set<Listener>>();
const log: AppEvent[] = [];

function counter(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/**
 * In-memory event bus. Demo only — no persistence, no network.
 * Future: replace publish() body with a real broker (NATS, SNS, etc.).
 */
export const EventBus = {
  publish<P>(input: Omit<AppEvent<P>, "id" | "occurredAt"> & { occurredAt?: string }): AppEvent<P> {
    const event: AppEvent<P> = {
      id:         `evt-${counter()}`,
      occurredAt: input.occurredAt ?? new Date().toISOString(),
      ...input,
    };
    log.push(event as AppEvent);
    listeners.get(event.kind)?.forEach((fn) => fn(event as AppEvent));
    listeners.get("*")?.forEach((fn) => fn(event as AppEvent));
    return event;
  },
  on(kind: AppEventKind | "*", fn: Listener): () => void {
    const set = listeners.get(kind) ?? new Set<Listener>();
    set.add(fn);
    listeners.set(kind, set);
    return () => set.delete(fn);
  },
  recent(limit = 50): AppEvent[] {
    return log.slice(-limit).reverse();
  },
  clear(): void {
    log.length = 0;
  },
};
