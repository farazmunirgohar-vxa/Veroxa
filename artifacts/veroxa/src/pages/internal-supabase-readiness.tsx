import { useEffect, useRef, useState } from "react";
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
import { getWriteReadinessStatus, WRITES_ENABLED } from "@/lib/data/writeReadiness";
import { getSchemaReadinessStatus } from "@/lib/data/schemaReadiness";
import { verifyM024ASchema } from "@/lib/data/schemaVerification";
import { EXPECTED_M024A_TABLES } from "@/lib/data/schemaVerification";
import {
  runDevWriteSmokeTests,
  getDevWriteSmokeTestReadiness,
} from "@/lib/data/devWriteSmokeTests";
import {
  getSupabaseReadinessStatus,
  getReadOnlyConnectionNotes,
} from "@/lib/repositories/supabaseReadiness";
import { isValidUuid } from "@/lib/data/devClientIdValidation";
import type { SchemaVerificationResult } from "@/lib/data/schemaVerificationTypes";
import type { SchemaSmokeTestResult } from "@/lib/data/schemaVerificationTypes";

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
  const writeStatus = getWriteReadinessStatus();
  const schemaStatus = getSchemaReadinessStatus();
  const smokeReadiness = getDevWriteSmokeTestReadiness();

  const [verifyResult, setVerifyResult] = useState<SchemaVerificationResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [smokeResult, setSmokeResult] = useState<SchemaSmokeTestResult | null>(null);
  const [smokeRunning, setSmokeRunning] = useState(false);
  const [devClientId, setDevClientId] = useState("");
  const clientIdRef = useRef<HTMLInputElement>(null);

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

        {/* Read-only operations foundation — diagnostic block */}
        <Card
          className="bg-amber-500/5 border-amber-500/30"
          data-testid="card-read-only-ops-foundation"
        >
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-foreground">
                Read-Only Operations Foundation
              </h2>
              <Badge
                variant="outline"
                className="text-[10px] bg-amber-500/10 text-amber-300 border-amber-500/30"
              >
                Internal only
              </Badge>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              Backend is not live. The Veroxa repository layer reads from
              bundled demo fixtures. Real auth, real AI, real publishing,
              real payments, and storage uploads are NOT enabled. The
              read-only Supabase adapter is scaffolded but inactive.
            </p>

            {(() => {
              const status = getSupabaseReadinessStatus();
              const notes = getReadOnlyConnectionNotes();
              const rows: { label: string; value: boolean | string }[] = [
                { label: "Data source mode",            value: status.dataSourceModeLabel },
                { label: "AUTH_MODE",                   value: status.authMode },
                { label: "Supabase URL configured",     value: status.envUrlConfigured },
                { label: "Supabase anon key configured",value: status.envAnonKeyConfigured },
                { label: "Read-only client initialised",value: status.clientInitialised },
                { label: "Read-only adapter available", value: status.readOnlyAdapterAvailable },
                { label: "Real auth active",            value: status.realAuthActive },
                { label: "Writes enabled",              value: status.writesEnabled },
                { label: "Storage uploads enabled",     value: status.storageUploadsEnabled },
                { label: "AI APIs enabled",             value: status.aiApisEnabled },
                { label: "Publishing integrations",     value: status.publishingIntegrationsEnabled },
                { label: "Payment integrations",        value: status.paymentIntegrationsEnabled },
              ];
              return (
                <>
                  <div className="rounded-md border border-amber-500/20 divide-y divide-amber-500/20">
                    {rows.map((r) => (
                      <div
                        key={r.label}
                        className="flex items-center justify-between px-3 py-2 text-xs"
                        data-testid={`read-only-ops-row-${r.label.replace(/\s+/g, "-").toLowerCase()}`}
                      >
                        <span className="text-amber-200/80">{r.label}</span>
                        {typeof r.value === "boolean" ? (
                          <YesNo value={r.value} />
                        ) : (
                          <span className="text-foreground font-mono text-[11px]">{r.value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <ul className="text-[11px] text-amber-200/70 space-y-1 pl-3 list-disc">
                    {notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </>
              );
            })()}
          </CardContent>
        </Card>

        {/* Header */}
        <div className="space-y-2" data-testid="readiness-header">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/5">
              DEV ONLY · writes disabled unless explicit flag · no production data
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

        {/* Schema Readiness — M024A */}
        <Card className="bg-card border-border" data-testid="card-schema-readiness">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Schema Readiness</h3>
              <Badge variant="outline" className="text-[10px] bg-muted/30 text-muted-foreground border-border">
                M024A
              </Badge>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 pl-1" data-testid="list-schema-readiness">
              <li>• Schema version: <code className="text-foreground">{schemaStatus.schemaVersion}</code></li>
              <li>• Metadata tables (created by migration): <span className="text-foreground">{schemaStatus.metadataTables.join(", ")}</span></li>
              <li>• Schema migration drafted: <span className="text-foreground">{schemaStatus.schemaCreated ? "Yes" : "No"}</span></li>
              <li>• Storage ready: <span className="text-foreground">{schemaStatus.storageReady ? "Yes" : "No"}</span></li>
              <li>• Real auth ready: <span className="text-foreground">{schemaStatus.realAuthReady ? "Yes" : "No"}</span></li>
              <li>• Upload-key RLS ready: <span className="text-foreground">{schemaStatus.uploadKeyRlsReady ? "Yes" : "No"}</span></li>
              <li>• Production RLS ready: <span className="text-foreground">{schemaStatus.productionReady ? "Yes" : "No"}</span></li>
              <li>• Dev write adapter: available only with <code>VITE_VEROXA_ENABLE_DEV_WRITES="true"</code></li>
              <li>• Next step: {schemaStatus.nextStep}</li>
            </ul>
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
              See <code>supabase/migrations/</code>, <code>src/lib/data/schemaReadiness.ts</code>, and{" "}
              <code>docs/M024A_SUPABASE_METADATA_SCHEMA_AND_RLS.md</code>.
            </p>
          </CardContent>
        </Card>

        {/* Write Readiness — M023C */}
        <Card className="bg-card border-border" data-testid="card-write-readiness">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Write Readiness</h3>
              <Badge variant="outline" className="text-[10px] bg-muted/30 text-muted-foreground border-border">
                M023C
              </Badge>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 pl-1" data-testid="list-write-readiness">
              <li>• Write mode: <span className="text-foreground">{writeStatus.mode}</span></li>
              <li>• Writes enabled: <span className="text-foreground">{writeStatus.enabled ? "Yes" : "No"}</span></li>
              <li>• Env flag: <code className="text-foreground">{writeStatus.envFlagName}</code> (only the exact string <code>"true"</code> enables writes)</li>
              <li>• Current adapter: <span className="text-foreground">{writeStatus.enabled ? "devSupabaseWriteAdapter" : "disabledWriteAdapter"}</span></li>
              <li>• Storage upload: <span className="text-foreground">not connected</span></li>
              <li>• Service role in frontend: <span className="text-foreground">not allowed</span></li>
              <li>• Real migrations: <span className="text-foreground">not created in this build</span></li>
              <li>• Tables expected (may not exist yet): <code>upload_submissions</code>, <code>direction_requests</code>, <code>team_review_decisions</code></li>
              <li>• Errors are safe-mapped — no raw DB errors reach the client.</li>
              <li>• Next step: {writeStatus.nextStep}</li>
            </ul>
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
              See <code>src/lib/data/writeReadiness.ts</code>,{" "}
              <code>src/lib/data/writeAdapter.ts</code>,{" "}
              <code>src/lib/data/devSupabaseWriteAdapter.ts</code>, and{" "}
              <code>docs/sql-plan/</code>.
            </p>
          </CardContent>
        </Card>

        {/* Schema Verification — M024B */}
        <Card className="bg-card border-border" data-testid="card-schema-verification">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Schema Verification</h3>
              <Badge variant="outline" className="text-[10px] bg-muted/30 text-muted-foreground border-border">
                M024B
              </Badge>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 pl-1">
              <li>• Expected schema version: <code className="text-foreground">M024A_FIRST_CLIENT_METADATA</code></li>
              <li>• Expected tables: <span className="text-foreground">{EXPECTED_M024A_TABLES.join(", ")}</span></li>
              <li>• Read-only check — no writes performed during verification.</li>
            </ul>
            <Button
              size="sm"
              variant="outline"
              disabled={verifying}
              onClick={async () => {
                setVerifying(true);
                setVerifyResult(null);
                try {
                  const result = await verifyM024ASchema();
                  setVerifyResult(result);
                } finally {
                  setVerifying(false);
                }
              }}
            >
              {verifying ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Verifying…</> : "Run schema verification"}
            </Button>
            {verifyResult && (
              <div className="space-y-1 text-xs">
                <p className={verifyResult.ok ? "text-emerald-400" : "text-amber-400"}>
                  {verifyResult.ok ? <CheckCircle2 className="inline w-3 h-3 mr-1" /> : <AlertTriangle className="inline w-3 h-3 mr-1" />}
                  {verifyResult.safeMessage}
                </p>
                <ul className="pl-2 space-y-0.5">
                  {verifyResult.tableChecks.map((t) => (
                    <li key={t.tableName} className="flex items-center gap-1">
                      {t.status === "passed"
                        ? <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        : <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
                      <code className="text-muted-foreground">{t.tableName}</code>
                      <span className="text-muted-foreground/70">— {t.safeMessage}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground/50">Checked at: {verifyResult.checkedAt}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dev Write Smoke Test — M024B */}
        <Card className="bg-card border-border" data-testid="card-smoke-test">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold">Dev Write Smoke Test</h3>
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-300 border-amber-500/30">
                Internal only
              </Badge>
            </div>

            {/* Warnings */}
            <div className="rounded border border-amber-500/20 bg-amber-500/5 p-2 text-[11px] text-amber-200/80 space-y-0.5">
              <p>⚠ Do not use real restaurant data in this smoke test.</p>
              <p>⚠ This does not upload files or test storage.</p>
              <p>⚠ This does not test production security.</p>
              <p>⚠ M024A RLS is dev-stage only.</p>
              <p>⚠ Production RLS and real auth are still incomplete.</p>
            </div>

            <ul className="text-xs text-muted-foreground space-y-1 pl-1">
              <li>• Write mode: <span className="text-foreground">{writeStatus.mode}</span></li>
              <li>• Env flag: <code className="text-foreground">{writeStatus.envFlagName}</code></li>
              <li>• Writes enabled: <span className={WRITES_ENABLED ? "text-emerald-400" : "text-muted-foreground"}>{WRITES_ENABLED ? "Yes" : "No"}</span></li>
              <li>• Storage upload: <span className="text-foreground">not connected</span></li>
              <li>• Requires fictional dev client UUID (created manually in dev Supabase).</li>
            </ul>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Dev client UUID (fictional only)</label>
              <input
                ref={clientIdRef}
                type="text"
                value={devClientId}
                onChange={(e) => setDevClientId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                spellCheck={false}
              />
              {devClientId && !isValidUuid(devClientId) && (
                <p className="text-[10px] text-red-400">Not a valid UUID format.</p>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                disabled={smokeRunning}
                onClick={async () => {
                  setSmokeRunning(true);
                  setSmokeResult(null);
                  try {
                    const result = await runDevWriteSmokeTests({
                      clientId: devClientId || undefined,
                      dryRun: true,
                    });
                    setSmokeResult(result);
                  } finally {
                    setSmokeRunning(false);
                  }
                }}
              >
                {smokeRunning ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                Run dry run
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={
                  smokeRunning ||
                  !WRITES_ENABLED ||
                  !isValidUuid(devClientId)
                }
                title={
                  !WRITES_ENABLED
                    ? `Set ${writeStatus.envFlagName}="true" to enable`
                    : !isValidUuid(devClientId)
                    ? "Provide a valid dev client UUID first"
                    : "Run metadata smoke test"
                }
                onClick={async () => {
                  setSmokeRunning(true);
                  setSmokeResult(null);
                  try {
                    const result = await runDevWriteSmokeTests({
                      clientId: devClientId,
                      dryRun: false,
                    });
                    setSmokeResult(result);
                  } finally {
                    setSmokeRunning(false);
                  }
                }}
              >
                {smokeRunning ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                Run metadata smoke test
              </Button>
            </div>
            {!WRITES_ENABLED && (
              <p className="text-[11px] text-amber-300/80">{smokeReadiness.safeMessage}</p>
            )}
            {smokeResult && (
              <div className="space-y-1 text-xs mt-1">
                <p className={smokeResult.ok ? "text-emerald-400" : smokeResult.status === "dry_run" ? "text-blue-400" : "text-amber-400"}>
                  {smokeResult.ok || smokeResult.status === "dry_run"
                    ? <CheckCircle2 className="inline w-3 h-3 mr-1" />
                    : <AlertTriangle className="inline w-3 h-3 mr-1" />}
                  {smokeResult.safeMessage}
                </p>
                <ul className="pl-2 space-y-0.5">
                  {smokeResult.steps.map((s, i) => (
                    <li key={i} className="flex items-center gap-1">
                      {s.status === "passed" || s.status === "dry_run"
                        ? <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        : s.status === "skipped"
                        ? <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        : <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
                      <span className="text-muted-foreground">{s.name}</span>
                      <span className="text-muted-foreground/60">— {s.safeMessage}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground/50">Ran at: {smokeResult.ranAt}</p>
              </div>
            )}
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
