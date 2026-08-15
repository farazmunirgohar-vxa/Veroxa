/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES?: {
    info(stream: ReadableStream): Promise<{
      width: number;
      height: number;
      format: string;
      fileSize: number;
    }>;
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Some hosted runtimes do not offer the optional Cloudflare Images
    // capability. Private media verification uses its separately configured
    // Storage transformation adapter; keep this legacy binding isolated to
    // the public image optimizer and do not leave a previous request's value
    // on the isolate.
    (globalThis as typeof globalThis & {
      __VEROXA_IMAGES__?: Env["IMAGES"];
    }).__VEROXA_IMAGES__ = env.IMAGES;
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const images = env.IMAGES;
      if (!images) {
        return Response.json({ error: "image_optimizer_unavailable" }, {
          status: 503,
          headers: {
            "cache-control": "no-store, max-age=0",
            "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
            "x-content-type-options": "nosniff",
          },
        });
      }
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await images.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
