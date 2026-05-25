import type { Session } from "./types";

/** Demo session check. Pure function — no storage, no cookies. */
export const SessionService = {
  isActive(session: Session | null): boolean {
    if (!session) return false;
    return new Date(session.expiresAt).getTime() > Date.now();
  },
  remainingMs(session: Session | null): number {
    if (!session) return 0;
    return Math.max(0, new Date(session.expiresAt).getTime() - Date.now());
  },
  remainingLabel(session: Session | null): string {
    const ms = SessionService.remainingMs(session);
    if (ms <= 0) return "expired";
    const m = Math.floor(ms / 60000);
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
  },
};
