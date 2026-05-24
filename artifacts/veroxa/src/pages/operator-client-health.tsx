import { PortalLayout } from "@/components/PortalLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { clientHealthDisplay as clientHealth } from "@/lib/demo-data";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function OperatorClientHealth() {
  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-client-health">Client Health</h2>
        <p className="text-muted-foreground mt-1">Per-client health score, posting cadence, and last shoot date.</p>
      </div>

      <DemoOnlyBanner message="Static demo — health scores, cadence, and reasons (low media / inconsistent posting / report delayed / Google rating change) are illustrative only." testId="banner-operator-health" />

      <Card className="bg-card border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/50">
              <TableHead className="py-4">Client</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Posts / Sched.</TableHead>
              <TableHead>Last Shoot</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientHealth.map((client, i) => (
              <TableRow key={i} className="border-border/50 hover:bg-accent/20" data-testid={`client-row-${i}`}>
                <TableCell className="font-semibold text-sm">{client.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={client.score} className="h-1.5 w-16" />
                    <span className="text-xs text-muted-foreground w-10">{client.score}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{client.postsThisMonth} / {client.scheduled}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{client.lastShoot}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className={cn("border-none",
                    client.status === "Healthy" ? "bg-emerald-500/10 text-emerald-500" :
                    client.status === "Warning" ? "bg-amber-500/10 text-amber-500" :
                    client.status === "At Risk" ? "bg-red-500/10 text-red-500" :
                    "bg-red-900/20 text-red-400"
                  )}>
                    {client.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </PortalLayout>
  );
}
