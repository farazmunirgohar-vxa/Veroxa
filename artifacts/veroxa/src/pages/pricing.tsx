import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Shield, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";

const PLANS = [
  {
    name: "Essential",
    price: "$497",
    tagline: "Keep your restaurant active and visible online.",
    highlight: false,
    badge: null,
    includes: [
      "Google Business Profile optimization",
      "Facebook + Instagram management",
      "Social media picture posting",
      "Basic captions",
      "Weekly updates",
      "Monthly performance snapshot",
      "Veroxa Client Portal access",
    ],
    note: null,
    cta: "Start with Essential",
    ctaSubject: "Essential Plan Inquiry",
  },
  {
    name: "Growth",
    price: "$697",
    tagline: "Everything in Essential, plus stronger reach with video.",
    highlight: true,
    badge: "Most Popular",
    includes: [
      "Everything in Essential",
      "Reels posting",
      "TikTok posting/management",
      "Short-form content support",
      "Enhanced monthly report",
    ],
    note: null,
    cta: "Start with Growth",
    ctaSubject: "Growth Plan Inquiry",
  },
  {
    name: "Premium",
    price: "$997",
    tagline: "Everything in Growth, plus paid ads management.",
    highlight: false,
    badge: null,
    includes: [
      "Everything in Growth",
      "Facebook/Instagram ads management",
      "Google Ads management",
      "Campaign setup and monitoring",
      "Monthly ad performance report",
    ],
    note: "Ad spend is separate and paid directly by the restaurant to the ad platform.",
    cta: "Start with Premium",
    ctaSubject: "Premium Plan Inquiry",
  },
];

const GLOBAL_RULES = [
  "No contract",
  "Cancel anytime",
  "Google Optimization included in all plans",
  "Facebook + Instagram included in all plans",
  "Maximum 1 post per day",
  "Reels + TikTok available from Growth",
  "Ads management available from Premium",
];

const FAQ_ITEMS = [
  {
    q: "Is Google optimization included in every plan?",
    a: "Yes. Google Optimization — Google Search, Google Maps, Google Business Profile, and review support — is included in all three plans at no extra cost.",
  },
  {
    q: "Which social media platforms are included at each tier?",
    a: "Essential includes Facebook and Instagram picture posting. Growth adds Reels and TikTok posting/management. Premium includes everything in Growth plus Ads management.",
  },
  {
    q: "How many posts per day does Veroxa publish?",
    a: "Veroxa posts a maximum of once per day, when enough usable content is available. Posting volume depends entirely on the quality and quantity of photos and videos the restaurant provides.",
  },
  {
    q: "What if my restaurant doesn't have enough photos or videos?",
    a: "Veroxa can only post when usable media is available. The Client Portal includes a Media Library and weekly guidance on what to capture — regular phone photos of dishes, prep moments, and specials are usually enough to keep things moving.",
  },
  {
    q: "Is ad spend included in Premium?",
    a: "No. Ad spend is separate and paid directly by the restaurant to the ad platform. The Premium plan covers Veroxa's ads management — campaign setup, targeting, creative direction, monitoring, and reporting.",
  },
  {
    q: "Is there a contract or minimum commitment?",
    a: "No contract. You can cancel anytime. Veroxa works month to month.",
  },
  {
    q: "What if I do not have a website or social media accounts?",
    a: "Veroxa will help set up the basic presence or accounts needed to run the service. This is not a custom website development package.",
  },
  {
    q: "Does Veroxa guarantee more customers?",
    a: "No. Veroxa does not guarantee rankings, revenue, walk-ins, or a specific number of new customers. The focus is on creating consistent daily customer opportunities online. Results depend on restaurant quality, offer, location, market, and the media the restaurant provides.",
  },
];

export default function PricingPage() {
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
            Google Optimization included in every plan. No contracts, no
            setup fees, no surprises.
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
              className={`relative rounded-2xl border p-7 flex flex-col gap-5 ${
                plan.highlight
                  ? "border-primary/60 bg-primary/5 shadow-[0_0_30px_rgba(99,102,241,0.12)]"
                  : "border-border/40 bg-card/20"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold uppercase tracking-wider">
                    <Star className="w-3 h-3" />
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan name + price */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  {plan.name}
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground mb-1">/mo</span>
                </div>
                <p className="text-sm text-muted-foreground leading-snug">
                  {plan.tagline}
                </p>
              </div>

              {/* Includes */}
              <div className="flex-1 space-y-2">
                {plan.includes.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2
                      className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        plan.highlight ? "text-primary" : "text-primary/70"
                      }`}
                    />
                    <span className="text-sm font-medium leading-snug">{item}</span>
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
              <a
                href={`mailto:hello@veroxa.com?subject=${encodeURIComponent(plan.ctaSubject)}`}
                data-testid={`btn-plan-cta-${plan.name.toLowerCase()}`}
              >
                <Button
                  size="lg"
                  variant={plan.highlight ? "default" : "outline"}
                  className={`w-full ${
                    plan.highlight
                      ? "shadow-[0_0_20px_rgba(99,102,241,0.25)]"
                      : "border-border/60 hover:bg-accent/50"
                  }`}
                >
                  {plan.cta} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </a>
            </div>
          ))}
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

      {/* Media note */}
      <section className="pb-8 px-6 lg:px-12 max-w-5xl mx-auto w-full">
        <div
          className="rounded-xl border border-border/30 bg-card/10 px-6 py-4 text-sm text-muted-foreground leading-relaxed max-w-3xl"
          data-testid="media-note"
        >
          <strong className="text-foreground/80">About posting volume:</strong>{" "}
          Posting depends on usable media provided by the restaurant. Veroxa may
          post up to once per day when enough usable content is available.
          Content volume is limited by available client photos and videos.
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
              <p className="text-sm font-semibold text-foreground mb-2">{f.q}</p>
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
          <h2 className="text-2xl font-bold mb-4">Not sure which plan to start with?</h2>
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
                Request Free Audit <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <a
              href="mailto:hello@veroxa.com?subject=Pricing%20Inquiry"
              data-testid="btn-pricing-cta-contact"
            >
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-7 border-border/60 hover:bg-accent/50"
              >
                Get in Touch
              </Button>
            </a>
            <Link href="/demo/client/dashboard" data-testid="btn-pricing-cta-demo">
              <Button
                size="lg"
                variant="ghost"
                className="h-12 px-7 text-muted-foreground hover:text-foreground"
              >
                Demo Preview
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
