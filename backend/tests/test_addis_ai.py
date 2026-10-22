"""
Tests for Provider B (Addis AI Ethiopian Localization Adapter)
and Deterministic Invariant Preservation.
"""

import pytest
import re
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.schemas.report import ObservationFlag
from backend.app.schemas.ai import (
    EnglishClinicalExplanation,
    AnalyteExplanation,
    LocalizedReportExplanation,
    LocalizedAnalyteExplanation,
    LocalizationRequest,
)
from backend.app.services.ai.addis_ai import (
    MockAddisAIProvider,
    verify_localization_invariants,
    LocalizationInvariantError,
    get_addis_ai_provider,
)


@pytest.fixture
def sample_english_cbc_explanation() -> EnglishClinicalExplanation:
    return EnglishClinicalExplanation(
        report_id="SYN-CBC-001",
        panel_name="Complete Blood Count",
        overall_summary="Hemoglobin and hematocrit are low, suggestive of microcytic anemia.",
        analyte_explanations=[
            AnalyteExplanation(
                test_name="Hemoglobin",
                code="HGB",
                observed_value=9.2,
                unit="g/dL",
                reference_interval_text="12.0 - 15.5 g/dL",
                flag=ObservationFlag.LOW,
                what_it_measures="Hemoglobin transports oxygen from lungs to tissues.",
                clinical_interpretation="Observed 9.2 g/dL is below standard 12.0 - 15.5 g/dL range.",
            ),
            AnalyteExplanation(
                test_name="Hematocrit",
                code="HCT",
                observed_value=28.5,
                unit="%",
                reference_interval_text="36.0 - 46.0 %",
                flag=ObservationFlag.LOW,
                what_it_measures="Percentage of blood volume composed of red blood cells.",
                clinical_interpretation="Observed 28.5% is below reference range.",
            ),
            AnalyteExplanation(
                test_name="White Blood Cells",
                code="WBC",
                observed_value=6.4,
                unit="10^3/uL",
                reference_interval_text="4.5 - 11.0 10^3/uL",
                flag=ObservationFlag.NORMAL,
                what_it_measures="Immune system defense cells.",
                clinical_interpretation="Within standard reference range.",
            ),
            AnalyteExplanation(
                test_name="Platelets",
                code="PLT",
                observed_value=245.0,
                unit="10^3/uL",
                reference_interval_text="150.0 - 450.0 10^3/uL",
                flag=ObservationFlag.NORMAL,
                what_it_measures="Blood clotting cells.",
                clinical_interpretation="Within normal physiological boundaries.",
            ),
        ],
        suggested_doctor_questions=[
            "What might be causing my hemoglobin to be below the normal range?",
            "Do I need an iron panel or ferritin test to check for iron deficiency?",
        ]
    )


@pytest.fixture
def sample_english_lipid_explanation() -> EnglishClinicalExplanation:
    return EnglishClinicalExplanation(
        report_id="SYN-LIP-001",
        panel_name="Lipid Panel",
        overall_summary="Elevated total cholesterol and LDL indicating cardiovascular risk factors.",
        analyte_explanations=[
            AnalyteExplanation(
                test_name="Total Cholesterol",
                code="CHOL",
                observed_value=240.0,
                unit="mg/dL",
                reference_interval_text="< 200 mg/dL",
                flag=ObservationFlag.HIGH,
                what_it_measures="Total amount of cholesterol circulating in the blood.",
                clinical_interpretation="Observed 240.0 mg/dL exceeds desirable range.",
            ),
            AnalyteExplanation(
                test_name="LDL Cholesterol",
                code="LDL",
                observed_value=162.0,
                unit="mg/dL",
                reference_interval_text="< 100 mg/dL",
                flag=ObservationFlag.HIGH,
                what_it_measures="Low-density lipoprotein cholesterol that can accumulate in arteries.",
                clinical_interpretation="Observed 162.0 mg/dL is elevated above normal threshold.",
            ),
            AnalyteExplanation(
                test_name="HDL Cholesterol",
                code="HDL",
                observed_value=38.0,
                unit="mg/dL",
                reference_interval_text="> 40 mg/dL",
                flag=ObservationFlag.LOW,
                what_it_measures="Protective cholesterol that carries excess lipids back to the liver.",
                clinical_interpretation="Observed 38.0 mg/dL is below protective target.",
            ),
        ],
        suggested_doctor_questions=[
            "What lifestyle or dietary modifications are recommended for high LDL?",
            "When should my lipid panel be re-evaluated?",
        ]
    )


@pytest.mark.asyncio
async def test_mock_addis_ai_amharic_cbc_preserves_values_and_units(
    sample_english_cbc_explanation: EnglishClinicalExplanation
):
    """Verifies Amharic localization preserves all numerical values and uses Ge'ez script."""
    provider = MockAddisAIProvider()
    localized = await provider.localize(sample_english_cbc_explanation, "am")

    assert localized.language == "am"
    assert localized.report_id == "SYN-CBC-001"
    assert "የተሟላ የደም ምርመራ" in localized.panel_name

    # Ge'ez unicode regex check (U+1200 to U+137F)
    geez_pattern = re.compile(r"[\u1200-\u137F]")
    assert geez_pattern.search(localized.overall_summary) is not None
    assert geez_pattern.search(localized.non_diagnostic_statement) is not None

    # Check strict preservation of numerical values, units, flags
    assert len(localized.analyte_explanations) == 4
    hgb = localized.analyte_explanations[0]
    assert hgb.code == "HGB"
    assert hgb.observed_value == 9.2
    assert hgb.unit == "g/dL"
    assert hgb.reference_interval_text == "12.0 - 15.5 g/dL"
    assert hgb.flag == ObservationFlag.LOW
    assert "ሂሞግሎቢን" in hgb.test_name
    assert geez_pattern.search(hgb.what_it_measures) is not None

    # Questions and disclaimer
    assert len(localized.suggested_doctor_questions) >= 2
    for q in localized.suggested_doctor_questions:
        assert geez_pattern.search(q) is not None


@pytest.mark.asyncio
async def test_mock_addis_ai_oromo_lipid_preserves_values_and_units(
    sample_english_lipid_explanation: EnglishClinicalExplanation
):
    """Verifies Afaan Oromoo localization preserves all numerical values and uses Qubee."""
    provider = MockAddisAIProvider()
    localized = await provider.localize(sample_english_lipid_explanation, "om")

    assert localized.language == "om"
    assert localized.report_id == "SYN-LIP-001"
    assert "Cooma Dhiigaa" in localized.panel_name

    # Check strict preservation of numerical values
    assert len(localized.analyte_explanations) == 3
    chol = localized.analyte_explanations[0]
    assert chol.code == "CHOL"
    assert chol.observed_value == 240.0
    assert chol.unit == "mg/dL"
    assert chol.reference_interval_text == "< 200 mg/dL"
    assert chol.flag == ObservationFlag.HIGH
    assert "Koleestaroolii" in chol.test_name
    assert "dhiiga" in chol.what_it_measures.lower()

    # Afaan Oromoo doctor questions
    assert len(localized.suggested_doctor_questions) >= 2
    assert any("ogeessa fayyaa" in q.lower() or "bu'aan" in q.lower() for q in localized.suggested_doctor_questions)


@pytest.mark.asyncio
async def test_mock_addis_ai_english_passthrough(
    sample_english_cbc_explanation: EnglishClinicalExplanation
):
    """Verifies English request returns an identical validated pass-through."""
    provider = MockAddisAIProvider()
    localized = await provider.localize(sample_english_cbc_explanation, "en")

    assert localized.language == "en"
    assert localized.panel_name == sample_english_cbc_explanation.panel_name
    assert len(localized.analyte_explanations) == len(sample_english_cbc_explanation.analyte_explanations)
    for src, loc in zip(sample_english_cbc_explanation.analyte_explanations, localized.analyte_explanations):
        assert src.observed_value == loc.observed_value
        assert src.unit == loc.unit
        assert src.test_name == loc.test_name


def test_verify_localization_invariants_detects_value_tampering(
    sample_english_cbc_explanation: EnglishClinicalExplanation
):
    """Verifies that altering a numerical value raises LocalizationInvariantError."""
    # Create invalid localized version where 9.2 was changed to 10.0
    bad_localized = LocalizedReportExplanation(
        report_id=sample_english_cbc_explanation.report_id,
        language="am",
        panel_name="የተሟላ የደም ምርመራ",
        overall_summary="ማብራሪያ",
        analyte_explanations=[
            LocalizedAnalyteExplanation(
                test_name="ሂሞግሎቢን",
                code="HGB",
                observed_value=10.0,  # Altered! Original was 9.2
                unit="g/dL",
                reference_interval_text="12.0 - 15.5 g/dL",
                flag=ObservationFlag.LOW,
                what_it_measures="ማብራሪያ",
                clinical_interpretation="ትርጉም",
            ),
            # Missing other analytes
        ],
        non_diagnostic_statement="መግለጫ",
        suggested_doctor_questions=["ጥያቄ"],
        disclaimer="ማስተባበያ",
    )

    with pytest.raises(LocalizationInvariantError):
        verify_localization_invariants(sample_english_cbc_explanation, bad_localized)


def test_verify_localization_invariants_detects_unit_tampering(
    sample_english_cbc_explanation: EnglishClinicalExplanation
):
    """Verifies that altering a unit raises LocalizationInvariantError."""
    provider = MockAddisAIProvider()
    import asyncio
    localized = asyncio.run(provider.localize(sample_english_cbc_explanation, "am"))

    # Tamper with unit of first analyte
    localized.analyte_explanations[0].unit = "mg/dL"  # Original was g/dL

    with pytest.raises(LocalizationInvariantError):
        verify_localization_invariants(sample_english_cbc_explanation, localized)


@pytest.mark.asyncio
async def test_unsupported_language_raises_value_error(
    sample_english_cbc_explanation: EnglishClinicalExplanation
):
    """Verifies that requesting an unsupported language raises ValueError."""
    provider = MockAddisAIProvider()
    with pytest.raises(ValueError, match="Unsupported localization language"):
        await provider.localize(sample_english_cbc_explanation, "fr")


def test_api_localize_endpoint(sample_english_cbc_explanation: EnglishClinicalExplanation):
    """Integration test: POST /api/v1/reports/localize returns 200 with Amharic payload."""
    client = TestClient(app)
    req = {
        "explanation": sample_english_cbc_explanation.model_dump(),
        "target_language": "am"
    }
    response = client.post("/api/v1/reports/localize", json=req)
    assert response.status_code == 200
    data = response.json()
    assert data["language"] == "am"
    assert data["report_id"] == "SYN-CBC-001"
    assert len(data["analyte_explanations"]) == 4
    assert data["analyte_explanations"][0]["observed_value"] == 9.2
    assert data["analyte_explanations"][0]["unit"] == "g/dL"


def test_api_localize_endpoint_rejects_invalid_language(
    sample_english_cbc_explanation: EnglishClinicalExplanation
):
    """Integration test: Unsupported language returns 422 Unprocessable Entity."""
    client = TestClient(app)
    req = {
        "explanation": sample_english_cbc_explanation.model_dump(),
        "target_language": "german"
    }
    response = client.post("/api/v1/reports/localize", json=req)
    assert response.status_code == 422
    assert "Unsupported localization language" in response.json()["detail"]
