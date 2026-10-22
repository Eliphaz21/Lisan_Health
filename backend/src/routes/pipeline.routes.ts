import { Router } from "express";
import { pipelineController } from "../controllers/pipeline.controller";

const router = Router();

router.post("/process", pipelineController.processPipeline);

export default router;
