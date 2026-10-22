export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "USER" | "ADMIN";
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AdminStats {
  totalUsers: number;
  totalReports: number;
  activeAdmin: string;
  dbStatus: string;
  uptime_seconds: number;
  ai_providers: {
    provider_a: string;
    provider_b: string;
    tts_active: boolean;
  };
}

export interface SavedReportItem {
  id: string;
  user_id: string;
  original_file_name?: string;
  report_text?: string;
  extracted_json: any;
  explanation_json: any;
  localized_amharic?: any;
  localized_oromo?: any;
  audio_amharic_url?: string;
  audio_oromo_url?: string;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  actor_email: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface AiConfigData {
  active_provider: "addis_ai" | "gemini_ai" | "hybrid" | "mock";
  addis_ai: {
    base_url: string;
    api_key_configured: boolean;
    api_key_masked: string;
    model: string;
    tts_enabled: boolean;
    voice_amharic: string;
    voice_oromo: string;
  };
  gemini_ai: {
    api_key_configured: boolean;
    api_key_masked: string;
    model: string;
  };
}

