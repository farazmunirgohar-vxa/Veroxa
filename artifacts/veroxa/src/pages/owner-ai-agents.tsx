import { PortalLayout } from "@/components/PortalLayout";
import { AIAgentsView } from "@/components/AIAgentsView";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function OwnerAIAgents() {
  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground" data-testid="header-ai-agents">
          AI Agents
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Preview of the AI agent layer that will power the Veroxa restaurant growth OS.
        </p>
      </div>
      <DemoOnlyBanner
        message="AI Preview — Demonstration only. No live AI actions are being executed. No OpenAI, Anthropic, Gemini, social APIs, or automation tools are connected."
        testId="banner-owner-ai-agents"
      />
      <AIAgentsView viewerRole="owner" />
    </PortalLayout>
  );
}
