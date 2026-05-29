import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Megaphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import {
  VEROXA_PLANS,
  COP_TERM_PRICING,
  COP_TERM_DISPLAY,
  COP_TERM_LABELS,
  BUNDLE_TERM_PRICING,
  BUNDLE_TERM_DISPLAY,
  AD_SPEND_DISCLAIMER,
  COMPLETE_PRESENCE_SETUP_DISCLAIMER,
  type TermPricing,
} from "@/data/pricing/veroxaPricing";

const COP = VEROXA_PLANS.complete_online_presence;
const ADS_ADDON = VEROXA_PLANS.ads_addon;

type TermKey = keyof TermPricing;
const TERM_KEYS: TermKey[] = ["months12", "months6", "months3", "noContract"];

const COP_INCLUDES = [
  "Facebook management",
  "Instagram management",
  "TikTok management",
  "Google Optimization",
  "Content planning",
  "Caption / draft creation",
  "Posting support",
  "Restaurant media guidance",
  "Weekly updates",
  "Monthly reports",
  "Team-managed execution",
  "Veroxa Client Portal access",
];

const ADS_INCLUDES = [
  "Ad campaign setup",
  "Audience and offer targeting",
  "Creative direction for ad-specific assets",
  "Campaign monitoring and optimization",
  "Monthly ad performance reporting",
];

const FAQ_ITEMS = [
  {
    q: "Is Google optimization included?",
    a: "Yes. Google optimization — Google Search SEO, Google Maps SEO, Google Business Profile, and reviews support — is included in Complete Online Presence.",
  },
  {
    q: "Can I buy ads management alone?",
    a: "No. Ads Management is only available as an add-on to Complete Online Presence. Ads work better when your Google presence, website, menu/order path, and content foundation are already clean.",
  },
  {
    q: "Is ad spend included?",
    a: "No. Ad spend is separate and paid directly by the restaurant to the ad platform.",
  },
  {
    q: "Which social media platforms are included in Complete Online Presence?",
    a: "Facebook, Instagram, and TikTok.",
  },
  {
    q: "What if I do not have a website or social media accounts?",
    a: "If you purchase Complete Online Presence, Veroxa will help create/setup the required basic website/presence or account/page needed to operate the service. This is not a custom website development package.",
  },
  {
    q: "What is the difference between the pricing tiers?",
    a: "The tiers reflect commitment length. A 12-month agreement offers the lowest monthly rate ($997/mo). Shorter terms or month-to-month carry a higher monthly rate. All terms are the same Complete Online Presence service.",
  },
  {
    q: "Does Veroxa offer a separate bundle plan?",
    a: `No. Pricing is simple: Complete Online Presence starts at ${COP_TERM_DISPLAY.months12}/mo, and Ads Management can be added for ${ADS_ADDON.displayPrice}/mo.`,
  },
  {
    q: "Does Veroxa guarantee more customers?",
    a: "No. Veroxa does not guarantee rankings, revenue, walk-ins, or exact customers. Veroxa's focus is helping restaurant partners create more daily customer opportunities. Results depend on restaurant quality, market, offer, location, consistency, and media supply.",
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
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            Flat monthly pricing.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              Flexible terms.
            </span>
          </h1>
          <p className="text-muted-foreground animate-in fade-in slide-in-from-bottom-5 duration-700">
            One core package — Complete Online Presence — with Google
            optimization built in. Add Ads Management when you're ready. Ad
            spend is always separate.
          </p>
        </div>
      </section>

      {/* ── SECTION 1: Complete Online Presence ──────────────────── */}
      <section className="py-16 px-6 lg:px-12 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-1">{COP.label}</h2>
        <p className="text-muted-foreground mb-8 text-sm max-w-2xl">
          The core Veroxa system for restaurants that want Facebook, Instagram,
          TikTok, Google Optimization, content planning, posting support, media
          guidance, weekly updates, monthly reports, and team-managed execution.
        </p>

        {/* Tier pricing table */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="pricing-cop-tiers">
          {TERM_KEYS.map((key) => (
            <div
              key={key}
              className={`p-6 rounded-2xl border flex flex-col gap-2 ${
                key === "months12"
                  ? "border-primary/50 bg-primary/5"
                  : "border-border/40 bg-card/20"
              }`}
              data-testid={`pricing-cop-${key}`}
            >
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {COP_TERM_LABELS[key]}
              </span>
              <div>
                <span className="text-3xl font-extrabold">
                  {COP_TERM_DISPLAY[key]}
                </span>
                <span className="text-sm text-muted-foreground ml-1">/mo</span>
              </div>
              {key === "months12" && (
                <span className="text-[11px] text-primary font-medium">
                  Best value
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-4">
          {/* Includes */}
          <div className="border border-border/50 rounded-2xl bg-card/20 p-7 md:col-span-2">
            <h3 className="text-sm font-bold mb-5 text-foreground">
              What's included
            </h3>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
              {COP_INCLUDES.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 py-1.5 border-b border-border/20 last:border-b-0"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA card */}
          <div
            className="p-7 rounded-2xl border border-primary/50 bg-primary/5 flex flex-col gap-3 md:col-span-1"
            data-testid="pricing-cop-cta"
          >
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Get started
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Includes Facebook, Instagram, TikTok, and Google optimization.
              Starts at {COP_TERM_DISPLAY.months12}/mo on a 12-month term.
            </p>
            <a
              href="mailto:hello@veroxa.com?subject=Complete Online Presence Inquiry"
              data-testid="btn-cop-cta"
            >
              <Button size="lg" className="w-full mt-2">
                Start Complete Online Presence{" "}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>

        <div
          className="mt-4 p-4 rounded-xl border border-primary/30 bg-primary/5 text-sm text-foreground/90 leading-relaxed max-w-3xl"
          data-testid="cop-setup-note"
        >
          <strong>Setup support:</strong> {COMPLETE_PRESENCE_SETUP_DISCLAIMER}
        </div>

        <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-lg mt-6">
          Veroxa does not guarantee rankings, revenue, walk-ins, or exact
          customers. Results depend on restaurant quality, offer, consistency,
          location, and market demand.
        </p>
      </section>

      {/* ── SECTION 2: Ads Management Add-On ─────────────────────── */}
      <section className="py-16 px-6 lg:px-12 bg-card/20 border-y border-border/40">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Megaphone className="w-5 h-5 text-amber-500" />
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
              Ads Management
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">
            Add Ads Management to Complete Online Presence.
          </h2>
          <p className="text-muted-foreground mb-8 text-sm max-w-xl">
            Ads Management is only available as an add-on to Complete Online
            Presence. Ads work better when your Google presence, website,
            menu/order path, and content foundation are already clean. Veroxa
            manages the advertising system; the restaurant controls and pays the
            actual ad budget.
          </p>

          <div className="grid md:grid-cols-3 gap-5 mb-6">
            <div
              className="p-7 rounded-2xl border border-amber-500/40 bg-amber-500/5 flex flex-col gap-3 md:col-span-1"
              data-testid="pricing-ads-addon"
            >
              <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-300">
                Add-on · with Complete Online Presence
              </span>
              <div>
                <span className="text-4xl font-extrabold">
                  {ADS_ADDON.displayPrice}
                </span>
                <span className="text-sm text-muted-foreground ml-1">/mo</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {ADS_ADDON.tagline}
              </span>
              <span className="text-xs text-muted-foreground/70">
                Flat rate — same price at all terms.
              </span>
            </div>

            <div className="border border-border/50 rounded-2xl bg-card/20 p-7 md:col-span-2">
              <h3 className="text-sm font-bold mb-5 text-foreground">
                What's included
              </h3>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
                {ADS_INCLUDES.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 py-1.5 border-b border-border/20 last:border-b-0"
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-sm text-amber-400/90 leading-relaxed"
            data-testid="banner-ad-spend-separate"
          >
            <strong>Ad spend is separate.</strong> {AD_SPEND_DISCLAIMER}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Bundle totals ───────────────────────────────── */}
      <section className="py-16 px-6 lg:px-12 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">
            Most common path
          </span>
        </div>
        <h2 className="text-2xl font-bold mb-2">
          Complete Online Presence + Ads Management
        </h2>
        <p className="text-muted-foreground mb-8 text-sm max-w-2xl">
          Most restaurants start with Complete Online Presence. When they want
          ads managed too, they add Ads Management for {ADS_ADDON.displayPrice}
          /mo. Below are combined service totals — these are two line items
          added together, not a separate "bundle" plan.
        </p>

        <div
          className="overflow-x-auto rounded-2xl border border-border/40 bg-card/20"
          data-testid="bundle-pricing-table"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">
                  Term
                </th>
                <th className="text-right px-6 py-4 font-semibold text-muted-foreground">
                  Complete Online Presence
                </th>
                <th className="text-right px-6 py-4 font-semibold text-muted-foreground">
                  Ads Management
                </th>
                <th className="text-right px-6 py-4 font-semibold text-foreground">
                  Combined /mo
                </th>
              </tr>
            </thead>
            <tbody>
              {TERM_KEYS.map((key, i) => (
                <tr
                  key={key}
                  className={`border-b border-border/20 last:border-b-0 ${
                    key === "months12" ? "bg-primary/5" : ""
                  }`}
                  data-testid={`bundle-row-${key}`}
                >
                  <td className="px-6 py-4 font-medium">
                    {COP_TERM_LABELS[key]}
                    {i === 0 && (
                      <span className="ml-2 text-[10px] font-semibold text-primary uppercase tracking-wide">
                        Best value
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-muted-foreground">
                    {COP_TERM_DISPLAY[key]}/mo
                  </td>
                  <td className="px-6 py-4 text-right text-muted-foreground">
                    {ADS_ADDON.displayPrice}/mo
                  </td>
                  <td className="px-6 py-4 text-right font-bold">
                    {BUNDLE_TERM_DISPLAY[key]}/mo
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground/60 mt-4 leading-relaxed max-w-lg">
          Before ad spend. Ad spend is paid directly by the restaurant to the
          ad platform.
        </p>
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
          <h2 className="text-2xl font-bold mb-4">Not sure where to start?</h2>
          <p className="text-muted-foreground mb-8">
            Request a free restaurant audit. We'll show you where your online
            presence stands today and how Complete Online Presence can help.
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
              href="mailto:hello@veroxa.com?subject=Complete Online Presence Inquiry"
              data-testid="btn-pricing-cta-start"
            >
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-7 border-border/60 hover:bg-accent/50"
              >
                Start Complete Online Presence
              </Button>
            </a>
            <Link href="/demo" data-testid="btn-pricing-cta-demo">
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

// Suppress unused-var lint for bundle totals exported from veroxaPricing
// that are imported for live calculation but not individually referenced here.
void (BUNDLE_TERM_PRICING satisfies TermPricing);
void (COP_TERM_PRICING satisfies TermPricing);
