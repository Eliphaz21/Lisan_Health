import { Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { config } from "../config";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { UpdateRoleSchema, UpdateStatusSchema } from "../schemas/auth.schema";
import { CreateUserByAdminSchema, UpdateAiConfigSchema } from "../schemas/admin.schema";

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

  async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const parse = CreateUserByAdminSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ detail: parse.error.issues[0].message });
      return;
    }

    const { email, full_name, password, role } = parse.data;
    const cleanEmail = email.toLowerCase().trim();

    const existing = await db.findUserByEmail(cleanEmail);
    if (existing) {
      res.status(409).json({ detail: "A user with this email address already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await db.createUser({
      email: cleanEmail,
      fullName: full_name,
      passwordHash,
      role: role || "USER",
    });

    await db.logAudit(
      "USER_PROVISIONED",
      req.user?.email || "admin",
      `Provisioned user account for ${cleanEmail} with role ${role || "USER"}`,
      req.ip
    );

    res.status(201).json({
      message: "User created successfully.",
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
      },
    });
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
    await db.logAudit(
      "ROLE_UPDATED",
      req.user?.email || "admin",
      `Changed role of ${user.email} from ${user.role} to ${parse.data.role}`,
      req.ip
    );

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
    await db.logAudit(
      "STATUS_UPDATED",
      req.user?.email || "admin",
      `Changed account status of ${user.email} to ${parse.data.is_active ? "ACTIVE" : "DEACTIVATED"}`,
      req.ip
    );

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
    await db.logAudit(
      "USER_DELETED",
      req.user?.email || "admin",
      `Deleted user account ${user.email} (ID: ${id})`,
      req.ip
    );

    res.json({ message: "User deleted successfully." });
  },

  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    const stats = await db.countStats();
    const configs = await db.getAllSystemConfigs();

    res.json({
      ...stats,
      uptime_seconds: process.uptime(),
      memory_usage: process.memoryUsage(),
      active_provider: configs["ACTIVE_AI_PROVIDER"] || "addis_ai",
      ai_providers: {
        provider_a: "Clinical Reasoning Engine (English)",
        provider_b: config.addisAi.apiKey ? "Addis AI Live Integration (Amharic & Afaan Oromoo)" : "Addis AI High-Fidelity Localizer",
        gemini_active: Boolean(configs["GEMINI_AI_KEY"] || process.env.GEMINI_API_KEY),
        tts_active: config.addisAi.ttsEnabled,
      },
    });
  },

  async listAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    const limit = Math.min(parseInt(String(req.query.limit || 50), 10), 100);
    const logs = await db.listAuditLogs(limit);
    res.json(logs);
  },

  async getAiConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    const configs = await db.getAllSystemConfigs();

    const addisKey = configs["ADDIS_AI_KEY"] || config.addisAi.apiKey || "";
    const geminiKey = configs["GEMINI_AI_KEY"] || process.env.GEMINI_API_KEY || "";

    res.json({
      active_provider: configs["ACTIVE_AI_PROVIDER"] || "addis_ai",
      addis_ai: {
        base_url: configs["ADDIS_AI_BASE_URL"] || config.addisAi.baseUrl,
        api_key_configured: Boolean(addisKey),
        api_key_masked: addisKey ? `${addisKey.substring(0, 10)}...${addisKey.substring(addisKey.length - 4)}` : "",
        model: configs["ADDIS_AI_MODEL"] || config.addisAi.textModel,
        tts_enabled: configs["ADDIS_AI_TTS_ENABLED"] ? configs["ADDIS_AI_TTS_ENABLED"] === "true" : config.addisAi.ttsEnabled,
        voice_amharic: configs["ADDIS_AI_VOICE_AM"] || config.addisAi.voiceAm,
        voice_oromo: configs["ADDIS_AI_VOICE_OM"] || config.addisAi.voiceOm,
      },
      gemini_ai: {
        api_key_configured: Boolean(geminiKey),
        api_key_masked: geminiKey ? `${geminiKey.substring(0, 8)}...${geminiKey.substring(geminiKey.length - 4)}` : "",
        model: configs["GEMINI_MODEL"] || "gemini-2.5-flash",
      },
    });
  },

  async updateAiConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    const parse = UpdateAiConfigSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ detail: parse.error.issues[0].message });
      return;
    }

    const {
      active_provider,
      addis_ai_key,
      addis_ai_base_url,
      gemini_ai_key,
      gemini_model,
      tts_enabled,
      voice_amharic,
      voice_oromo,
    } = parse.data;

    if (active_provider) {
      await db.setSystemConfig("ACTIVE_AI_PROVIDER", active_provider);
    }
    if (addis_ai_key && addis_ai_key.trim()) {
      await db.setSystemConfig("ADDIS_AI_KEY", addis_ai_key.trim());
      config.addisAi.apiKey = addis_ai_key.trim();
    }
    if (addis_ai_base_url && addis_ai_base_url.trim()) {
      await db.setSystemConfig("ADDIS_AI_BASE_URL", addis_ai_base_url.trim());
      config.addisAi.baseUrl = addis_ai_base_url.trim();
    }
    if (gemini_ai_key && gemini_ai_key.trim()) {
      await db.setSystemConfig("GEMINI_AI_KEY", gemini_ai_key.trim());
      process.env.GEMINI_API_KEY = gemini_ai_key.trim();
    }
    if (gemini_model) {
      await db.setSystemConfig("GEMINI_MODEL", gemini_model);
    }
    if (tts_enabled !== undefined) {
      await db.setSystemConfig("ADDIS_AI_TTS_ENABLED", String(tts_enabled));
      config.addisAi.ttsEnabled = tts_enabled;
    }
    if (voice_amharic) {
      await db.setSystemConfig("ADDIS_AI_VOICE_AM", voice_amharic);
    }
    if (voice_oromo) {
      await db.setSystemConfig("ADDIS_AI_VOICE_OM", voice_oromo);
    }

    await db.logAudit(
      "AI_CONFIG_UPDATED",
      req.user?.email || "admin",
      `Updated AI configuration: Provider=${active_provider || "unchanged"}, AddisKey=${addis_ai_key ? "Updated" : "Kept"}, GeminiKey=${gemini_ai_key ? "Updated" : "Kept"}`,
      req.ip
    );

    res.json({
      message: "AI configuration and API credentials updated successfully.",
      active_provider: active_provider || (await db.getSystemConfig("ACTIVE_AI_PROVIDER")) || "addis_ai",
    });
  },
};
