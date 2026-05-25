import { User, CheckCircle2, Circle, Eye, FileText } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import {
  demoTeamOversight,
  getRestaurantName,
} from "@/data/demoData";

export default function OperatorTeamOversight() {
  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      <div className="mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight"
          data-testid="header-team-oversight"
        >
          Team Oversight
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Monitor team workload, task completion, and content pipeline across
          each team member.
        </p>
      </div>

      <DemoOnlyBanner
        message="Demo only — team workload figures are sample data. No employee management system is connected."
        testId="banner-team-oversight"
      />

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Team members"     value={String(demoTeamOversight.length)}                                                    />
        <SummaryCard label="Open tasks"       value={String(demoTeamOversight.reduce((s, m) => s + m.openTasks, 0))}                     />
        <SummaryCard label="Awaiting review"  value={String(demoTeamOversight.reduce((s, m) => s + m.contentAwaitingReview, 0))}          />
        <SummaryCard label="Active reports"   value={String(demoTeamOversight.reduce((s, m) => s + m.reportWorkload, 0))}                 />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {demoTeamOversight.map((member) => {
          const completionRate = Math.round(
            (member.completedTasks / (member.openTasks + member.completedTasks)) * 100,
          );
          return (
            <Card
              key={member.name}
              className="bg-card border-border"
              data-testid={`oversight-card-${member.name.toLowerCase()}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {member.name[0]}
                  </div>
                  <div>
                    <CardTitle className="text-base">{member.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className="text-[10px] mt-1 border-primary/30 text-primary bg-primary/10"
                    >
                      {member.role}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Assigned clients */}
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
                    Assigned clients
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {member.assignedClientIds.map((id) => (
                      <Badge
                        key={id}
                        variant="outline"
                        className="text-[11px] border-border text-foreground/70"
                      >
                        {getRestaurantName(id)}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-2 gap-2">
                  <MetricTile icon={Circle}       label="Open tasks"          value={member.openTasks}             />
                  <MetricTile icon={CheckCircle2} label="Completed"           value={member.completedTasks}        />
                  <MetricTile icon={Eye}          label="Awaiting review"     value={member.contentAwaitingReview} />
                  <MetricTile icon={FileText}     label="Active reports"      value={member.reportWorkload}        />
                </div>

                {/* Completion progress */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Task completion rate</span>
                    <span className="font-semibold">{completionRate}%</span>
                  </div>
                  <Progress value={completionRate} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PortalLayout>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-3 text-center">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/20 px-3 py-2 flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
