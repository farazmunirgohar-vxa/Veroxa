import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import LandingPage from "@/pages/landing";
import DemoHub from "@/pages/demo-hub";
import ClientPortal from "@/pages/client-portal";
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
