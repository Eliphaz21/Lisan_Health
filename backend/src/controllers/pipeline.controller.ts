import { Request, Response } from "express";
import { config } from "../config";
import { extractReportFromText, extractReportFromFileBuffer } from "../services/extraction.service";
import { explainReportInEnglish } from "../services/clinicalReasoning.service";
import { addisAiService } from "../services/addisAi.service";
import { ExtractedReport } from "../types";
import { verifyReasoningPreservation } from "../services/validator.service";

function validateUploadedFile(file: Express.Multer.File): void {
  const name = file.originalname.toLowerCase();
  const extension = name.slice(name.lastIndexOf("."));
  if (![".pdf", ".png", ".jpg", ".jpeg", ".txt"].includes(extension)) {
    throw Object.assign(new Error("Unsupported report file type."), { status: 415 });
  }
  if (file.size > config.uploadMaxBytes) {
    throw Object.assign(new Error("Report file exceeds the maximum allowed size."), { status: 413 });
  }
  const header = file.buffer.subarray(0, 12);
  const isPdf = header.subarray(0, 5).toString("ascii") === "%PDF-";
  const isPng = header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpeg = header.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  const isText = extension === ".txt" && !header.includes(0);
  const valid = (extension === ".pdf" && isPdf) || (extension === ".png" && isPng) || ([".jpg", ".jpeg"].includes(extension) && isJpeg) || (extension === ".txt" && isText);
  if (!valid) throw Object.assign(new Error("Uploaded file content does not match its declared type."), { status: 415 });
}

export const pipelineController = {
  async processPipeline(req: Request, res: Response): Promise<void> {
    try {
      const { text, target_language = "am", structured_report } = req.body;
      const lang = ["en", "am", "om", "ti"].includes(target_language) ? target_language : "am";

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
      verifyReasoningPreservation(extracted, englishExplanation);

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
      console.error("[Pipeline Error]", err?.message);
      res.status(err?.status || 500).json({ detail: err?.status ? err.message : "Report processing failed." });
    }
  },

  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ detail: "Please provide a medical report file (PDF, PNG, JPG, or TXT)." });
        return;
      }
      validateUploadedFile(file);

      const lang = ["en", "am", "om", "ti"].includes(req.body.target_language) ? req.body.target_language : "am";
      const extracted = await extractReportFromFileBuffer(file.buffer, file.originalname, file.mimetype);

      if (extracted.analytes.length === 0) {
        const isImage = file.mimetype.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(file.originalname);
        const hasGemini = Boolean(config.geminiAi?.apiKey || process.env.GEMINI_API_KEY || process.env.REASONING_API_KEY);

        if (isImage && !hasGemini) {
          res.status(400).json({
            detail: "Image OCR requires a Google Gemini API Key. Please add your Gemini API Key in the Admin AI Hub (/admin), or upload a digital PDF/TXT lab report.",
          });
          return;
        }

        res.status(422).json({
          detail: `Could not identify any clinical laboratory values in "${file.originalname}". Please ensure the report contains clear test names and numerical values.`,
        });
        return;
      }

      // Stage A: Provider A Clinical Reasoning (English)
      const englishExplanation = explainReportInEnglish(extracted);
      verifyReasoningPreservation(extracted, englishExplanation);

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
        file_name: file.originalname,
      });
    } catch (err: any) {
      console.error("[Upload Error]", err?.message);
      res.status(err?.status || 500).json({ detail: err?.status ? err.message : "Uploaded report processing failed." });
    }
  },
};
