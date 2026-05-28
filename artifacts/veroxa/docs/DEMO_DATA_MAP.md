# Demo Data Map

All demo data lives under `src/data/demo/`. The original `src/data/demoData.ts`
is now a pure barrel re-exporting every file in that directory — all existing
imports from `demoData.ts` continue to work without change.

## File inventory

| File | Future backend table(s) | Key exports |
|---|---|---|
| `demoClients.ts` | `clients`, `client_profiles`, `menu_items`, `brand_guidelines`, `media_requirements`, `client_notes`, `client_lifecycle` | `demoRestaurants`, `demoRestaurantProfiles`, `demoMenuItems`, `demoBrandGuidelines`, `demoMediaRequirements`, `demoClientNotes`, `demoClientLifecycle`, `HealthLevel`, helpers |
| `demoClientHealth.ts` | `client_health` (computed), `kpi_snapshots` | `demoClientHealth`, `demoOwnerKpis`, `demoOperatorKpis`, `demoClientHealthDistribution`, `demoHealthScores`, `demoClientPriorities`, `NotificationCategory` |
| `demoOnboarding.ts` | `onboarding_items` | `demoOnboardingSteps`, `getOnboardingSummary`, `getVeroxaNextNeeds` |
| `demoMediaAssets.ts` | `media_assets`, `media_runway` | `demoMediaItems`, `demoMediaRunway`, `getMediaSummary`, `MediaStatus`, `MediaType` |
| `demoNotifications.ts` | `notifications` | `demoNotifications`, `demoRoleNotifications`, `DemoNotification`, `NotificationKind` |
| `demoActivityLogs.ts` | `activity_logs` | `demoActivityEvents`, `demoActivityLog`, `ActivityRole`, `ActivityKind` |
| `demoWeeklyReports.ts` | `weekly_reports`, `report_ops` | `demoWeeklyReports`, `demoReportingOps`, `demoUpcomingReports`, `reportOpStatusColor` |
| `demoMonthlyReports.ts` | `monthly_reports` | `demoMonthlyReports` |
| `demoPosts.ts` | `posts`, `content_concepts`, `tasks` | `demoContentPipelineItems`, `demoContentItems`, `demoTasksV2`, `demoWorkflowStages`, `ContentType`, `WorkflowStage` |
| `demoPostSlots.ts` | `post_slots` | `demoCalendarSlots`, `CalendarSlotKind` |
| `demoRequests.ts` | `client_requests` | `demoClientRequests`, `requestStatusColor`, `requestPriorityColor` |
| `demoAgents.ts` | `ai_agents`, `ai_suggestions` | `demoAgents`, `demoAiAgentsV2`, `demoAiSuggestions`, `demoAgentWorkflow`, `demoAiAgentSummary` |
| `demoTeam.ts` | `team_members`, `team_alerts` | `demoTeamMembers`, `demoTeamAlerts`, `demoTeamMetrics`, `demoTeamOversight` |
| `demoOperations.ts` | `work_items`, `content_review_queue`, `risk_alerts`, `operator_actions` | `demoWorkQueue`, `demoContentReviewQueue`, `demoRiskItems`, `demoOperatorActions`, `demoOperatorAssistant`, `demoDailyDigest`, `demoBottlenecks`, `demoOperatorMetrics`, `demoPipelineMetrics` |
| `demoFinancials.ts` | `revenue_events` (agg), `analytics` | `demoOwnerMetrics`, `demoRevenueTrend`, `demoServicePlans`, `demoBiMetrics`, `demoMediaAnalytics`, `demoOpsIntelligence`, `demoReportingAnalytics` |
| `demoOwner.ts` | `owner_alerts`, `rbac_permissions`, `automation_configs`, `internal_notes` | `demoOwnerCommandItems`, `demoPermissionsMatrix`, `demoAutomationRoadmap`, `demoSystemMap`, `demoOwnerBriefing`, `demoInternalNotes`, `BizSeverity` |
| `demoSystemStatus.ts` | `system_config` / status reference | `demoControlPresets`, `demoSystemStatus`, `SystemStatusState` |
| `demoClientTeamWork.ts` | `client_team_submissions`, `client_team_messages`, `client_action_items`, `client_team_status_events` | `demoClientTeamSubmissions`, `demoClientTeamMessages`, `demoClientActionItems`, `demoClientTeamStatusEvents`, `ClientTeamSubmission`, `ClientTeamMessage`, `ClientActionItem`, `ClientTeamStatusEvent`, helpers (`getClientTeamSubmissions`, `getSubmissionsForClient`, `getOpenClientActions`, `getTeamInboxSubmissions`, `getBlockedSubmissions`, `getClientTeamMessages`, `getSubmissionMessages`, `getClientTeamWorkSummary`, `getStatusEventsForSubmission`, `getClientVisibleStatusEvents`, `getTeamStatusEvents`, `getLatestStatusEventForSubmission`, `getSubmissionWorkType`, `getSubmissionTeamWorkStatus`, `getSubmissionClientStatusLabel`, `getSubmissionTeamStatusLabel`, `getSubmissionNextTeamAction`, `getSubmissionNextClientAction`, `getActiveSubmissionsForClient`, `getClientActionableSubmissions`, `getTeamReadySubmissions`, `getTeamWaitingOnClientSubmissions`, `getCompletedSubmissionsForClient`, `getSubmissionById`) |
| `demoRestaurantSearch.ts` | (none — public `/free-audit` fixture only; not a future table) | `RestaurantSearchCandidate`, `demoRestaurantSearchCandidates`, `searchRestaurantCandidates`, `getRestaurantCandidateById` |

## Cross-file imports

| Importer | Imports from |
|---|---|
| `demoOnboarding.ts` | `demoClients.ts` (`demoRestaurants`) |
| `demoMediaAssets.ts` | `demoClientHealth.ts` (`demoClientHealth`) |
| `demoOperations.ts` | `demoPosts.ts` (`ContentType`), `demoOwner.ts` (`BizSeverity`) |
| `demoFinancials.ts` | `demoOwner.ts` (`BizSeverity`) |

## Conventions

- **AUTH_MODE** is locked to `"placeholder"` — do not change.
- All data is static/illustrative — no backend, no real APIs.
- Add new demo exports to the most relevant split file, then update this map.
- When a real backend table is introduced, the corresponding demo file becomes
  the authoritative interface contract for that domain — copy its types first.
