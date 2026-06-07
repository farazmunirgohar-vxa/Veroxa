import { Router, type IRouter } from "express";
import healthRouter from "./health";
import auditAiRouter from "./auditAi";
import auditLiveRouter from "./auditLive";
import aiDraftsRouter from "./aiDrafts";
import pilotAccessRouter from "./pilotAccess";
import {
  protectedApiRateLimit,
  requireAiRoutesEnabled,
  requireGoogleRoutesEnabled,
  requireProtectedApiAccess,
} from "../middlewares/apiSecurity";

const router: IRouter = Router();

router.use(healthRouter);
router.use(pilotAccessRouter);

router.use(protectedApiRateLimit);
router.use(requireProtectedApiAccess);
router.use(requireAiRoutesEnabled, auditAiRouter);
router.use(requireGoogleRoutesEnabled, auditLiveRouter);
router.use(requireAiRoutesEnabled, aiDraftsRouter);

export default router;
