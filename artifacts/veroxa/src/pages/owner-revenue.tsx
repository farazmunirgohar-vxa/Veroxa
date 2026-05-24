import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { revenueData, growthSummary } from "@/lib/demo-data";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function OwnerRevenue() {
  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-revenue">Revenue</h2>
        <p className="text-muted-foreground mt-1">Monthly recurring revenue trend and growth summary.</p>
      </div>

      <DemoOnlyBanner message="Static demo — revenue numbers, retainers, ad-service revenue, and churn-risk figures are illustrative only. No payment processor or billing system is connected." testId="banner-owner-revenue" />

      <Card className="bg-card border-border mb-8">
        <CardHeader>
          <CardTitle className="text-xl">MRR Trend — Last 6 Months</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[260px] w-full" data-testid="revenue-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[...revenueData]} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "MRR"]}
                />
                <Area type="monotone" dataKey="rev" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xl font-bold mb-4">Growth Summary — May 2026</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {growthSummary.map((item, i) => (
            <Card key={i} className="bg-card/50 border-border/50" data-testid={`growth-item-${i}`}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className={`text-2xl font-bold ${item.positive ? "text-foreground" : "text-red-500"}`}>{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
}
