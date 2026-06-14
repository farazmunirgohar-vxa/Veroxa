import { Link } from "wouter";
import { MessageSquare } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { getClientPortalHref } from "@/lib/clientPortalRoutes";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { momoCpV1Seed, statusTone } from "@/domain/momoCpV1/momoClientPortalSeed";

export default function ClientProfile() {
  const mode = useRealPortalDataMode();
  const messagesHref = getClientPortalHref("messages", mode.isPublicDemoRoute);

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <PageHeader
        title="Profile"
        description="Review what Veroxa knows about your restaurant. If anything looks wrong, just message Veroxa."
        testId="header-client-profile"
      />

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 text-sm leading-6 text-muted-foreground">
          This page is for review only. Changes are not published or stored as live business updates here. Please message Veroxa if anything needs to be corrected.
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2" data-testid="profile-review-sections">
        {momoCpV1Seed.profile.map((section) => (
          <Card key={section.section}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-sm">{section.section}</CardTitle>
              {section.purpose ? <p className="text-xs leading-5 text-muted-foreground">{section.purpose}</p> : null}
            </CardHeader>
            <CardContent className="space-y-3">
              {section.fields.map((field) => (
                <div key={field.label} className="rounded-xl border border-border/70 bg-background/70 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">{field.label}</p>
                    <StatusBadge tone={statusTone(field.status)}>{field.status}</StatusBadge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-foreground">{field.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </section>

      <Card data-testid="profile-correction-path">
        <CardHeader>
          <CardTitle className="text-sm">Need to correct something?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>Please message Veroxa with the correction. Veroxa will review changes before using them publicly.</p>
          <Link href={messagesHref}>
            <Button variant="outline">
              <MessageSquare className="mr-2 h-4 w-4" />
              Message Veroxa About Profile
            </Button>
          </Link>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}
