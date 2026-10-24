export type ObservationFlag =
  | 'NORMAL'
  | 'LOW'
  | 'HIGH'
  | 'CRITICAL_LOW'
  | 'CRITICAL_HIGH'
  | 'UNCERTAIN';

export type ExtractionStatus =
  | 'PENDING'
  | 'EXTRACTED'
  | 'NEEDS_REVIEW'
  | 'FAILED';

export interface ReferenceInterval {
  low?: number | null;
  high?: number | null;
  unit?: string | null;
  text_representation?: string | null;
}

export interface LabObservation {
  test_name: string;
  code?: string | null;
  value?: number | null;
  value_text?: string | null;
  unit?: string | null;
  reference_interval?: ReferenceInterval | null;
  flag: ObservationFlag;
  needs_review: boolean;
  review_reason?: string | null;
}

export interface ExtractedLabReport {
  report_id: string;
  panel_name: string;
  patient_age?: number | null;
  patient_gender?: string | null;
  collected_date?: string | null;
  raw_text: string;
  observations: LabObservation[];
  status: ExtractionStatus;
  confidence_score: number;
  warnings: string[];
}

export type SupportedLanguage = 'en' | 'am' | 'om' | 'ti';

export interface HealthStatus {
  status: string;
  version: string;
  environment: string;
  timestamp: string;
}
