import { Router } from "express";
import multer from "multer";
import { pipelineController } from "../controllers/pipeline.controller";

const router = Router();
const upload = multer({
  limits: { fileSize: 15 * 1024 * 1024 },
  storage: multer.memoryStorage(),
});

router.post("/process", pipelineController.processPipeline);
router.post("/upload", upload.single("file"), pipelineController.uploadFile);

export default router;
