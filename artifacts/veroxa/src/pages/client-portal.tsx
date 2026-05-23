import { LayoutDashboard, CalendarDays, Globe, FileText, Bell, Clock, TrendingUp, ImageIcon, CheckCircle2, ChevronRight, Loader2, AlertTriangle } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useClientPortalData } from "@/hooks/useClientPortalData";

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Content Calendar", icon: CalendarDays },
  { label: "Google Visibility", icon: Globe },
  { label: "Reports", icon: FileText },
  { label: "Updates", icon: Bell },
];

export default function ClientPortal() {
  const { source, loading, error, data } = useClientPortalData();

  return (
    <PortalLayout items={sidebarItems} portalName="Client Portal">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
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
            {loading && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <p className="text-muted-foreground">Here is your content performance and upcoming schedule for this week.</p>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {data.googleMetrics.map((metric, i) => (
          <Card key={i} className="bg-card/50 border-border/50 shadow-sm" data-testid={`google-metric-${i}`}>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground mb-2">{metric.label}</p>
              <p className="text-2xl font-bold">{metric.value}</p>
              <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${metric.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                <TrendingUp className="w-3 h-3" /> {metric.change} this month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Scheduled Posts */}
        <div className="lg:col-span-2 space-y-5">
          <h3 className="text-xl font-bold">Upcoming Scheduled Posts</h3>
          <div className="space-y-3">
            {data.scheduledPosts.map((post, i) => (
              <Card key={i} className="bg-card border-border hover:border-primary/30 transition-colors" data-testid={`post-card-${i}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5 flex-shrink-0">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-snug">{post.caption}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {post.date}
                          </span>
                          <span className="text-xs text-muted-foreground">{post.platform}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={`border-none flex-shrink-0 ${
                      post.status === 'Scheduled' ? 'bg-emerald-500/10 text-emerald-500' :
                      post.status === 'In Review' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {post.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Weekly Update */}
          <Card className="bg-card border-border mt-2" data-testid="weekly-update">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Weekly Update — 19–25 May</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /><span>4 posts published this week across Instagram and Facebook.</span></div>
              <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /><span>Google impressions up 18% — your kebab platter post drove the highest reach this month.</span></div>
              <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /><span>2 new 5-star Google reviews received. Veroxa team prepared suggested responses.</span></div>
              <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /><span>Next shoot booked for Thursday 29 May at 11am — please have the new menu items ready.</span></div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Content Supply */}
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

          {/* Monthly Report Preview */}
          <div>
            <h3 className="text-xl font-bold mb-4">Monthly Report</h3>
            <Card className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer" data-testid="monthly-report-preview">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">April 2026 Report</span>
                  <Badge variant="outline" className="border-none bg-emerald-500/10 text-emerald-500">Ready</Badge>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between"><span>Posts published</span><span className="text-foreground font-medium">18</span></div>
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
      </div>
    </PortalLayout>
  );
}
