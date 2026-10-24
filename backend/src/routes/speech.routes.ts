import { Router } from "express";
import { speechController } from "../controllers/speech.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/synthesize", requireAuth, speechController.synthesize);
router.get("/stream/:audioId", requireAuth, speechController.streamAudio);

export default router;
