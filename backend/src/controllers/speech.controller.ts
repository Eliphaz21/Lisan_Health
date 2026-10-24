import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { config } from "../config";
import { addisAiService } from "../services/addisAi.service";

export const speechController = {
  async synthesize(req: Request, res: Response): Promise<void> {
    const { text, language = "am" } = req.body;
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      res.status(400).json({ detail: "Text is required for audio synthesis." });
      return;
    }

    const lang = ["en", "am", "om", "ti"].includes(language) ? language : "am";
    try {
      const { audioId } = await addisAiService.synthesizeSpeech(text, lang);
      res.json({
        audio_id: audioId,
        audio_url: `/api/v1/speech/stream/${audioId}`,
        language: lang,
      });
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to synthesize speech." });
    }
  },

  async streamAudio(req: Request, res: Response): Promise<void> {
    const sanitizedId = String(req.params.audioId).replace(/[^a-zA-Z0-9_-]/g, "");
    const audioPath = path.join(config.audioDir, `${sanitizedId}.mp3`);

    if (!fs.existsSync(audioPath)) {
      res.status(404).json({ detail: "Audio file not found or expired." });
      return;
    }

    res.setHeader("Content-Type", "audio/mpeg");
    const stream = fs.createReadStream(audioPath);
    stream.pipe(res);
  },
};
