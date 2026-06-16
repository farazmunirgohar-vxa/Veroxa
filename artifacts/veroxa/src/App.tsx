import { lazy } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary, RouteBoundary } from "@/components/common";
import { ScrollToTop } from "@/components/ScrollToTop";

// Route guards (small wrappers — kept eager so guard logic runs immediately)
import InternalDemoGuard from "@/components/auth/InternalDemoGuard";
import ClientPortalGuard from "@/components/auth/ClientPortalGuard";
import { RealPortalDataBoundary } from "@/components/auth/RealPortalDataBoundary";

// Page components — lazy-loaded so visitors only download the route they open.
const NotFound = lazy(() => import("@/pages/not-found"));

// Public site
const LandingPage = lazy(() => import("@/pages/landing"));
const ServicesPage = lazy(() => import("@/pages/services"));
const PricingPage = lazy(() => import("@/pages/pricing"));
const LoginPage = lazy(() => import("@/pages/login"));
const FreeAudit = lazy(() => import("@/pages/free-audit"));


// Client Portal (real Veroxa OS review — /client/*)
const ClientDashboard = lazy(() => import("@/pages/client-dashboard"));
const ClientMedia = lazy(() => import("@/pages/client-media"));
const ClientMessages = lazy(() => import("@/pages/client-messages"));
const ClientReports = lazy(() => import("@/pages/client-reports"));
const ClientConnections = lazy(() => import("@/pages/client-connections"));
const ClientProfile = lazy(() => import("@/pages/client-profile"));

// Team Portal (real Veroxa OS review — /team/*, login required)
const TeamDashboard = lazy(() => import("@/pages/team-dashboard"));
const TeamApprovalQueue = lazy(() => import("@/pages/team-approval-queue"));
const TeamVisibilityAudit = lazy(() => import("@/pages/team-visibility-audit"));
const TeamFirstClientReadiness = lazy(() => import("@/pages/team-first-client-readiness"));
const TeamFirstClientOps = lazy(() => import("@/pages/team-first-client-ops"));
const TeamUploadInbox = lazy(() => import("@/pages/team-upload-inbox"));
const TeamWorkQueue = lazy(() => import("@/pages/team-work-queue"));
const TeamManualExecution = lazy(() => import("@/pages/team-manual-execution"));
const TeamDirectionQueue = lazy(() => import("@/pages/team-direction-queue"));
const TeamReportQueue = lazy(() => import("@/pages/team-report-queue"));
const TeamAuditLeads = lazy(() => import("@/pages/team-audit-leads"));
const TeamOnboarding = lazy(() => import("@/pages/team-onboarding"));
const TeamProfileCorrections = lazy(() => import("@/pages/team-profile-corrections"));

const queryClient = new QueryClient();

function Router() {
  return (
    <RouteBoundary>
      <Switch>
        {/* ── Public site ─────────────────────────────────────────── */}
        <Route path="/" component={LandingPage} />
        <Route path="/services" component={ServicesPage} />
        <Route path="/pricing" component={PricingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/free-audit" component={FreeAudit} />

        {/* ── Client Portal — login required in placeholder and future real auth ── */}
        <Route path="/client/dashboard">
          {() => (
            <ClientPortalGuard>
              <RealPortalDataBoundary portal="client">
                <ClientDashboard />
              </RealPortalDataBoundary>
            </ClientPortalGuard>
          )}
        </Route>
        <Route path="/client/onboarding">
          {() => (
            <ClientPortalGuard>
              <RealPortalDataBoundary portal="client">
                <ClientProfile />
              </RealPortalDataBoundary>
            </ClientPortalGuard>
          )}
        </Route>
        <Route path="/client/media">
          {() => (
            <ClientPortalGuard>
              <RealPortalDataBoundary portal="client">
                <ClientMedia />
              </RealPortalDataBoundary>
            </ClientPortalGuard>
          )}
        </Route>
        <Route path="/client/messages">
          {() => (
            <ClientPortalGuard>
              <RealPortalDataBoundary portal="client">
                <ClientMessages />
              </RealPortalDataBoundary>
            </ClientPortalGuard>
          )}
        </Route>
        <Route path="/client/requests">
          {() => (
            <ClientPortalGuard>
              <RealPortalDataBoundary portal="client">
                <ClientMessages />
              </RealPortalDataBoundary>
            </ClientPortalGuard>
          )}
        </Route>
        <Route path="/client/updates">
          {() => (
            <ClientPortalGuard>
              <RealPortalDataBoundary portal="client">
                <ClientReports />
              </RealPortalDataBoundary>
            </ClientPortalGuard>
          )}
        </Route>
        <Route path="/client/reports">
          {() => (
            <ClientPortalGuard>
              <RealPortalDataBoundary portal="client">
                <ClientReports />
              </RealPortalDataBoundary>
            </ClientPortalGuard>
          )}
        </Route>
        <Route path="/client/connections">
          {() => (
            <ClientPortalGuard>
              <RealPortalDataBoundary portal="client">
                <ClientConnections />
              </RealPortalDataBoundary>
            </ClientPortalGuard>
          )}
        </Route>
        <Route path="/client/profile">
          {() => (
            <ClientPortalGuard>
              <RealPortalDataBoundary portal="client">
                <ClientProfile />
              </RealPortalDataBoundary>
            </ClientPortalGuard>
          )}
        </Route>

        {/* ── Team Portal — real Veroxa OS review (login required) ──── */}
        <Route path="/team/dashboard">
          {() => (
            <InternalDemoGuard role="team">
              <RealPortalDataBoundary portal="team">
                <TeamDashboard />
              </RealPortalDataBoundary>
            </InternalDemoGuard>
          )}
        </Route>
        <Route path="/team/onboarding">
          {() => (
            <InternalDemoGuard role="team">
              <RealPortalDataBoundary portal="team">
                <TeamOnboarding />
              </RealPortalDataBoundary>
            </InternalDemoGuard>
          )}
        </Route>
        <Route path="/team/upload-inbox">
          {() => (
            <InternalDemoGuard role="team">
              <RealPortalDataBoundary portal="team">
                <TeamUploadInbox />
              </RealPortalDataBoundary>
            </InternalDemoGuard>
          )}
        </Route>
        <Route path="/team/work-queue">
          {() => (
            <InternalDemoGuard role="team">
              <RealPortalDataBoundary portal="team">
                <TeamWorkQueue />
              </RealPortalDataBoundary>
            </InternalDemoGuard>
          )}
        </Route>
        <Route path="/team/manual-execution">
          {() => (
            <InternalDemoGuard role="team">
              <RealPortalDataBoundary portal="team">
                <TeamManualExecution />
              </RealPortalDataBoundary>
            </InternalDemoGuard>
          )}
        </Route>
        <Route path="/team/direction-queue">
          {() => (
            <InternalDemoGuard role="team">
              <RealPortalDataBoundary portal="team">
                <TeamDirectionQueue />
              </RealPortalDataBoundary>
            </InternalDemoGuard>
          )}
        </Route>
        <Route path="/team/report-queue">
          {() => (
            <InternalDemoGuard role="team">
              <RealPortalDataBoundary portal="team">
                <TeamReportQueue />
              </RealPortalDataBoundary>
            </InternalDemoGuard>
          )}
        </Route>
        <Route path="/team/audit-leads">
          {() => (
            <InternalDemoGuard role="team">
              <RealPortalDataBoundary portal="team">
                <TeamAuditLeads />
              </RealPortalDataBoundary>
            </InternalDemoGuard>
          )}
        </Route>
        <Route path="/team/approval-queue">
          {() => (
            <InternalDemoGuard role="team">
              <RealPortalDataBoundary portal="team">
                <TeamApprovalQueue />
              </RealPortalDataBoundary>
            </InternalDemoGuard>
          )}
        </Route>
        <Route path="/team/profile-corrections">
          {() => (
            <InternalDemoGuard role="team">
              <RealPortalDataBoundary portal="team">
                <TeamProfileCorrections />
              </RealPortalDataBoundary>
            </InternalDemoGuard>
          )}
        </Route>
        <Route path="/team/visibility-audit">
          {() => (
            <InternalDemoGuard role="team">
              <RealPortalDataBoundary portal="team">
                <TeamVisibilityAudit />
              </RealPortalDataBoundary>
            </InternalDemoGuard>
          )}
        </Route>
        <Route path="/team/first-client-readiness">
          {() => (
            <InternalDemoGuard role="team">
              <RealPortalDataBoundary portal="team">
                <TeamFirstClientReadiness />
              </RealPortalDataBoundary>
            </InternalDemoGuard>
          )}
        </Route>
        <Route path="/team/first-client-ops">
          {() => (
            <InternalDemoGuard role="team">
              <RealPortalDataBoundary portal="team">
                <TeamFirstClientOps />
              </RealPortalDataBoundary>
            </InternalDemoGuard>
          )}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </RouteBoundary>
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
