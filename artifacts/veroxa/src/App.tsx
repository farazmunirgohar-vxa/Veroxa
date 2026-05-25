import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import LandingPage from "@/pages/landing";
import DemoHub from "@/pages/demo-hub";
import ClientPortal from "@/pages/client-portal";
import ClientDashboard from "@/pages/client-dashboard";
import ClientCalendar from "@/pages/client-calendar";
import ClientGoogle from "@/pages/client-google";
import ClientReports from "@/pages/client-reports";
import ClientUpdates from "@/pages/client-updates";
import ClientOnboarding from "@/pages/client-onboarding";
import ClientMedia from "@/pages/client-media";
import TeamPortal from "@/pages/team-portal";
import TeamTasks from "@/pages/team-tasks";
import TeamMediaReview from "@/pages/team-media-review";
import TeamAiReview from "@/pages/team-ai-review";
import TeamDrafts from "@/pages/team-drafts";
import TeamScheduling from "@/pages/team-scheduling";
import OperatorPortal from "@/pages/operator-portal";
import OperatorOverview from "@/pages/operator-overview";
import OperatorAlerts from "@/pages/operator-alerts";
import OperatorClientHealth from "@/pages/operator-client-health";
import OperatorFailedPosts from "@/pages/operator-failed-posts";
import OperatorReportApprovals from "@/pages/operator-report-approvals";
import OwnerPortal from "@/pages/owner-portal";
import OwnerDashboard from "@/pages/owner-dashboard";
import OwnerRevenue from "@/pages/owner-revenue";
import OwnerClientHealth from "@/pages/owner-client-health";
import OwnerAlerts from "@/pages/owner-alerts";
import OwnerSettings from "@/pages/owner-settings";
import OwnerAIAgents from "@/pages/owner-ai-agents";
import OwnerActivity from "@/pages/owner-activity";
import OwnerKpis from "@/pages/owner-kpis";
import OwnerMediaInventory from "@/pages/owner-media-inventory";
import OwnerWeeklyReports from "@/pages/owner-weekly-reports";
import OwnerMonthlyReports from "@/pages/owner-monthly-reports";
import OperatorAIAgents from "@/pages/operator-ai-agents";
import OperatorActivity from "@/pages/operator-activity";
import OperatorKpis from "@/pages/operator-kpis";
import OperatorMediaInventory from "@/pages/operator-media-inventory";
import OperatorWeeklyReports from "@/pages/operator-weekly-reports";
import OperatorMonthlyReports from "@/pages/operator-monthly-reports";
import ClientWeeklyReport from "@/pages/client-weekly-report";
import ClientMonthlyReport from "@/pages/client-monthly-report";
import OperatorPriorityBoard from "@/pages/operator-priority-board";
import OperatorTeamOversight from "@/pages/operator-team-oversight";
import OperatorContentOps from "@/pages/operator-content-ops";
import OperatorReportingCommand from "@/pages/operator-reporting-command";
import OperatorRiskCenter from "@/pages/operator-risk-center";
import OperatorActionCenter from "@/pages/operator-action-center";
import OperatorDailyDigest from "@/pages/operator-daily-digest";
import OwnerExecutiveDashboard from "@/pages/owner-executive-dashboard";
import OwnerCommandCenter from "@/pages/owner-command-center";
import OwnerAiAgentsV2 from "@/pages/owner-ai-agents-v2";
import OwnerAgentWorkflow from "@/pages/owner-agent-workflow";
import OwnerBiCenter from "@/pages/owner-bi-center";
import OwnerClientAnalytics from "@/pages/owner-client-analytics";
import OwnerReportingAnalytics from "@/pages/owner-reporting-analytics";
import OwnerMediaAnalytics from "@/pages/owner-media-analytics";
import OwnerOpsIntelligence from "@/pages/owner-ops-intelligence";
import OwnerPermissions from "@/pages/owner-permissions";
import OwnerAutomationRoadmap from "@/pages/owner-automation-roadmap";
import OwnerSystemMap from "@/pages/owner-system-map";
import OwnerDailyBriefing from "@/pages/owner-daily-briefing";
import OperatorOperationsCenter from "@/pages/operator-operations-center";
import OperatorWorkflowEngine from "@/pages/operator-workflow-engine";
import OperatorContentCalendar from "@/pages/operator-content-calendar";
import TeamTaskEngine from "@/pages/team-task-engine";
import ClientActivityLog from "@/pages/client-activity-log";
import InternalClientDetail from "@/pages/internal-client-detail";
import ClientAccount from "@/pages/client-account";
import OperatorCommandBoard from "@/pages/operator-command-board";
import ClientRequests from "@/pages/client-requests";
import InternalDemoControls from "@/pages/internal-demo-controls";
import InternalSystemStatus from "@/pages/internal-system-status";
import InternalArchitecture from "@/pages/internal-architecture";
import InternalIntegrations from "@/pages/internal-integrations";
import { ErrorBoundary } from "@/components/common";
import TeamDashboard from "@/pages/team-dashboard";
import TeamWorkQueue from "@/pages/team-work-queue";
import TeamContentReview from "@/pages/team-content-review";
import TeamReportQueue from "@/pages/team-report-queue";
import TeamPerformance from "@/pages/team-performance";
import TeamActivityFeed from "@/pages/team-activity-feed";
import TeamAlertCenter from "@/pages/team-alert-center";
import ClientWorkspace from "@/pages/client-workspace";
import ClientOnboardingCenter from "@/pages/client-onboarding-center";
import ClientContentPipeline from "@/pages/client-content-pipeline";
import ClientAIAgents from "@/pages/client-ai-agents";
import SupabaseTestPage from "@/pages/supabase-test";
import LoginPage from "@/pages/login";
import AuthStatusPage from "@/pages/auth-status";
import RealClientPlaceholder from "@/pages/real-client-placeholder";
import RealTeamPlaceholder from "@/pages/real-team-placeholder";
import RealOperatorPlaceholder from "@/pages/real-operator-placeholder";
import RealOwnerPlaceholder from "@/pages/real-owner-placeholder";
import InternalDemoGuard from "@/components/auth/InternalDemoGuard";
import ServicesPage from "@/pages/services";
import PricingPage from "@/pages/pricing";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={LandingPage} />
      <Route path="/services" component={ServicesPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/auth-status" component={AuthStatusPage} />
      <Route path="/demo" component={DemoHub} />

      {/* Public client demo — sales preview, no login required */}
      <Route path="/demo/client" component={ClientPortal} />
      <Route path="/demo/client/dashboard" component={ClientDashboard} />
      <Route path="/demo/client/calendar" component={ClientCalendar} />
      <Route path="/demo/client/google" component={ClientGoogle} />
      <Route path="/demo/client/reports" component={ClientReports} />
      <Route path="/demo/client/updates" component={ClientUpdates} />
      <Route path="/demo/client/onboarding" component={ClientOnboarding} />
      <Route path="/demo/client/media" component={ClientMedia} />
      <Route path="/demo/client/weekly-report" component={ClientWeeklyReport} />
      <Route path="/demo/client/monthly-report" component={ClientMonthlyReport} />
      <Route path="/demo/client/workspace" component={ClientWorkspace} />
      <Route path="/demo/client/onboarding-center" component={ClientOnboardingCenter} />
      <Route path="/demo/client/content-pipeline" component={ClientContentPipeline} />
      <Route path="/demo/client/ai-agents" component={ClientAIAgents} />

      {/* Internal team demo — login required, role = "team" */}
      <Route path="/demo/team">
        {() => <InternalDemoGuard role="team"><TeamPortal /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/team/tasks">
        {() => <InternalDemoGuard role="team"><TeamTasks /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/team/media-review">
        {() => <InternalDemoGuard role="team"><TeamMediaReview /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/team/ai-review">
        {() => <InternalDemoGuard role="team"><TeamAiReview /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/team/drafts">
        {() => <InternalDemoGuard role="team"><TeamDrafts /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/team/scheduling">
        {() => <InternalDemoGuard role="team"><TeamScheduling /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/team/dashboard">
        {() => <InternalDemoGuard role="team"><TeamDashboard /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/team/work-queue">
        {() => <InternalDemoGuard role="team"><TeamWorkQueue /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/team/content-review">
        {() => <InternalDemoGuard role="team"><TeamContentReview /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/team/report-queue">
        {() => <InternalDemoGuard role="team"><TeamReportQueue /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/team/performance">
        {() => <InternalDemoGuard role="team"><TeamPerformance /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/team/activity-feed">
        {() => <InternalDemoGuard role="team"><TeamActivityFeed /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/team/alerts">
        {() => <InternalDemoGuard role="team"><TeamAlertCenter /></InternalDemoGuard>}
      </Route>

      {/* Internal operator demo — login required, role = "operator" */}
      <Route path="/demo/operator">
        {() => <InternalDemoGuard role="operator"><OperatorPortal /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/operator/overview">
        {() => <InternalDemoGuard role="operator"><OperatorOverview /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/operator/alerts">
        {() => <InternalDemoGuard role="operator"><OperatorAlerts /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/operator/client-health">
        {() => <InternalDemoGuard role="operator"><OperatorClientHealth /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/operator/failed-posts">
        {() => <InternalDemoGuard role="operator"><OperatorFailedPosts /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/operator/report-approvals">
        {() => <InternalDemoGuard role="operator"><OperatorReportApprovals /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/operator/ai-agents">
        {() => <InternalDemoGuard role="operator"><OperatorAIAgents /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/operator/activity">
        {() => <InternalDemoGuard role="operator"><OperatorActivity /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/operator/kpis">
        {() => <InternalDemoGuard role="operator"><OperatorKpis /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/operator/media-inventory">
        {() => <InternalDemoGuard role="operator"><OperatorMediaInventory /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/operator/weekly-reports">
        {() => <InternalDemoGuard role="operator"><OperatorWeeklyReports /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/operator/monthly-reports">
        {() => <InternalDemoGuard role="operator"><OperatorMonthlyReports /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/operator/priority-board">
        {() => <InternalDemoGuard role="operator"><OperatorPriorityBoard /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/operator/team-oversight">
        {() => <InternalDemoGuard role="operator"><OperatorTeamOversight /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/operator/content-ops">
        {() => <InternalDemoGuard role="operator"><OperatorContentOps /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/operator/reporting-command">
        {() => <InternalDemoGuard role="operator"><OperatorReportingCommand /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/operator/risk-center">
        {() => <InternalDemoGuard role="operator"><OperatorRiskCenter /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/operator/action-center">
        {() => <InternalDemoGuard role="operator"><OperatorActionCenter /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/operator/daily-digest">
        {() => <InternalDemoGuard role="operator"><OperatorDailyDigest /></InternalDemoGuard>}
      </Route>

      {/* Internal owner demo — login required, role = "owner" */}
      <Route path="/demo/owner">
        {() => <InternalDemoGuard role="owner"><OwnerPortal /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/dashboard">
        {() => <InternalDemoGuard role="owner"><OwnerDashboard /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/revenue">
        {() => <InternalDemoGuard role="owner"><OwnerRevenue /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/client-health">
        {() => <InternalDemoGuard role="owner"><OwnerClientHealth /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/alerts">
        {() => <InternalDemoGuard role="owner"><OwnerAlerts /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/settings">
        {() => <InternalDemoGuard role="owner"><OwnerSettings /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/ai-agents">
        {() => <InternalDemoGuard role="owner"><OwnerAIAgents /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/activity">
        {() => <InternalDemoGuard role="owner"><OwnerActivity /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/kpis">
        {() => <InternalDemoGuard role="owner"><OwnerKpis /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/media-inventory">
        {() => <InternalDemoGuard role="owner"><OwnerMediaInventory /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/weekly-reports">
        {() => <InternalDemoGuard role="owner"><OwnerWeeklyReports /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/monthly-reports">
        {() => <InternalDemoGuard role="owner"><OwnerMonthlyReports /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/executive-dashboard">
        {() => <InternalDemoGuard role="owner"><OwnerExecutiveDashboard /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/command-center">
        {() => <InternalDemoGuard role="owner"><OwnerCommandCenter /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/ai-agents-v2">
        {() => <InternalDemoGuard role="owner"><OwnerAiAgentsV2 /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/agent-workflow">
        {() => <InternalDemoGuard role="owner"><OwnerAgentWorkflow /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/bi-center">
        {() => <InternalDemoGuard role="owner"><OwnerBiCenter /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/client-analytics">
        {() => <InternalDemoGuard role="owner"><OwnerClientAnalytics /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/reporting-analytics">
        {() => <InternalDemoGuard role="owner"><OwnerReportingAnalytics /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/media-analytics">
        {() => <InternalDemoGuard role="owner"><OwnerMediaAnalytics /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/ops-intelligence">
        {() => <InternalDemoGuard role="owner"><OwnerOpsIntelligence /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/permissions">
        {() => <InternalDemoGuard role="owner"><OwnerPermissions /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/automation-roadmap">
        {() => <InternalDemoGuard role="owner"><OwnerAutomationRoadmap /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/system-map">
        {() => <InternalDemoGuard role="owner"><OwnerSystemMap /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/daily-briefing">
        {() => <InternalDemoGuard role="owner"><OwnerDailyBriefing /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/operator/operations-center">
        {() => <InternalDemoGuard role="operator"><OperatorOperationsCenter /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/operator/workflow-engine">
        {() => <InternalDemoGuard role="operator"><OperatorWorkflowEngine /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/operator/content-calendar">
        {() => <InternalDemoGuard role="operator"><OperatorContentCalendar /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/team/task-engine">
        {() => <InternalDemoGuard role="team"><TeamTaskEngine /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/client/activity-log" component={ClientActivityLog} />
      <Route path="/demo/client/account"      component={ClientAccount} />
      <Route path="/demo/client/requests"     component={ClientRequests} />
      <Route path="/demo/operator/command-board">
        {() => <InternalDemoGuard role="operator"><OperatorCommandBoard /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/operator/client-detail">
        {() => <InternalDemoGuard role="operator"><InternalClientDetail role="operator" /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/owner/client-detail">
        {() => <InternalDemoGuard role="owner"><InternalClientDetail role="owner" /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/team/client-detail">
        {() => <InternalDemoGuard role="team"><InternalClientDetail role="team" /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/internal/demo-controls">
        {() => <InternalDemoGuard role="operator"><InternalDemoControls /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/internal/system-status">
        {() => <InternalDemoGuard role="operator"><InternalSystemStatus /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/internal/architecture">
        {() => <InternalDemoGuard role="operator"><InternalArchitecture /></InternalDemoGuard>}
      </Route>
      <Route path="/demo/internal/integrations">
        {() => <InternalDemoGuard role="operator"><InternalIntegrations /></InternalDemoGuard>}
      </Route>

      <Route path="/demo/supabase-test" component={SupabaseTestPage} />

      {/* Future authenticated route placeholders */}
      <Route path="/client/dashboard" component={RealClientPlaceholder} />
      <Route path="/client/onboarding" component={RealClientPlaceholder} />
      <Route path="/client/media" component={RealClientPlaceholder} />
      <Route path="/client/calendar" component={RealClientPlaceholder} />
      <Route path="/client/reports" component={RealClientPlaceholder} />
      <Route path="/team/tasks" component={RealTeamPlaceholder} />
      <Route path="/team/media-review" component={RealTeamPlaceholder} />
      <Route path="/team/drafts" component={RealTeamPlaceholder} />
      <Route path="/team/scheduling" component={RealTeamPlaceholder} />
      <Route path="/operator/overview" component={RealOperatorPlaceholder} />
      <Route path="/operator/alerts" component={RealOperatorPlaceholder} />
      <Route path="/operator/report-approvals" component={RealOperatorPlaceholder} />
      <Route path="/owner/dashboard" component={RealOwnerPlaceholder} />
      <Route path="/owner/revenue" component={RealOwnerPlaceholder} />
      <Route path="/owner/client-health" component={RealOwnerPlaceholder} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
