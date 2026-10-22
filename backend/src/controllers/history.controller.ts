import { Response } from "express";
import { db } from "../db";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export const historyController = {
  async saveReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ detail: "Authentication required to persist clinical reports." });
      return;
    }

    const {
      original_file_name,
      report_text,
      extracted_json,
      explanation_json,
      localized_amharic,
      localized_oromo,
      audio_amharic_url,
      audio_oromo_url,
    } = req.body;

    if (!extracted_json || !explanation_json) {
      res.status(400).json({ detail: "Both extracted_json and explanation_json are required." });
      return;
    }

    const saved = await db.saveReport({
      userId: req.user.id,
      originalFileName: original_file_name,
      reportText: report_text,
      extractedJson: extracted_json,
      explanationJson: explanation_json,
      localizedAmharic: localized_amharic,
      localizedOromo: localized_oromo,
      audioAmharicUrl: audio_amharic_url,
      audioOromoUrl: audio_oromo_url,
    });

    res.status(201).json({ message: "Report saved successfully to clinical history.", report: saved });
  },

  async listReports(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ detail: "Authentication required." });
      return;
    }

    const reports = await db.listReportsByUserId(req.user.id);
    res.json(reports);
  },

  async deleteReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ detail: "Authentication required." });
      return;
    }

    const id = String(req.params.id);
    const deleted = await db.deleteReport(id, req.user.id);
    if (!deleted) {
      res.status(404).json({ detail: "Report not found or unauthorized to delete." });
      return;
    }

    res.json({ message: "Report deleted successfully from history." });
  },
};
