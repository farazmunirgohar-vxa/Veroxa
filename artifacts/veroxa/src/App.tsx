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
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
