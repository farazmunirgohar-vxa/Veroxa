import { Link } from "wouter";
import {
  CheckCircle2,
  CircleDashed,
  Circle,
  ArrowRight,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import {
  getOnboardingSummary,
  getVeroxaNextNeeds,
  getRestaurantName,
  type OnboardingStatus,
  type OnboardingPriority,
} from "@/data/demoData";

const DEMO_CLIENT_ID = "demo-a";

const statusVisual: Record<
  OnboardingStatus,
  { color: string; icon: typeof CheckCircle2 }
> = {
  "Complete":    { color: "text-emerald-400", icon: CheckCircle2 },
  "In Progress": { color: "text-amber-400",   icon: CircleDashed },
  "Missing":     { color: "text-rose-400",    icon: Circle       },
};


const priorityColor: Record<OnboardingPriority, string> = {
  "High":   "border-rose-500/40 text-rose-300 bg-rose-500/10",
  "Medium": "border-amber-500/40 text-amber-300 bg-amber-500/10",
  "Low":    "border-muted-foreground/40 text-muted-foreground bg-muted/30",
};

export default function ClientOnboardingCenter() {
  const summary = getOnboardingSummary(DEMO_CLIENT_ID);
  const nextNeeds = getVeroxaNextNeeds(DEMO_CLIENT_ID);

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <div className="mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight"
          data-testid="header-onboarding-center"
        >
          Onboarding Center
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Track {getRestaurantName(DEMO_CLIENT_ID)}'s setup progress from
          information collection through portal access.
        </p>
      </div>

      <DemoOnlyBanner
        message="Demo only — read-only onboarding tracker. Form submissions and file uploads are not enabled."
        testId="banner-onboarding-center"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-primary" />
              Overall progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between mb-2">
              <p className="text-4xl font-bold tabular-nums">{summary.pct}%</p>
              <p className="text-sm text-muted-foreground">
                {summary.complete} of {summary.total} steps complete
              </p>
            </div>
            <Progress value={summary.pct} className="h-2" />
            <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
              <StatPill label="Complete"    value={summary.complete}   color="text-emerald-400" />
              <StatPill label="In progress" value={summary.inProgress} color="text-amber-400" />
              <StatPill label="Missing"     value={summary.missing}    color="text-rose-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              What Veroxa needs next
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {nextNeeds.map((n, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm"
              >
                <ArrowRight className="w-3.5 h-3.5 mt-1 text-primary flex-shrink-0" />
                <span>{n}</span>
              </div>
            ))}
            {summary.nextAction && (
              <div className="pt-2 border-t border-border mt-2">
                <Link href="/demo/client/onboarding">
                  <Button size="sm" variant="outline" className="w-full" data-testid="button-open-form">
                    Open onboarding form
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Onboarding checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {summary.steps.map((s) => {
            const v = statusVisual[s.status];
            const Icon = v.icon;
            return (
              <div
                key={s.id}
                className="rounded-md border border-border bg-muted/20 p-3"
                data-testid={`onboarding-step-${s.id}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 ${v.color} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{s.step}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${priorityColor[s.priority]}`}
                      >
                        {s.priority} priority
                      </Badge>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        Due {s.dueDate}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
