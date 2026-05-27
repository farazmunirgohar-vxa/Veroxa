# Veroxa Growth OS — Route & Nav Audit

> Date: 2026-05-27
> Pass: Hard stabilization pass

This document maps every route in `App.tsx` to its nav visibility status,
build state, and recommended action for the sales demo.

---

## Public Routes (no login required)

| Path | Component | Nav visibility | Notes |
|------|-----------|----------------|-------|
| `/` | Landing | Public nav | ✅ polished |
| `/services` | Services | Public nav | ✅ polished |
| `/pricing` | Pricing | Public nav | ✅ pricing corrected 2026-05-27 |
| `/demo` | DemoHub | Public nav | ✅ polished, client-only preview |
| `/login` | Login | Public nav | ✅ placeholder auth |
| `/demo/client/dashboard` | ClientDashboard | Linked from /demo | ✅ primary demo entry |
| `/demo/client/calendar` | ClientCalendar | Client sidebar | ✅ |
| `/demo/client/reports` | ClientReports | Client sidebar | ✅ |
| `/demo/client/media` | ClientMedia | Client sidebar | ✅ |
| `/demo/client/ai-draft-preview` | ClientAiDraftPreview | Client sidebar | ✅ |
| `/demo/client/requests` | ClientRequests | Client sidebar | ✅ |
| `/demo/client/account` | ClientAccount | Client sidebar | ✅ |
| `/demo/client/activity-log` | ClientActivityLog | Hidden | Secondary |
| `/demo/client/updates` | ClientUpdates | Hidden from nav | Rich page — consider surfacing |

---

## Client Portal Nav (visible items)

| Label | Path | Status |
|-------|------|--------|
| Dashboard | `/demo/client/dashboard` | ✅ primary |
| Upload Media | `/demo/client/media` | ✅ |
| AI Draft Preview | `/demo/client/ai-draft-preview` | ✅ |
| Calendar | `/demo/client/calendar` | ✅ |
| Reports | `/demo/client/reports` | ✅ |
| Requests | `/demo/client/requests` | ✅ |
| Account | `/demo/client/account` | ✅ |

**Hidden from nav (routes still active):**
- `/demo/client/workspace` — Workspace
- `/demo/client/onboarding-center` — Onboarding Center
- `/demo/client/content-pipeline` — Content Pipeline
- `/demo/client/google` — Google Business Profile
- `/demo/client/activity-log` — Activity Log
- `/demo/client/updates` — Weekly Updates (was polished 2026-05-27, consider surfacing)

---

## Team Portal Nav (visible items)

| Label | Path | Status |
|-------|------|--------|
| Dashboard | `/demo/team/dashboard` | ✅ |
| Work Queue | `/demo/team/work-queue` | ✅ |
| Media Review | `/demo/team/media-review` | ✅ polished |
| Content Review | `/demo/team/content-review` | ✅ polished, added to nav 2026-05-27 |
| Drafts | `/demo/team/drafts` | ✅ |
| Scheduling | `/demo/team/scheduling` | ✅ |
| Reports | `/demo/team/report-queue` | ✅ |
| Alerts | `/demo/team/alerts` | ✅ |

**Hidden from nav (routes still active):**
- `/demo/team/performance` — Team Performance (polished, hidden — consider surfacing)
- `/demo/team/client-detail` — Per-client detail view

**Future deletion candidates:**
- `/demo/team/task-engine` — Kanban view, overlaps Work Queue
- `/demo/team/tasks` — Personal task list, overlaps Dashboard

---

## Operator Portal Nav (visible items — 23 items + 4 section headers)

### Core
| Label | Path | Status |
|-------|------|--------|
| Command Center | `/demo/operator/operator-os` | ✅ primary |
| Client Health | `/demo/operator/client-health` | ✅ |
| Alerts | `/demo/operator/alerts` | ✅ |
| Report Approvals | `/demo/operator/report-approvals` | ✅ polished |
| Media Library | `/demo/operator/media-library` | ✅ |
| Team Oversight | `/demo/operator/team-oversight` | ✅ |
| System Status | `/demo/operator/system-status` | ✅ polished |

### Intelligence
| Label | Path | Status |
|-------|------|--------|
| Action Center | `/demo/operator/action-center` | ✅ |
| Priority Board | `/demo/operator/priority-board` | ✅ |
| Risk Center | `/demo/operator/risk-center` | ✅ |
| Daily Digest | `/demo/operator/daily-digest` | ✅ |

### Operations
| Label | Path | Status |
|-------|------|--------|
| Content Calendar | `/demo/operator/content-calendar` | ✅ |
| Content Ops | `/demo/operator/content-ops` | ✅ |
| Workflow Engine | `/demo/operator/workflow-engine` | ✅ |
| Ops Center | `/demo/operator/operations-center` | ✅ |
| Failed Posts | `/demo/operator/failed-posts` | ✅ |

### Reporting
| Label | Path | Status |
|-------|------|--------|
| Report Command | `/demo/operator/reporting-command` | ✅ |
| Weekly Reports | `/demo/operator/weekly-reports` | ✅ |
| Monthly Reports | `/demo/operator/monthly-reports` | ✅ |
| KPIs | `/demo/operator/kpis` | ✅ |

### Agents & Data
| Label | Path | Status |
|-------|------|--------|
| AI Agents | `/demo/operator/ai-agents` | ✅ |
| Activity | `/demo/operator/activity` | ✅ |
| Media Inventory | `/demo/operator/media-inventory` | ✅ |

**Note:** 23 items is heavy for a sales demo. Recommended simplified operator
demo path: Command Center → Client Health → Report Approvals → System Status.

---

## Owner Portal Nav (visible items — 7 items)

| Label | Path | Status |
|-------|------|--------|
| Executive Dashboard | `/demo/owner/executive-dashboard` | ✅ primary, polished |
| Revenue | `/demo/owner/revenue` | ✅ polished |
| Client Health | `/demo/owner/client-health` | ✅ |
| Critical Alerts | `/demo/owner/alerts` | ✅ |
| AI / System Health | `/demo/owner/ai-agents-v2` | ✅ |
| Growth | `/demo/owner/owner-os` | ✅ |
| Settings | `/demo/owner/settings` | ✅ |

**Hidden from nav (routes still active):**

| Path | Component | Notes |
|------|-----------|-------|
| `/demo/owner/bi-center` | OwnerBiCenter | BI analytics |
| `/demo/owner/client-analytics` | OwnerClientAnalytics | Client analytics deep-dive |
| `/demo/owner/reporting-analytics` | OwnerReportingAnalytics | Reporting analytics |
| `/demo/owner/media-analytics` | OwnerMediaAnalytics | Media analytics |
| `/demo/owner/ops-intelligence` | OwnerOpsIntelligence | Ops intelligence |
| `/demo/owner/agent-workflow` | OwnerAgentWorkflow | Agent workflow detail |
| `/demo/owner/automation-roadmap` | OwnerAutomationRoadmap | Automation roadmap |
| `/demo/owner/system-map` | OwnerSystemMap | System map |
| `/demo/owner/daily-briefing` | OwnerDailyBriefing | Daily briefing |
| `/demo/owner/permissions` | OwnerPermissions | Permissions |
| `/demo/owner/activity` | OwnerActivity | Activity feed |
| `/demo/owner/kpis` | OwnerKpis | KPI surface |
| `/demo/owner/media-inventory` | OwnerMediaInventory | Media inventory |
| `/demo/owner/weekly-reports` | OwnerWeeklyReports | Weekly archive |
| `/demo/owner/monthly-reports` | OwnerMonthlyReports | Monthly archive |

**Future deletion candidates:**
- `/demo/owner/dashboard` — shadowed by executive-dashboard
- `/demo/owner/command-center` — risk view, no nav entry, shadow of executive-dashboard
- `/demo/owner/ai-agents` — shadowed by ai-agents-v2

---

## Internal / Cross-Role Routes

| Path | Roles | Notes |
|------|-------|-------|
| `/demo/operator/client-detail` | operator | Per-client detail (operator view) |
| `/demo/owner/client-detail` | owner | Per-client detail (owner view) |
| `/demo/team/client-detail` | team | Per-client detail (team view) |
| `/demo/internal/demo-controls` | operator | Demo controls panel |
| `/demo/internal/system-status` | operator | Internal system status |
| `/demo/internal/architecture` | operator | Architecture view |
| `/demo/internal/integrations` | operator, owner | Integration center |
| `/demo/internal/client-health` | (hidden) | Cross-role client health |

---

## Recommended Restaurant-Owner Walkthrough (sales demo path)

Simplified path for a prospect seeing Veroxa for the first time:

1. **`/demo/client/dashboard`** — "This is your portal as a restaurant owner"
2. **`/demo/client/ai-draft-preview`** — "Upload a photo → get 3 caption drafts"
3. **`/demo/client/calendar`** — "Your content is scheduled here"
4. **`/demo/client/reports`** — "Your weekly and monthly results"
5. *(optional)* **`/demo/client/requests`** — "Veroxa asks you for what it needs"

Internal role showcase (for agency/operator pitch):
1. **`/demo/team/media-review`** — "Team reviews your photos before posting"
2. **`/demo/operator/operator-os`** — "Operator has full portfolio oversight"
3. **`/demo/owner/executive-dashboard`** — "Owner sees the business health summary"

---

## Pages considered too heavy for sales demo

- `/demo/operator/*` — 23 items; narrow to 4 core pages for demo walkthroughs
- `/demo/owner/bi-center` — full BI analytics, not needed in a first-touch demo
- `/demo/owner/ops-intelligence` — complex, suitable for deep-dive only
- `/demo/owner/agent-workflow` — technical detail, not restaurant-owner relevant
- `/demo/internal/*` — internal tooling, never shown to prospects

---

## Known route issues

None identified in this pass. All nav items resolve to registered routes.

---

## Safety confirmation

| Check | Result |
|-------|--------|
| `AUTH_MODE` | `"placeholder"` — verified in `src/lib/auth/authMode.ts` |
| OpenAI / Anthropic / Gemini imports | None in active UI code |
| Supabase storage upload | Not active (gated behind `AUTH_MODE`) |
| Real publishing API | Not connected |
| Payment integration | None |
| `supabase/migrations/` | Directory does not exist |
| Real restaurant data in fixtures | Removed — all demo names, addresses, emails use `.veroxa.test` domains and "Demo X" names |
| Demo gate | `InternalDemoGuard` wraps all internal routes; `veroxa-preview` gate unchanged |
