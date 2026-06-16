import { AUTH_MODE } from "@/lib/auth/authMode";
import type { AuthState } from "@/lib/auth/authContract";

export const MESSAGES_FEATURE_FLAG = "VITE_VEROXA_MESSAGES_ENABLED";

export function isMessagesFeatureFlagEnabled(): boolean {
  return import.meta.env.VITE_VEROXA_MESSAGES_ENABLED === "true";
}

export function canUseClientMessages(auth: AuthState): boolean {
  return (
    AUTH_MODE === "real" &&
    isMessagesFeatureFlagEnabled() &&
    auth.status === "authenticated" &&
    auth.session?.role === "client" &&
    Boolean(auth.session.clientId)
  );
}

export function canUseTeamMessages(auth: AuthState): boolean {
  return (
    AUTH_MODE === "real" &&
    isMessagesFeatureFlagEnabled() &&
    auth.status === "authenticated" &&
    auth.session?.role === "team"
  );
}
