import { Router, type IRouter } from "express";
import healthRouter from "./health";
import notesRouter from "./notes";
import payrollRouter from "./payroll";
import sheetsRouter from "./sheets";
import summariesRouter from "./summaries";

const router: IRouter = Router();

router.use(healthRouter);
router.use(notesRouter);
router.use(payrollRouter);
router.use(sheetsRouter);
router.use(summariesRouter);

export default router;
