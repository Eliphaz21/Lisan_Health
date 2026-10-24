import { Response } from "express";
import fs from "fs";
import path from "path";
import { config } from "../config";
import { addisAiService } from "../services/addisAi.service";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export const speechController = {
  async synthesize(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { text, language = "am" } = req.body;
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      res.status(400).json({ detail: "Text is required for audio synthesis." });
      return;
    }
    if (text.length > 12000) {
      res.status(413).json({ detail: "Speech text exceeds the 12,000-character limit." });
      return;
    }

    const lang = ["en", "am", "om", "ti"].includes(language) ? language : "am";
    if (lang === "en" && config.addisAi.voiceEn === "default") {
      res.status(422).json({ detail: "English speech is not configured. Addis Voices is currently configured for Amharic, Afaan Oromoo, and Tigrinya." });
      return;
    }
    try {
      if (!req.user) {
        res.status(401).json({ detail: "Authentication required." });
        return;
      }
      const { audioId } = await addisAiService.synthesizeSpeech(text.trim(), lang, req.user.id);
      res.json({
        audio_id: audioId,
        audio_url: `/api/v1/speech/stream/${audioId}`,
        language: lang,
      });
    } catch (err: any) {
      res.status(err?.status || 500).json({ detail: err.message || "Failed to synthesize speech." });
    }
  },

  async streamAudio(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ detail: "Authentication required." });
      return;
    }
    const sanitizedId = String(req.params.audioId).replace(/[^a-zA-Z0-9_-]/g, "");
    const audioPath = path.join(config.audioDir, req.user.id, `${sanitizedId}.mp3`);

    if (!fs.existsSync(audioPath)) {
      res.status(404).json({ detail: "Audio file not found or expired." });
      return;
    }

    res.setHeader("Content-Type", "audio/mpeg");
    const stream = fs.createReadStream(audioPath);
    stream.pipe(res);
  },
};
