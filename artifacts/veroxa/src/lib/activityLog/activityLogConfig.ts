import { AUTH_MODE } from "@/lib/auth/authMode";
import type { AuthState } from "@/lib/auth/authContract";

export const ACTIVITY_LOG_FEATURE_FLAG = "VITE_VEROXA_ACTIVITY_LOG_ENABLED";

export function isActivityLogFeatureFlagEnabled(): boolean {
  return import.meta.env.VITE_VEROXA_ACTIVITY_LOG_ENABLED === "true";
}

export function canReadClientVisibleActivity(auth: AuthState): boolean {
  return (
    AUTH_MODE === "real" &&
    isActivityLogFeatureFlagEnabled() &&
    auth.status === "authenticated" &&
    auth.session?.role === "client" &&
    Boolean(auth.session.clientId)
  );
}

export function canUseTeamActivityLog(auth: AuthState): boolean {
  return (
    AUTH_MODE === "real" &&
    isActivityLogFeatureFlagEnabled() &&
    auth.status === "authenticated" &&
    auth.session?.role === "team"
  );
}
