import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

const SYSTEM_POINTS = [
  "Google Business Profile and Google Maps visibility support",
  "Facebook + Instagram posting included in every plan",
  "Media guidance, weekly updates, and monthly reporting",
  "Client Portal requests paired with Veroxa Team review",
];

export default function LandingPage() {
  useDocumentMeta({
    title: "Veroxa — Restaurant Online Presence System",
    description:
      "Veroxa helps restaurants become easier to find, trust, choose, and return to through Google visibility, social posting, media guidance, and simple reporting.",
  });

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 flex flex-col">
      <PublicNav />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 lg:px-12 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Restaurant Online Presence System
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-5xl leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          Help your restaurant become easier to find, trust, choose, and return to.
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mb-10 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-150">
          Veroxa is a calm, done-with-review operating system for restaurant online presence: Google/local visibility, social posting support, media guidance, updates, and reports handled through a Client Portal and Veroxa Team workflow.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
          <Link href="/free-audit" data-testid="btn-hero-audit">
            <Button size="lg" className="h-14 px-8 text-base font-semibold shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all">
              Request Free Audit
            </Button>
          </Link>
          <Link href="/demo/client/dashboard" data-testid="btn-hero-client-demo">
            <Button size="lg" variant="outline" className="h-14 px-8 text-base border-border/50 hover:bg-accent/50 transition-colors">
              Client Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* What Veroxa Does */}
      <section className="py-20 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_1.2fr] gap-10 items-start">
          <div>
            <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">
              Built for restaurant owners
            </p>
            <h2 className="text-3xl font-bold mb-5">What Veroxa does</h2>
            <p className="text-muted-foreground leading-relaxed">
              Veroxa keeps the practical online pieces organized: local search readiness, Google Maps and Business Profile freshness, social content consistency, client-provided media use, simple reports, and clear requests when Veroxa needs restaurant input.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {SYSTEM_POINTS.map((point) => (
              <div
                key={point}
                className="rounded-xl border border-border/40 bg-card/20 p-4 text-sm font-medium leading-relaxed"
              >
                {point}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust boundaries */}
      <section className="pb-20 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto rounded-2xl border border-border/40 bg-card/20 p-6 md:p-7">
          <h2 className="text-xl font-bold mb-3">Clear, honest boundaries</h2>
          <div className="grid md:grid-cols-2 gap-5 text-sm text-muted-foreground leading-relaxed">
            <p>
              Veroxa is not a magic growth guarantee. Rankings, revenue, walk-ins, and new customers depend on the restaurant's quality, location, market, offer, consistency, and the usable photos or videos the restaurant provides.
            </p>
            <p>
              Veroxa does not handle comments, DMs, inboxes, refunds, complaints, order questions, or customer-service conversations at launch. Nothing public-facing goes live without Veroxa Team review and the right restaurant confirmation.
            </p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
