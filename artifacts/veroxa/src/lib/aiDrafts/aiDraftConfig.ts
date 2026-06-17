import { AUTH_MODE } from "@/lib/auth/authMode";
import type { AuthState } from "@/lib/auth/authContract";

export const AI_DRAFTS_FEATURE_FLAG = "VITE_VEROXA_AI_DRAFTS_ENABLED";

export function isAiDraftsFeatureFlagEnabled(): boolean {
  return import.meta.env.VITE_VEROXA_AI_DRAFTS_ENABLED === "true";
}

export function canUseTeamAiDrafts(auth: AuthState): boolean {
  return (
    AUTH_MODE === "real" &&
    isAiDraftsFeatureFlagEnabled() &&
    auth.status === "authenticated" &&
    auth.session?.role === "team"
  );
}
