import { Response } from "express";
import { db } from "../db";
import { config } from "../config";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { UpdateRoleSchema, UpdateStatusSchema } from "../schemas/auth.schema";

export const adminController = {
  async listUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    const users = await db.listAllUsers();
    res.json(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        is_active: u.is_active,
        created_at: u.created_at,
        updated_at: u.updated_at,
      }))
    );
  },

  async updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = String(req.params.id);
    const parse = UpdateRoleSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ detail: parse.error.issues[0].message });
      return;
    }

    const user = await db.findUserById(id);
    if (!user) {
      res.status(404).json({ detail: "User not found." });
      return;
    }

    // Protect primary admin from demotion
    if (user.email === config.adminEmail && parse.data.role !== "ADMIN") {
      res.status(400).json({ detail: "Primary system administrator cannot be demoted." });
      return;
    }

    await db.updateUserRole(id, parse.data.role);
    res.json({ message: "User role updated successfully.", role: parse.data.role });
  },

  async updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = String(req.params.id);
    const parse = UpdateStatusSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ detail: parse.error.issues[0].message });
      return;
    }

    const user = await db.findUserById(id);
    if (!user) {
      res.status(404).json({ detail: "User not found." });
      return;
    }

    if (user.email === config.adminEmail && !parse.data.is_active) {
      res.status(400).json({ detail: "Primary system administrator cannot be deactivated." });
      return;
    }

    await db.updateUserStatus(id, parse.data.is_active);
    res.json({ message: "User status updated successfully.", is_active: parse.data.is_active });
  },

  async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = String(req.params.id);
    const user = await db.findUserById(id);
    if (!user) {
      res.status(404).json({ detail: "User not found." });
      return;
    }

    if (user.email === config.adminEmail) {
      res.status(400).json({ detail: "Primary system administrator cannot be deleted." });
      return;
    }

    await db.deleteUser(id);
    res.json({ message: "User deleted successfully." });
  },

  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    const stats = await db.countStats();
    res.json({
      ...stats,
      uptime_seconds: process.uptime(),
      memory_usage: process.memoryUsage(),
      ai_providers: {
        provider_a: "Clinical Reasoning Engine (English)",
        provider_b: config.addisAi.apiKey ? "Addis AI Live Integration (Amharic & Afaan Oromoo)" : "Addis AI High-Fidelity Localizer",
        tts_active: config.addisAi.ttsEnabled,
      },
    });
  },

  async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.json({
      environment: config.env,
      admin_email: config.adminEmail,
      addis_ai_base_url: config.addisAi.baseUrl,
      addis_ai_key_configured: Boolean(config.addisAi.apiKey),
      addis_ai_model: config.addisAi.textModel,
      tts_enabled: config.addisAi.ttsEnabled,
      default_voice_amharic: config.addisAi.voiceAm,
      default_voice_oromo: config.addisAi.voiceOm,
      database_type: db.isPostgres() ? "PostgreSQL 17" : "Local Resilient Storage",
    });
  },
};
