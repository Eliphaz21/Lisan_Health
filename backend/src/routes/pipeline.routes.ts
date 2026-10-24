import { Router } from "express";
import multer from "multer";
import { pipelineController } from "../controllers/pipeline.controller";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  storage: multer.memoryStorage(),
});

const processingLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
router.post("/process", requireAuth, processingLimiter, pipelineController.processPipeline);
router.post("/upload", requireAuth, processingLimiter, upload.single("file"), pipelineController.uploadFile);

export default router;
