import re
from typing import Dict, Any, List, Optional, Tuple
from backend.app.schemas.report import (
    ExtractedLabReport,
    LabObservation,
    ReferenceInterval,
    ObservationFlag,
    ExtractionStatus
)


def calculate_observation_flag(
    value: Optional[float],
    interval: Optional[ReferenceInterval]
) -> Tuple[ObservationFlag, bool, Optional[str]]:
    """
    Deterministically computes observation flag strictly against the provided reference interval.
    NEVER invents a missing reference interval.
    
    Returns:
        Tuple of (flag, needs_review, review_reason)
    """
    if value is None:
        return ObservationFlag.UNCERTAIN, True, "Missing numerical measurement"

    if interval is None or (interval.low is None and interval.high is None):
        return ObservationFlag.UNCERTAIN, True, "No reference interval provided on source report"

    low = interval.low
    high = interval.high

    # Substantially deviant / critical thresholds (arbitrarily +/- 50% outside bounds for safety)
    if low is not None and high is not None:
        span = high - low
        if value < low:
            if span > 0 and value < (low - 0.5 * span):
                return ObservationFlag.CRITICAL_LOW, False, None
            return ObservationFlag.LOW, False, None
        elif value > high:
            if span > 0 and value > (high + 0.5 * span):
                return ObservationFlag.CRITICAL_HIGH, False, None
            return ObservationFlag.HIGH, False, None
        else:
            return ObservationFlag.NORMAL, False, None

    if low is not None and high is None:
        # e.g., HDL > 40
        if value < low:
            return ObservationFlag.LOW, False, None
        return ObservationFlag.NORMAL, False, None

    if high is not None and low is None:
        # e.g., Total Cholesterol < 200
        if value > high:
            return ObservationFlag.HIGH, False, None
        return ObservationFlag.NORMAL, False, None

    return ObservationFlag.UNCERTAIN, True, "Incomplete reference interval boundaries"


class DeterministicExtractor:
    """Deterministic extractor parsing synthetic and raw text laboratory records."""

    @staticmethod
    def extract_from_dict(data: Dict[str, Any]) -> ExtractedLabReport:
        """Parses structured dictionary into an ExtractedLabReport with calculated flags."""
        raw_obs = data.get("observations", [])
        observations: List[LabObservation] = []
        overall_needs_review = False
        warnings: List[str] = []

        for item in raw_obs:
            ref_data = item.get("reference_interval")
            ref_obj = None
            if ref_data:
                ref_obj = ReferenceInterval(
                    low=ref_data.get("low"),
                    high=ref_data.get("high"),
                    unit=ref_data.get("unit"),
                    text_representation=ref_data.get("text_representation")
                )

            val = item.get("value")
            unit = item.get("unit")
            flag, needs_review, reason = calculate_observation_flag(val, ref_obj)

            if not unit:
                needs_review = True
                reason = f"{reason or ''} Missing measurement unit".strip()

            if needs_review:
                overall_needs_review = True
                warnings.append(f"{item.get('test_name')}: {reason}")

            observation = LabObservation(
                test_name=item.get("test_name", "Unknown Test"),
                code=item.get("code"),
                value=val,
                value_text=str(val) if val is not None else None,
                unit=unit,
                reference_interval=ref_obj,
                flag=flag,
                needs_review=needs_review,
                review_reason=reason
            )
            observations.append(observation)

        status = ExtractionStatus.NEEDS_REVIEW if overall_needs_review else ExtractionStatus.EXTRACTED
        confidence = 0.75 if overall_needs_review else 1.0

        return ExtractedLabReport(
            report_id=data.get("report_id", "SYNTH-000"),
            panel_name=data.get("panel_name", "General Panel"),
            patient_age=data.get("patient_age"),
            patient_gender=data.get("patient_gender"),
            collected_date=data.get("collected_date"),
            raw_text=data.get("raw_text", ""),
            observations=observations,
            status=status,
            confidence_score=confidence,
            warnings=warnings
        )

    @staticmethod
    def extract_from_text_lines(text: str, report_id: str = "EXTRACTED-001") -> ExtractedLabReport:
        """
        Parses common laboratory text lines matching pattern:
        `Test Name: Value Unit (Ref: Low - High)`
        """
        lines = [line.strip() for line in text.strip().split("\n") if line.strip()]
        observations: List[LabObservation] = []
        warnings: List[str] = []
        overall_needs_review = False

        # Pattern: NAME: VALUE UNIT (Ref: LOW - HIGH)
        pattern = re.compile(
            r"^(?P<name>[A-Za-z0-9\s\(\)]+?):\s*(?P<val>[0-9\.]+)\s*(?P<unit>[^\(]*?)\s*(?:\(Ref:\s*(?P<ref>[^\)]+)\))?$"
        )

        for line in lines:
            match = pattern.match(line)
            if match:
                name = match.group("name").strip()
                val_str = match.group("val").strip()
                unit = match.group("unit").strip() or None
                ref_text = match.group("ref")

                try:
                    val = float(val_str)
                except ValueError:
                    val = None

                ref_obj = None
                if ref_text:
                    ref_text = ref_text.strip()
                    # Check range: 4.0 - 11.0
                    range_match = re.match(r"([0-9\.]+)\s*-\s*([0-9\.]+)", ref_text)
                    less_match = re.match(r"<\s*([0-9\.]+)", ref_text)
                    greater_match = re.match(r">\s*([0-9\.]+)", ref_text)

                    if range_match:
                        ref_obj = ReferenceInterval(
                            low=float(range_match.group(1)),
                            high=float(range_match.group(2)),
                            unit=unit,
                            text_representation=ref_text
                        )
                    elif less_match:
                        ref_obj = ReferenceInterval(
                            low=None,
                            high=float(less_match.group(1)),
                            unit=unit,
                            text_representation=ref_text
                        )
                    elif greater_match:
                        ref_obj = ReferenceInterval(
                            low=float(greater_match.group(1)),
                            high=None,
                            unit=unit,
                            text_representation=ref_text
                        )
                    else:
                        ref_obj = ReferenceInterval(text_representation=ref_text)

                flag, needs_review, reason = calculate_observation_flag(val, ref_obj)
                if not unit:
                    needs_review = True
                    reason = f"{reason or ''} Missing unit".strip()

                if needs_review:
                    overall_needs_review = True
                    warnings.append(f"{name}: {reason}")

                observations.append(LabObservation(
                    test_name=name,
                    value=val,
                    value_text=val_str,
                    unit=unit,
                    reference_interval=ref_obj,
                    flag=flag,
                    needs_review=needs_review,
                    review_reason=reason
                ))

        status = ExtractionStatus.NEEDS_REVIEW if overall_needs_review else ExtractionStatus.EXTRACTED
        confidence = 0.85 if overall_needs_review else 1.0

        return ExtractedLabReport(
            report_id=report_id,
            panel_name="Parsed Text Report",
            raw_text=text,
            observations=observations,
            status=status,
            confidence_score=confidence,
            warnings=warnings
        )
