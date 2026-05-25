import { useMemo } from "react";
import { CalendarDays, Building2 } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoCalendarSlots, getRestaurantName, type CalendarSlotKind } from "@/data/demoData";

const kindMeta: Record<CalendarSlotKind, { color: string; label: string; dot: string }> = {
  published: { color: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10", label: "Published", dot: "bg-emerald-400" },
  scheduled: { color: "border-sky-500/40 text-sky-300 bg-sky-500/10",             label: "Scheduled", dot: "bg-sky-400" },
  planned:   { color: "border-amber-500/40 text-amber-300 bg-amber-500/10",       label: "Planned",   dot: "bg-amber-400" },
  open:      { color: "border-muted-foreground/40 text-muted-foreground bg-muted/30", label: "Open",  dot: "bg-muted-foreground" },
};

const fmtDay = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

export default function OperatorContentCalendar() {
  const grouped = useMemo(() => {
    const byDate = new Map<string, typeof demoCalendarSlots>();
    demoCalendarSlots.forEach((s) => {
      const arr = byDate.get(s.date) ?? [];
      arr.push(s);
      byDate.set(s.date, arr);
    });
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, slots]) => ({
        date,
        slots: slots.sort((a, b) => a.time.localeCompare(b.time)),
      }));
  }, []);

  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-content-calendar">
          Content Calendar
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          The next two weeks of publishing across the portfolio — published, scheduled, planned, and open slots.
        </p>
      </div>

      <DemoOnlyBanner message="Demo only — no real scheduling system is connected." testId="banner-content-calendar" />

      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.entries(kindMeta) as [CalendarSlotKind, typeof kindMeta[CalendarSlotKind]][]).map(([k, m]) => (
          <Badge key={k} variant="outline" className={`text-[10px] ${m.color}`}>
            <span className={`w-2 h-2 rounded-full mr-1.5 ${m.dot}`} />{m.label}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {grouped.map(({ date, slots }) => (
          <Card key={date} className="bg-card border-border" data-testid={`calendar-day-${date}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />{fmtDay(date)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {slots.map((s, i) => {
                const m = kindMeta[s.kind];
                return (
                  <div key={i} className={`rounded-md border ${m.color.split(" ")[0]} bg-muted/15 px-2.5 py-2`}>
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-xs font-semibold tabular-nums">{s.time}</span>
                      <Badge variant="outline" className={`text-[9px] ${m.color}`}>{m.label}</Badge>
                    </div>
                    {s.title ? (
                      <>
                        <p className="text-xs leading-snug">{s.title}</p>
                        {s.clientId && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5" />{getRestaurantName(s.clientId)}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic">Open slot — available to plan.</p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}
