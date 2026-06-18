import { AUTH_MODE } from "@/lib/auth/authMode";
import type { AuthState } from "@/lib/auth/authContract";

export const REPORTS_FROM_ACTIVITY_FEATURE_FLAG = "VITE_VEROXA_REPORTS_FROM_ACTIVITY_ENABLED";

export function isReportsFromActivityFeatureFlagEnabled(): boolean {
  return import.meta.env.VITE_VEROXA_REPORTS_FROM_ACTIVITY_ENABLED === "true";
}

export function canUseTeamReportsFromActivity(auth: AuthState): boolean {
  return (
    AUTH_MODE === "real" &&
    isReportsFromActivityFeatureFlagEnabled() &&
    auth.status === "authenticated" &&
    auth.session?.role === "team"
  );
}

export function canReadClientReportsFromActivity(auth: AuthState): boolean {
  return (
    AUTH_MODE === "real" &&
    isReportsFromActivityFeatureFlagEnabled() &&
    auth.status === "authenticated" &&
    auth.session?.role === "client" &&
    Boolean(auth.session.clientId)
  );
}
