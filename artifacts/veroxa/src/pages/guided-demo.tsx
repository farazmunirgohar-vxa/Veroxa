import { Link } from "wouter";
import {
  ArrowRight,
  Lock,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { veroxaGuidedWalkthrough, type DemoWalkthroughStep } from "@/data/demo/demoWalkthrough";

// ── Role badge styles ─────────────────────────────────────────────

const ROLE_STYLE: Record<string, string> = {
  Client:   "bg-blue-500/10 text-blue-300 border-blue-500/30",
  Team:     "bg-violet-500/10 text-violet-300 border-violet-500/30",
  };

// ── Step card ─────────────────────────────────────────────────────

function StepCard({ step }: { step: DemoWalkthroughStep }) {
  const isGuarded = step.access === "internal";

  return (
    <Card
      className="bg-card border-border hover:border-primary/30 transition-colors overflow-hidden"
      data-testid={`step-card-${step.stepNumber}`}
    >
      <CardContent className="p-0">
        <div className="flex gap-0">
          {/* Step number gutter */}
          <div className="flex-shrink-0 w-14 flex flex-col items-center pt-6 pb-4 border-r border-border bg-muted/10">
            <span className="text-2xl font-black tabular-nums text-muted-foreground/50 leading-none">
              {step.stepNumber}
            </span>
            {step.stepNumber < veroxaGuidedWalkthrough.steps.length && (
              <div className="flex-1 mt-4 w-px bg-border" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-5 space-y-3">
            {/* Header row */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={`text-[11px] font-semibold border ${ROLE_STYLE[step.role] ?? ""}`}
                data-testid={`step-role-${step.stepNumber}`}
              >
                {step.role}
              </Badge>
              <Badge
                variant="outline"
                className="text-[11px] border-border text-muted-foreground"
              >
                {step.visualLabel}
              </Badge>
              {isGuarded && (
                <Badge
                  variant="outline"
                  className="text-[11px] border-amber-500/30 bg-amber-500/5 text-amber-400 flex items-center gap-1"
                  data-testid={`step-guarded-${step.stepNumber}`}
                >
                  <Lock className="w-2.5 h-2.5" />
                  Requires demo access
                </Badge>
              )}
            </div>

            {/* Title + explanation */}
            <div>
              <h3 className="text-base font-semibold text-foreground leading-snug mb-1">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.shortExplanation}
              </p>
            </div>

            {/* What to look for */}
            <div className="rounded-md border border-border/60 bg-muted/10 p-3 space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                What to look for
              </p>
              {step.whatToLookFor.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-primary/60" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href={step.route} data-testid={`step-open-${step.stepNumber}`}>
                <Button
                  size="sm"
                  variant={isGuarded ? "outline" : "default"}
                  className="gap-1.5 font-semibold"
                >
                  Open this step
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
              {isGuarded && (
                <p className="text-[11px] text-muted-foreground">
                  Enter code <span className="font-semibold text-foreground/70">veroxa-preview</span> when prompted
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function GuidedDemo() {
  const { title, subtitle, steps } = veroxaGuidedWalkthrough;

  const publicSteps  = steps.filter((s) => s.access === "public");
  const internalSteps = steps.filter((s) => s.access === "internal");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav />

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 space-y-8">

        {/* Header */}
        <div className="text-center space-y-3" data-testid="guided-demo-header">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold">
            Guided Sales Demo
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Quick-start CTAs */}
        <div
          className="flex flex-col sm:flex-row gap-3 justify-center"
          data-testid="guided-demo-quick-ctas"
        >
          <Link href="/free-audit" data-testid="cta-guided-demo-free-audit">
            <Button size="lg" className="font-semibold gap-1.5">
              Start with a Free Audit
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/demo/client" data-testid="cta-guided-demo-client-portal">
            <Button size="lg" variant="outline" className="font-semibold gap-1.5">
              Preview Client Portal
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* How Veroxa works — owner-facing flow blurb */}
        <Card
          className="bg-card border-border"
          data-testid="guided-demo-flow-blurb"
        >
          <CardContent className="p-5 space-y-2">
            <p className="text-sm font-semibold text-foreground">
              How a restaurant works with Veroxa
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You share direction and upload phone photos. Veroxa drafts the
              content, reviews it before anything goes live, schedules posts at
              the right time, and reports back monthly. You stay in charge of
              the direction; Veroxa handles the execution.
            </p>
          </CardContent>
        </Card>

        {/* Safety banner */}
        <div
          className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3"
          data-testid="guided-demo-safety-banner"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-200/80">
            This guided demo uses sample data only. No real client account, no real posting,
            no real AI provider, and no real upload. Everything resets on refresh.
          </p>
        </div>

        {/* Access key note */}
        <div
          className="rounded-lg border border-border bg-muted/10 px-4 py-3 text-sm text-muted-foreground"
          data-testid="guided-demo-access-note"
        >
          <p>
            <span className="font-semibold text-foreground/80">Steps 1, 2, 5, 6</span> are public — no login required.{" "}
            <span className="font-semibold text-foreground/80">Steps 3, 4, 7, 8</span> show internal Team/Internal Admin views.
            These require the demo access code{" "}
            <span className="font-mono font-semibold text-foreground/80">veroxa-preview</span> when prompted.
            The guided demo does not bypass any existing access controls.
          </p>
        </div>

        {/* Public steps */}
        <section data-testid="section-public-steps">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Client view — no login required
          </h2>
          <div className="space-y-3">
            {publicSteps.map((step) => (
              <StepCard key={step.stepNumber} step={step} />
            ))}
          </div>
        </section>

        {/* Internal steps */}
        <section data-testid="section-internal-steps">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            Internal views — demo access required
          </h2>
          <div className="space-y-3">
            {internalSteps.map((step) => (
              <StepCard key={step.stepNumber} step={step} />
            ))}
          </div>
        </section>

        {/* Footer note */}
        <p
          className="text-center text-[11px] text-muted-foreground pb-4"
          data-testid="guided-demo-footer"
        >
          Guided Sales Demo · Veroxa · Demo-only fixture data · No AI API connected · No real posting or scheduling
        </p>
      </div>

      <PublicFooter />
    </div>
  );
}
