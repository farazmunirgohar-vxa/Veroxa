import type { MomoReadinessResult, ReadinessCheck } from "./types";

export function calculateMomoReadiness(
  checks: ReadinessCheck[],
  measuredAt = new Date().toISOString(),
): MomoReadinessResult {
  const required = checks.filter((check) => check.required);
  const totalWeight = required.reduce((sum, check) => sum + Math.max(0, check.weight), 0);
  const passedWeight = required
    .filter((check) => check.state === "passed" && check.evidenceRefs.length > 0)
    .reduce((sum, check) => sum + Math.max(0, check.weight), 0);
  const score = totalWeight === 0 ? 0 : Math.round((passedWeight / totalWeight) * 100);
  const blockingChecks = required.filter(
    (check) => check.state !== "passed" || check.evidenceRefs.length === 0,
  );

  return {
    score,
    gate: score === 100 && blockingChecks.length === 0 ? "ready" : "blocked",
    checks,
    blockingChecks,
    measuredAt,
  };
}

export function validateReadinessWeights(checks: ReadinessCheck[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const check of checks) {
    if (seen.has(check.key)) errors.push(`Duplicate readiness key: ${check.key}`);
    seen.add(check.key);
    if (!Number.isFinite(check.weight) || check.weight < 0) {
      errors.push(`Invalid readiness weight: ${check.key}`);
    }
    if (check.state === "passed" && check.evidenceRefs.length === 0) {
      errors.push(`Passed readiness check lacks evidence: ${check.key}`);
    }
  }
  return errors;
}
