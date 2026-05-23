import { CalendarDays, ImageIcon, Layers, BarChart2, Loader2, AlertTriangle } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";

export default function ClientDashboard() {
  const { source, loading, error, data } = useClientPortalData();

  const summaryCards = [
    { label: "Upcoming posts",      value: loading ? "—" : String(data.scheduledPosts.length), icon: CalendarDays },
    { label: "Media assets",        value: loading ? "—" : String(data.mediaAssetsCount),       icon: ImageIcon   },
    { label: "Platforms connected", value: loading ? "—" : String(data.platformsCount),         icon: Layers      },
    { label: "Latest report",       value: loading ? "—" : data.monthlyReportPreview.status,    icon: BarChart2   },
  ];

  const snapshotItems = [
    "Your upcoming content is scheduled and ready for review.",
    "Google visibility data is being tracked for this month.",
    "Your latest monthly report is available in Reports.",
    "Veroxa is monitoring your content supply.",
  ];

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">

      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-welcome">
              {loading ? "Mamadali Kebab House" : data.businessName}
            </h2>
            {!loading && (
              <Badge
                variant="outline"
                className={`text-[10px] font-semibold px-2 py-0.5 border-none ${
                  source === "supabase"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {source === "supabase" ? "Live demo data" : "Static demo fallback"}
              </Badge>
            )}
            {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
          <p className="text-muted-foreground">Welcome back. Here is a quick overview of your account.</p>
          {source === "supabase" && (
            <p className="text-[10px] text-muted-foreground/50 mt-1">
              Read check: {data.platformsCount} platforms · {data.mediaAssetsCount} media assets
            </p>
          )}
          {source === "demo" && error && (
            <p className="flex items-center gap-1.5 text-xs text-amber-500 mt-1">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              Supabase unavailable — showing static demo data.
            </p>
          )}
        </div>
        <Badge variant="outline" className="px-3 py-1 bg-card text-card-foreground border-border font-medium self-start md:self-auto">
          May 2026 — Week 3
        </Badge>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <Card key={i} className="bg-card/50 border-border/50 shadow-sm" data-testid={`summary-card-${i}`}>
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                <card.icon className="w-4 h-4 text-muted-foreground/40" />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* This week at a glance */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">This week at a glance</h3>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5 space-y-3">
            {snapshotItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0 mt-1.5" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

    </PortalLayout>
  );
}
