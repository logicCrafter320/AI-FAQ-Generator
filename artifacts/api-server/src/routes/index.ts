import { Router, type IRouter } from "express";
import healthRouter from "./health";
import faqRouter from "./faq";

const router: IRouter = Router();

router.use(healthRouter);
router.use(faqRouter);

export default router;
