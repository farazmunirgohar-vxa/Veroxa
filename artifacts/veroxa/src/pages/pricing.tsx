import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import {
  AD_SPEND_DISCLAIMER,
  CURRENT_PUBLIC_PLANS,
  FIRST_CLIENT_LOYALTY_DISCOUNT_POLICY,
  GLOBAL_PRICING_RULES,
  MEDIA_DEPENDENCY_DISCLAIMER,
  PREMIUM_READINESS_RULE,
  SERVICE_BOUNDARY_DISCLAIMER,
} from "@/data/pricing/veroxaPricing";

const PLANS = CURRENT_PUBLIC_PLANS.map((plan) => ({
  name: plan.label,
  price: plan.displayPrice,
  tagline: plan.tagline,
  includes: plan.includes,
  note:
    plan.id === "premium"
      ? `${AD_SPEND_DISCLAIMER} ${PREMIUM_READINESS_RULE}`
      : null,
  cta:
    plan.id === "premium"
      ? "Check Premium Readiness"
      : `Start with ${plan.label}`,
}));

const GLOBAL_RULES = GLOBAL_PRICING_RULES;

const FAQ_ITEMS = [
  {
    q: "Is Google optimization included in every plan?",
    a: "Yes. Google/local visibility support — Google Search basics, Google Maps basics, Google Business Profile cleanup, and review/reputation drafts/reminders — is included in all three plans at no extra cost.",
  },
  {
    q: "Which social media platforms are included at each tier?",
    a: "Starter includes Google/local cleanup plus Facebook and Instagram basic posting. Growth adds stronger online consistency across Facebook, Instagram, TikTok, and up to 1 post/day when usable media is available. Premium includes everything in Growth plus ads readiness/support after approval.",
  },
  {
    q: "How many posts per day does Veroxa publish?",
    a: "Starter is capped at up to 3 posts/week when usable media is available. Growth and Premium are capped at up to 1 post/day when usable media is available; Premium adds ads management readiness/support without increasing the posting cap.",
  },
  {
    q: "What if my restaurant doesn't have enough photos or videos?",
    a: "Veroxa can only post when usable media is available. The Client Portal includes a Media Library and weekly guidance on what to capture — regular phone photos of dishes, prep moments, and specials are usually enough to keep things moving.",
  },
  {
    q: "Is ad spend included in Premium?",
    a: `${AD_SPEND_DISCLAIMER} Premium requires a Veroxa readiness assessment by phone, Zoom, or in person, client approval, and an agreed ad budget.`,
  },
  {
    q: "Does Veroxa handle comments, DMs, inboxes, or customer-service replies?",
    a: "Not at launch. Veroxa handles content posting, captions, page consistency, Google visibility, online presence, media guidance, weekly updates, monthly snapshots/reports, and ads management only after readiness. The restaurant remains responsible for comments, messages, DMs, orders, complaints, refunds, and customer-service conversations.",
  },

  {
    q: "Is there a contract or minimum commitment?",
    a: `No contract. You can cancel anytime. Veroxa works month to month. ${FIRST_CLIENT_LOYALTY_DISCOUNT_POLICY}`,
  },
  {
    q: "What if I do not have a website or social media accounts?",
    a: "Veroxa will help set up the basic presence or accounts needed to run the service. This is not a custom website development package.",
  },
  {
    q: "Are outcomes promised?",
    a: "No. Veroxa does not promise rankings, revenue, walk-ins, or a specific customer count. The focus is a stronger online presence that helps restaurants become easier to find, easier to trust, and easier to choose. Results depend on restaurant quality, offer, location, market, and the media the restaurant provides.",
  },
];

export default function PricingPage() {
  useDocumentMeta({
    title: "Pricing — Veroxa",
    description: "View Veroxa's simple monthly restaurant growth plans.",
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav />

      {/* Hero */}
      <section className="pt-24 pb-16 px-6 lg:px-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-primary/15 blur-[100px] rounded-full pointer-events-none -z-10" />
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-wider mb-6 animate-in fade-in duration-300">
            <Shield className="w-3 h-3" />
            No contract · Cancel anytime
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            Simple pricing.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              Three clear plans.
            </span>
          </h1>
          <p className="text-muted-foreground animate-in fade-in slide-in-from-bottom-5 duration-700">
            Google/local visibility support is included in every plan. No
            contract, cancel anytime, no payment checkout here, and ad spend
            stays separate.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-8 px-6 lg:px-12 max-w-5xl mx-auto w-full">
        <div className="grid md:grid-cols-3 gap-5" data-testid="pricing-plans">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              data-testid={`pricing-plan-${plan.name.toLowerCase()}`}
              className="relative rounded-2xl border border-border/40 bg-card/20 p-7 flex flex-col gap-5"
            >
              {/* Plan name + price */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  {plan.name}
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground mb-1">
                    /mo
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-snug">
                  {plan.tagline}
                </p>
              </div>

              {/* Includes */}
              <div className="flex-1 space-y-2">
                {plan.includes.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary/70" />
                    <span className="text-sm font-medium leading-snug">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {/* Ad spend note (Premium only) */}
              {plan.note && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-400/90 leading-relaxed">
                  <strong>Ad spend is separate.</strong> {plan.note}
                </div>
              )}

              {/* CTA */}
              <Link
                href="/free-audit"
                data-testid={`btn-plan-cta-${plan.name.toLowerCase()}`}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-border/60 hover:bg-accent/50"
                >
                  {plan.cta} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Which plan section */}
      <section
        className="pb-8 px-6 lg:px-12 max-w-5xl mx-auto w-full"
        data-testid="which-plan-section"
      >
        <div className="rounded-2xl border border-border/40 bg-card/20 px-7 py-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Which plan should I start with?
          </h3>
          <div className="grid sm:grid-cols-3 gap-5">
            <div>
              <p className="text-sm font-semibold mb-1">Starter</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Low-friction entry for basic consistency and local visibility
                cleanup.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-1">Growth</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Built for restaurants that want stronger online consistency
                across Google, social content, TikTok, and reporting.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-1">Premium</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Selective and readiness-gated: requires assessment, approval,
                and an agreed ad budget. Ad spend remains separate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Global rules strip */}
      <section className="py-10 px-6 lg:px-12 max-w-5xl mx-auto w-full">
        <div
          className="rounded-2xl border border-border/40 bg-card/20 px-7 py-6"
          data-testid="global-rules"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              All plans
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
            {GLOBAL_RULES.map((rule) => (
              <div key={rule} className="flex items-center gap-2.5 py-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
                <span className="text-sm text-foreground/80">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust notes */}
      <section className="pb-8 px-6 lg:px-12 max-w-5xl mx-auto w-full">
        <div
          className="rounded-xl border border-border/30 bg-card/10 px-6 py-4 text-sm text-muted-foreground leading-relaxed max-w-3xl"
          data-testid="pricing-trust-note"
        >
          <strong className="text-foreground/80">Clear boundaries:</strong>{" "}
          Veroxa does not promise rankings, revenue, walk-ins, viral posts, or
          customer counts. Results depend on restaurant quality, market,
          location, offer, consistency, and usable client-provided media.
        </div>
      </section>

      {/* Media note */}
      <section className="pb-8 px-6 lg:px-12 max-w-5xl mx-auto w-full">
        <div
          className="rounded-xl border border-border/30 bg-card/10 px-6 py-4 text-sm text-muted-foreground leading-relaxed max-w-3xl"
          data-testid="media-note"
        >
          <strong className="text-foreground/80">About posting volume:</strong>{" "}
          {MEDIA_DEPENDENCY_DISCLAIMER}
        </div>
      </section>

      {/* Service boundary */}
      <section className="pb-8 px-6 lg:px-12 max-w-5xl mx-auto w-full">
        <div
          className="rounded-xl border border-border/30 bg-card/10 px-6 py-4 text-sm text-muted-foreground leading-relaxed max-w-3xl"
          data-testid="service-boundary-note"
        >
          <strong className="text-foreground/80">Service boundary:</strong>{" "}
          {SERVICE_BOUNDARY_DISCLAIMER}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 lg:px-12 max-w-3xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-6">Pricing FAQ</h2>
        <div className="space-y-4">
          {FAQ_ITEMS.map((f) => (
            <div
              key={f.q}
              className="p-5 rounded-xl border border-border/40 bg-card/20"
            >
              <p className="text-sm font-semibold text-foreground mb-2">
                {f.q}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 lg:px-12 bg-card/10 border-t border-border/30">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">
            Not sure which plan to start with?
          </h2>
          <p className="text-muted-foreground mb-8">
            Request a free restaurant audit. We'll show you where your online
            presence stands today and recommend the right starting point.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/free-audit" data-testid="btn-pricing-cta-audit">
              <Button
                size="lg"
                className="h-12 px-7 font-semibold shadow-[0_0_20px_rgba(99,102,241,0.25)]"
              >
                Start Free Audit <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link
              href="/demo/client/dashboard"
              data-testid="btn-pricing-cta-demo"
            >
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-7 border-border/60 hover:bg-accent/50"
              >
                View Client Demo
              </Button>
            </Link>
            <Link href="/login" data-testid="btn-pricing-cta-login">
              <Button
                size="lg"
                variant="ghost"
                className="h-12 px-7 text-muted-foreground hover:text-foreground"
              >
                Portal Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
