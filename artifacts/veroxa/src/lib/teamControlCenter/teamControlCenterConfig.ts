import { AUTH_MODE } from "@/lib/auth/authMode";
import type { AuthState } from "@/lib/auth/authContract";

export const TEAM_CONTROL_CENTER_FEATURE_FLAG = "VITE_VEROXA_TEAM_CONTROL_CENTER_ENABLED";

export function isTeamControlCenterFeatureFlagEnabled(): boolean {
  return import.meta.env.VITE_VEROXA_TEAM_CONTROL_CENTER_ENABLED === "true";
}

export function canUseTeamControlCenter(auth: AuthState): boolean {
  const role = auth.session?.role;
  return (
    AUTH_MODE === "real" &&
    isTeamControlCenterFeatureFlagEnabled() &&
    auth.status === "authenticated" &&
    role === "team"
  );
}
