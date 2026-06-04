import {
  BarChart3,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  FileText,
  MessageSquareOff,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

const serviceLayers = [
  {
    icon: Compass,
    title: "Google Business Profile and Maps readiness",
    body: "Veroxa reviews profile completeness, business details, categories, menu and ordering links, photos, freshness, and local visibility opportunities so the restaurant is easier to find and easier to trust.",
  },
  {
    icon: Sparkles,
    title: "Social content consistency from client-provided media",
    body: "Veroxa organizes usable restaurant photos and videos into a steady Facebook, Instagram, and related social rhythm without pretending the restaurant has unlimited content supply.",
  },
  {
    icon: Camera,
    title: "Media guidance and reminders",
    body: "Restaurant partners get simple guidance on what to send next: food, storefront, menu, staff, catering, seasonal items, and best sellers that can support clearer online presence.",
  },
  {
    icon: ClipboardCheck,
    title: "Content preparation and Veroxa team review",
    body: "Veroxa prepares captions, visibility updates, review-support drafts, and next-step tasks for team review. Nothing public goes live without Veroxa team review.",
  },
  {
    icon: BarChart3,
    title: "Weekly updates",
    body: "The restaurant can see calm progress notes, next needs, and what Veroxa is preparing instead of chasing scattered messages or unclear marketing activity.",
  },
  {
    icon: FileText,
    title: "Monthly reporting",
    body: "Reports are prepared around visible work, client inputs, media supply, and online-presence progress. They stay practical, clear, and free from guarantee language.",
  },
  {
    icon: ShieldCheck,
    title: "Client Portal workflow",
    body: "The Client Portal gives the restaurant one calmer place to review media needs, requests, updates, and reports while protected routes remain separate from the public demo.",
  },
  {
    icon: CheckCircle2,
    title: "Premium ads readiness and support layer",
    body: "For restaurants that are ready, Veroxa can support ad planning and readiness review. This service layer requires assessment, client approval, and an agreed ad budget before ad work is considered.",
  },
];

const serviceSteps = [
  "Client provides usable restaurant media.",
  "Veroxa organizes inputs and prepares the work.",
  "Veroxa team reviews before anything goes live.",
  "Client confirms business-truth details when needed.",
  "Work is manually tracked and prepared in pre-live mode.",
  "Updates and reports are prepared for clear review.",
];

const boundaries = [
  "Comments",
  "DMs",
  "Inboxes",
  "Refunds",
  "Complaints",
  "Order questions",
  "Customer-service conversations",
];

export default function ServicesPage() {
  useDocumentMeta({
    title: "Restaurant Services — Veroxa",
    description:
      "What Veroxa does for restaurants: Google Maps readiness, social consistency, media guidance, reviewed content preparation, updates, reporting, and clear launch boundaries.",
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav />

      <section className="pt-24 pb-14 px-6 lg:px-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[320px] bg-primary/15 blur-[110px] rounded-full pointer-events-none -z-10" />
        <div className="max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-4">
            What Veroxa does
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            What Veroxa does for restaurants
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700">
            Veroxa helps restaurants become easier to find, easier to trust,
            and easier to choose by organizing local visibility, client-provided
            media, content preparation, team review, updates, and reporting into
            one calm operating workflow.
          </p>
        </div>
      </section>

      <section className="py-12 px-6 lg:px-12 max-w-6xl mx-auto w-full" data-testid="services-layer-section">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              Core service layers
            </p>
            <h2 className="text-2xl md:text-3xl font-bold">
              Online presence work, organized by Veroxa
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            Services are shown here by operating layer. Plan prices and package
            inclusions live on the Pricing page.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {serviceLayers.map((layer) => {
            const Icon = layer.icon;
            return (
              <article key={layer.title} className="rounded-2xl border border-border/40 bg-card/20 p-5">
                <Icon className="w-5 h-5 text-primary mb-4" />
                <h3 className="font-bold mb-2 leading-snug">{layer.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{layer.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="py-14 px-6 lg:px-12 bg-card/20 border-y border-border/40" data-testid="service-workflow-section">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[0.8fr_1.2fr] gap-8 items-start">
          <div>
            <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">
              How the service works
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Simple for the restaurant, reviewed by Veroxa
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Veroxa is designed so the restaurant partner does the minimum
              practical work: provide usable media and confirm business-truth
              details when needed. Veroxa prepares, reviews, tracks, and reports
              the work calmly.
            </p>
          </div>
          <ol className="grid sm:grid-cols-2 gap-3">
            {serviceSteps.map((step, index) => (
              <li key={step} className="rounded-xl border border-border/40 bg-background/50 p-4 flex gap-3">
                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-sm leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-14 px-6 lg:px-12 max-w-5xl mx-auto w-full" data-testid="service-boundaries-section">
        <div className="rounded-2xl border border-border/40 bg-card/20 p-7 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <MessageSquareOff className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Service boundaries
              </p>
              <h2 className="text-2xl font-bold mb-2">What Veroxa does not handle at launch</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                Veroxa supports online presence preparation and review. The
                restaurant remains responsible for direct customer conversations
                and service issues.
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {boundaries.map((boundary) => (
              <div key={boundary} className="rounded-lg border border-border/40 bg-background/40 px-4 py-3 text-sm">
                {boundary}
              </div>
            ))}
          </div>
        </div>
      </section>


      <PublicFooter />
    </div>
  );
}
