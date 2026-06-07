import express, { type Express } from "express";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { veroxaCors } from "./middlewares/corsPolicy";

const app: Express = express();

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
