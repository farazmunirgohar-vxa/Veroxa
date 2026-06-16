import { AUTH_MODE } from "@/lib/auth/authMode";
import type { AuthState } from "@/lib/auth/authContract";

export const PROFILE_CORRECTIONS_FEATURE_FLAG = "VITE_VEROXA_PROFILE_CORRECTIONS_ENABLED";

export function isProfileCorrectionsFeatureFlagEnabled(): boolean {
  return import.meta.env.VITE_VEROXA_PROFILE_CORRECTIONS_ENABLED === "true";
}

export function canUseProfileCorrections(auth: AuthState): boolean {
  return (
    AUTH_MODE === "real" &&
    isProfileCorrectionsFeatureFlagEnabled() &&
    auth.status === "authenticated" &&
    auth.session?.role === "client" &&
    Boolean(auth.session.clientId)
  );
}

export function canTeamReviewProfileCorrections(auth: AuthState): boolean {
  return (
    AUTH_MODE === "real" &&
    isProfileCorrectionsFeatureFlagEnabled() &&
    auth.status === "authenticated" &&
    auth.session?.role === "team"
  );
}

const BUSINESS_TRUTH_PATTERNS = [
  /hours?/i,
  /holiday/i,
  /menu/i,
  /availab/i,
  /price|pricing/i,
  /discount|offer|promotion|deal/i,
  /address|phone/i,
  /order|reservation|website|facebook|instagram|social|link/i,
  /catering/i,
  /halal|dietary|religious|health|allergen|organic/i,
  /complaint|review|reputation/i,
];

export function isSensitiveBusinessTruthField(label: string): boolean {
  return BUSINESS_TRUTH_PATTERNS.some((pattern) => pattern.test(label));
}
