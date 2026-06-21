import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MomoWorkspaceNav } from "@/components/team/MomoWorkspaceNav";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import {
  momoWorkspaceOperatingSnapshot,
  momoWorkspaceSnapshotCategories,
  type MomoWorkspaceSnapshotCategory,
  type MomoWorkspaceSnapshotRisk,
  type MomoWorkspaceSnapshotStatus,
} from "@/lib/momoWorkspace/momoWorkspaceOperatingSnapshot";

const sectionLabels: Record<MomoWorkspaceSnapshotCategory, string> = {
  "Operating Baseline": "Operating snapshot",
  "Top Blockers": "Top blockers",
  "Business Truth": "Business truth",
  "Media Content": "Media/content",
  "Brand AI Rules": "Brand/AI rules",
  "AI Generation": "AI generation",
  "AI Approval": "AI approval",
  "Reports Activity": "Reports/activity",
  "Readiness Dry Run": "Readiness/dry run",
  "Safety Boundaries": "Safety boundaries",
  "Safe Next Actions": "Safe next internal actions",
};

const statusLabels: Record<MomoWorkspaceSnapshotStatus, string> = {
  blocked: "blocked",
  needs_faraz_review: "needs Faraz review",
  needs_owner_confirmation: "needs owner confirmation",
  needs_media_rights_confirmation: "needs media rights confirmation",
  internal_review_only: "internal review only",
  disabled_by_default: "disabled by default",
  ready_for_internal_review_only: "ready for internal review only",
  future_step_required: "future step required",
};

const riskLabels: Record<MomoWorkspaceSnapshotRisk, string> = {
  low: "low risk",
  medium: "medium risk",
  high: "high risk",
  critical: "critical risk",
};

const groupedWorkspaceRoutes = [
  { label: "Work", href: "/team/momo/work" },
  { label: "Intelligence", href: "/team/momo/intelligence" },
  { label: "Content + AI", href: "/team/momo/content-ai" },
  { label: "Reports", href: "/team/momo/reports" },
  { label: "Readiness", href: "/team/momo/readiness" },
];

const detailRoutes = [
  { label: "Business Truth", href: "/team/momo-business-truth" },
  { label: "Media Content", href: "/team/momo-media-content" },
  { label: "Brand/AI Rules", href: "/team/momo-brand-ai-rules" },
  { label: "AI Generation", href: "/team/momo-ai-generation" },
  { label: "AI Approval", href: "/team/momo-ai-approval" },
  { label: "Dry Run", href: "/team/momo-dry-run-go-no-go" },
  { label: "Activity Log", href: "/team/activity-log" },
  { label: "Reports From Activity", href: "/team/reports-from-activity" },
  { label: "Control Center", href: "/team/control-center" },
];

export default function TeamMomoWorkspace() {
  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <MomoWorkspaceNav />
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Momo Dashboard</h2>
          <p className="mt-1 text-sm text-muted-foreground">Momo-only internal workspace.</p>
        </div>
        <Badge variant="outline">Team only</Badge>
      </div>

      <Card className="border-amber-500/30 bg-amber-500/10">
        <CardContent className="grid gap-1 p-4 text-sm text-amber-100">
          <p>This does not activate the pilot.</p>
          <p>This does not turn on real auth.</p>
          <p>This does not contact Momo’s House.</p>
          <p>This does not publish externally.</p>
          <p>Momo owner walkthrough remains blocked.</p>
          <p>No next activation PR is approved by default.</p>
          <p>Future real-world activation requires separate explicit Faraz approval.</p>
        </CardContent>
      </Card>

      <section className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Grouped Momo workspace routes">
        {groupedWorkspaceRoutes.map((route) => (
          <Button key={route.href} asChild size="sm" variant="outline">
            <Link href={route.href}>{route.label}</Link>
          </Button>
        ))}
      </section>

      <section className="mt-6 grid gap-4" aria-label="Momo operating snapshot">
        {momoWorkspaceSnapshotCategories.map((category) => {
          const items = momoWorkspaceOperatingSnapshot.filter((item) => item.category === category);
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-base">{sectionLabels[category]}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {items.map((item) => (
                  <article key={item.id} className="rounded-lg border bg-background/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold">{item.title}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{statusLabels[item.status]}</Badge>
                        <Badge variant={item.risk === "critical" ? "destructive" : "outline"}>{riskLabels[item.risk]}</Badge>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Evidence note: {item.evidence_note}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Safe next step: {item.safe_next_step}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.route_href ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={item.route_href}>Review route</Link>
                        </Button>
                      ) : null}
                      {item.secondary_route_href ? (
                        <Button asChild size="sm" variant="ghost">
                          <Link href={item.secondary_route_href}>Grouped route</Link>
                        </Button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">Internal detail routes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {detailRoutes.map((route) => (
            <Button key={route.href} asChild size="sm" variant="outline">
              <Link href={route.href}>{route.label}</Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </PortalLayout>
  );
}
