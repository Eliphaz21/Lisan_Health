export type UserRole = "USER" | "ADMIN";

export interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserPublicProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AnalyteValue {
  name: string;
  value: number;
  unit: string;
  reference_range_low: number;
  reference_range_high: number;
  flag: "NORMAL" | "LOW" | "HIGH" | "CRITICAL";
  interpretation_hint?: string;
}

export interface ExtractedReport {
  patient_id?: string;
  report_date?: string;
  laboratory_name?: string;
  test_category: string;
  analytes: AnalyteValue[];
  raw_text?: string;
}

export interface AnalyteExplanation {
  name: string;
  value: number;
  unit: string;
  reference_range: string;
  status: "Normal" | "Low" | "High" | "Critical";
  plain_explanation: string;
  what_this_measures: string;
}

export interface ClinicalExplanation {
  test_category: string;
  summary: string;
  overall_status: "NORMAL" | "ATTENTION_NEEDED" | "CRITICAL";
  analytes: AnalyteExplanation[];
  suggested_questions_for_doctor: string[];
  disclaimer: string;
}

export interface LocalizedExplanation {
  language: "en" | "am" | "om";
  test_category: string;
  summary: string;
  overall_status: string;
  analytes: Array<AnalyteExplanation & { localized_explanation?: string }>;
  suggested_questions_for_doctor: string[];
  disclaimer: string;
}

export interface SavedReport {
  id: string;
  user_id: string;
  original_file_name?: string;
  report_text?: string;
  extracted_json: ExtractedReport;
  explanation_json: ClinicalExplanation;
  localized_amharic?: LocalizedExplanation;
  localized_oromo?: LocalizedExplanation;
  audio_amharic_url?: string;
  audio_oromo_url?: string;
  created_at: string;
}
