import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Hexagon, Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AUTH_MODE } from "@/lib/auth/authMode";
import { useAuth } from "@/lib/auth/useAuth";
import { getSupabaseClient } from "@/lib/supabase";

export interface SidebarItem {
  label: string;
  icon?: React.ElementType;
  href?: string;
  /** When set to 'section', renders as a section-header divider (no link, no icon). */
  type?: 'section';
}

interface PortalLayoutProps {
  children: React.ReactNode;
  items: SidebarItem[];
  portalName: string;
}

interface SidebarNavProps {
  items: SidebarItem[];
  location: string;
  fallbackActive: number;
  setFallbackActive: (i: number) => void;
  portalName: string;
  onNavigate?: () => void;
}

function isRouteActive(itemHref: string, location: string): boolean {
  if (location === itemHref) return true;
  const defaultSuffixes = ["/dashboard", "/overview", "/tasks"];
  for (const suffix of defaultSuffixes) {
    if (itemHref.endsWith(suffix)) {
      const root = itemHref.slice(0, itemHref.lastIndexOf(suffix));
      if (location === root || location === root + "/") return true;
    }
  }
  return false;
}

/**
 * Sign-out footer — shown only when AUTH_MODE === "real".
 * Displays the signed-in user's role + email and a sign-out button.
 * No writes. No token display.
 */
function AuthFooter({ onNavigate }: { onNavigate?: () => void }) {
  const auth = useAuth();
  const [, setLocation] = useLocation();

  if (AUTH_MODE !== "real" || auth.status !== "authenticated") return null;

  const { role, email, displayName } = auth.session!;

  async function handleSignOut() {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    onNavigate?.();
    setLocation("/login");
  }

  return (
    <div className="px-4 pb-3 space-y-1">
      <div className="flex flex-col px-2 py-2">
        <span className="text-xs font-semibold text-sidebar-foreground/80 capitalize">
          {displayName ?? role}
        </span>
        <span className="text-[11px] text-sidebar-foreground/50 truncate">{email}</span>
      </div>
      <button
        onClick={handleSignOut}
        className="w-full flex items-center gap-2 text-sm text-sidebar-foreground/60 hover:text-red-400 px-2 py-2 transition-colors rounded-md hover:bg-red-500/10"
        data-testid="btn-sign-out"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </div>
  );
}

function SidebarNav({
  items,
  location,
  fallbackActive,
  setFallbackActive,
  portalName,
  onNavigate,
}: SidebarNavProps) {
  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <div className="px-6 py-4 flex-1">
        <div
          className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4"
          data-testid="text-portal-name"
        >
          {portalName}
        </div>
        <nav className="space-y-1">
          {items.map((item, i) => {
            // Section header — renders as a divider label, not a clickable item.
            if (item.type === 'section') {
              return (
                <div key={i} className="pt-4 pb-1 px-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35">
                    {item.label}
                  </p>
                </div>
              );
            }

            const isActive = item.href?.startsWith("/")
              ? isRouteActive(item.href, location)
              : item.href?.startsWith("#")
              ? false
              : i === fallbackActive;

            const sharedClass = cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            );
            const icon = item.icon ? (
              <item.icon
                className={cn(
                  "w-4 h-4",
                  isActive ? "text-primary" : "text-sidebar-foreground/50"
                )}
              />
            ) : null;
            const testId = `sidebar-item-${item.label.toLowerCase().replace(/\s+/g, "-")}`;

            if (item.href?.startsWith("/")) {
              return (
                <Link
                  key={i}
                  href={item.href}
                  className={sharedClass}
                  data-testid={testId}
                  onClick={onNavigate}
                >
                  {icon}
                  {item.label}
                </Link>
              );
            }
            if (item.href?.startsWith("#")) {
              return (
                <a
                  key={i}
                  href={item.href}
                  onClick={() => {
                    setFallbackActive(i);
                    onNavigate?.();
                  }}
                  className={sharedClass}
                  data-testid={testId}
                >
                  {icon}
                  {item.label}
                </a>
              );
            }
            return (
              <button
                key={i}
                onClick={() => {
                  setFallbackActive(i);
                  onNavigate?.();
                }}
                className={sharedClass}
                data-testid={testId}
              >
                {icon}
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-sidebar-border shrink-0">
        <AuthFooter onNavigate={onNavigate} />
        {AUTH_MODE === "placeholder" && (
          <div className="p-4 pt-2">
            <Link
              href="/demo"
              className="flex items-center gap-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground px-2 py-2 transition-colors rounded-md hover:bg-sidebar-accent"
              data-testid="link-back-demo"
              onClick={onNavigate}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Demo Hub
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function PortalLayout({ children, items, portalName }: PortalLayoutProps) {
  const [location] = useLocation();
  const [fallbackActive, setFallbackActive] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem =
    items.find((item) =>
      item.href?.startsWith("/") ? isRouteActive(item.href, location) : false
    ) ?? items[fallbackActive];

  const logoSlot = (small?: boolean) => (
    <div
      className={cn(
        "rounded-lg bg-primary/10 flex items-center justify-center text-primary",
        small ? "w-7 h-7" : "w-8 h-8"
      )}
    >
      <Hexagon className={cn("fill-primary/20", small ? "w-4 h-4" : "w-5 h-5")} />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden">

      {/* ── Desktop Sidebar (md+) ─────────────────────────────── */}
      <aside className="hidden md:flex w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex-col shrink-0 sticky top-0 h-screen">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 group transition-opacity hover:opacity-80"
            data-testid="link-home"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
              <Hexagon className="w-5 h-5 fill-primary/20" />
            </div>
            <span className="font-bold tracking-tight text-lg">Veroxa</span>
          </Link>
        </div>
        <SidebarNav
          items={items}
          location={location}
          fallbackActive={fallbackActive}
          setFallbackActive={setFallbackActive}
          portalName={portalName}
        />
      </aside>

      {/* ── Mobile Top Header (< md) ──────────────────────────── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 shrink-0">
        <Link href="/" className="flex items-center gap-2" data-testid="link-home">
          {logoSlot(true)}
          <span className="font-bold tracking-tight">Veroxa</span>
        </Link>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              className="p-2 rounded-md text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-64 p-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col [&>button]:hidden"
          >
            <div className="h-14 flex items-center px-6 border-b border-sidebar-border shrink-0">
              <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                {logoSlot(true)}
                <span className="font-bold tracking-tight">Veroxa</span>
              </Link>
            </div>
            <SidebarNav
              items={items}
              location={location}
              fallbackActive={fallbackActive}
              setFallbackActive={setFallbackActive}
              portalName={portalName}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* ── Main Content ──────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 bg-background/50 pt-14 md:pt-0">

        {/* Desktop breadcrumb */}
        <header className="hidden md:flex h-16 items-center px-8 border-b border-border/40 backdrop-blur-md sticky top-0 z-10">
          <h1
            className="text-sm font-medium text-muted-foreground"
            data-testid="header-breadcrumb"
          >
            {portalName} / {activeItem?.label ?? "Dashboard"}
          </h1>
        </header>

        {/* Mobile breadcrumb */}
        <div className="md:hidden px-4 pt-3 pb-1">
          <p className="text-xs text-muted-foreground" data-testid="header-breadcrumb">
            {portalName} / {activeItem?.label ?? "Dashboard"}
          </p>
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {AUTH_MODE === "placeholder" && (
              <div
                className="px-3 py-2 rounded-md bg-amber-500/8 border border-amber-500/20 text-amber-400 text-xs font-medium flex items-center gap-2"
                data-testid="banner-preview"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                Development Preview — sample data only, not a live client account.
              </div>
            )}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
