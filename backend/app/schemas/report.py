from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class ObservationFlag(str, Enum):
    """Flag indicating observation status relative to its reference interval."""
    NORMAL = "NORMAL"
    LOW = "LOW"
    HIGH = "HIGH"
    CRITICAL_LOW = "CRITICAL_LOW"
    CRITICAL_HIGH = "CRITICAL_HIGH"
    UNCERTAIN = "UNCERTAIN"


class ExtractionStatus(str, Enum):
    """Processing status for the extraction stage."""
    PENDING = "PENDING"
    EXTRACTED = "EXTRACTED"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    FAILED = "FAILED"


class ReferenceInterval(BaseModel):
    """Deterministic laboratory reference range."""
    low: Optional[float] = Field(default=None, description="Lower limit of reference interval")
    high: Optional[float] = Field(default=None, description="Upper limit of reference interval")
    unit: Optional[str] = Field(default=None, description="Unit of measurement for the interval")
    text_representation: Optional[str] = Field(default=None, description="Verbatim text from source report")


class LabObservation(BaseModel):
    """Single laboratory analyte observation extracted deterministically."""
    test_name: str = Field(description="Name of the laboratory test (e.g., Hemoglobin, Glucose)")
    code: Optional[str] = Field(default=None, description="Standard acronym or code (e.g., HGB, WBC, CHOL)")
    value: Optional[float] = Field(default=None, description="Extracted numerical measurement")
    value_text: Optional[str] = Field(default=None, description="Verbatim string representation of value")
    unit: Optional[str] = Field(default=None, description="Reported unit (e.g., g/dL, mg/dL, 10^3/uL)")
    reference_interval: Optional[ReferenceInterval] = Field(
        default=None,
        description="Reference interval provided on the source report"
    )
    flag: ObservationFlag = Field(
        default=ObservationFlag.NORMAL,
        description="Calculated relationship to reference interval"
    )
    needs_review: bool = Field(
        default=False,
        description="Whether manual human verification is required due to ambiguous OCR or missing unit"
    )
    review_reason: Optional[str] = Field(
        default=None,
        description="Explanation when needs_review is True"
    )


class ExtractedLabReport(BaseModel):
    """Structured report produced by Stage A extraction."""
    report_id: str = Field(description="Unique identifier for the report instance")
    panel_name: str = Field(default="General Laboratory Panel", description="Title of the diagnostic panel")
    patient_age: Optional[int] = Field(default=None, description="Patient age if declared on report")
    patient_gender: Optional[str] = Field(default=None, description="Patient gender if declared on report")
    collected_date: Optional[str] = Field(default=None, description="Sample collection date/time")
    raw_text: str = Field(default="", description="Verbatim extracted source text")
    observations: List[LabObservation] = Field(
        default_factory=list,
        description="List of extracted analyte observations"
    )
    status: ExtractionStatus = Field(
        default=ExtractionStatus.EXTRACTED,
        description="Current extraction status"
    )
    confidence_score: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="OCR / Parsing confidence score between 0.0 and 1.0"
    )
    warnings: List[str] = Field(
        default_factory=list,
        description="Warnings encountered during extraction"
    )
