import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MomoWorkspaceNav } from "@/components/team/MomoWorkspaceNav";
import { momoWorkQueueBoard, momoWorkQueueLanes, type MomoWorkQueueRisk, type MomoWorkQueueStatus } from "@/lib/momoWorkspace/momoWorkQueueBoard";
import { teamPortalNavItems } from "@/lib/teamPortalNav";

const statusLabel: Record<MomoWorkQueueStatus, string> = {
  internal_review_only: "internal review only",
  blocked: "blocked",
  needs_faraz_review: "needs Faraz review",
  needs_owner_confirmation: "needs owner confirmation",
  needs_media_rights_confirmation: "needs media rights confirmation",
  disabled_by_default: "disabled by default",
  ready_for_internal_review_only: "ready for internal review only",
  future_step_required: "future step required",
};

const riskVariant: Record<MomoWorkQueueRisk, "default" | "secondary" | "destructive" | "outline"> = {
  low: "secondary",
  medium: "outline",
  high: "default",
  critical: "destructive",
};

const safetyCopy = [
  "Momo-only internal work board.",
  "This does not activate the pilot.",
  "This does not turn on real auth.",
  "This does not contact Momo’s House.",
  "This does not publish externally.",
  "This does not generate AI output.",
  "This does not create fake work items or queue counts.",
  "Momo owner walkthrough remains blocked.",
  "No next activation PR is approved by default.",
  "Future real-world activation requires separate explicit Faraz approval.",
];

const groupedRoutes = [
  { label: "Momo Dashboard", href: "/team/momo" },
  { label: "Restaurant Intelligence", href: "/team/momo/intelligence" },
  { label: "Content + AI", href: "/team/momo/content-ai" },
  { label: "Reports", href: "/team/momo/reports" },
  { label: "Readiness", href: "/team/momo/readiness" },
];

export default function TeamMomoWork() {
  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <MomoWorkspaceNav />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <Badge variant="outline">Work Queue organization only</Badge>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Momo Work Queue</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            What should Team Faraz review or work on internally today, and where should each type of work be handled?
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {groupedRoutes.map((route) => (
            <Button asChild key={route.href} size="sm" variant="outline">
              <Link href={route.href}>{route.label}</Link>
            </Button>
          ))}
        </div>
      </div>

      <Card className="border-amber-500/30 bg-amber-500/10">
        <CardHeader>
          <CardTitle className="text-base">Hard operating lock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {safetyCopy.map((copy) => (
              <div key={copy} className="rounded-lg border border-amber-500/20 bg-background/60 px-3 py-2 text-sm">
                {copy}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="mt-6 grid gap-4">
        {momoWorkQueueLanes.map((lane) => {
          const items = momoWorkQueueBoard.filter((item) => item.lane === lane);
          return (
            <Card key={lane}>
              <CardHeader>
                <CardTitle className="text-lg">{lane}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {items.map((item) => (
                  <div key={item.id} className="rounded-xl border bg-card/50 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Badge variant="outline">{statusLabel[item.status]}</Badge>
                        <Badge variant={riskVariant[item.risk]}>{item.risk} risk</Badge>
                      </div>
                    </div>
                    <dl className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                      <div>
                        <dt className="font-medium">Work rule</dt>
                        <dd className="mt-1 text-muted-foreground">{item.work_rule}</dd>
                      </div>
                      <div>
                        <dt className="font-medium">Blocked if</dt>
                        <dd className="mt-1 text-muted-foreground">{item.blocked_if}</dd>
                      </div>
                      <div>
                        <dt className="font-medium">Safe next internal action</dt>
                        <dd className="mt-1 text-muted-foreground">{item.safe_next_step}</dd>
                      </div>
                    </dl>
                    {(item.route_href || item.secondary_route_href) && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.route_href && (
                          <Button asChild size="sm" variant="outline">
                            <Link href={item.route_href}>Open internal route</Link>
                          </Button>
                        )}
                        {item.secondary_route_href && (
                          <Button asChild size="sm" variant="ghost">
                            <Link href={item.secondary_route_href}>Open related route</Link>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </PortalLayout>
  );
}
