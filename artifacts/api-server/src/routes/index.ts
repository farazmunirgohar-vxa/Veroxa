import { Router, type IRouter } from "express";
import healthRouter from "./health";
import auditAiRouter from "./auditAi";

const router: IRouter = Router();

router.use(healthRouter);
router.use(auditAiRouter);

export default router;
