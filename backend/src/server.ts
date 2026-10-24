import { app } from "./app";
import { config, validateProductionConfig } from "./config";
import fs from "fs/promises";
import path from "path";

async function purgeExpiredAudio(): Promise<void> {
  const directory = config.audioDir;
  const cutoff = Date.now() - config.retentionHours * 60 * 60 * 1000;
  try {
    async function purgeDirectory(currentDirectory: string): Promise<void> {
      const entries = await fs.readdir(currentDirectory, { withFileTypes: true });
      await Promise.all(entries.map(async (entry) => {
        const filePath = path.join(currentDirectory, entry.name);
        if (entry.isDirectory()) {
          await purgeDirectory(filePath);
          if ((await fs.readdir(filePath)).length === 0) await fs.rmdir(filePath);
          return;
        }
        const stat = await fs.stat(filePath);
        if (stat.mtimeMs < cutoff || entry.name.endsWith(".part")) await fs.unlink(filePath);
      }));
    }
    await purgeDirectory(directory);
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
