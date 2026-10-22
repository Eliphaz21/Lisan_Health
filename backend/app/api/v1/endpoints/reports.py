from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from backend.app.schemas.report import ExtractedLabReport
from backend.app.schemas.ai import (
    EnglishClinicalExplanation,
    LocalizedReportExplanation,
    LocalizationRequest,
    PipelineProcessRequest,
)
from backend.app.services.extractor import DeterministicExtractor
from backend.app.services.ai.reasoning_provider import get_reasoning_provider
from backend.app.services.ai.addis_ai import (
    get_addis_ai_provider,
    LocalizationInvariantError,
)
from backend.app.services.ai.pipeline import (
    get_dual_ai_pipeline,
    PipelineInvariantError,
)

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


@router.post(
    "/explain-english",
    response_model=EnglishClinicalExplanation,
    status_code=status.HTTP_200_OK,
    summary="Generate Provider A English Clinical Reasoning",
    description="Analyzes an extracted laboratory report and returns an evidence-grounded non-diagnostic explanation."
)
async def explain_report_in_english(report: ExtractedLabReport) -> EnglishClinicalExplanation:
    """Invokes AI Provider A for evidence-grounded English reasoning."""
    try:
        provider = get_reasoning_provider()
        explanation = await provider.generate_explanation(report)
        return explanation
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Clinical reasoning failed: {str(e)}"
        )


@router.post(
    "/localize",
    response_model=LocalizedReportExplanation,
    status_code=status.HTTP_200_OK,
    summary="Localize Clinical Explanation (Addis AI)",
    description="Translates and culturally adapts an English clinical explanation into Amharic, Afaan Oromoo, or verified English."
)
async def localize_report_explanation(request: LocalizationRequest) -> LocalizedReportExplanation:
    """Invokes AI Provider B (Addis AI) for Ethiopian localization."""
    try:
        provider = get_addis_ai_provider()
        localized = await provider.localize(
            explanation=request.explanation,
            target_language=request.target_language
        )
        return localized
    except (ValueError, LocalizationInvariantError) as err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Localization rejected: {str(err)}"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Localization service error: {str(exc)}"
        )


@router.post(
    "/process-pipeline",
    response_model=LocalizedReportExplanation,
    status_code=status.HTTP_200_OK,
    summary="Execute Full Dual-AI Sequential Pipeline",
    description="Takes extracted data or raw text and runs Provider A (Reasoning) + Invariant Guard + Provider B (Addis AI) into target language."
)
async def process_dual_ai_pipeline(request: PipelineProcessRequest) -> LocalizedReportExplanation:
    """Executes the complete Dual-AI pipeline with safety verification."""
    if not request.report and not request.raw_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'report' (structured) or 'raw_text' must be provided."
        )

    pipeline = get_dual_ai_pipeline()
    try:
        if request.report:
            return await pipeline.execute(
                report=request.report,
                target_language=request.target_language
            )
        else:
            return await pipeline.execute_from_text(
                raw_text=request.raw_text,
                report_id=request.report_id or "RPT-001",
                target_language=request.target_language
            )
    except (ValueError, LocalizationInvariantError, PipelineInvariantError) as err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Pipeline safety verification failed: {str(err)}"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dual-AI pipeline failed: {str(exc)}"
        )


