import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { AlertCircle, ArrowRight, KeyRound, Lock, Info, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  resolveUploadKey,
  getUploadKeyAccessMessage,
  type UploadKeyAccessResult,
} from "@/lib/uploadKeys/uploadKeyAccess";
import type { DemoRestaurantUploadKey } from "@/data/uploadKeys/demoRestaurantUploadKeys";
import { RestaurantUploadFlow } from "@/components/upload/RestaurantUploadFlow";

/**
 * /upload — restaurant upload entry (M012).
 *
 * App-style entry page. Approved restaurant employees enter their
 * Restaurant Upload Key (no account, no email/password) and unlock
 * the upload flow for that one restaurant.
 *
 * Demo only:
 *   - No Supabase, no network, no localStorage persistence.
 *   - Granting access switches into the local upload flow component.
 *   - Refreshing the page clears state by design.
 */
export default function RestaurantUploadAccess() {
  const [keyInput, setKeyInput] = useState("");
  const [result, setResult] = useState<UploadKeyAccessResult | null>(null);
  const [activeRestaurant, setActiveRestaurant] =
    useState<DemoRestaurantUploadKey | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setResult(resolveUploadKey(keyInput));
  }

  function continueToUpload() {
    if (result && result.kind === "granted") {
      setActiveRestaurant(result.restaurant);
    }
  }

  function exitUpload() {
    setActiveRestaurant(null);
    setResult(null);
    setKeyInput("");
  }

  if (activeRestaurant) {
    return <RestaurantUploadFlow restaurant={activeRestaurant} onExit={exitUpload} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-start sm:justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Brand row */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <span className="font-bold tracking-tight">Veroxa</span>
            <span className="text-xs">/ Restaurant Upload</span>
          </Link>

          {/* Header */}
          <div className="mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-border flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-1" data-testid="upload-access-heading">
              Veroxa Restaurant Upload
            </h1>
            <p className="text-sm text-muted-foreground">
              Demo-only upload-key preview. Veroxa will tell clients how to send media for review after setup. No live storage is connected.
            </p>
          </div>

          {/* Key form */}
          <form onSubmit={handleSubmit} className="space-y-3" data-testid="upload-key-form">
            <Input
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="DEMO-XXXX-2026"
              className="h-12 text-base tracking-wider"
              data-testid="input-upload-key"
              aria-label="Restaurant Upload Key"
            />
            <Button
              type="submit"
              className="w-full h-12 font-semibold"
              data-testid="btn-upload-key-continue"
            >
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Sample / QA preview only — not a real client account.
            </p>
          </form>

          {/* Result */}
          {result && result.kind === "granted" && (
            <Card
              className="mt-6 border-emerald-500/30 bg-emerald-500/5"
              data-testid="upload-access-granted"
            >
              <CardContent className="p-4">
                <p className="text-sm text-emerald-300/90 mb-1">
                  Access granted for content upload.
                </p>
                <p className="text-base font-semibold mb-3">{result.restaurant.restaurantName}</p>
                <Button
                  onClick={continueToUpload}
                  className="w-full"
                  data-testid="btn-upload-access-continue"
                >
                  Continue to Upload <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          )}

          {result && result.kind === "paused" && (
            <Card
              className="mt-6 border-amber-500/30 bg-amber-500/5"
              data-testid="upload-access-paused"
            >
              <CardContent className="p-4 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-200/90">{getUploadKeyAccessMessage(result)}</p>
              </CardContent>
            </Card>
          )}

          {result && result.kind === "invalid" && (
            <Card
              className="mt-6 border-rose-500/30 bg-rose-500/5"
              data-testid="upload-access-invalid"
            >
              <CardContent className="p-4 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-rose-200/90">{getUploadKeyAccessMessage(result)}</p>
              </CardContent>
            </Card>
          )}

          {result && result.kind === "empty" && (
            <p
              className="mt-4 text-xs text-muted-foreground text-center"
              data-testid="upload-access-empty"
            >
              {getUploadKeyAccessMessage(result)}
            </p>
          )}

          {/* Demo helper */}
          <details className="mt-8 group" data-testid="upload-demo-helper">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <Info className="w-3 h-3" /> Demo helper — show test keys
            </summary>
            <div className="mt-3 px-4 py-3 rounded-lg bg-muted/40 text-xs space-y-1.5">
              <p className="text-muted-foreground">
                These keys exist only in this demo. They unlock the upload flow for one
                fictional restaurant each — nothing else.
              </p>
              <ul className="font-mono text-foreground/90 space-y-0.5">
                <li>DEMO-GRILL-2026 — Demo Grill House</li>
                <li>DEMO-TACO-2026 — Demo Taco Bar</li>
                <li>DEMO-MED-2026 — Demo Mediterranean Grill</li>
                <li>DEMO-CAFE-2026 — Demo Cafe (paused)</li>
              </ul>
            </div>
          </details>

          {/* What happens after upload */}
          <div
            className="mt-8 rounded-lg border border-border bg-muted/20 p-4"
            data-testid="upload-access-what-happens"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
              What happens after upload
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              In this preview, uploads stay demo-only and no live storage is connected. After setup, Veroxa will tell clients how to send media for review. Nothing posts automatically — Veroxa team review happens before anything goes live.
            </p>
          </div>

          {/* Scope notice */}
          <div className="mt-8 flex items-start gap-2 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <p>
              Restaurant keys only unlock content upload for that one restaurant. They do not
              grant access to Team areas, pricing, account settings, or any other restaurant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
