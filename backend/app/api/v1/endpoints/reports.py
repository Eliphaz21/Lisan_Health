from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from backend.app.schemas.report import ExtractedLabReport
from backend.app.services.extractor import DeterministicExtractor

router = APIRouter(prefix="/reports", tags=["Report Processing"])


class RawTextParseRequest(BaseModel):
    """Request model for raw text report parsing."""
    raw_text: str = Field(..., description="Raw text of laboratory findings")
    report_id: str = Field(default="CLI-001", description="Client provided or generated report ID")


@router.post(
    "/parse-synthetic",
    response_model=ExtractedLabReport,
    status_code=status.HTTP_200_OK,
    summary="Extract & Validate Synthetic Structured Report",
    description="Deterministically parses a structured synthetic lab dictionary into an ExtractedLabReport."
)
async def parse_synthetic_report(data: Dict[str, Any]) -> ExtractedLabReport:
    """Parses a structured synthetic report payload."""
    try:
        report = DeterministicExtractor.extract_from_dict(data)
        return report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to extract report: {str(e)}"
        )


@router.post(
    "/parse-text",
    response_model=ExtractedLabReport,
    status_code=status.HTTP_200_OK,
    summary="Extract & Validate Raw Text Lab Findings",
    description="Parses lines of laboratory text with pattern: Test: Value Unit (Ref: Low - High)."
)
async def parse_text_report(request: RawTextParseRequest) -> ExtractedLabReport:
    """Parses raw text report findings."""
    try:
        report = DeterministicExtractor.extract_from_text_lines(
            text=request.raw_text,
            report_id=request.report_id
        )
        return report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse text: {str(e)}"
        )
