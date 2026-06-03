import type {
  ActivityLogEntityType,
  ActivityLogRecord,
  ActivityLogVisibility,
  CreateActivityLogInput,
} from "./saasTypes";

const WRITE_ENTITY_TYPES: ActivityLogEntityType[] = [
  "restaurant",
  "restaurant_profile",
  "media_asset",
  "client_request",
  "prepared_action",
  "approval_decision",
  "manual_execution_event",
  "report",
  "visibility_finding",
  "opportunity_score",
  "profit_validation_snapshot",
];

export function buildActivityLogPreview(
  input: CreateActivityLogInput,
): ActivityLogRecord {
  return {
    id: `preview-${input.entityType}-${input.entityId}`,
    restaurantId: input.restaurantId,
    dataMode: input.dataMode ?? "placeholder_review",
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    actorUserId: input.actorUserId,
    actorLabel: input.actorLabel ?? "Veroxa team",
    summary: input.summary,
    visibility: input.visibility ?? "team_internal",
    metadata: input.visibility === "client_safe" ? undefined : input.metadata,
    isPersisted: false,
    createdAt: new Date().toISOString(),
  };
}

export function formatActivityLogSummary(log: ActivityLogRecord): string {
  const persisted = log.isPersisted ? "persisted" : "preview only";
  return `${log.actorLabel} ${log.action.replaceAll("_", " ")} ${log.entityType.replaceAll("_", " ")}: ${log.summary} (${persisted}).`;
}

export function requiresActivityLogForEntity(
  entityType: ActivityLogEntityType,
): boolean {
  return WRITE_ENTITY_TYPES.includes(entityType);
}

export function getActivityLogVisibilityLabel(
  visibility: ActivityLogVisibility,
): string {
  return visibility === "client_safe"
    ? "Client-safe summary"
    : "Team/internal only";
}
