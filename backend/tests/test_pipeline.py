"""
End-to-End Tests for Dual-AI Sequential Pipeline Orchestrator.
Validates the full flow:
Deterministic Extraction -> Provider A Clinical Reasoning -> Safety Gate -> Provider B Addis AI -> Invariant Check.
"""

import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.schemas.report import ExtractedLabReport, ObservationFlag
from backend.app.schemas.ai import EnglishClinicalExplanation, AnalyteExplanation
from backend.app.services.extractor import DeterministicExtractor
from backend.app.services.ai.reasoning_provider import MockReasoningProvider, ReasoningProvider
from backend.app.services.ai.addis_ai import MockAddisAIProvider
from backend.app.services.ai.pipeline import (
    DualAIPipeline,
    PipelineInvariantError,
    get_dual_ai_pipeline,
)

FIXTURES_DIR = Path(__file__).resolve().parent.parent.parent / "tests" / "fixtures"


@pytest.fixture
def synthetic_cbc_report() -> ExtractedLabReport:
    with open(FIXTURES_DIR / "synthetic_cbc_anemia.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    return DeterministicExtractor.extract_from_dict(data)


@pytest.fixture
def synthetic_lipid_report() -> ExtractedLabReport:
    with open(FIXTURES_DIR / "synthetic_lipid_panel.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    return DeterministicExtractor.extract_from_dict(data)


@pytest.mark.asyncio
async def test_dual_ai_pipeline_end_to_end_amharic(synthetic_cbc_report: ExtractedLabReport):
    """End-to-end verification: CBC extracted report -> English reasoning -> Amharic explanation."""
    pipeline = get_dual_ai_pipeline()
    localized = await pipeline.execute(synthetic_cbc_report, target_language="am")

    assert localized.language == "am"
    assert localized.report_id == "SYNTH-CBC-001"
    assert "የተሟላ የደም ምርመራ" in localized.panel_name

    # Check exact numerical value preservation
    hgb = next(a for a in localized.analyte_explanations if a.code == "HGB")
    assert hgb.observed_value == 9.8
    assert hgb.unit == "g/dL"
    assert hgb.flag == ObservationFlag.LOW
    assert "ሂሞግሎቢን" in hgb.test_name

    assert len(localized.suggested_doctor_questions) >= 2


@pytest.mark.asyncio
async def test_dual_ai_pipeline_end_to_end_oromo(synthetic_lipid_report: ExtractedLabReport):
    """End-to-end verification: Lipid panel -> English reasoning -> Afaan Oromoo explanation."""
    pipeline = get_dual_ai_pipeline()
    localized = await pipeline.execute(synthetic_lipid_report, target_language="om")

    assert localized.language == "om"
    assert localized.report_id == "SYNTH-LIPID-002"
    assert "Cooma Dhiigaa" in localized.panel_name

    chol = next(a for a in localized.analyte_explanations if a.code == "CHOL")
    assert chol.observed_value == 245.0
    assert chol.unit == "mg/dL"
    assert chol.flag == ObservationFlag.HIGH


@pytest.mark.asyncio
async def test_dual_ai_pipeline_from_raw_text():
    """Verifies end-to-end processing starting from raw OCR / plain text lines."""
    raw_text = (
        "Hemoglobin: 8.5 g/dL (Ref: 12.0 - 15.5)\n"
        "Hematocrit: 26.0 % (Ref: 36.0 - 46.0)\n"
        "WBC: 5.5 10^3/uL (Ref: 4.5 - 11.0)"
    )
    pipeline = get_dual_ai_pipeline()
    localized = await pipeline.execute_from_text(
        raw_text=raw_text,
        report_id="TXT-TEST-001",
        target_language="am"
    )

    assert localized.language == "am"
    assert localized.report_id == "TXT-TEST-001"
    assert len(localized.analyte_explanations) == 3
    hgb = localized.analyte_explanations[0]
    assert hgb.observed_value == 8.5
    assert hgb.unit == "g/dL"


class RogueReasoningProviderMutatedValue(ReasoningProvider):
    """Simulates an unsafe reasoning LLM that hallucinated a modified numerical value."""
    async def generate_explanation(self, report: ExtractedLabReport) -> EnglishClinicalExplanation:
        return EnglishClinicalExplanation(
            report_id=report.report_id,
            panel_name=report.panel_name,
            overall_summary="Hallucinated summary",
            analyte_explanations=[
                AnalyteExplanation(
                    test_name="Hemoglobin",
                    code="HGB",
                    observed_value=999.9,  # Mutated! Original is 9.8
                    unit="g/dL",
                    reference_interval_text="12.0 - 15.5 g/dL",
                    flag=ObservationFlag.LOW,
                    what_it_measures="Oxygen transporter",
                    clinical_interpretation="Dangerous mutation",
                )
            ],
            suggested_doctor_questions=["Question 1?", "Question 2?"]
        )


@pytest.mark.asyncio
async def test_dual_ai_pipeline_catches_mutated_reasoning_value(synthetic_cbc_report: ExtractedLabReport):
    """Intermediate Safety Gate: Pipeline must catch and block any AI that mutates numbers."""
    rogue_pipeline = DualAIPipeline(
        reasoning_provider=RogueReasoningProviderMutatedValue(),
        localization_provider=MockAddisAIProvider()
    )

    with pytest.raises(PipelineInvariantError, match="AI mutated value for 'Hemoglobin'"):
        await rogue_pipeline.execute(synthetic_cbc_report, target_language="am")


class RogueReasoningProviderInventedAnalyte(ReasoningProvider):
    """Simulates an unsafe reasoning LLM that invented an analyte not present in report."""
    async def generate_explanation(self, report: ExtractedLabReport) -> EnglishClinicalExplanation:
        return EnglishClinicalExplanation(
            report_id=report.report_id,
            panel_name=report.panel_name,
            overall_summary="Hallucinated summary",
            analyte_explanations=[
                AnalyteExplanation(
                    test_name="Hallucinated Analyte X",
                    code="HAX",
                    observed_value=12.5,
                    unit="mg/dL",
                    reference_interval_text="10 - 20 mg/dL",
                    flag=ObservationFlag.NORMAL,
                    what_it_measures="Fake analyte",
                    clinical_interpretation="Does not exist",
                )
            ],
            suggested_doctor_questions=["Question 1?", "Question 2?"]
        )


@pytest.mark.asyncio
async def test_dual_ai_pipeline_catches_invented_analyte(synthetic_cbc_report: ExtractedLabReport):
    """Intermediate Safety Gate: Pipeline must catch and block hallucinated non-existent tests."""
    rogue_pipeline = DualAIPipeline(
        reasoning_provider=RogueReasoningProviderInventedAnalyte(),
        localization_provider=MockAddisAIProvider()
    )

    with pytest.raises(PipelineInvariantError, match="AI invented hallucinated analyte"):
        await rogue_pipeline.execute(synthetic_cbc_report, target_language="am")


def test_api_process_pipeline_with_structured_report(synthetic_cbc_report: ExtractedLabReport):
    """API Integration: POST /api/v1/reports/process-pipeline with ExtractedLabReport."""
    client = TestClient(app)
    req = {
        "report": synthetic_cbc_report.model_dump(mode="json"),
        "target_language": "am"
    }
    response = client.post("/api/v1/reports/process-pipeline", json=req)
    assert response.status_code == 200
    data = response.json()
    assert data["language"] == "am"
    assert data["report_id"] == "SYNTH-CBC-001"
    assert len(data["analyte_explanations"]) == 5


def test_api_process_pipeline_with_raw_text():
    """API Integration: POST /api/v1/reports/process-pipeline with raw_text in Afaan Oromoo."""
    client = TestClient(app)
    raw_text = (
        "Total Cholesterol: 250 mg/dL (Ref: < 200)\n"
        "Triglycerides: 180 mg/dL (Ref: < 150)"
    )
    req = {
        "raw_text": raw_text,
        "report_id": "OROMO-LIP-01",
        "target_language": "om"
    }
    response = client.post("/api/v1/reports/process-pipeline", json=req)
    assert response.status_code == 200
    data = response.json()
    assert data["language"] == "om"
    assert data["report_id"] == "OROMO-LIP-01"
    assert len(data["analyte_explanations"]) == 2


def test_api_process_pipeline_rejects_empty_payload():
    """API Integration: Reject when neither report nor raw_text is provided."""
    client = TestClient(app)
    response = client.post("/api/v1/reports/process-pipeline", json={"target_language": "am"})
    assert response.status_code == 400
    assert "Either 'report' (structured) or 'raw_text' must be provided" in response.json()["detail"]
