import { ShieldCheck, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoSystemStatus, type SystemStatusState } from "@/data/demoData";

const stateMeta: Record<SystemStatusState, { color: string; icon: typeof CheckCircle2; bar: string }> = {
  Active:          { color: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10", icon: CheckCircle2, bar: "border-l-emerald-500" },
  "Not Connected": { color: "border-rose-500/40 text-rose-300 bg-rose-500/10",          icon: XCircle,      bar: "border-l-rose-500" },
  Placeholder:     { color: "border-amber-500/40 text-amber-300 bg-amber-500/10",       icon: AlertCircle,  bar: "border-l-amber-500" },
};

export default function InternalSystemStatus() {
  return (
    <div className="min-h-screen bg-background text-foreground px-4 md:px-8 py-6 md:py-10 max-w-4xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-system-status">
          System Status
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          What's live in this build and what's stubbed — so demo and real features are never confused.
        </p>
      </div>

      <DemoOnlyBanner message="Veroxa is running in demo mode. Production integrations are not connected." testId="banner-system-status" />

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> Build connections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {demoSystemStatus.map((s) => {
            const m    = stateMeta[s.state];
            const Icon = m.icon;
            return (
              <div key={s.label} className={`rounded-md border border-border border-l-4 ${m.bar} bg-muted/20 px-3 py-2`} data-testid={`status-${s.label.replace(/[^a-zA-Z]/g, "-").toLowerCase()}`}>
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-semibold">{s.label}</p>
                  <Badge variant="outline" className={`text-[10px] ${m.color}`}>
                    <Icon className="w-3 h-3 mr-1" />{s.state}
                  </Badge>
                </div>
                <p className="text-xs text-foreground/80">{s.detail}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <p className="text-[10px] text-muted-foreground mt-6 text-center">
        Demo build {new Date().toISOString().slice(0, 10)} · Veroxa Growth OS
      </p>
    </div>
  );
}
