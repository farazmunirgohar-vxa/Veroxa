// TODO(client-health-drift): identical drift to owner-client-health.tsx. This
//   page renders <ClientHealthCenter />, which reads `demoClientHealth`
//   directly with the non-canonical vocabulary `healthy | attention | critical`.
//   The canonical source is `ClientHealthEngine.profiles()` +
//   `portfolioSummary()` in `src/domain/clientHealth/engine.ts`, vocabulary
//   `Healthy | Caution | Urgent | Broken`. See
//   `docs/CLIENT_HEALTH_ENGINE_CONTRACT.md` §5.2 (Operator/team shell). The
//   widget itself is the root cause — migrating it once would remediate both
//   the owner and operator client-health pages. No fix in this pass —
//   documentation only.
import { PortalLayout } from "@/components/PortalLayout";
import { ClientHealthCenter } from "@/components/ClientHealthCenter";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function OperatorClientHealth() {
  return (
    <PortalLayout
      items={operatorPortalNavItems}
      portalName="Operator Portal"
    >
      <div className="mb-6">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight text-foreground"
          data-testid="header-client-health"
        >
          Client Health Center
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Per-client health view for operators — main issues, recommended
          actions, and assigned team.
        </p>
      </div>

      <DemoOnlyBanner
        message="Demo only — operational health signals are illustrative. No real monitoring is connected."
        testId="banner-operator-health"
      />

      <ClientHealthCenter viewerRole="operator" />
    </PortalLayout>
  );
}
