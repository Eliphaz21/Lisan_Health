from typing import List, Dict, Any, Tuple
from backend.app.schemas.report import LabObservation


class StageBValidator:
    """
    Deterministic Stage B validation filter.
    Enforces the zero-hallucination invariant:
    Numerical values, signs, and measurement units extracted in Stage A must match identically.
    """

    @staticmethod
    def validate_preservation(
        source_observations: List[LabObservation],
        evaluated_observations: List[Dict[str, Any]]
    ) -> Tuple[bool, List[str]]:
        """
        Validates that evaluated downstream observations match source observations identically.
        
        Returns:
            Tuple of (is_valid, list_of_violations)
        """
        violations: List[str] = []
        source_map = {obs.test_name.lower(): obs for obs in source_observations}

        if len(source_observations) != len(evaluated_observations):
            violations.append(
                f"Count mismatch: source has {len(source_observations)} tests, "
                f"downstream has {len(evaluated_observations)} tests."
            )

        for eval_item in evaluated_observations:
            name = eval_item.get("test_name", "").lower()
            if name not in source_map:
                violations.append(f"Invented or unmatched test name detected: '{eval_item.get('test_name')}'")
                continue

            src = source_map[name]
            eval_val = eval_item.get("value")
            eval_unit = eval_item.get("unit")

            # Check numeric value preservation
            if src.value is not None and eval_val is not None:
                if abs(src.value - float(eval_val)) > 1e-6:
                    violations.append(
                        f"Value altered for {src.test_name}: source {src.value} vs downstream {eval_val}"
                    )
            elif src.value != eval_val:
                violations.append(
                    f"Value nullness mismatch for {src.test_name}: source {src.value} vs downstream {eval_val}"
                )

            # Check unit preservation
            if (src.unit or "").strip().lower() != (eval_unit or "").strip().lower():
                violations.append(
                    f"Unit altered for {src.test_name}: source '{src.unit}' vs downstream '{eval_unit}'"
                )

        is_valid = len(violations) == 0
        return is_valid, violations
