import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env in project root
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

function resolveDatabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return "";
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
  jwtSecret: process.env.SECRET_KEY || "",
  jwtExpiresIn: process.env.ACCESS_TOKEN_EXPIRE_MINUTES ? `${process.env.ACCESS_TOKEN_EXPIRE_MINUTES}m` : "15m",
  adminEmail: (process.env.ADMIN_EMAIL || "").toLowerCase().trim(),
  trustProxy: process.env.TRUST_PROXY === "true",
  maxJsonBytes: process.env.MAX_JSON_BYTES || "1mb",
  uploadMaxBytes: Number(process.env.MAX_UPLOAD_SIZE_BYTES || 10 * 1024 * 1024),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 10),
  retentionHours: Number(process.env.RETENTION_HOURS || 24),

  // Database
  databaseUrl: resolveDatabaseUrl(process.env.DATABASE_URL),
  databaseSslRejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",

  // Addis AI Provider
  addisAi: {
    baseUrl: (process.env.ADDIS_AI_BASE_URL || "https://api.addisassistant.com").replace(/\/+$/, "").replace(/\/v1$/, ""),
    apiKey: process.env.ADDIS_AI_API_KEY || "",
    textModel: process.env.ADDIS_AI_TEXT_MODEL || "addis-አሌፍ-፩",
    timeoutMs: parseInt(process.env.ADDIS_AI_TIMEOUT_SECONDS || "30", 10) * 1000,
    ttsEnabled: process.env.ADDIS_AI_TTS_ENABLED !== "false",
    voiceAm: process.env.ADDIS_AI_TTS_DEFAULT_VOICE_AM || "am-hamen",
    voiceOm: process.env.ADDIS_AI_TTS_DEFAULT_VOICE_OM || "om-bikila",
    voiceTi: process.env.ADDIS_AI_TTS_DEFAULT_VOICE_TI || "ti-berhane",
    voiceEn: process.env.ADDIS_AI_TTS_DEFAULT_VOICE_EN || "default",
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

export function validateProductionConfig(): void {
  if (config.env === "production") {
    const missing: string[] = [];
    if (config.jwtSecret.length < 32) missing.push("SECRET_KEY (minimum 32 characters)");
    if (!config.databaseUrl) missing.push("DATABASE_URL");
    if (!config.adminEmail) missing.push("ADMIN_EMAIL");
    if (missing.length > 0) throw new Error(`Production configuration is incomplete: ${missing.join(", ")}`);
  }
}
