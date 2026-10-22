"""
Dual-AI Sequential Pipeline Orchestrator.
Coordinates:
1. Deterministic Extraction / Validation
2. Provider A: English Clinical Reasoning
3. Intermediate Invariant Cross-Verification
4. Provider B: Addis AI Ethiopian Localization (Amharic / Afaan Oromoo / English)
5. Post-Localization Invariant Verification
"""

import logging
from typing import Optional

from backend.app.schemas.report import ExtractedLabReport
from backend.app.schemas.ai import (
    EnglishClinicalExplanation,
    LocalizedReportExplanation,
)
from backend.app.services.extractor import DeterministicExtractor
from backend.app.services.ai.reasoning_provider import (
    ReasoningProvider,
    get_reasoning_provider,
)
from backend.app.services.ai.addis_ai import (
    AddisAIProvider,
    get_addis_ai_provider,
    verify_localization_invariants,
    LocalizationInvariantError,
)

logger = logging.getLogger(__name__)


class PipelineInvariantError(ValueError):
    """Raised when an intermediate safety gate detects numerical or schema alteration."""
    pass


class DualAIPipeline:
    """
    Sequential pipeline chaining Provider A (clinical reasoning) and Provider B (Addis AI localization)
    with strict deterministic invariant validation between stages.
    """

    def __init__(
        self,
        reasoning_provider: Optional[ReasoningProvider] = None,
        localization_provider: Optional[AddisAIProvider] = None,
    ):
        self.reasoning_provider = reasoning_provider or get_reasoning_provider()
        self.localization_provider = localization_provider or get_addis_ai_provider()

    def _verify_reasoning_invariants(
        self,
        report: ExtractedLabReport,
        explanation: EnglishClinicalExplanation,
    ) -> bool:
        """
        Cross-validates that Provider A did not mutate or invent any numerical values or units.
        """
        if report.report_id != explanation.report_id:
            raise PipelineInvariantError(
                f"Report ID mismatch: extracted '{report.report_id}' vs explanation '{explanation.report_id}'"
            )

        # Create lookup by test name or code
        obs_map = {obs.test_name.lower(): obs for obs in report.observations}
        code_map = {obs.code.lower(): obs for obs in report.observations if obs.code}

        for analyte in explanation.analyte_explanations:
            matched_obs = (
                obs_map.get(analyte.test_name.lower())
                or (code_map.get(analyte.code.lower()) if analyte.code else None)
            )

            if not matched_obs:
                raise PipelineInvariantError(
                    f"AI invented hallucinated analyte '{analyte.test_name}' not in source report!"
                )

            if analyte.observed_value != matched_obs.value:
                raise PipelineInvariantError(
                    f"AI mutated value for '{analyte.test_name}': "
                    f"extracted={matched_obs.value} vs explanation={analyte.observed_value}"
                )

            if matched_obs.unit and analyte.unit != matched_obs.unit:
                raise PipelineInvariantError(
                    f"AI mutated unit for '{analyte.test_name}': "
                    f"extracted='{matched_obs.unit}' vs explanation='{analyte.unit}'"
                )

        return True

    async def execute(
        self,
        report: ExtractedLabReport,
        target_language: str = "am",
    ) -> LocalizedReportExplanation:
        """
        Executes the full sequential pipeline on an ExtractedLabReport:
        Stage 1: Provider A Clinical Reasoning (English)
        Stage 2: Deterministic Invariant Safety Check
        Stage 3: Provider B Addis AI Localization
        Stage 4: Post-Localization Invariant Safety Check
        """
        logger.info(
            "Executing Dual-AI pipeline for report %s, target_language=%s",
            report.report_id,
            target_language
        )

        # Stage 1: Provider A Clinical Reasoning
        explanation: EnglishClinicalExplanation = await self.reasoning_provider.generate_explanation(report)

        # Stage 2: Verify Stage 1 against source extraction
        self._verify_reasoning_invariants(report, explanation)

        # Stage 3: Provider B Localization
        localized: LocalizedReportExplanation = await self.localization_provider.localize(
            explanation=explanation,
            target_language=target_language,
        )

        # Stage 4: Post-Localization Invariant Verification
        verify_localization_invariants(explanation, localized)

        logger.info(
            "Successfully completed Dual-AI pipeline for report %s in language %s",
            report.report_id,
            target_language
        )
        return localized

    async def execute_from_text(
        self,
        raw_text: str,
        report_id: str = "RPT-001",
        target_language: str = "am",
    ) -> LocalizedReportExplanation:
        """
        Extracts raw text deterministically and runs the Dual-AI pipeline.
        """
        report = DeterministicExtractor.extract_from_text_lines(
            text=raw_text,
            report_id=report_id,
        )
        return await self.execute(report=report, target_language=target_language)


def get_dual_ai_pipeline(
    reasoning_provider: Optional[ReasoningProvider] = None,
    localization_provider: Optional[AddisAIProvider] = None,
) -> DualAIPipeline:
    """Factory creating DualAIPipeline instance with configured providers."""
    return DualAIPipeline(
        reasoning_provider=reasoning_provider,
        localization_provider=localization_provider,
    )
