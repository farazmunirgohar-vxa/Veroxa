// TODO(client-health-drift): this page renders the portfolio health center via
//   <ClientHealthCenter />, which reads `demoClientHealth` directly with the
//   non-canonical vocabulary `healthy | attention | critical`. The canonical
//   source is `ClientHealthEngine.profiles()` + `portfolioSummary()` in
//   `src/domain/clientHealth/engine.ts`, which emits the canonical vocabulary
//   `Healthy | Caution | Urgent | Broken`. See
//   `docs/CLIENT_HEALTH_ENGINE_CONTRACT.md` §5.1 (Owner shell) and
//   `docs/CLIENT_HEALTH_SURFACE_MAP.md` §2 for the full audit. No fix in this
//   pass — documentation only.
import { PortalLayout } from "@/components/PortalLayout";
import { ClientHealthCenter } from "@/components/ClientHealthCenter";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function OwnerClientHealth() {
  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-6">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight text-foreground"
          data-testid="header-client-health"
        >
          Client Health Center
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Portfolio-wide view of which restaurants are healthy, need attention,
          or are at risk.
        </p>
      </div>

      <DemoOnlyBanner
        message="Demo only — health scores, signals, and recommended actions are illustrative. No real scoring logic, monitoring, or backend is connected."
        testId="banner-owner-health"
      />

      <ClientHealthCenter viewerRole="owner" />
    </PortalLayout>
  );
}
