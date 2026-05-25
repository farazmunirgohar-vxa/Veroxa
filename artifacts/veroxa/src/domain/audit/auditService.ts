import type { AuditEntry } from "./types";

const log: AuditEntry[] = [];

function id(): string {
  return `aud-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/** Demo audit log. In production, fan out to a tamper-evident store. */
export const AuditService = {
  record(entry: Omit<AuditEntry, "id" | "occurredAt"> & { occurredAt?: string }): AuditEntry {
    const e: AuditEntry = { id: id(), occurredAt: new Date().toISOString(), ...entry };
    log.push(e);
    return e;
  },
  list(limit = 100): AuditEntry[]             { return log.slice(-limit).reverse(); },
  forSubject(subjectId: string): AuditEntry[] { return log.filter((e) => e.subjectId === subjectId).reverse(); },
  forActor(actorId: string): AuditEntry[]     { return log.filter((e) => e.actorId === actorId).reverse(); },
  count(): number                             { return log.length; },
  // Intentionally no `clear()` — audit logs are append-only.
};
