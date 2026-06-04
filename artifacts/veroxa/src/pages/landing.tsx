import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { COMPLETE_ONLINE_PRESENCE_PLAN, CURRENT_LAUNCH_ADDONS, PRICING_NO_CONTRACT_DISCLAIMER } from "@/data/pricing/veroxaPricing";

const handled = [
  "Google Business Profile support",
  "Google Maps/local visibility basics",
  "Local SEO/search visibility basics",
  "Website alignment/refinement if access is provided",
  "Facebook support",
  "Instagram support",
  "Picture-based content support",
  "Up to 3 posts/updates per week, media dependent",
  "Weekly updates",
  "Monthly online presence report",
  "Client Portal access",
  "Portal request response/review/answer within 24 hours",
  "Veroxa team review before anything goes live",
];

const howItWorks = [
  "Restaurant provides access, media, and business details.",
  "Veroxa aligns profiles and online presence across Google, Maps/local visibility, website, Facebook, and Instagram.",
  "Veroxa prepares platform-specific drafts for review.",
  "Veroxa team reviews before anything goes live.",
  "Client requests go through the portal; Veroxa responds/reviews/answers within 24 hours.",
  "Weekly updates explain what Veroxa worked on, what was posted/prepared, what is pending, what media is needed, what client details need confirmation, and what is next. Monthly reports go deeper.",
];

export default function LandingPage() {
  useDocumentMeta({
    title: "Complete Online Presence for Restaurants — Veroxa",
    description:
      "Veroxa manages restaurant online presence across Google, Maps/local visibility, website alignment, Facebook, and Instagram for $495/month. Yelp is coming soon.",
  });

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 flex flex-col">
      <PublicNav />
      <section className="pt-28 pb-16 px-6 lg:px-12 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold mb-8">
          One launch offer • Home → Audit → Login
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-5xl leading-[1.1] mb-6">
          Complete Online Presence for Restaurants
        </h1>
        <p className="text-3xl md:text-4xl font-bold text-primary mb-5" data-testid="home-price">
          {COMPLETE_ONLINE_PRESENCE_PLAN.displayPrice}/month
        </p>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mb-8">
          Veroxa manages your restaurant’s complete online presence across Google, Maps/local visibility, website alignment, Facebook, and Instagram — then tracks what is working, what needs improvement, and what media helps your restaurant become easier to find, easier to trust, and easier to choose.
        </p>
        <p className="text-sm text-muted-foreground mb-10">
          Portal-based workflow • Weekly updates • Monthly online presence report • {PRICING_NO_CONTRACT_DISCLAIMER}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/free-audit" data-testid="btn-hero-audit">
            <Button size="lg" className="h-14 px-8 text-base font-semibold shadow-[0_0_30px_rgba(99,102,241,0.3)]">Request Audit</Button>
          </Link>
          <Link href="/login" data-testid="btn-hero-login">
            <Button size="lg" variant="outline" className="h-14 px-8 text-base border-border/50">Login</Button>
          </Link>
        </div>
      </section>

      <section className="py-16 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
          <div>
            <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">What Veroxa handles</p>
            <h2 className="text-3xl font-bold mb-5">One calm online presence package.</h2>
            <p className="text-muted-foreground leading-relaxed">
              Veroxa focuses on the practical places restaurants are discovered, checked, trusted, and chosen. No multi-package funnel, no public demo promotion, and no fake live execution claims.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {handled.map((point) => <div key={point} className="rounded-xl border border-border/40 bg-card/20 p-4 text-sm font-medium leading-relaxed">{point}</div>)}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 lg:px-12 bg-card/10 border-y border-border/30">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">How it works</p>
          <div className="grid md:grid-cols-3 gap-4">
            {howItWorks.map((step, index) => (
              <div key={step} className="rounded-2xl border border-border/40 bg-background/60 p-5">
                <div className="text-xs text-primary font-semibold mb-2">Step {index + 1}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-border/40 bg-card/20 p-6">
            <h2 className="text-xl font-bold mb-3">Coming soon</h2>
            <ul className="space-y-2 text-sm text-muted-foreground"><li>Yelp</li><li>TikTok</li><li>Reels/video content</li><li>Ads management</li></ul>
          </div>
          <div className="rounded-2xl border border-border/40 bg-card/20 p-6">
            <h2 className="text-xl font-bold mb-3">Add-ons</h2>
            <p className="sr-only">New basic website +$95. Missing social profile creation +$45/profile.</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {CURRENT_LAUNCH_ADDONS.map((addon) => <li key={addon.id}>{addon.label} — {addon.displayPrice}</li>)}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">Missing social profile creation is available as a $45/profile add-on for Facebook or Instagram. Yelp setup is coming soon, not a launch add-on.</p>
          </div>
          <div className="rounded-2xl border border-border/40 bg-card/20 p-6">
            <h2 className="text-xl font-bold mb-3">Not included at launch</h2>
            <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <p>Comments, DMs, inboxes, customer-service replies, refunds, complaints, and order questions.</p>
              <p>Full website redesign, custom development, hosting/domain/email troubleshooting, paid ad spend, daily posting, automated publishing, live integrations, or guaranteed results.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto rounded-2xl border border-border/40 bg-card/20 p-6 md:p-7 text-center">
          <h2 className="text-2xl font-bold mb-3">Start with a Restaurant Online Presence Audit.</h2>
          <p className="text-sm text-muted-foreground mb-6">The audit reviews online presence gaps and whether Complete Online Presence — $495/month is a fit. Recommendations are not guarantees.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/free-audit"><Button>Start Audit</Button></Link>
            <Link href="/login"><Button variant="outline">Login</Button></Link>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
