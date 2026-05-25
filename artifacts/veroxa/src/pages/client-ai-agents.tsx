import { PortalLayout } from "@/components/PortalLayout";
import { AIAgentsView } from "@/components/AIAgentsView";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function ClientAIAgents() {
  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <div className="mb-6">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight text-foreground"
          data-testid="header-client-ai-agents"
        >
          AI Agents
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          A preview of the AI agents Veroxa uses to power your content workflow.
        </p>
      </div>
      <DemoOnlyBanner
        message="Demo only — agent activity is illustrative. No real AI calls are made."
        testId="banner-client-ai-agents"
      />
      <AIAgentsView viewerRole="client" />
    </PortalLayout>
  );
}
