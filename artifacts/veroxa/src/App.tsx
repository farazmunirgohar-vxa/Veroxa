import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/common";
import { ScrollToTop } from "@/components/ScrollToTop";
import NotFound from "@/pages/not-found";

// Public site
import LandingPage from "@/pages/landing";
import ServicesPage from "@/pages/services";
import PricingPage from "@/pages/pricing";
import LoginPage from "@/pages/login";
import FreeAudit from "@/pages/free-audit";

// Public demo preview (sample data, no login)
import DemoHub from "@/pages/demo-hub";
import GuidedDemo from "@/pages/guided-demo";
import RestaurantUploadAccess from "@/pages/restaurant-upload-access";

// Client Portal (real Veroxa OS review — /client/*)
import ClientDashboard from "@/pages/client-dashboard";
import ClientMedia from "@/pages/client-media";
import ClientRequests from "@/pages/client-requests";
import ClientUpdates from "@/pages/client-updates";
import ClientReports from "@/pages/client-reports";

// Team Portal (real Veroxa OS review — /team/*, login required)
import InternalDemoGuard from "@/components/auth/InternalDemoGuard";
import TeamDashboard from "@/pages/team-dashboard";
import TeamApprovalQueue from "@/pages/team-approval-queue";
import TeamVisibilityAudit from "@/pages/team-visibility-audit";
import TeamUploadInbox from "@/pages/team-upload-inbox";
import TeamWorkQueue from "@/pages/team-work-queue";
import TeamDirectionQueue from "@/pages/team-direction-queue";
import TeamReportQueue from "@/pages/team-report-queue";
import TeamAuditLeads from "@/pages/team-audit-leads";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* ── Public site ─────────────────────────────────────────── */}
      <Route path="/" component={LandingPage} />
      <Route path="/services" component={ServicesPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/free-audit" component={FreeAudit} />

      {/* ── Public demo preview — sample data only, no login ─────── */}
      <Route path="/demo" component={DemoHub} />
      <Route path="/guided-demo" component={GuidedDemo} />
      {/* Restaurant Upload Key entry — public, demo-only. No login. */}
      <Route path="/upload" component={RestaurantUploadAccess} />
      {/* Public client preview surfaced from the demo hub. */}
      <Route path="/demo/client/dashboard" component={ClientDashboard} />

      {/* ── Client Portal — real Veroxa OS review (public, no login) ── */}
      <Route path="/client/dashboard" component={ClientDashboard} />
      <Route path="/client/media" component={ClientMedia} />
      <Route path="/client/requests" component={ClientRequests} />
      <Route path="/client/updates" component={ClientUpdates} />
      <Route path="/client/reports" component={ClientReports} />

      {/* ── Team Portal — real Veroxa OS review (login required) ──── */}
      <Route path="/team/dashboard">
        {() => (
          <InternalDemoGuard role="team">
            <TeamDashboard />
          </InternalDemoGuard>
        )}
      </Route>
      <Route path="/team/upload-inbox">
        {() => (
          <InternalDemoGuard role="team">
            <TeamUploadInbox />
          </InternalDemoGuard>
        )}
      </Route>
      <Route path="/team/work-queue">
        {() => (
          <InternalDemoGuard role="team">
            <TeamWorkQueue />
          </InternalDemoGuard>
        )}
      </Route>
      <Route path="/team/direction-queue">
        {() => (
          <InternalDemoGuard role="team">
            <TeamDirectionQueue />
          </InternalDemoGuard>
        )}
      </Route>
      <Route path="/team/report-queue">
        {() => (
          <InternalDemoGuard role="team">
            <TeamReportQueue />
          </InternalDemoGuard>
        )}
      </Route>
      <Route path="/team/audit-leads">
        {() => (
          <InternalDemoGuard role="team">
            <TeamAuditLeads />
          </InternalDemoGuard>
        )}
      </Route>
      <Route path="/team/approval-queue">
        {() => (
          <InternalDemoGuard role="team">
            <TeamApprovalQueue />
          </InternalDemoGuard>
        )}
      </Route>
      <Route path="/team/visibility-audit">
        {() => (
          <InternalDemoGuard role="team">
            <TeamVisibilityAudit />
          </InternalDemoGuard>
        )}
      </Route>

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
            <ScrollToTop />
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
