import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import assetsRouter from "./assets.js";
import acknowledgementsRouter from "./acknowledgments.js";
import notificationsRouter from "./notifications.js";
import servicesRouter from "./services.js";
import licensesRouter from "./licenses.js";
import employeesRouter from "./employees.js";
import dashboardRouter from "./dashboard.js";
import importExportRouter from "./importexport.js";
import settingsRouter from "./settings.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(assetsRouter);
router.use(acknowledgementsRouter);
router.use(notificationsRouter);
router.use(servicesRouter);
router.use(licensesRouter);
router.use(employeesRouter);
router.use(dashboardRouter);
router.use(importExportRouter);
router.use(settingsRouter);

export default router;
