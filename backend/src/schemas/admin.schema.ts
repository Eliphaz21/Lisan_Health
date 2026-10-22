import { z } from "zod";

export const CreateUserByAdminSchema = z
  .object({
    full_name: z.string().trim().min(2, "Full name must be at least 2 characters").max(70),
    email: z.string().email("Invalid email address").max(100).trim().toLowerCase(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["USER", "ADMIN"]).default("USER"),
  })
  .strict();

export const UpdateAiConfigSchema = z
  .object({
    active_provider: z.enum(["addis_ai", "gemini_ai", "hybrid", "mock"]).optional(),
    addis_ai_key: z.string().optional(),
    addis_ai_base_url: z.string().url().optional(),
    gemini_ai_key: z.string().optional(),
    gemini_model: z.string().optional(),
    tts_enabled: z.boolean().optional(),
    voice_amharic: z.string().optional(),
    voice_oromo: z.string().optional(),
  })
  .strict();
