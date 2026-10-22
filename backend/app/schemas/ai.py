from typing import List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.report import ObservationFlag, ExtractedLabReport


class AnalyteExplanation(BaseModel):
    """Structured clinical explanation for a single laboratory observation."""
    test_name: str = Field(description="Name of the laboratory test")
    code: Optional[str] = Field(default=None, description="Standard acronym or code")
    observed_value: Optional[float] = Field(default=None, description="Exact numerical value extracted in Stage A")
    unit: Optional[str] = Field(default=None, description="Measurement unit matching Stage A")
    reference_interval_text: Optional[str] = Field(default=None, description="Verbatim source reference interval")
    flag: ObservationFlag = Field(description="Clinical indicator flag relative to source range")
    what_it_measures: str = Field(description="Plain-language explanation of what this test measures in the body")
    clinical_interpretation: str = Field(
        description="Non-diagnostic description of whether the observation is within standard reference boundaries"
    )
    uncertainty_note: Optional[str] = Field(
        default=None,
        description="Note regarding missing context, ambiguous OCR, or symptom correlation"
    )


class EnglishClinicalExplanation(BaseModel):
    """
    Structured output from AI Provider A (Clinical Reasoning).
    Strictly educational and evidence-grounded in source report reference intervals.
    """
    report_id: str = Field(description="Report identifier matching source document")
    panel_name: str = Field(description="Title of the diagnostic panel")
    overall_summary: str = Field(description="Concise, plain-language summary of the laboratory findings")
    analyte_explanations: List[AnalyteExplanation] = Field(
        default_factory=list,
        description="Itemized explanations for each analyte"
    )
    non_diagnostic_statement: str = Field(
        default="An out-of-range laboratory finding is an indicator that warrants medical review, not a standalone diagnosis.",
        description="Affirmation that values require qualified clinical correlation"
    )
    suggested_doctor_questions: List[str] = Field(
        default_factory=list,
        min_length=2,
        description="2 to 4 practical clarifying questions for the patient to ask their physician"
    )
    disclaimer: str = Field(
        default=(
            "This explanation is provided for educational purposes to assist patient understanding. "
            "It does not constitute medical diagnosis, clinical prognosis, or treatment recommendations."
        ),
        description="Standard non-diagnostic clinical disclaimer"
    )


class LocalizedAnalyteExplanation(BaseModel):
    """Localized clinical explanation for a single analyte."""
    test_name: str = Field(description="Localized or standard name of the laboratory test")
    code: Optional[str] = Field(default=None, description="Standard acronym or code")
    observed_value: Optional[float] = Field(default=None, description="Exact numerical value extracted in Stage A (strictly preserved)")
    unit: Optional[str] = Field(default=None, description="Measurement unit (strictly preserved)")
    reference_interval_text: Optional[str] = Field(default=None, description="Verbatim source reference interval (strictly preserved)")
    flag: ObservationFlag = Field(description="Clinical indicator flag relative to source range")
    what_it_measures: str = Field(description="Plain-language explanation translated/adapted into target language")
    clinical_interpretation: str = Field(description="Non-diagnostic interpretation translated/adapted into target language")
    uncertainty_note: Optional[str] = Field(default=None, description="Optional localized note")


class LocalizedReportExplanation(BaseModel):
    """
    Structured localized explanation from AI Provider B (Addis AI).
    Preserves all numbers, units, and ranges while adapting language to Amharic, Afaan Oromoo, or English.
    """
    report_id: str = Field(description="Source report identifier")
    language: str = Field(description="Language code ('en', 'am', 'om')")
    panel_name: str = Field(description="Localized panel title")
    overall_summary: str = Field(description="Culturally accessible, localized overview of findings")
    analyte_explanations: List[LocalizedAnalyteExplanation] = Field(
        default_factory=list,
        description="Localized analyte explanations"
    )
    non_diagnostic_statement: str = Field(description="Localized affirmation of non-diagnostic role")
    suggested_doctor_questions: List[str] = Field(
        default_factory=list,
        description="Localized practical questions for the patient to ask their physician"
    )
    disclaimer: str = Field(description="Localized medical disclaimer")


class LocalizationRequest(BaseModel):
    """Request payload for localizing an English clinical explanation."""
    explanation: EnglishClinicalExplanation = Field(description="English clinical explanation from Provider A")
    target_language: str = Field(
        default="am",
        description="Target language code: 'am' (Amharic), 'om' (Afaan Oromoo), or 'en' (English)"
    )


class PipelineProcessRequest(BaseModel):
    """Payload to trigger the complete Dual-AI sequential pipeline."""
    report: Optional[ExtractedLabReport] = Field(
        default=None,
        description="Structured extracted lab report if already parsed"
    )
    raw_text: Optional[str] = Field(
        default=None,
        description="Raw lab report text to be deterministically extracted and explained"
    )
    report_id: Optional[str] = Field(
        default="RPT-001",
        description="Report identifier"
    )
    target_language: str = Field(
        default="am",
        description="Target language code: 'am' (Amharic), 'om' (Afaan Oromoo), or 'en' (English)"
    )


