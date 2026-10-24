import { app } from "./app";
import { config } from "./config";
import { initDb } from "./db";

async function bootstrap() {
  console.log(`[LisanHealth Backend] Starting enterprise Express service in ${config.env} mode...`);

  // Connect & initialize database
  await initDb();

  // Hydrate dynamic AI configurations from database if stored
  try {
    const { db } = await import("./db");
    const dbKey = await db.getSystemConfig("ADDIS_AI_KEY");
    if (dbKey && dbKey.trim()) {
      config.addisAi.apiKey = dbKey.trim();
    }
    const dbUrl = await db.getSystemConfig("ADDIS_AI_BASE_URL");
    if (dbUrl && dbUrl.trim()) {
      config.addisAi.baseUrl = dbUrl.trim();
    }
    const dbGeminiKey = await db.getSystemConfig("GEMINI_AI_KEY");
    if (dbGeminiKey && dbGeminiKey.trim()) {
      config.geminiAi.apiKey = dbGeminiKey.trim();
      process.env.GEMINI_API_KEY = dbGeminiKey.trim();
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
