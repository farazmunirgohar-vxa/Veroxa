import { useMemo, useState, type FormEvent } from "react";
import {
  ClipboardList,
  Building2,
  Sparkles,
  UtensilsCrossed,
  CalendarClock,
  Camera,
  Globe,
  CheckCircle2,
  Circle,
  CircleDashed,
  Info,
  Upload,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { clientPortalNavItems } from "@/lib/clientPortalNav";

type SectionKey =
  | "basics"
  | "brand"
  | "menu"
  | "content"
  | "media"
  | "google";

interface OnboardingState {
  basics: {
    restaurantName: string;
    contactName: string;
    contactEmail: string;
    phone: string;
    address: string;
    website: string;
    gbpLink: string;
  };
  brand: {
    cuisineType: string;
    dietaryNotes: string;
    brandTone: string;
    bestSellers: string;
    promoteThisMonth: string;
    avoidPromoting: string;
  };
  menu: {
    menuLink: string;
    currentSpecials: string;
    cateringNotes: string;
  };
  content: {
    platforms: {
      instagram: boolean;
      facebook: boolean;
      tiktok: boolean;
      gbp: boolean;
    };
    postingDays: string;
    postingTimes: string;
    letVeroxaRecommend: boolean;
  };
  media: {
    mediaTypes: string;
    mediaUploader: string;
    uploadFrequency: string;
    presentationNotes: string;
  };
  google: {
    currentRating: string;
    reviewGoals: string;
    serviceAreas: string;
    keywords: string;
    commonQuestions: string;
  };
}

const initialState: OnboardingState = {
  basics: {
    restaurantName: "",
    contactName: "",
    contactEmail: "",
    phone: "",
    address: "",
    website: "",
    gbpLink: "",
  },
  brand: {
    cuisineType: "",
    dietaryNotes: "",
    brandTone: "",
    bestSellers: "",
    promoteThisMonth: "",
    avoidPromoting: "",
  },
  menu: {
    menuLink: "",
    currentSpecials: "",
    cateringNotes: "",
  },
  content: {
    platforms: { instagram: false, facebook: false, tiktok: false, gbp: false },
    postingDays: "",
    postingTimes: "",
    letVeroxaRecommend: false,
  },
  media: {
    mediaTypes: "",
    mediaUploader: "",
    uploadFrequency: "",
    presentationNotes: "",
  },
  google: {
    currentRating: "",
    reviewGoals: "",
    serviceAreas: "",
    keywords: "",
    commonQuestions: "",
  },
};

const sectionMeta: Array<{
  key: SectionKey;
  title: string;
  description: string;
  icon: typeof Building2;
}> = [
  {
    key: "basics",
    title: "Restaurant Basics",
    description: "Core contact and location details we need to set the account up.",
    icon: Building2,
  },
  {
    key: "brand",
    title: "Brand & Positioning",
    description: "How the restaurant sounds, what it sells, and what to lean into.",
    icon: Sparkles,
  },
  {
    key: "menu",
    title: "Menu & Offers",
    description: "Menu, current specials, and catering or family options.",
    icon: UtensilsCrossed,
  },
  {
    key: "content",
    title: "Content Preferences",
    description: "Where, when, and how often Veroxa should post.",
    icon: CalendarClock,
  },
  {
    key: "media",
    title: "Media Instructions",
    description: "Who provides photos and video, and how often.",
    icon: Camera,
  },
  {
    key: "google",
    title: "Google Visibility",
    description: "Google profile, reviews, and search keywords to target.",
    icon: Globe,
  },
];

type ReadinessStatus = "pending" | "in_progress" | "ready";

function sectionReadiness(
  state: OnboardingState,
  key: SectionKey,
): ReadinessStatus {
  let total = 0;
  let filled = 0;

  const count = (value: string | boolean) => {
    total += 1;
    if (typeof value === "string") {
      if (value.trim().length > 0) filled += 1;
    } else if (value) {
      filled += 1;
    }
  };

  switch (key) {
    case "basics":
      Object.values(state.basics).forEach(count);
      break;
    case "brand":
      Object.values(state.brand).forEach(count);
      break;
    case "menu":
      Object.values(state.menu).forEach(count);
      break;
    case "content":
      count(state.content.platforms.instagram);
      count(state.content.platforms.facebook);
      count(state.content.platforms.tiktok);
      count(state.content.platforms.gbp);
      count(state.content.postingDays);
      count(state.content.postingTimes);
      count(state.content.letVeroxaRecommend);
      break;
    case "media":
      Object.values(state.media).forEach(count);
      break;
    case "google":
      Object.values(state.google).forEach(count);
      break;
  }

  if (filled === 0) return "pending";
  if (filled >= total) return "ready";
  return "in_progress";
}

function StatusPill({ status }: { status: ReadinessStatus }) {
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5" /> Ready
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
        <CircleDashed className="w-3.5 h-3.5" /> In progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <Circle className="w-3.5 h-3.5" /> Pending
    </span>
  );
}

export default function ClientOnboarding() {
  const [state, setState] = useState<OnboardingState>(initialState);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const readiness = useMemo(
    () =>
      sectionMeta.map((s) => ({
        ...s,
        status: sectionReadiness(state, s.key),
      })),
    [state],
  );

  const overallPct = useMemo(() => {
    const ready = readiness.filter((r) => r.status === "ready").length;
    const partial = readiness.filter((r) => r.status === "in_progress").length;
    return Math.round(((ready + partial * 0.5) / readiness.length) * 100);
  }, [readiness]);

  const setBasics = <K extends keyof OnboardingState["basics"]>(
    key: K,
    value: OnboardingState["basics"][K],
  ) => setState((s) => ({ ...s, basics: { ...s.basics, [key]: value } }));

  const setBrand = <K extends keyof OnboardingState["brand"]>(
    key: K,
    value: OnboardingState["brand"][K],
  ) => setState((s) => ({ ...s, brand: { ...s.brand, [key]: value } }));

  const setMenu = <K extends keyof OnboardingState["menu"]>(
    key: K,
    value: OnboardingState["menu"][K],
  ) => setState((s) => ({ ...s, menu: { ...s.menu, [key]: value } }));

  const setContent = <K extends keyof OnboardingState["content"]>(
    key: K,
    value: OnboardingState["content"][K],
  ) => setState((s) => ({ ...s, content: { ...s.content, [key]: value } }));

  const setPlatform = (
    key: keyof OnboardingState["content"]["platforms"],
    value: boolean,
  ) =>
    setState((s) => ({
      ...s,
      content: {
        ...s.content,
        platforms: { ...s.content.platforms, [key]: value },
      },
    }));

  const setMedia = <K extends keyof OnboardingState["media"]>(
    key: K,
    value: OnboardingState["media"][K],
  ) => setState((s) => ({ ...s, media: { ...s.media, [key]: value } }));

  const setGoogle = <K extends keyof OnboardingState["google"]>(
    key: K,
    value: OnboardingState["google"][K],
  ) => setState((s) => ({ ...s, google: { ...s.google, [key]: value } }));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitMessage("Demo only — onboarding is not saved yet.");
  };

  const handleReset = () => {
    setState(initialState);
    setSubmitMessage(null);
  };

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-3xl font-bold tracking-tight">Client Onboarding</h2>
          <Badge
            variant="outline"
            className="border-amber-500/40 text-amber-400 bg-amber-500/10"
            data-testid="badge-demo-only"
          >
            Demo only — not saved
          </Badge>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          A demo preview of the information Veroxa collects before launching a
          restaurant growth system.
        </p>
        <div className="flex items-start gap-2 text-sm text-muted-foreground max-w-3xl">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>This form does not submit or store information yet.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-2">
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
          data-testid="form-onboarding"
        >
          {sectionMeta.map(({ key, title, description, icon: Icon }) => (
            <Card
              key={key}
              className="bg-card border-border"
              data-testid={`section-${key}`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {description}
                      </p>
                    </div>
                  </div>
                  <StatusPill
                    status={sectionReadiness(state, key)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {key === "basics" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Restaurant name" htmlFor="b-name">
                      <Input
                        id="b-name"
                        value={state.basics.restaurantName}
                        onChange={(e) =>
                          setBasics("restaurantName", e.target.value)
                        }
                        placeholder="e.g. Maison Saffron"
                      />
                    </Field>
                    <Field label="Main contact name" htmlFor="b-contact">
                      <Input
                        id="b-contact"
                        value={state.basics.contactName}
                        onChange={(e) => setBasics("contactName", e.target.value)}
                        placeholder="Owner or marketing lead"
                      />
                    </Field>
                    <Field label="Contact email" htmlFor="b-email">
                      <Input
                        id="b-email"
                        type="email"
                        value={state.basics.contactEmail}
                        onChange={(e) =>
                          setBasics("contactEmail", e.target.value)
                        }
                        placeholder="contact@restaurant.com"
                      />
                    </Field>
                    <Field label="Phone number" htmlFor="b-phone">
                      <Input
                        id="b-phone"
                        value={state.basics.phone}
                        onChange={(e) => setBasics("phone", e.target.value)}
                        placeholder="+1 (555) 555-0100"
                      />
                    </Field>
                    <Field
                      label="Address"
                      htmlFor="b-address"
                      className="md:col-span-2"
                    >
                      <Input
                        id="b-address"
                        value={state.basics.address}
                        onChange={(e) => setBasics("address", e.target.value)}
                        placeholder="Street, city, region"
                      />
                    </Field>
                    <Field label="Website" htmlFor="b-website">
                      <Input
                        id="b-website"
                        value={state.basics.website}
                        onChange={(e) => setBasics("website", e.target.value)}
                        placeholder="https://"
                      />
                    </Field>
                    <Field
                      label="Google Business Profile link"
                      htmlFor="b-gbp"
                    >
                      <Input
                        id="b-gbp"
                        value={state.basics.gbpLink}
                        onChange={(e) => setBasics("gbpLink", e.target.value)}
                        placeholder="https://g.page/..."
                      />
                    </Field>
                  </div>
                )}

                {key === "brand" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Cuisine type" htmlFor="br-cuisine">
                      <Input
                        id="br-cuisine"
                        value={state.brand.cuisineType}
                        onChange={(e) =>
                          setBrand("cuisineType", e.target.value)
                        }
                        placeholder="e.g. Modern Levantine"
                      />
                      <p
                        className="text-xs text-muted-foreground mt-1.5"
                        data-testid="text-cuisine-guidance-hint"
                      >
                        Later, Veroxa will use this cuisine type to recommend what photos and videos your team should capture.
                      </p>
                    </Field>
                    <Field
                      label="Halal / vegetarian / specialty notes"
                      htmlFor="br-diet"
                    >
                      <Input
                        id="br-diet"
                        value={state.brand.dietaryNotes}
                        onChange={(e) =>
                          setBrand("dietaryNotes", e.target.value)
                        }
                        placeholder="What to highlight or call out"
                      />
                    </Field>
                    <Field
                      label="Brand tone"
                      htmlFor="br-tone"
                      className="md:col-span-2"
                    >
                      <Input
                        id="br-tone"
                        value={state.brand.brandTone}
                        onChange={(e) => setBrand("brandTone", e.target.value)}
                        placeholder="e.g. warm, premium, family-led"
                      />
                    </Field>
                    <Field label="Best-selling items" htmlFor="br-best">
                      <Textarea
                        id="br-best"
                        value={state.brand.bestSellers}
                        onChange={(e) =>
                          setBrand("bestSellers", e.target.value)
                        }
                        placeholder="What customers love most"
                        rows={3}
                      />
                    </Field>
                    <Field label="Items to promote this month" htmlFor="br-promote">
                      <Textarea
                        id="br-promote"
                        value={state.brand.promoteThisMonth}
                        onChange={(e) =>
                          setBrand("promoteThisMonth", e.target.value)
                        }
                        placeholder="Specials, launches, seasonal items"
                        rows={3}
                      />
                    </Field>
                    <Field
                      label="Items to avoid promoting"
                      htmlFor="br-avoid"
                      className="md:col-span-2"
                    >
                      <Textarea
                        id="br-avoid"
                        value={state.brand.avoidPromoting}
                        onChange={(e) =>
                          setBrand("avoidPromoting", e.target.value)
                        }
                        placeholder="Out-of-stock, retired, or low-margin items"
                        rows={2}
                      />
                    </Field>
                  </div>
                )}

                {key === "menu" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Menu link" htmlFor="m-link">
                        <Input
                          id="m-link"
                          value={state.menu.menuLink}
                          onChange={(e) => setMenu("menuLink", e.target.value)}
                          placeholder="https://restaurant.com/menu"
                        />
                      </Field>
                      <Field label="Current specials" htmlFor="m-specials">
                        <Input
                          id="m-specials"
                          value={state.menu.currentSpecials}
                          onChange={(e) =>
                            setMenu("currentSpecials", e.target.value)
                          }
                          placeholder="e.g. Tuesday taco night"
                        />
                      </Field>
                    </div>
                    <Field
                      label="Catering / family platters / lunch specials"
                      htmlFor="m-catering"
                    >
                      <Textarea
                        id="m-catering"
                        value={state.menu.cateringNotes}
                        onChange={(e) =>
                          setMenu("cateringNotes", e.target.value)
                        }
                        placeholder="Group offers, set menus, lunch combos"
                        rows={3}
                      />
                    </Field>
                    <div
                      className="border border-dashed border-border rounded-lg p-6 text-center bg-muted/20"
                      data-testid="menu-upload-placeholder"
                    >
                      <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Upload menu (placeholder)</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Real uploads are not enabled in the demo. Coming in a
                        later phase.
                      </p>
                    </div>
                  </div>
                )}

                {key === "content" && (
                  <div className="space-y-5">
                    <div>
                      <Label className="text-sm font-medium">
                        Preferred platforms
                      </Label>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        {(
                          [
                            ["instagram", "Instagram"],
                            ["facebook", "Facebook"],
                            ["tiktok", "TikTok"],
                            ["gbp", "Google Business Profile"],
                          ] as const
                        ).map(([k, label]) => (
                          <label
                            key={k}
                            className="flex items-center gap-2 text-sm cursor-pointer"
                            data-testid={`platform-${k}`}
                          >
                            <Checkbox
                              checked={state.content.platforms[k]}
                              onCheckedChange={(v) =>
                                setPlatform(k, Boolean(v))
                              }
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Preferred posting days" htmlFor="c-days">
                        <Input
                          id="c-days"
                          value={state.content.postingDays}
                          onChange={(e) =>
                            setContent("postingDays", e.target.value)
                          }
                          placeholder="e.g. Tue, Thu, Sat"
                        />
                      </Field>
                      <Field label="Preferred posting times" htmlFor="c-times">
                        <Input
                          id="c-times"
                          value={state.content.postingTimes}
                          onChange={(e) =>
                            setContent("postingTimes", e.target.value)
                          }
                          placeholder="e.g. 11:30 and 18:00"
                        />
                      </Field>
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={state.content.letVeroxaRecommend}
                        onCheckedChange={(v) =>
                          setContent("letVeroxaRecommend", Boolean(v))
                        }
                        data-testid="checkbox-recommend"
                      />
                      Let Veroxa recommend posting times
                    </label>
                  </div>
                )}

                {key === "media" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                      label="What kind of photos / videos can the restaurant provide?"
                      htmlFor="md-types"
                      className="md:col-span-2"
                    >
                      <Textarea
                        id="md-types"
                        value={state.media.mediaTypes}
                        onChange={(e) =>
                          setMedia("mediaTypes", e.target.value)
                        }
                        placeholder="Phone photos, professional shoots, behind-the-scenes, etc."
                        rows={3}
                      />
                    </Field>
                    <Field label="Who will upload media?" htmlFor="md-who">
                      <Input
                        id="md-who"
                        value={state.media.mediaUploader}
                        onChange={(e) =>
                          setMedia("mediaUploader", e.target.value)
                        }
                        placeholder="Owner, manager, kitchen lead..."
                      />
                    </Field>
                    <Field
                      label="How often can they upload media?"
                      htmlFor="md-freq"
                    >
                      <Input
                        id="md-freq"
                        value={state.media.uploadFrequency}
                        onChange={(e) =>
                          setMedia("uploadFrequency", e.target.value)
                        }
                        placeholder="Weekly, monthly, on request..."
                      />
                    </Field>
                    <Field
                      label="Notes for food presentation or filming"
                      htmlFor="md-notes"
                      className="md:col-span-2"
                    >
                      <Textarea
                        id="md-notes"
                        value={state.media.presentationNotes}
                        onChange={(e) =>
                          setMedia("presentationNotes", e.target.value)
                        }
                        placeholder="Plating, angles, lighting, brand items to include"
                        rows={3}
                      />
                    </Field>
                  </div>
                )}

                {key === "google" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Current Google rating" htmlFor="g-rating">
                      <Input
                        id="g-rating"
                        value={state.google.currentRating}
                        onChange={(e) =>
                          setGoogle("currentRating", e.target.value)
                        }
                        placeholder="e.g. 4.3"
                      />
                    </Field>
                    <Field label="Review goals" htmlFor="g-reviews">
                      <Input
                        id="g-reviews"
                        value={state.google.reviewGoals}
                        onChange={(e) =>
                          setGoogle("reviewGoals", e.target.value)
                        }
                        placeholder="e.g. 4.6+ within 90 days"
                      />
                    </Field>
                    <Field
                      label="Service areas"
                      htmlFor="g-areas"
                      className="md:col-span-2"
                    >
                      <Input
                        id="g-areas"
                        value={state.google.serviceAreas}
                        onChange={(e) =>
                          setGoogle("serviceAreas", e.target.value)
                        }
                        placeholder="Neighborhoods or delivery radius"
                      />
                    </Field>
                    <Field
                      label="Keywords you want to be found for"
                      htmlFor="g-keywords"
                    >
                      <Textarea
                        id="g-keywords"
                        value={state.google.keywords}
                        onChange={(e) => setGoogle("keywords", e.target.value)}
                        placeholder="e.g. best brunch downtown, halal steak"
                        rows={3}
                      />
                    </Field>
                    <Field
                      label="Common customer questions"
                      htmlFor="g-questions"
                    >
                      <Textarea
                        id="g-questions"
                        value={state.google.commonQuestions}
                        onChange={(e) =>
                          setGoogle("commonQuestions", e.target.value)
                        }
                        placeholder="Reservations, parking, dietary..."
                        rows={3}
                      />
                    </Field>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <Card className="bg-card border-border">
            <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6">
              <div className="text-sm text-muted-foreground max-w-xl">
                Real onboarding answers will later be saved after auth,
                production RLS, and audit logs are approved. Submitting today
                will not save anything.
              </div>
              <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="w-full sm:w-auto"
                    data-testid="button-reset-onboarding"
                  >
                    Reset demo form
                  </Button>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto"
                    data-testid="button-submit-onboarding"
                  >
                    Save Onboarding — Coming Soon
                  </Button>
                </div>
                {submitMessage && (
                  <p
                    className="text-xs text-amber-400 sm:text-right"
                    data-testid="text-submit-message"
                    role="status"
                  >
                    {submitMessage}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-6 self-start">
          <Card
            className="bg-card border-border"
            data-testid="card-launch-readiness"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Launch Readiness
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Overall progress</span>
                  <span>{overallPct}%</span>
                </div>
                <Progress value={overallPct} className="h-2" />
              </div>
              <Separator />
              <ul className="space-y-3">
                {readiness.map((r) => (
                  <li
                    key={r.key}
                    className="flex items-center justify-between gap-3"
                    data-testid={`readiness-${r.key}`}
                  >
                    <div className="flex items-center gap-2">
                      <r.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{r.title}</span>
                    </div>
                    <StatusPill status={r.status} />
                  </li>
                ))}
              </ul>
              <Separator />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Real onboarding will be saved after auth, production RLS, and
                write policies are approved.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PortalLayout>
  );
}

interface FieldProps {
  label: string;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}

function Field({ label, htmlFor, className, children }: FieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
