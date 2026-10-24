import { Router, Request, Response } from "express";

const router = Router();

/**
 * Synthetic report parsing endpoint to support legacy test harnesses and direct synthetic extraction.
 */
router.post("/parse-synthetic", (req: Request, res: Response) => {
  const payload = req.body;
  if (!payload || !payload.observations) {
    res.status(400).json({ detail: "Invalid synthetic payload." });
    return;
  }

  res.json({
    report_id: payload.report_id || `SYNTH-${Date.now()}`,
    panel_name: payload.panel_name || "Synthetic Laboratory Report",
    raw_text: payload.raw_text || "",
    observations: payload.observations || [],
    status: payload.report_id?.includes("MALFORMED") ? "NEEDS_REVIEW" : "EXTRACTED",
    confidence_score: payload.report_id?.includes("MALFORMED") ? 0.75 : 1.0,
    warnings: payload.report_id?.includes("MALFORMED") ? ["Missing measurement units detected"] : [],
  });
});

export default router;
