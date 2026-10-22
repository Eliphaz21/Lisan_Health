import { Router } from "express";
import { speechController } from "../controllers/speech.controller";

const router = Router();

router.post("/synthesize", speechController.synthesize);
router.get("/stream/:audioId", speechController.streamAudio);

export default router;
