import { Star } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { draftVariants } from "@/lib/demo-data";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function TeamDrafts() {
  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground" data-testid="header-drafts">Content Drafts</h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">Caption variants ready for review — select the best one to move to scheduling.</p>
      </div>

      <DemoOnlyBanner message="Static demo — no real edit, save, or approval is wired. Draft and approval states illustrate the future Team/Internal Admin review flow only." testId="banner-team-drafts" />

      <div className="space-y-3">
        {draftVariants.map((variant) => (
          <Card key={variant.id} className={`bg-card border-border ${variant.status === "Approved" ? "border-emerald-500/40" : ""}`} data-testid={`draft-variant-${variant.id}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {variant.id}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{variant.caption}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <Badge variant="outline" className={`border-none ${
                    variant.status === "Approved" ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                  }`}>
                    {variant.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {variant.score} / 100
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}
