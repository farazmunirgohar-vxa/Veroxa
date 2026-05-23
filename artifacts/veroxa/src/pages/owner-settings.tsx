import { Settings as SettingsIcon } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";

export default function OwnerSettings() {
  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-settings">Settings</h2>
        <p className="text-muted-foreground mt-1">Account and agency preferences.</p>
      </div>

      <Card className="bg-card border-border max-w-2xl">
        <CardContent className="p-8 flex flex-col items-center text-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Settings coming soon</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Agency-wide preferences, branding, team roles, billing, and integrations are planned for a future release.
            No real settings are configured in this demo.
          </p>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}
