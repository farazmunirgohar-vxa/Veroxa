import { useState } from "react";
import { Wrench, ArrowRight, Building2, Heart, Images, FileText, Workflow, ClipboardList } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoControlPresets, demoClientLifecycle, lifecycleStageColor, riskLevelColor } from "@/data/demoData";

export default function InternalDemoControls() {
  const [activeId, setActiveId] = useState(demoControlPresets[0].id);
  const active = demoControlPresets.find((p) => p.id === activeId)!;

  const presetTargets: Record<string, string> = {
    "healthy":     "crescent",
    "low-media":   "urban",
    "at-risk":     "alnoor",
    "onboarding":  "urban",
    "report-late": "urban",
    "pipeline":    "alnoor",
  };

  const targetClientId = presetTargets[active.id];
  const targetLife     = demoClientLifecycle.find((c) => c.clientId === targetClientId);

  const quickLinks = [
    { label: "Operations Center", href: "/demo/operator/operations-center", icon: Workflow      },
    { label: "Command Board",     href: "/demo/operator/command-board",     icon: ClipboardList },
    { label: "Client Detail",     href: "/demo/operator/client-detail",     icon: Building2     },
    { label: "Media Analytics",   href: "/demo/owner/media-analytics",      icon: Images        },
    { label: "Reporting Command", href: "/demo/operator/reporting-command", icon: FileText      },
    { label: "Client Health",     href: "/demo/owner/client-health",        icon: Heart         },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-demo-controls">
          Demo Controls
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Internal preview presets — jump to a representative client state for screenshots and walk-throughs.
        </p>
      </div>

      <DemoOnlyBanner message="Internal only — these presets don't persist; they describe pre-staged demo data." testId="banner-demo-controls" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Preset list */}
        <Card className="bg-card border-border lg:col-span-5">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Wrench className="w-4 h-4 text-primary" /> Presets ({demoControlPresets.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {demoControlPresets.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                data-testid={`preset-${p.id}`}
                className={`w-full text-left rounded-md border px-3 py-2 transition-colors ${
                  p.id === activeId
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted/20 hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{p.description}</p>
                <p className="text-[10px] text-primary mt-1">Example: {p.exampleClient}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Active preset detail */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="bg-card border-primary/30">
            <CardHeader>
              <CardTitle className="text-base">{active.label}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{active.description}</p>
            </CardHeader>
            <CardContent>
              {targetLife && (
                <div className="rounded-md border border-border bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-primary" /> {active.exampleClient}
                    </p>
                    <div className="flex gap-1">
                      <Badge variant="outline" className={`text-[9px] ${lifecycleStageColor[targetLife.lifecycleStage]}`}>{targetLife.lifecycleStage}</Badge>
                      <Badge variant="outline" className={`text-[9px] ${riskLevelColor[targetLife.riskLevel]}`}>{targetLife.riskLevel}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/85">{targetLife.nextAction}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><ArrowRight className="w-4 h-4 text-primary" /> Quick jumps</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {quickLinks.map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href}>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs" data-testid={`qlink-${href}`}>
                    <Icon className="w-3.5 h-3.5 mr-1.5" />{label}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
