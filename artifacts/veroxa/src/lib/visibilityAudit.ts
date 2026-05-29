import { getDemoVisibilityAuditResults } from "@/data/audit/demoVisibilityAuditInputs";
import { mapVisibilityFindingsToPreparedActions } from "@/domain/visibilityAudit";

export function getTeamVisibilityAuditSummaries() {
  return getDemoVisibilityAuditResults().map((result) => ({
    ...result,
    preparedActionCount: mapVisibilityFindingsToPreparedActions(result.findings).length,
  }));
}

export function getVisibilityPreparedActionSeeds() {
  const findings = getDemoVisibilityAuditResults().flatMap((result) => result.findings);
  return mapVisibilityFindingsToPreparedActions(findings);
}
