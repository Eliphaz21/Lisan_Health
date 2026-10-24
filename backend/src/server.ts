import { app } from "./app";
import { config, validateProductionConfig } from "./config";
import fs from "fs/promises";
import path from "path";

async function purgeExpiredAudio(): Promise<void> {
  const directory = config.audioDir;
  const cutoff = Date.now() - config.retentionHours * 60 * 60 * 1000;
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    await Promise.all(entries.filter((entry) => entry.isFile()).map(async (entry) => {
      const filePath = path.join(directory, entry.name);
      const stat = await fs.stat(filePath);
      if (stat.mtimeMs < cutoff) await fs.unlink(filePath);
    }));
  } catch (err: any) {
    if (err?.code !== "ENOENT") console.warn("[Retention] Audio cleanup failed:", err?.message);
  }
}
import { initDb } from "./db";

async function bootstrap() {
  validateProductionConfig();
  await purgeExpiredAudio();
  console.log(`[LisanHealth Backend] Starting enterprise Express service in ${config.env} mode...`);

  // Connect & initialize database
  await initDb();

  // Hydrate dynamic AI configurations from database if stored
  try {
    const { db } = await import("./db");
    const dbUrl = await db.getSystemConfig("ADDIS_AI_BASE_URL");
    if (dbUrl && dbUrl.trim()) {
      config.addisAi.baseUrl = dbUrl.trim();
    }
    const dbGeminiModel = await db.getSystemConfig("GEMINI_MODEL");
    if (dbGeminiModel && dbGeminiModel.trim()) {
      config.geminiAi.model = dbGeminiModel.trim();
      process.env.GEMINI_MODEL = dbGeminiModel.trim();
    }
  } catch (err) {
    console.warn("[Config Sync Warning] Could not hydrate dynamic system configs:", err);
  }

  app.listen(config.port, () => {
    console.log(`[LisanHealth Backend] Server listening on http://localhost:${config.port}`);
    console.log(`[LisanHealth Backend] Admin email: ${config.adminEmail}`);
    console.log(`[LisanHealth Backend] Addis AI Key: ${config.addisAi.apiKey ? "Configured (Active)" : "Not Configured"}`);
    console.log(`[LisanHealth Backend] Gemini AI Key: ${config.geminiAi.apiKey ? "Configured (Active)" : "Not Configured"}`);
    console.log(`[LisanHealth Backend] Gemini Model: ${config.geminiAi.model}`);
  });
}

bootstrap().catch((err) => {
  console.error("[Bootstrap Failure]", err);
  process.exit(1);
});
