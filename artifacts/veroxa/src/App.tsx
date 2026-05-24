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
import SupabaseTestPage from "@/pages/supabase-test";
import LoginPage from "@/pages/login";
import RealClientPlaceholder from "@/pages/real-client-placeholder";
import RealTeamPlaceholder from "@/pages/real-team-placeholder";
import RealOperatorPlaceholder from "@/pages/real-operator-placeholder";
import RealOwnerPlaceholder from "@/pages/real-owner-placeholder";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/demo" component={DemoHub} />
      <Route path="/demo/client" component={ClientPortal} />
      <Route path="/demo/client/dashboard" component={ClientDashboard} />
      <Route path="/demo/client/calendar" component={ClientCalendar} />
      <Route path="/demo/client/google" component={ClientGoogle} />
      <Route path="/demo/client/reports" component={ClientReports} />
      <Route path="/demo/client/updates" component={ClientUpdates} />
      <Route path="/demo/client/onboarding" component={ClientOnboarding} />
      <Route path="/demo/client/media" component={ClientMedia} />
      <Route path="/demo/team" component={TeamPortal} />
      <Route path="/demo/team/tasks" component={TeamTasks} />
      <Route path="/demo/team/media-review" component={TeamMediaReview} />
      <Route path="/demo/team/ai-review" component={TeamAiReview} />
      <Route path="/demo/team/drafts" component={TeamDrafts} />
      <Route path="/demo/team/scheduling" component={TeamScheduling} />
      <Route path="/demo/operator" component={OperatorPortal} />
      <Route path="/demo/operator/overview" component={OperatorOverview} />
      <Route path="/demo/operator/alerts" component={OperatorAlerts} />
      <Route path="/demo/operator/client-health" component={OperatorClientHealth} />
      <Route path="/demo/operator/failed-posts" component={OperatorFailedPosts} />
      <Route path="/demo/operator/report-approvals" component={OperatorReportApprovals} />
      <Route path="/demo/owner" component={OwnerPortal} />
      <Route path="/demo/owner/dashboard" component={OwnerDashboard} />
      <Route path="/demo/owner/revenue" component={OwnerRevenue} />
      <Route path="/demo/owner/client-health" component={OwnerClientHealth} />
      <Route path="/demo/owner/alerts" component={OwnerAlerts} />
      <Route path="/demo/owner/settings" component={OwnerSettings} />
      <Route path="/demo/supabase-test" component={SupabaseTestPage} />
      <Route path="/login" component={LoginPage} />
      {/* Future authenticated route placeholders — UI shell only, no real auth yet. */}
      <Route path="/client/dashboard" component={RealClientPlaceholder} />
      <Route path="/team/tasks" component={RealTeamPlaceholder} />
      <Route path="/operator/overview" component={RealOperatorPlaceholder} />
      <Route path="/owner/dashboard" component={RealOwnerPlaceholder} />
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
