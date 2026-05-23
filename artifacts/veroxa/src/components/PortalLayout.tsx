import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  label: string;
  icon: React.ElementType;
  href?: string;
}

interface PortalLayoutProps {
  children: React.ReactNode;
  items: SidebarItem[];
  portalName: string;
}

function isRouteActive(itemHref: string, location: string): boolean {
  if (location === itemHref) return true;
  // Treat the portal root (e.g. /demo/client) as active for its default tab
  const defaultSuffixes = ["/dashboard", "/overview", "/tasks"];
  for (const suffix of defaultSuffixes) {
    if (itemHref.endsWith(suffix)) {
      const root = itemHref.slice(0, itemHref.lastIndexOf(suffix));
      if (location === root || location === root + "/") return true;
    }
  }
  return false;
}

export function PortalLayout({ children, items, portalName }: PortalLayoutProps) {
  const [location] = useLocation();
  const [fallbackActive, setFallbackActive] = useState(0);

  const activeItem =
    items.find((item) =>
      item.href?.startsWith("/") ? isRouteActive(item.href, location) : false
    ) ?? items[fallbackActive];

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80" data-testid="link-home">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
              <Hexagon className="w-5 h-5 fill-primary/20" />
            </div>
            <span className="font-bold tracking-tight text-lg">Veroxa</span>
          </Link>
        </div>

        <div className="px-6 py-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4" data-testid="text-portal-name">
            {portalName}
          </div>
          <nav className="space-y-1">
            {items.map((item, i) => {
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
              const icon = (
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-sidebar-foreground/50")} />
              );
              const testId = `sidebar-item-${item.label.toLowerCase().replace(/\s+/g, "-")}`;

              if (item.href?.startsWith("/")) {
                return (
                  <Link key={i} href={item.href} className={sharedClass} data-testid={testId}>
                    {icon}
                    {item.label}
                  </Link>
                );
              }
              if (item.href?.startsWith("#")) {
                return (
                  <a key={i} href={item.href} onClick={() => setFallbackActive(i)} className={sharedClass} data-testid={testId}>
                    {icon}
                    {item.label}
                  </a>
                );
              }
              return (
                <button key={i} onClick={() => setFallbackActive(i)} className={sharedClass} data-testid={testId}>
                  {icon}
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-sidebar-border">
          <Link
            href="/demo"
            className="flex items-center gap-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground px-2 py-2 transition-colors rounded-md hover:bg-sidebar-accent"
            data-testid="link-back-demo"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Demo Hub
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background/50">
        <header className="h-16 flex items-center px-8 border-b border-border/40 backdrop-blur-md sticky top-0 z-10">
          <h1 className="text-sm font-medium text-muted-foreground" data-testid="header-breadcrumb">
            {portalName} / {activeItem?.label ?? "Dashboard"}
          </h1>
        </header>
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div
              className="px-3 py-2 rounded-md bg-amber-500/8 border border-amber-500/20 text-amber-400 text-xs font-medium flex items-center gap-2"
              data-testid="banner-preview"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              Development Preview — sample data only, not a live client account.
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
