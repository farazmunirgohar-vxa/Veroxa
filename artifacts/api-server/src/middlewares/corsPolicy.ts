import cors, { type CorsOptions } from "cors";

const LOCAL_DEV_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/;

function configuredOrigins(): Set<string> {
  return new Set(
    (process.env["VEROXA_ALLOWED_ORIGINS"] ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

function isOriginAllowed(origin: string, allowlist: Set<string>): boolean {
  if (allowlist.has(origin)) return true;
  return process.env["NODE_ENV"] === "development" && LOCAL_DEV_ORIGIN_PATTERN.test(origin);
}

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    callback(null, isOriginAllowed(origin, configuredOrigins()));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-veroxa-api-key"],
  maxAge: 600,
};

export function veroxaCors() {
  return cors(corsOptions);
}
