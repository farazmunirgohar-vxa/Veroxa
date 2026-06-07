import express, { type Express } from "express";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { veroxaCors } from "./middlewares/corsPolicy";

const TRUST_PROXY_ENV = "VEROXA_TRUST_PROXY";
const DISABLED_TRUST_PROXY_VALUES = new Set(["", "0", "false", "no", "off"]);
const UNSAFE_TRUST_PROXY_VALUES = new Set(["1", "true"]);

function getTrustProxySetting(): false | string | string[] {
  const raw = process.env[TRUST_PROXY_ENV]?.trim();
  if (!raw || DISABLED_TRUST_PROXY_VALUES.has(raw.toLowerCase())) return false;

  const values = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (values.length === 0) return false;

  for (const value of values) {
    if (UNSAFE_TRUST_PROXY_VALUES.has(value.toLowerCase())) {
      throw new Error(
        `${TRUST_PROXY_ENV} must not be set to broad ${JSON.stringify(value)}. ` +
          "Use false/0/unset, loopback, linklocal, uniquelocal, or explicit trusted proxy/subnet values.",
      );
    }
  }

  return values.length === 1 ? values[0] : values;
}

const app: Express = express();

// Default is no proxy trust, so req.ip comes from the socket peer. Forwarded
// headers are only considered by Express when VEROXA_TRUST_PROXY explicitly
// names trusted proxy hops/subnets; pilot login rate limits never parse raw
// X-Forwarded-For in route code.
app.set("trust proxy", getTrustProxySetting());

app.use(
  pinoHttp({
    logger,
    redact: [
      "req.headers.authorization",
      "req.headers.x-veroxa-api-key",
      "req.headers[\"x-veroxa-api-key\"]",
      "req.body.email",
      "req.body.password",
    ],
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(veroxaCors());
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use("/api", router);

export default app;
