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
