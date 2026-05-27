import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Database,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getSupabaseHealthReport,
  type SupabaseHealthReport,
} from "@/lib/supabase/supabaseHealth";
import {
  getClientPortalSummaryReadOnly,
  getClientPortalMediaReadOnly,
  getClientPortalCalendarReadOnly,
  getClientPortalReportsReadOnly,
  getClientPortalRequestsReadOnly,
  getClientPortalUpdatesReadOnly,
  getClientPortalGoogleSnapshotReadOnly,
  getClientPortalAccountReadOnly,
} from "@/lib/data/supabaseReadOnlyData";
import type { ReadOnlyEnvelope } from "@/lib/data/clientPortalReadOnlyTypes";

type CoverageRow = {
  label: string;
  status: "live" | "fallback" | "skipped" | "loading";
  message: string;
};

function envelopeToRow(label: string, env: ReadOnlyEnvelope<unknown>): CoverageRow {
  if (env.status === "live") return { label, status: "live", message: "Available" };
  if (env.status === "fallback")
    return { label, status: "fallback", message: env.error || "Fallback active" };
  return { label, status: "skipped", message: env.error || "Not implemented" };
}

function CoverageStatusPill({ status }: { status: CoverageRow["status"] }) {
  const styles: Record<CoverageRow["status"], string> = {
    live:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    fallback: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    skipped:  "bg-muted/20 text-muted-foreground border-border",
    loading:  "bg-muted/20 text-muted-foreground border-border",
  };
  const labels: Record<CoverageRow["status"], string> = {
    live: "Live",
    fallback: "Fallback",
    skipped: "Skipped",
    loading: "…",
  };
  return (
    <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function YesNo({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
      <CheckCircle2 className="w-3.5 h-3.5" /> Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-muted-foreground text-xs font-semibold">
      <XCircle className="w-3.5 h-3.5" /> No
    </span>
  );
}

function ReadTestStatus({ report }: { report: SupabaseHealthReport }) {
  const t = report.lastReadTest;
  if (t.kind === "ok") {
    return (
      <div className="flex items-start gap-2 text-emerald-400 text-sm">
        <CheckCircle2 className="w-4 h-4 mt-0.5" />
        <span>Read OK — {t.rowsReturned} row(s) returned via client-safe view.</span>
      </div>
    );
  }
  if (t.kind === "blocked") {
    return (
      <div className="flex items-start gap-2 text-amber-400 text-sm">
        <AlertTriangle className="w-4 h-4 mt-0.5" />
        <span>{t.message}</span>
      </div>
    );
  }
  if (t.kind === "error") {
    return (
      <div className="flex items-start gap-2 text-destructive text-sm">
        <XCircle className="w-4 h-4 mt-0.5" />
        <span>Read failed: {t.message}</span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 text-muted-foreground text-sm">
      <span className="w-4 h-4 mt-0.5 inline-flex items-center justify-center">·</span>
      <span>Not attempted — {t.reason}</span>
    </div>
  );
}

export default function InternalSupabaseReadiness() {
  const [report, setReport] = useState<SupabaseHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [coverage, setCoverage] = useState<CoverageRow[]>([]);
  const [coverageLoading, setCoverageLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    setCoverageLoading(true);
    try {
      const [r, summary, media, calendar, reports, requests, updates, google, account] = await Promise.all([
        getSupabaseHealthReport(),
        getClientPortalSummaryReadOnly(),
        getClientPortalMediaReadOnly(),
        getClientPortalCalendarReadOnly(),
        getClientPortalReportsReadOnly(),
        getClientPortalRequestsReadOnly(),
        getClientPortalUpdatesReadOnly(),
        getClientPortalGoogleSnapshotReadOnly(),
        getClientPortalAccountReadOnly(),
      ]);
      setReport(r);
      setCoverage([
        envelopeToRow("clients (summary)",            summary),
        envelopeToRow("media_assets",                 media),
        envelopeToRow("post_slots / calendar",        calendar),
        envelopeToRow("weekly + monthly reports",     reports),
        envelopeToRow("client_requests",              requests),
        envelopeToRow("notifications / updates",      updates),
        envelopeToRow("google business snapshot",     google),
        envelopeToRow("account profile",              account),
      ]);
    } finally {
      setLoading(false);
      setCoverageLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        <Link
          href="/demo"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Demo Hub
        </Link>

        {/* Header */}
        <div className="space-y-2" data-testid="readiness-header">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/5">
              DEV ONLY · no writes · no production connection
            </Badge>
          </div>
          <h1 className="text-2xl font-bold">Supabase Readiness (M007)</h1>
          <p className="text-sm text-muted-foreground">
            Read-only diagnostic of the dev Supabase connection layer. No writes are performed.
            No keys are displayed. The portal continues to fall back to fixture data whenever a
            read is not possible.
          </p>
        </div>

        {/* Card: report */}
        <Card className="bg-card border-border">
          <CardContent className="p-5 space-y-5">

            {loading || !report ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                Running diagnostic…
              </div>
            ) : (
              <>
                {/* Modes */}
                <div className="grid grid-cols-2 gap-3" data-testid="readiness-modes">
                  <div className="rounded-md border border-border bg-muted/10 p-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">AUTH_MODE</p>
                    <p className="text-sm font-mono font-semibold text-foreground">{report.authMode}</p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/10 p-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">DATA_MODE</p>
                    <p className="text-sm font-mono font-semibold text-foreground">{report.dataMode}</p>
                  </div>
                </div>

                {/* Booleans */}
                <div className="rounded-md border border-border divide-y divide-border">
                  {[
                    { label: "Supabase URL configured", value: report.envUrlConfigured },
                    { label: "Supabase anon key configured", value: report.envAnonKeyConfigured },
                    { label: "Supabase client initialised", value: report.clientInitialised },
                    { label: "Read-only mode active", value: report.readonlyModeActive },
                    { label: "Fixture fallback active", value: report.fixtureFallbackActive },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between px-3 py-2.5 text-sm"
                      data-testid={`readiness-row-${row.label.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      <span className="text-muted-foreground">{row.label}</span>
                      <YesNo value={row.value} />
                    </div>
                  ))}
                </div>

                {/* Read test */}
                <div className="rounded-md border border-border bg-muted/10 p-3 space-y-2">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Last read test
                  </p>
                  <ReadTestStatus report={report} />
                </div>

                {/* Warnings */}
                {report.warnings.length > 0 && (
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
                    <p className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Warnings
                    </p>
                    {report.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-amber-200/80">{w}</p>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={refresh} data-testid="btn-readiness-refresh">
                    Re-run diagnostic
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* M008: Client Portal Read-Only Coverage */}
        <Card className="bg-card border-border" data-testid="readiness-coverage">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Client Portal Read-Only Coverage
                </p>
                <h2 className="text-sm font-semibold text-foreground">
                  Per-section availability (M008)
                </h2>
              </div>
              <Badge variant="outline" className="text-[10px]">M008</Badge>
            </div>

            {coverageLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-3 justify-center">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Checking sections…
              </div>
            ) : (
              <div className="rounded-md border border-border divide-y divide-border">
                {coverage.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                    data-testid={`coverage-row-${row.label.replace(/\s+/g, "-").replace(/[^a-z0-9-]/gi, "").toLowerCase()}`}
                  >
                    <span className="text-xs font-mono text-muted-foreground truncate flex-1">
                      {row.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground/70 truncate max-w-[55%]">
                      {row.message}
                    </span>
                    <CoverageStatusPill status={row.status} />
                  </div>
                ))}
              </div>
            )}

            <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
              <strong className="text-foreground/80">Live</strong> = real rows came back from a client_portal_* view.&nbsp;
              <strong className="text-foreground/80">Fallback</strong> = read attempted but RLS/env/error sent us to fixtures.&nbsp;
              <strong className="text-foreground/80">Skipped</strong> = no client-safe view yet, fixture-only by design.
            </p>
          </CardContent>
        </Card>

        {/* Safety footer */}
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-start gap-2 text-xs text-emerald-200/80">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p>
            This page does not write to the database, does not upload anything, does not call any
            AI provider, and does not contact a production database. Reads only — through
            client-safe views, governed by RLS. See <code>docs/M007_SUPABASE_READONLY_CONNECTION.md</code>.
          </p>
        </div>

      </div>
    </div>
  );
}
