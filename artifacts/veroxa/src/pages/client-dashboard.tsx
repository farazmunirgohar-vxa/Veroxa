import { Link } from "wouter";
import { CalendarDays, Globe, FileText, Bell, Loader2, AlertTriangle, ChevronRight, ImageIcon, Layers, BarChart2, ClipboardList } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";

const quickLinks = [
  { label: "Content Calendar",  icon: CalendarDays, href: "/demo/client/calendar", description: "Scheduled and in-review posts" },
  { label: "Google Visibility", icon: Globe,        href: "/demo/client/google",   description: "Business Profile performance" },
  { label: "Reports",           icon: FileText,     href: "/demo/client/reports",  description: "Monthly performance report"   },
  { label: "Updates",           icon: Bell,         href: "/demo/client/updates",  description: "Weekly update from Veroxa"    },
];

export default function ClientDashboard() {
  const { source, loading, error, data } = useClientPortalData();

  const summaryCards = [
    { label: "Upcoming posts",      value: loading ? "—" : String(data.scheduledPosts.length), icon: CalendarDays },
    { label: "Media assets",        value: loading ? "—" : String(data.mediaAssetsCount),       icon: ImageIcon   },
    { label: "Platforms connected", value: loading ? "—" : String(data.platformsCount),         icon: Layers      },
    { label: "Latest report",       value: loading ? "—" : data.monthlyReportPreview.status,    icon: BarChart2   },
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

      {/* Content Supply — compact snapshot */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Content Supply</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {data.contentSupply.map((item, i) => (
            <Card key={i} className="bg-card border-border" data-testid={`supply-card-${i}`}>
              <CardContent className="p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold text-xs">{item.value}/{item.max}</span>
                </div>
                <Progress value={(item.value / item.max) * 100} className="h-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Links</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {quickLinks.map((link, i) => (
            <Link key={i} href={link.href}>
              <Card className="bg-card border-border hover:border-primary/40 hover:bg-card/80 transition-all cursor-pointer group" data-testid={`quick-link-${i}`}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                      <link.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">{link.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

    </PortalLayout>
  );
}
