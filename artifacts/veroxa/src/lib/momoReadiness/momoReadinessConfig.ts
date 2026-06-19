import { AUTH_MODE } from "@/lib/auth/authMode";
import type { AuthState } from "@/lib/auth/authContract";

export const MOMO_READINESS_GATE_FEATURE_FLAG = "VITE_VEROXA_MOMO_READINESS_GATE_ENABLED";

export function isMomoReadinessGateFeatureFlagEnabled(): boolean {
  return import.meta.env.VITE_VEROXA_MOMO_READINESS_GATE_ENABLED === "true";
}

export function canUseMomoReadinessGate(auth: AuthState): boolean {
  const role = auth.session?.role;
  return (
    AUTH_MODE === "real" &&
    isMomoReadinessGateFeatureFlagEnabled() &&
    auth.status === "authenticated" &&
    role === "team"
  );
}
