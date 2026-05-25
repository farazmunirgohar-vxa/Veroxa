import {
  Sunrise,
  AlertTriangle,
  Users,
  FileText,
  ImageOff,
  GitBranch,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoDailyDigest } from "@/data/demoData";

const categoryIcon: Record<string, typeof Sunrise> = {
  "Today's Priorities":       Sunrise,
  "Urgent Alerts":            AlertTriangle,
  "Clients Needing Attention": Users,
  "Reports Due":              FileText,
  "Media Shortages":          ImageOff,
  "Pipeline Bottlenecks":     GitBranch,
};

const categoryAccent: Record<string, string> = {
  "Today's Priorities":       "border-l-primary text-primary bg-primary/10",
  "Urgent Alerts":            "border-l-rose-500 text-rose-400 bg-rose-500/10",
  "Clients Needing Attention": "border-l-amber-500 text-amber-400 bg-amber-500/10",
  "Reports Due":              "border-l-violet-500 text-violet-400 bg-violet-500/10",
  "Media Shortages":          "border-l-cyan-500 text-cyan-400 bg-cyan-500/10",
  "Pipeline Bottlenecks":     "border-l-sky-500 text-sky-400 bg-sky-500/10",
};

const today = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month:   "long",
  day:     "numeric",
  year:    "numeric",
});

export default function OperatorDailyDigest() {
  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      {/* Executive header */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 px-6 py-5 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
              Daily Digest
            </p>
            <h2
              className="text-2xl md:text-3xl font-bold tracking-tight"
              data-testid="header-daily-digest"
            >
              Good morning
            </h2>
            <p className="text-muted-foreground text-sm mt-1">{today}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatPill label="Urgent alerts" value="2" color="text-rose-400"   />
            <StatPill label="Actions today" value="4" color="text-amber-400"  />
            <StatPill label="Reports due"   value="3" color="text-violet-400" />
          </div>
        </div>
      </div>

      <DemoOnlyBanner
        message="Demo only — digest content is sample data representing a future live briefing."
        testId="banner-daily-digest"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {demoDailyDigest.map((section) => {
          const Icon   = categoryIcon[section.category] ?? Sunrise;
          const accent = categoryAccent[section.category] ?? "border-l-border text-muted-foreground bg-muted/30";
          const [borderClass, iconClass, bgClass] = accent.split(" ");

          return (
            <Card
              key={section.category}
              className={`bg-card border border-border border-l-4 ${borderClass}`}
              data-testid={`digest-section-${section.category.replace(/\s/g, "-").toLowerCase()}`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className={`p-1.5 rounded-md ${bgClass}`}>
                    <Icon className={`w-4 h-4 ${iconClass}`} />
                  </span>
                  {section.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-foreground/85 leading-relaxed"
                    >
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${bgClass.replace("bg-", "bg-").replace("/10", "/60")} ${iconClass}`}
                        style={{ background: "currentColor" }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PortalLayout>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-2 text-center">
      <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
