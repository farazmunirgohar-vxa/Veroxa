import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Compass, Megaphone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import {
  AD_SPEND_DISCLAIMER,
  CURRENT_PUBLIC_PLANS,
  MEDIA_DEPENDENCY_DISCLAIMER,
  PREMIUM_READINESS_RULE,
  SERVICE_BOUNDARY_DISCLAIMER,
} from "@/data/pricing/veroxaPricing";

const planSummaries = CURRENT_PUBLIC_PLANS.map((plan) => ({
  name: plan.label,
  price: plan.displayPrice,
  tagline: plan.tagline,
  includes: plan.includes,
}));

const boundaries = [
  "Comments",
  "DMs and inboxes",
  "Refunds",
  "Complaints",
  "Order questions",
  "Customer-service conversations",
];

export default function ServicesPage() {
  useDocumentMeta({
    title: "Services — Veroxa",
    description:
      "Explore Veroxa services for restaurant Google visibility, social posting support, media guidance, reporting, and Premium ads readiness.",
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav />

      {/* Hero */}
      <section className="pt-24 pb-16 px-6 lg:px-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-primary/15 blur-[100px] rounded-full pointer-events-none -z-10" />
        <div className="max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-4">
            Restaurant presence, handled calmly
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            Services that match the real Veroxa offer.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700">
            Veroxa helps restaurants improve Google Business Profile readiness, Google Search and Maps visibility basics, social posting consistency, media rhythm, updates, and monthly reporting without claiming guaranteed growth.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="py-14 px-6 lg:px-12 max-w-6xl mx-auto w-full">
        <div className="grid md:grid-cols-3 gap-5" data-testid="services-plan-grid">
          {planSummaries.map((plan) => (
            <div
              key={plan.name}
              className="rounded-2xl border border-border/40 bg-card/20 p-6 flex flex-col gap-4"
              data-testid={`services-plan-${plan.name.toLowerCase()}`}
            >
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                  {plan.name}
                </p>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-3xl font-extrabold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground mb-1">/month</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {plan.tagline}
                </p>
              </div>
              <div className="space-y-2">
                {plan.includes.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary/80" />
                    <span className="text-sm leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core layers */}
      <section className="py-12 px-6 lg:px-12 bg-card/20 border-y border-border/40">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5">
          <div className="rounded-xl border border-border/40 bg-background/40 p-5">
            <Compass className="w-5 h-5 text-primary mb-3" />
            <h2 className="font-bold mb-2">Google/local visibility</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Google Business Profile optimization, Google Search SEO basics, Google Maps SEO basics, profile freshness, menu/link consistency, and local visibility opportunities are core to every plan.
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/40 p-5">
            <ShieldCheck className="w-5 h-5 text-primary mb-3" />
            <h2 className="font-bold mb-2">Portal + team workflow</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Restaurant partners use the Client Portal for media and simple status. Veroxa Team review keeps public actions calm, checked, and queued instead of automatic.
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/40 p-5">
            <Megaphone className="w-5 h-5 text-primary mb-3" />
            <h2 className="font-bold mb-2">Premium ads readiness</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Premium adds ads management readiness/support only after assessment, client approval, and an agreed budget. Ad reporting begins once approved ads are active later.
            </p>
          </div>
        </div>
      </section>

      {/* Boundaries */}
      <section className="py-14 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto rounded-2xl border border-border/40 bg-card/20 p-6 md:p-7">
          <h2 className="text-2xl font-bold mb-3">What is not included at launch</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            {SERVICE_BOUNDARY_DISCLAIMER}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-5">
            {boundaries.map((item) => (
              <div key={item} className="rounded-lg border border-border/30 bg-background/30 px-3 py-2 text-sm">
                {item}
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              {MEDIA_DEPENDENCY_DISCLAIMER}
            </p>
            <p>
              {AD_SPEND_DISCLAIMER} {PREMIUM_READINESS_RULE}
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 lg:px-12 bg-card/10 border-t border-border/30">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">
            Start with the Free Audit
          </h2>
          <p className="text-muted-foreground mb-8">
            The audit helps identify whether your restaurant should start with Essential, Growth, or Premium readiness review.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/free-audit" data-testid="btn-services-cta-audit">
              <Button
                size="lg"
                className="h-12 px-7 font-semibold shadow-[0_0_20px_rgba(99,102,241,0.25)]"
              >
                Start Free Audit <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/pricing" data-testid="btn-services-cta-pricing">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-7 border-border/60 hover:bg-accent/50"
              >
                See Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
