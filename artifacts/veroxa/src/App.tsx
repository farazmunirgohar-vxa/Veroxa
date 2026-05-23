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
import TeamPortal from "@/pages/team-portal";
import OperatorPortal from "@/pages/operator-portal";
import OwnerPortal from "@/pages/owner-portal";
import SupabaseTestPage from "@/pages/supabase-test";

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
      <Route path="/demo/team" component={TeamPortal} />
      <Route path="/demo/operator" component={OperatorPortal} />
      <Route path="/demo/owner" component={OwnerPortal} />
      <Route path="/demo/supabase-test" component={SupabaseTestPage} />
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
