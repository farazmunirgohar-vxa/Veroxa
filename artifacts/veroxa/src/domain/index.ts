// Domain barrel — single import point for repositories, services, and types.
// Today these read from src/data/demoData.ts. Tomorrow they swap to real APIs
// without touching any pages.
export * from "./clients/types";
export * from "./content/types";
export * from "./media/types";
export * from "./reports/types";
export * from "./tasks/types";
export * from "./notifications/types";
export * from "./requests/types";
export * from "./operations/types";
export * from "./ai/types";

export { ClientRepository }       from "./clients/repository";
export { ContentRepository }      from "./content/repository";
export { MediaRepository }        from "./media/repository";
export { ReportRepository }       from "./reports/repository";
export { TaskRepository }         from "./tasks/repository";
export { NotificationRepository } from "./notifications/repository";
export { RequestRepository }      from "./requests/repository";
export { OperationsRepository }   from "./operations/repository";
export { AIRepository }           from "./ai/repository";

export { ClientService, HealthService, RiskService } from "./clients/service";
export { WorkflowService, ContentService }           from "./content/service";
export { MediaService }                              from "./media/service";
export { ReportService }                             from "./reports/service";
export { TaskService }                               from "./tasks/service";
export { NotificationService }                       from "./notifications/service";

export { rolePermissions, can } from "./users/permissions";
export type { AppRole, AppAction, RolePermission } from "./users/permissions";

// ── Batch A scaffolding ────────────────────────────────────────────
export { AuthService }                  from "./auth/authService";
export { SessionService }               from "./auth/sessionService";
export { PermissionService }            from "./auth/permissionService";
export { routeAccessMap, ruleFor, isAllowed } from "./auth/routeAccess";
export type { AuthUser, Session, Credentials, AuthResult, AuthStatus } from "./auth/types";
export type { RouteRule, RouteAccess } from "./auth/routeAccess";

export { EventBus } from "./events/eventBus";
export type { AppEvent, AppEventKind } from "./events/types";

export { AuditService } from "./audit/auditService";
export type { AuditEntry, AuditAction } from "./audit/types";

export { AutomationService } from "./automation/service";
export { automationRegistry } from "./automation/registry";
export type { AutomationRule, AutomationCategory, AutomationStatus, AutomationTrigger } from "./automation/types";

export { AgentOrchestrator, agentPipeline } from "./ai/orchestrator";
export type { AgentNode, AgentRole }        from "./ai/orchestrator";

export { IntegrationService }     from "./integrations/service";
export { integrationRegistry }    from "./integrations/registry";
export type { Integration, IntegrationCategory, IntegrationStatus } from "./integrations/types";

export { NotificationEngineV2 } from "./notifications/engineV2";
export type { NotificationChannel, NotificationPriorityV2, ChannelPreference } from "./notifications/engineV2";
