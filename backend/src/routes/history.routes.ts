import { Router } from "express";
import { historyController } from "../controllers/history.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

router.post("/save", historyController.saveReport);
router.get("/", historyController.listReports);
router.delete("/:id", historyController.deleteReport);

export default router;
