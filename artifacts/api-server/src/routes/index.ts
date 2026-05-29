import { Router, type IRouter } from "express";
import healthRouter from "./health";
import auditAiRouter from "./auditAi";
import auditLiveRouter from "./auditLive";
import aiDraftsRouter from "./aiDrafts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(auditAiRouter);
router.use(auditLiveRouter);
router.use(aiDraftsRouter);

export default router;
