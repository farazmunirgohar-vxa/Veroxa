import { Trophy, Users, FileText, CheckCircle2, Clock, Heart } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoTeamMembers } from "@/data/demoData";

export default function TeamPerformance() {
  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight"
          data-testid="header-team-performance"
        >
          Team Performance
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Demo metrics showing team throughput, turnaround time, and client
          health contributions.
        </p>
      </div>

      <DemoOnlyBanner
        message="Demo only — performance numbers are sample data. No real calculations are connected."
        testId="banner-team-performance"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {demoTeamMembers.map((member) => (
          <Card
            key={member.name}
            className="bg-card border-border"
            data-testid={`member-card-${member.name.toLowerCase()}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {member.name[0]}
                </div>
                <div>
                  <CardTitle className="text-base">{member.name}</CardTitle>
                  <Badge variant="outline" className="text-[10px] mt-1 border-primary/30 text-primary bg-primary/10">
                    {member.role}
                  </Badge>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-muted-foreground">Health score</p>
                  <p className="text-2xl font-bold text-emerald-400 tabular-nums">
                    {member.clientHealthScore}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <MetricTile icon={Users}         label="Clients"     value={String(member.clientsManaged)}   />
                <MetricTile icon={FileText}       label="Reports"     value={String(member.reportsCompleted)} />
                <MetricTile icon={CheckCircle2}   label="Approved"    value={String(member.contentApproved)}  />
                <MetricTile icon={Clock}          label="Turnaround"  value={member.avgTurnaround}            />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-emerald-400" />
                    Client health contribution
                  </span>
                  <span className="font-semibold tabular-nums">
                    {member.clientHealthScore}%
                  </span>
                </div>
                <Progress value={member.clientHealthScore} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team summary row */}
      <Card className="bg-card border-border mt-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" /> Team Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <SummaryBlock
              label="Total reports completed"
              value={String(demoTeamMembers.reduce((s, m) => s + m.reportsCompleted, 0))}
            />
            <SummaryBlock
              label="Total content approved"
              value={String(demoTeamMembers.reduce((s, m) => s + m.contentApproved, 0))}
            />
            <SummaryBlock
              label="Avg turnaround"
              value="1.2 days"
            />
            <SummaryBlock
              label="Portfolio health avg"
              value={`${Math.round(demoTeamMembers.reduce((s, m) => s + m.clientHealthScore, 0) / demoTeamMembers.length)}%`}
            />
          </div>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/20 px-3 py-2 flex items-center gap-3">
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
