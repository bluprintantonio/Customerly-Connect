import { Router, type IRouter } from "express";
import healthRouter from "./health";
import conversationsRouter from "./conversations";
import widgetsRouter from "./widgets";
import widgetPublicRouter from "./widget-public";
import widgetScriptRouter from "./widget-script";

const router: IRouter = Router();

router.use(healthRouter);
router.use(conversationsRouter);
router.use(widgetsRouter);
router.use(widgetPublicRouter);
router.use(widgetScriptRouter);

export default router;
