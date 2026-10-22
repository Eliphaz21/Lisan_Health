import { Request, Response } from "express";
import { extractReportFromText } from "../services/extraction.service";
import { explainReportInEnglish } from "../services/clinicalReasoning.service";
import { addisAiService } from "../services/addisAi.service";
import { ExtractedReport } from "../types";

export const pipelineController = {
  async processPipeline(req: Request, res: Response): Promise<void> {
    try {
      const { text, target_language = "am", structured_report } = req.body;
      const lang = target_language === "om" ? "om" : "am";

      let extracted: ExtractedReport;

      if (structured_report && structured_report.analytes && structured_report.analytes.length > 0) {
        extracted = structured_report as ExtractedReport;
      } else if (text && typeof text === "string" && text.trim().length > 0) {
        extracted = extractReportFromText(text);
      } else {
        res.status(400).json({ detail: "Please provide either raw medical report text or a structured report payload." });
        return;
      }

      // Stage A: Provider A Clinical Reasoning (English)
      const englishExplanation = explainReportInEnglish(extracted);

      // Stage B: Provider B Addis AI Localization (Amharic or Afaan Oromoo)
      const localizedExplanation = await addisAiService.localize(englishExplanation, lang);

      // Stage C: Speech Synthesis (TTS)
      const speechSummary = `${localizedExplanation.summary} ${localizedExplanation.analytes
        .map((a) => `${a.name}: ${a.value} ${a.unit}.`)
        .join(" ")}`;

      const { audioId } = await addisAiService.synthesizeSpeech(speechSummary, lang);
      const audioUrl = `/api/v1/speech/stream/${audioId}`;

      res.json({
        extracted,
        explanation_en: englishExplanation,
        explanation_localized: localizedExplanation,
        audio_url: audioUrl,
        language: lang,
      });
    } catch (err: any) {
      console.error("[Pipeline Error]", err);
      res.status(500).json({ detail: err.message || "An error occurred during medical report processing." });
    }
  },
};
