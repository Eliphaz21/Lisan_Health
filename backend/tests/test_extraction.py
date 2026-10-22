import json
from pathlib import Path
import pytest

from backend.app.schemas.report import (
    ObservationFlag,
    ExtractionStatus,
    ExtractedLabReport
)
from backend.app.services.extractor import DeterministicExtractor
from backend.app.services.validator import StageBValidator

FIXTURES_DIR = Path(__file__).resolve().parent.parent.parent / "tests" / "fixtures"


def test_extract_synthetic_cbc_anemia():
    """Verify deterministic parsing and flag calculation on synthetic anemia CBC."""
    fixture_path = FIXTURES_DIR / "synthetic_cbc_anemia.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    report = DeterministicExtractor.extract_from_dict(data)

    assert report.report_id == "SYNTH-CBC-001"
    assert report.status == ExtractionStatus.EXTRACTED
    assert len(report.observations) == 5

    # Find Hemoglobin
    hgb = next(obs for obs in report.observations if obs.code == "HGB")
    assert hgb.value == 9.8
    assert hgb.unit == "g/dL"
    assert hgb.flag == ObservationFlag.LOW
    assert hgb.needs_review is False

    # Find Platelets
    plt = next(obs for obs in report.observations if obs.code == "PLT")
    assert plt.value == 240.0
    assert plt.flag == ObservationFlag.NORMAL


def test_extract_synthetic_lipid_panel():
    """Verify lipid panel evaluation against one-sided bounds (< and >)."""
    fixture_path = FIXTURES_DIR / "synthetic_lipid_panel.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    report = DeterministicExtractor.extract_from_dict(data)

    chol = next(obs for obs in report.observations if obs.code == "CHOL")
    assert chol.value == 245.0
    assert chol.flag == ObservationFlag.HIGH  # Ref: < 200

    hdl = next(obs for obs in report.observations if obs.code == "HDL")
    assert hdl.value == 38.0
    assert hdl.flag == ObservationFlag.LOW  # Ref: > 40

    ldl = next(obs for obs in report.observations if obs.code == "LDL")
    assert ldl.value == 169.0
    assert ldl.flag == ObservationFlag.HIGH  # Ref: < 100


def test_extract_synthetic_malformed_triggers_review():
    """Verify that ambiguous/missing units or intervals trigger NEEDS_REVIEW."""
    fixture_path = FIXTURES_DIR / "synthetic_malformed.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    report = DeterministicExtractor.extract_from_dict(data)

    assert report.status == ExtractionStatus.NEEDS_REVIEW
    assert report.confidence_score < 1.0
    assert len(report.warnings) > 0

    glu = next(obs for obs in report.observations if obs.code == "GLU")
    assert glu.flag == ObservationFlag.UNCERTAIN
    assert glu.needs_review is True


def test_extract_from_text_lines():
    """Verify regex-based text line parsing for common lab formats."""
    raw_text = (
        "WBC: 6.5 10^3/uL (Ref: 4.0 - 11.0)\n"
        "HGB: 13.5 g/dL (Ref: 12.0 - 16.0)\n"
        "CHOL: 215.0 mg/dL (Ref: < 200.0)"
    )

    report = DeterministicExtractor.extract_from_text_lines(raw_text)

    assert len(report.observations) == 3
    assert report.observations[0].value == 6.5
    assert report.observations[0].unit == "10^3/uL"
    assert report.observations[0].flag == ObservationFlag.NORMAL

    assert report.observations[2].value == 215.0
    assert report.observations[2].flag == ObservationFlag.HIGH


def test_validator_preservation_success():
    """Verify Stage B validator approves identical downstream observations."""
    fixture_path = FIXTURES_DIR / "synthetic_cbc_anemia.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    report = DeterministicExtractor.extract_from_dict(data)

    downstream_data = [
        {"test_name": "White Blood Cells (WBC)", "value": 6.5, "unit": "10^3/uL"},
        {"test_name": "Red Blood Cells (RBC)", "value": 3.8, "unit": "10^6/uL"},
        {"test_name": "Hemoglobin (HGB)", "value": 9.8, "unit": "g/dL"},
        {"test_name": "Hematocrit (HCT)", "value": 30.5, "unit": "%"},
        {"test_name": "Platelets (PLT)", "value": 240.0, "unit": "10^3/uL"},
    ]

    is_valid, violations = StageBValidator.validate_preservation(report.observations, downstream_data)
    assert is_valid is True
    assert len(violations) == 0


def test_validator_rejects_altered_numerical_values():
    """Verify Stage B validator rejects hallucinated or modified numerical values."""
    fixture_path = FIXTURES_DIR / "synthetic_cbc_anemia.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    report = DeterministicExtractor.extract_from_dict(data)

    # Maliciously altered HGB value from 9.8 to 10.5
    tampered_data = [
        {"test_name": "White Blood Cells (WBC)", "value": 6.5, "unit": "10^3/uL"},
        {"test_name": "Red Blood Cells (RBC)", "value": 3.8, "unit": "10^6/uL"},
        {"test_name": "Hemoglobin (HGB)", "value": 10.5, "unit": "g/dL"},  # Modified!
        {"test_name": "Hematocrit (HCT)", "value": 30.5, "unit": "%"},
        {"test_name": "Platelets (PLT)", "value": 240.0, "unit": "10^3/uL"},
    ]

    is_valid, violations = StageBValidator.validate_preservation(report.observations, tampered_data)
    assert is_valid is False
    assert any("Value altered for Hemoglobin (HGB)" in v for v in violations)


def test_validator_rejects_altered_unit():
    """Verify Stage B validator rejects changed measurement units."""
    fixture_path = FIXTURES_DIR / "synthetic_cbc_anemia.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    report = DeterministicExtractor.extract_from_dict(data)

    # Maliciously altered HGB unit from g/dL to mg/dL
    tampered_data = [
        {"test_name": "White Blood Cells (WBC)", "value": 6.5, "unit": "10^3/uL"},
        {"test_name": "Red Blood Cells (RBC)", "value": 3.8, "unit": "10^6/uL"},
        {"test_name": "Hemoglobin (HGB)", "value": 9.8, "unit": "mg/dL"},  # Modified unit!
        {"test_name": "Hematocrit (HCT)", "value": 30.5, "unit": "%"},
        {"test_name": "Platelets (PLT)", "value": 240.0, "unit": "10^3/uL"},
    ]

    is_valid, violations = StageBValidator.validate_preservation(report.observations, tampered_data)
    assert is_valid is False
    assert any("Unit altered for Hemoglobin (HGB)" in v for v in violations)


def test_api_parse_synthetic_endpoint(client):
    """Test POST /api/v1/reports/parse-synthetic via HTTP API."""
    fixture_path = FIXTURES_DIR / "synthetic_cbc_anemia.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    response = client.post("/api/v1/reports/parse-synthetic", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["report_id"] == "SYNTH-CBC-001"
    assert data["status"] == "EXTRACTED"
    assert len(data["observations"]) == 5


def test_api_parse_text_endpoint(client):
    """Test POST /api/v1/reports/parse-text via HTTP API."""
    payload = {
        "raw_text": "WBC: 7.2 10^3/uL (Ref: 4.0 - 11.0)\nPLT: 180 10^3/uL (Ref: 150 - 450)",
        "report_id": "TEST-TEXT-01"
    }

    response = client.post("/api/v1/reports/parse-text", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["report_id"] == "TEST-TEXT-01"
    assert len(data["observations"]) == 2
    assert data["observations"][0]["flag"] == "NORMAL"
