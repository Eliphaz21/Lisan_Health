import json
from pathlib import Path
import pytest

from backend.app.schemas.report import ObservationFlag
from backend.app.services.extractor import DeterministicExtractor
from backend.app.services.ai.reasoning_provider import (
    MockReasoningProvider,
    get_reasoning_provider,
    ReasoningProvider
)

FIXTURES_DIR = Path(__file__).resolve().parent.parent.parent / "tests" / "fixtures"


@pytest.mark.asyncio
async def test_mock_reasoning_provider_anemia_cbc():
    """Verify Provider A produces structured educational explanation for synthetic CBC."""
    fixture_path = FIXTURES_DIR / "synthetic_cbc_anemia.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    extracted_report = DeterministicExtractor.extract_from_dict(data)
    provider: ReasoningProvider = get_reasoning_provider("mock")

    explanation = await provider.generate_explanation(extracted_report)

    assert explanation.report_id == "SYNTH-CBC-001"
    assert explanation.panel_name == "Complete Blood Count (CBC)"
    assert len(explanation.analyte_explanations) == 5

    # Verify Hemoglobin item
    hgb_exp = next(e for e in explanation.analyte_explanations if e.code == "HGB")
    assert hgb_exp.observed_value == 9.8
    assert hgb_exp.unit == "g/dL"
    assert hgb_exp.flag == ObservationFlag.LOW
    assert "Hemoglobin is an iron-rich protein" in hgb_exp.what_it_measures
    assert "below this laboratory's reference interval" in hgb_exp.clinical_interpretation

    # Verify Platelets item
    plt_exp = next(e for e in explanation.analyte_explanations if e.code == "PLT")
    assert plt_exp.observed_value == 240.0
    assert plt_exp.flag == ObservationFlag.NORMAL

    # Verify Doctor Questions
    assert len(explanation.suggested_doctor_questions) >= 3
    assert any("symptoms" in q.lower() for q in explanation.suggested_doctor_questions)

    # Verify Non-diagnostic Safeguards
    assert "does not alone establish a diagnosis" in explanation.non_diagnostic_statement
    assert "does not replace medical advice" in explanation.disclaimer


@pytest.mark.asyncio
async def test_mock_reasoning_provider_lipid_panel():
    """Verify Provider A interprets lipid panel parameters."""
    fixture_path = FIXTURES_DIR / "synthetic_lipid_panel.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    extracted_report = DeterministicExtractor.extract_from_dict(data)
    provider = MockReasoningProvider()

    explanation = await provider.generate_explanation(extracted_report)

    assert explanation.report_id == "SYNTH-LIPID-002"
    chol_exp = next(e for e in explanation.analyte_explanations if e.code == "CHOL")
    assert chol_exp.observed_value == 245.0
    assert chol_exp.flag == ObservationFlag.HIGH
    assert "higher than recommended reference boundaries" in chol_exp.clinical_interpretation


@pytest.mark.asyncio
async def test_reasoning_medical_safety_boundaries():
    """Safety Test: Asserts Provider A output never diagnoses disease or prescribes dosage."""
    fixture_path = FIXTURES_DIR / "synthetic_cbc_anemia.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    extracted_report = DeterministicExtractor.extract_from_dict(data)
    provider = MockReasoningProvider()
    explanation = await provider.generate_explanation(extracted_report)

    full_text = (
        explanation.overall_summary + " " +
        " ".join(e.clinical_interpretation for e in explanation.analyte_explanations)
    ).lower()

    # Banned diagnostic and prescriptive phrases
    banned_phrases = [
        "you have anemia",
        "i diagnose you with",
        "we diagnose",
        "take this medication",
        "prescribe 50mg",
        "dosage is",
    ]

    for phrase in banned_phrases:
        assert phrase not in full_text, f"Safety violation: Banned phrase '{phrase}' found in clinical reasoning."


def test_reasoning_provider_factory():
    """Verify factory returns MockReasoningProvider by default."""
    provider = get_reasoning_provider("mock")
    assert isinstance(provider, MockReasoningProvider)


def test_api_explain_english_endpoint(client):
    """Test POST /api/v1/reports/explain-english via HTTP API."""
    fixture_path = FIXTURES_DIR / "synthetic_cbc_anemia.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    extracted = DeterministicExtractor.extract_from_dict(data)

    response = client.post("/api/v1/reports/explain-english", json=extracted.model_dump())
    assert response.status_code == 200
    payload = response.json()
    assert payload["report_id"] == "SYNTH-CBC-001"
    assert len(payload["analyte_explanations"]) == 5
    assert len(payload["suggested_doctor_questions"]) >= 3
    assert "disclaimer" in payload
