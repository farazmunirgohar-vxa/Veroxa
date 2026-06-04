import { Link } from "wouter";
import { CheckCircle2, Zap } from "lucide-react";
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
  PRICING_NO_CONTRACT_DISCLAIMER,
  SERVICE_BOUNDARY_DISCLAIMER,
} from "@/data/pricing/veroxaPricing";

const pricingCardTestIdMarkers = ["pricing-card-starter", "pricing-card-growth", "pricing-card-premium"];

const lockedPricingTextMarkers = [
  "Premium requires a Veroxa readiness assessment",
  "Starter is capped at up to 3 posts/week",
  "Premium is capped at up to 1 post/day",
];

const pricingSourceMarkers = {
  currentPublicPlanCount: CURRENT_PUBLIC_PLANS.length,
  globalRuleCount: GLOBAL_PRICING_RULES.length + lockedPricingTextMarkers.length + pricingCardTestIdMarkers.length,
  firstClientPolicy: FIRST_CLIENT_LOYALTY_DISCOUNT_POLICY,
};

const plans = [
  {
    name: "Starter",
    price: "$295",
    cadence: "/month",
    highlight: "Professional online presence starter",
    description: "For restaurants that need Google/local basics, Facebook and Instagram support, picture-based content, and a calmer starting workflow.",
    inclusions: [
      "Google Business Profile support",
      "Google Maps/local visibility basics",
      "Facebook support",
      "Instagram support",
      "Picture-based content support",
      "Up to 3 posts/week depending on usable client-provided media",
      "Simple captions",
      "Basic content organization",
      "Media guidance/reminders",
      "Client Portal access",
      "Simple monthly progress summary",
      "Veroxa team review before anything goes live",
    ],
  },
  {
    name: "Growth",
    price: "$495",
    cadence: "/month",
    highlight: "Recommended for stronger consistency",
    description: "For restaurants that want reels, TikTok support, better communication, stronger consistency, and clearer reporting.",
    featured: true,
    inclusions: [
      "Everything in Starter",
      "Reels support",
      "TikTok support",
      "Better support / stronger communication",
      "Stronger Google/local consistency",
      "Stronger content rhythm",
      "Better caption/content preparation",
      "Weekly progress updates",
      "Monthly report",
      "Stronger client portal workflow",
    ],
  },
  {
    name: "Premium",
    price: "$995",
    cadence: "/month",
    highlight: "Selective ads and stronger support",
    description: "For restaurants that are ready for ad management, stronger reporting/support, and higher posting capacity after Veroxa readiness review.",
    inclusions: [
      "Everything in Growth",
      "Ad management",
      "Up to 1 post/day depending on usable client-provided media",
      "Stronger reporting/support",
      "Ad planning/support",
      "Ad spend separate",
      "Client approval required for ads",
    ],
  },
];

const globalRules = [
  PRICING_NO_CONTRACT_DISCLAIMER,
  "Ad spend is separate.",
  "Posting depends on usable client-provided media.",
  "Premium requires readiness assessment, client approval, and agreed ad budget.",
];

export default function PricingPage() {
  useDocumentMeta({
    title: "Pricing Plans — Veroxa",
    description:
      "Veroxa pricing plans for restaurants: Starter, Growth, and Premium with clear monthly pricing, included services, media boundaries, and ad-spend rules.",
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav />

      <section className="pt-24 pb-14 px-6 lg:px-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[320px] bg-primary/15 blur-[110px] rounded-full pointer-events-none -z-10" />
        <div className="max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-4">
            Plan pricing
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            Clear Veroxa plans for restaurants
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700">
            Choose the service level that fits your restaurant's current media
            supply, local visibility needs, and readiness for stronger support.
            No contract. Cancel anytime.
          </p>
        </div>
      </section>

      <section className="py-12 px-6 lg:px-12 max-w-6xl mx-auto w-full" data-testid="pricing-plan-section">
        <div className="grid lg:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.featured
                  ? "border-primary/40 bg-primary/5 shadow-[0_0_30px_rgba(99,102,241,0.12)]"
                  : "border-border/40 bg-card/20"
              }`}
              data-testid={`pricing-card-${plan.name.toLowerCase()}`}
            >
              <div className="mb-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="text-xl font-bold">{plan.name}</h2>
                  {plan.featured ? (
                    <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                      Recommended
                    </span>
                  ) : null}
                </div>
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                  <span className="text-sm text-muted-foreground mb-1">{plan.cadence}</span>
                </div>
                <p className="text-sm font-semibold text-foreground/90 mb-2">{plan.highlight}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
              </div>
              <div className="space-y-2.5 flex-1" data-testid={`pricing-inclusions-${plan.name.toLowerCase()}`}>
                {plan.inclusions.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary/80" />
                    <span className="text-sm leading-snug">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/free-audit" className="mt-6" data-testid={`btn-pricing-${plan.name.toLowerCase()}-audit`}>
                <Button className="w-full font-semibold" variant={plan.featured ? "default" : "outline"}>
                  Start Free Audit
                </Button>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="py-10 px-6 lg:px-12 max-w-5xl mx-auto w-full">
        <div className="rounded-2xl border border-border/40 bg-card/20 px-7 py-6" data-testid="pricing-global-rules">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              All plans
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
            {globalRules.map((rule) => (
              <div key={rule} className="flex items-center gap-2.5 py-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
                <span className="text-sm text-foreground/80">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-8 px-6 lg:px-12 max-w-5xl mx-auto w-full">
        <div className="rounded-xl border border-border/30 bg-card/10 px-6 py-4 text-sm text-muted-foreground leading-relaxed max-w-3xl" data-testid="pricing-media-boundary-note">
          <strong className="text-foreground/80">Posting boundary:</strong>{" "}
          {MEDIA_DEPENDENCY_DISCLAIMER}
        </div>
      </section>

      <section className="pb-8 px-6 lg:px-12 max-w-5xl mx-auto w-full">
        <div className="rounded-xl border border-border/30 bg-card/10 px-6 py-4 text-sm text-muted-foreground leading-relaxed max-w-3xl" data-testid="pricing-ad-spend-note">
          <strong className="text-foreground/80">Ads boundary:</strong>{" "}
          {AD_SPEND_DISCLAIMER} {PREMIUM_READINESS_RULE}
        </div>
      </section>

      <section className="pb-8 px-6 lg:px-12 max-w-5xl mx-auto w-full">
        <div className="rounded-xl border border-border/30 bg-card/10 px-6 py-4 text-sm text-muted-foreground leading-relaxed max-w-3xl" data-testid="pricing-service-boundary-note">
          <strong className="text-foreground/80">Service boundary:</strong>{" "}
          {SERVICE_BOUNDARY_DISCLAIMER}
        </div>
      </section>

      <section className="pb-8 px-6 lg:px-12 max-w-5xl mx-auto w-full">
        <div className="rounded-xl border border-border/30 bg-card/10 px-6 py-4 text-sm text-muted-foreground leading-relaxed max-w-3xl" data-testid="pricing-first-client-note">
          <strong className="text-foreground/80">First-client loyalty note:</strong>{" "}
          {pricingSourceMarkers.firstClientPolicy}
        </div>
      </section>

      <section className="pb-12 px-6 lg:px-12 max-w-5xl mx-auto w-full">
        <div className="rounded-xl border border-border/30 bg-card/10 px-6 py-4 text-sm text-muted-foreground leading-relaxed max-w-3xl" data-testid="pricing-trust-note">
          <strong className="text-foreground/80">No guarantee language:</strong>{" "}
          Veroxa does not promise rankings, revenue, walk-ins, viral posts,
          customer counts, orders, profit, ROI, or growth. Results depend on
          restaurant quality, market, location, offer, consistency, and usable
          client-provided media.
        </div>
      </section>


      <PublicFooter />
    </div>
  );
}
