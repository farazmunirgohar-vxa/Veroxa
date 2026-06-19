import { AUTH_MODE } from "@/lib/auth/authMode";
import type { AuthState } from "@/lib/auth/authContract";

export const MOMO_ACTIVATION_GATE_FEATURE_FLAG = "VITE_VEROXA_MOMO_ACTIVATION_GATE_ENABLED";

export function isMomoActivationGateFeatureFlagEnabled(): boolean {
  return import.meta.env.VITE_VEROXA_MOMO_ACTIVATION_GATE_ENABLED === "true";
}

export function canUseMomoActivationGate(auth: AuthState): boolean {
  const role = auth.session?.role;
  return (
    AUTH_MODE === "real" &&
    isMomoActivationGateFeatureFlagEnabled() &&
    auth.status === "authenticated" &&
    role === "team"
  );
}
