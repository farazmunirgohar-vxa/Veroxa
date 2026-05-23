import { TrendingUp, ChevronRight, Loader2, AlertTriangle } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";

export default function ClientDashboard() {
  const { source, loading, error, data } = useClientPortalData();

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
          <p className="text-muted-foreground">Here is your content performance overview for this week.</p>
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

      {/* Google Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {data.googleMetrics.map((metric, i) => (
          <Card key={i} className="bg-card/50 border-border/50 shadow-sm" data-testid={`google-metric-${i}`}>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground mb-2">{metric.label}</p>
              <p className="text-2xl font-bold">{metric.value}</p>
              <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${metric.positive ? "text-emerald-500" : "text-red-500"}`}>
                <TrendingUp className="w-3 h-3" /> {metric.change} this month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Supply + Monthly Report */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4">Content Supply</h3>
          <div className="space-y-4">
            {data.contentSupply.map((item, i) => (
              <Card key={i} className="bg-card border-border" data-testid={`supply-card-${i}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold">{item.value} / {item.max}</span>
                  </div>
                  <Progress value={(item.value / item.max) * 100} className="h-1.5" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">Monthly Report</h3>
          <Card className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer" data-testid="monthly-report-preview">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">{data.monthlyReportPreview.title}</span>
                <Badge variant="outline" className={`border-none ${
                  data.monthlyReportPreview.status === "In Review"
                    ? "bg-amber-500/10 text-amber-500"
                    : data.monthlyReportPreview.status === "Drafting"
                    ? "bg-muted text-muted-foreground"
                    : "bg-emerald-500/10 text-emerald-500"
                }`}>
                  {data.monthlyReportPreview.status}
                </Badge>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between"><span>Posts published</span><span className="text-foreground font-medium">{data.monthlyReportPreview.postsPublished}</span></div>
                <div className="flex justify-between"><span>Total reach</span><span className="text-foreground font-medium">41,200</span></div>
                <div className="flex justify-between"><span>Google impressions</span><span className="text-foreground font-medium">12,580</span></div>
                <div className="flex justify-between"><span>New reviews</span><span className="text-foreground font-medium">6</span></div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-primary">
                View full report <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
