import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env in project root
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

function resolveDatabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return "postgresql://admin_lisan_health:postgres@196.190.212.135:54382/lisan_health?sslmode=prefer";
  let url = rawUrl.trim();
  // Automatically route internal AletCloud cluster host to external public IP when running outside K8s
  if (url.includes("lisan-health-rw.db-947.svc.cluster.local") && !process.env.KUBERNETES_SERVICE_HOST) {
    url = url.replace("lisan-health-rw.db-947.svc.cluster.local:5432", "196.190.212.135:54382")
             .replace("lisan-health-rw.db-947.svc.cluster.local", "196.190.212.135:54382");
  }
  return url;
}

export const config = {
  env: process.env.NODE_ENV || process.env.ENVIRONMENT || "development",
  port: parseInt(process.env.APP_PORT || process.env.PORT || "8000", 10),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  // Security
  jwtSecret: process.env.SECRET_KEY || "d3eccfbc4acb10b77bb53cee4ef6c57f6363f8969ebbd8dbe1749901ed40bfec",
  jwtExpiresIn: process.env.ACCESS_TOKEN_EXPIRE_MINUTES ? `${process.env.ACCESS_TOKEN_EXPIRE_MINUTES}m` : "7d",
  adminEmail: (process.env.ADMIN_EMAIL || "eliphazyab@gmail.com").toLowerCase().trim(),

  // Database
  databaseUrl: resolveDatabaseUrl(process.env.DATABASE_URL),

  // Addis AI Provider
  addisAi: {
    baseUrl: process.env.ADDIS_AI_BASE_URL || "https://api.addisassistant.com/v1",
    apiKey: process.env.ADDIS_AI_API_KEY || "",
    textModel: process.env.ADDIS_AI_TEXT_MODEL || "addis-አሌፍ-፩",
    timeoutMs: parseInt(process.env.ADDIS_AI_TIMEOUT_SECONDS || "30", 10) * 1000,
    ttsEnabled: process.env.ADDIS_AI_TTS_ENABLED !== "false",
    voiceAm: process.env.ADDIS_AI_TTS_DEFAULT_VOICE_AM || "hanna",
    voiceOm: process.env.ADDIS_AI_TTS_DEFAULT_VOICE_OM || "chala",
  },

  // Google Gemini AI Provider (Vision OCR & Clinical Reasoning)
  geminiAi: {
    apiKey: process.env.GEMINI_API_KEY || process.env.REASONING_API_KEY || "",
    model: process.env.GEMINI_MODEL || process.env.REASONING_MODEL || "gemini-2.5-flash",
    timeoutMs: 45000,
  },

  // Storage
  uploadDir: path.resolve(__dirname, "../../../storage/uploads"),
  audioDir: path.resolve(__dirname, "../../../storage/audio"),
};
