import { Palette, Users, CreditCard, Plug } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

const sections = [
  {
    icon: Palette,
    title: "Brand settings",
    desc: "Agency logo, brand colors, public name, and default voice profile applied to every client deliverable.",
  },
  {
    icon: Users,
    title: "Team permissions",
    desc: "Role assignments, team-to-client mappings, and operator escalation rules.",
  },
  {
    icon: CreditCard,
    title: "Billing settings",
    desc: "Invoicing, retainer plans, and payment processor configuration. No payment processor is connected.",
  },
  {
    icon: Plug,
    title: "Integrations",
    desc: "Supabase, Google Business Profile, Meta, TikTok, and AI providers. None are connected in this demo.",
  },
];

export default function OwnerSettings() {
  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-settings">Settings</h2>
        <p className="text-muted-foreground mt-1">Account and agency preferences.</p>
      </div>

      <DemoOnlyBanner message="Static demo — no settings are saved. None of these sections are wired to a backend, billing processor, or third-party integration yet." />

      <div className="grid sm:grid-cols-2 gap-4 max-w-4xl">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title} className="bg-card border-border" data-testid={`settings-section-${s.title.toLowerCase().replace(/\s+/g, "-")}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-base font-semibold">{s.title}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[10px] tracking-wide">Coming soon</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PortalLayout>
  );
}
