import { PortalLayout } from "@/components/PortalLayout";
import { AIAgentsView } from "@/components/AIAgentsView";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function OperatorAIAgents() {
  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground" data-testid="header-ai-agents">
          AI Agents
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Operator view of the AI agent layer — purpose, recent demo outputs, and confidence.
        </p>
      </div>
      <DemoOnlyBanner
        message="AI Preview — Demonstration only. No live AI actions are being executed."
        testId="banner-operator-ai-agents"
      />
      <AIAgentsView viewerRole="operator" />
    </PortalLayout>
  );
}
