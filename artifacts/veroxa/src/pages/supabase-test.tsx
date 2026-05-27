import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, FlaskConical } from "lucide-react";
import {
  MAMADALI_DEMO_CLIENT_ID,
  getClientById,
  getClientPlatforms,
  getClientMediaAssets,
  getClientCalendar,
  getClientWeeklyReports,
  getClientMonthlyReports,
} from "@/lib/supabase";

// Read-only smoke test that exercises every client-safe view this portal
// uses. post_slots intentionally removed — it has no client-safe view by
// design and the client portal must never read public.post_slots directly.
// See: docs/PORTAL_QUERY_SAFETY_PLAN.md
type TestResult = {
  businessName: string;
  platformsCount: number;
  mediaAssetsCount: number;
  calendarCount: number;
  weeklyReportsCount: number;
  monthlyReportsCount: number;
};

type PageState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: TestResult }
  | { status: "error"; message: string };

const EXPECTED: Record<string, number | string> = {
  "Business name": "Mamadali Kebab House",
  "client_portal_platforms_view": 4,
  "client_portal_media_view": 10,
  "client_portal_calendar_view": 7,
  "client_portal_weekly_reports_view": 2,
  "client_portal_monthly_reports_view": 1,
};

export default function SupabaseTestPage() {
  const [state, setState] = useState<PageState>({ status: "idle" });

  useEffect(() => {
    async function run() {
      setState({ status: "loading" });
      try {
        const [client, platforms, media, calendar, weekly, monthly] =
          await Promise.all([
            getClientById(MAMADALI_DEMO_CLIENT_ID),
            getClientPlatforms(MAMADALI_DEMO_CLIENT_ID),
            getClientMediaAssets(MAMADALI_DEMO_CLIENT_ID),
            getClientCalendar(MAMADALI_DEMO_CLIENT_ID),
            getClientWeeklyReports(MAMADALI_DEMO_CLIENT_ID),
            getClientMonthlyReports(MAMADALI_DEMO_CLIENT_ID),
          ]);

        setState({
          status: "success",
          result: {
            businessName:
              (client as Record<string, unknown>)?.business_name as string ??
              (client as Record<string, unknown>)?.businessName as string ??
              "(unknown)",
            platformsCount: platforms.length,
            mediaAssetsCount: media.length,
            calendarCount: calendar.length,
            weeklyReportsCount: weekly.length,
            monthlyReportsCount: monthly.length,
          },
        });
      } catch (err) {
        setState({
          status: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
    run();
  }, []);

  const rows: { label: string; actual: string | number; expected: string | number }[] =
    state.status === "success"
      ? [
          { label: "Business name", actual: state.result.businessName, expected: EXPECTED["Business name"] },
          { label: "client_portal_platforms_view", actual: state.result.platformsCount, expected: EXPECTED["client_portal_platforms_view"] },
          { label: "client_portal_media_view", actual: state.result.mediaAssetsCount, expected: EXPECTED["client_portal_media_view"] },
          { label: "client_portal_calendar_view", actual: state.result.calendarCount, expected: EXPECTED["client_portal_calendar_view"] },
          { label: "client_portal_weekly_reports_view", actual: state.result.weeklyReportsCount, expected: EXPECTED["client_portal_weekly_reports_view"] },
          { label: "client_portal_monthly_reports_view", actual: state.result.monthlyReportsCount, expected: EXPECTED["client_portal_monthly_reports_view"] },
        ]
      : [];

  const allPass =
    state.status === "success" &&
    rows.every((r) => String(r.actual) === String(r.expected));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="w-full max-w-xl">
        <Link
          href="/demo"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-10 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Demo Hub
        </Link>

        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-3">
            <FlaskConical className="w-6 h-6 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-400 border border-amber-400/30 rounded px-2 py-0.5 bg-amber-400/5">
              Development test only
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Supabase Read Test
          </h1>
          <p className="text-sm text-muted-foreground">
            Read-only Supabase check — no writes, uploads, auth, or automation.
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-amber-400/30 bg-amber-400/5 p-4 text-xs leading-relaxed text-amber-200/90 animate-in fade-in slide-in-from-bottom-6 duration-600">
          <p className="font-semibold uppercase tracking-wider text-amber-300 mb-1.5">
            Placeholder-phase diagnostics only
          </p>
          <ul className="space-y-1 list-disc list-inside marker:text-amber-400/50">
            <li>
              <code className="text-amber-100">AUTH_MODE</code> remains{" "}
              <code className="text-amber-100">&quot;placeholder&quot;</code>.
              This page does NOT activate production auth or backend wiring.
            </li>
            <li>
              No real database connection is required for normal demo use.
              The portal runs on local fixtures.
            </li>
            <li>
              All client portal query checks must use{" "}
              <code className="text-amber-100">client_portal_*</code> views
              only — never base tables. See{" "}
              <code className="text-amber-100">
                docs/PORTAL_QUERY_SAFETY_CHECKLIST.md
              </code>
              .
            </li>
            <li>
              This is read-only, view-only smoke testing. Do not promote
              what you learn here to a live integration without the full
              safety pass.
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {state.status === "idle" || state.status === "loading" ? (
            <div className="flex flex-col items-center gap-4 py-10 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm">Running read queries against Supabase dev…</span>
            </div>
          ) : state.status === "error" ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-destructive font-semibold">
                <XCircle className="w-5 h-5 shrink-0" />
                Query failed
              </div>
              <pre className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-4 whitespace-pre-wrap break-all leading-relaxed">
                {state.message}
              </pre>
              <p className="text-xs text-muted-foreground">
                Check that <code className="text-foreground">VITE_SUPABASE_URL</code> and{" "}
                <code className="text-foreground">VITE_SUPABASE_ANON_KEY</code> are set, RLS
                read policies have been applied, and the Supabase dev project is reachable.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-foreground">
                  Mamadali demo — read results
                </span>
                <span
                  className={`flex items-center gap-1.5 text-xs font-semibold ${
                    allPass ? "text-emerald-400" : "text-destructive"
                  }`}
                >
                  {allPass ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> All checks passed
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" /> Some values do not match
                    </>
                  )}
                </span>
              </div>

              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-2 font-medium">Table / field</th>
                      <th className="text-right px-4 py-2 font-medium">Actual</th>
                      <th className="text-right px-4 py-2 font-medium">Expected</th>
                      <th className="text-right px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const pass = String(row.actual) === String(row.expected);
                      return (
                        <tr
                          key={row.label}
                          className={`border-t border-border ${
                            i % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                          }`}
                        >
                          <td className="px-4 py-2.5 font-mono text-xs text-foreground">
                            {row.label}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs text-foreground">
                            {String(row.actual)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">
                            {String(row.expected)}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {pass ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 inline-block" />
                            ) : (
                              <XCircle className="w-4 h-4 text-destructive inline-block" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
