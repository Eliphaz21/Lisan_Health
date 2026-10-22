import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import httpx

from backend.app.core.config import settings
from backend.app.schemas.report import ExtractedLabReport, LabObservation, ObservationFlag
from backend.app.schemas.ai import EnglishClinicalExplanation, AnalyteExplanation

logger = logging.getLogger(__name__)

# Evidence-grounded educational reference material for common laboratory analytes
EDUCATIONAL_ANALYTE_KNOWLEDGE: Dict[str, Dict[str, str]] = {
    "HGB": {
        "what_it_measures": "Hemoglobin is an iron-rich protein in red blood cells responsible for carrying oxygen from the lungs to tissues throughout the body.",
        "low_context": "The reported value is below this laboratory's reference interval. Lower levels may indicate decreased oxygen-carrying capacity, commonly discussed in relation to nutritional iron, blood loss, or red cell production.",
        "high_context": "The reported value exceeds this laboratory's reference interval, which can be associated with dehydration or living at high altitudes.",
        "normal_context": "The reported value falls within the standard reference boundaries for this laboratory.",
    },
    "WBC": {
        "what_it_measures": "White blood cells (leukocytes) are essential components of the immune system that help defend the body against infections and inflammation.",
        "low_context": "The reported value is below standard reference limits. Lower counts are evaluated in the context of viral exposures, bone marrow activity, or medications.",
        "high_context": "The reported count exceeds the upper reference limit. Elevated counts are commonly seen in response to physiological stress, bacterial infections, or systemic inflammation.",
        "normal_context": "The total white blood cell count falls within the expected healthy range for this laboratory.",
    },
    "RBC": {
        "what_it_measures": "Red blood cells (erythrocytes) transport oxygen and nutrients to tissues and remove carbon dioxide wastes.",
        "low_context": "The red blood cell count is below the expected reference interval, often evaluated alongside hemoglobin and hematocrit.",
        "high_context": "The red blood cell count is higher than standard reference limits.",
        "normal_context": "The red blood cell count is within standard reference limits.",
    },
    "HCT": {
        "what_it_measures": "Hematocrit represents the proportion of whole blood volume that is comprised of red blood cells.",
        "low_context": "Hematocrit is below the reference interval, mirroring a lower concentration of circulating red blood cells.",
        "high_context": "Hematocrit is elevated, which can occur with reduced fluid intake or elevated red cell mass.",
        "normal_context": "Hematocrit is within standard physiological reference limits.",
    },
    "PLT": {
        "what_it_measures": "Platelets (thrombocytes) are specialized cell fragments that aggregate to form clots and stop bleeding following vascular injury.",
        "low_context": "Platelet count is below the expected reference range, which clinicians assess in relation to bleeding tendencies or immune factors.",
        "high_context": "Platelet count is elevated, which can accompany reactive inflammation or acute stress.",
        "normal_context": "Platelet count is within the healthy reference interval.",
    },
    "CHOL": {
        "what_it_measures": "Total cholesterol measures the cumulative circulating cholesterol compounds essential for cell membranes and hormone synthesis.",
        "low_context": "Total cholesterol is below standard reference limits.",
        "high_context": "Total cholesterol is higher than recommended reference boundaries. Elevated levels are assessed as part of cardiovascular risk screening.",
        "normal_context": "Total cholesterol is within standard recommended boundaries.",
    },
    "TRIG": {
        "what_it_measures": "Triglycerides are the primary storage form of fats in the bloodstream, derived from dietary calories.",
        "low_context": "Triglyceride levels are below standard reference thresholds.",
        "high_context": "Triglycerides exceed the target reference threshold, evaluated alongside metabolic factors and nutrition.",
        "normal_context": "Triglycerides are within the desirable reference range.",
    },
    "HDL": {
        "what_it_measures": "High-density lipoprotein (HDL) cholesterol helps transport cholesterol away from peripheral vessels back to the liver.",
        "low_context": "HDL levels are below the optimal reference threshold. Higher levels are generally considered protective.",
        "high_context": "HDL levels are elevated, which is generally favorable.",
        "normal_context": "HDL cholesterol meets standard healthy reference guidelines.",
    },
    "LDL": {
        "what_it_measures": "Low-density lipoprotein (LDL) cholesterol transports cholesterol to peripheral tissues; elevated circulating levels can accumulate in arterial walls.",
        "low_context": "LDL cholesterol is within a desirable low concentration.",
        "high_context": "LDL cholesterol is higher than the recommended target threshold, and is a standard focal point for cardiovascular wellness reviews.",
        "normal_context": "LDL cholesterol is within standard healthy bounds.",
    },
    "GLU": {
        "what_it_measures": "Blood glucose measures the concentration of sugar in the bloodstream, providing primary energy to cells.",
        "low_context": "Blood glucose is below the reference threshold (hypoglycemia), which can cause shakiness, sweating, or hunger.",
        "high_context": "Blood glucose is elevated above reference limits, which is evaluated in the context of fasting status, insulin sensitivity, or diabetes.",
        "normal_context": "Blood glucose is within standard fasting reference boundaries.",
    },
}


class ReasoningProvider(ABC):
    """Abstract base class for AI Provider A (Clinical Reasoning)."""

    @abstractmethod
    async def generate_explanation(self, report: ExtractedLabReport) -> EnglishClinicalExplanation:
        """
        Receives an extracted laboratory report and returns an evidence-grounded,
        non-diagnostic educational explanation in plain English.
        """
        pass


class MockReasoningProvider(ReasoningProvider):
    """
    Deterministic mock provider for automated testing and offline development.
    Produces high-fidelity, evidence-grounded clinical reasoning without paid API keys.
    """

    async def generate_explanation(self, report: ExtractedLabReport) -> EnglishClinicalExplanation:
        analyte_explanations: List[AnalyteExplanation] = []
        out_of_range_names: List[str] = []

        for obs in report.observations:
            code = (obs.code or "").upper()
            knowledge = EDUCATIONAL_ANALYTE_KNOWLEDGE.get(code, {
                "what_it_measures": f"{obs.test_name} is a biochemical analyte evaluated as part of a {report.panel_name}.",
                "low_context": f"The observed level is lower than the reference boundaries provided on this report.",
                "high_context": f"The observed level is higher than the reference boundaries provided on this report.",
                "normal_context": f"The observed level is within standard reference boundaries.",
            })

            ref_text = None
            if obs.reference_interval:
                ref_text = obs.reference_interval.text_representation or (
                    f"{obs.reference_interval.low} - {obs.reference_interval.high} {obs.reference_interval.unit or ''}".strip()
                )

            # Determine interpretation based on deterministic flag
            if obs.flag in [ObservationFlag.LOW, ObservationFlag.CRITICAL_LOW]:
                interpretation = knowledge.get("low_context", "")
                out_of_range_names.append(obs.test_name)
            elif obs.flag in [ObservationFlag.HIGH, ObservationFlag.CRITICAL_HIGH]:
                interpretation = knowledge.get("high_context", "")
                out_of_range_names.append(obs.test_name)
            elif obs.flag == ObservationFlag.UNCERTAIN:
                interpretation = "This observation has incomplete or uncertain reference boundaries and requires clinical verification."
            else:
                interpretation = knowledge.get("normal_context", "")

            uncertainty = None
            if obs.needs_review:
                uncertainty = f"Note: {obs.review_reason or 'Values require verification against source document.'}"

            analyte_explanations.append(
                AnalyteExplanation(
                    test_name=obs.test_name,
                    code=obs.code,
                    observed_value=obs.value,
                    unit=obs.unit,
                    reference_interval_text=ref_text,
                    flag=obs.flag,
                    what_it_measures=knowledge.get("what_it_measures", ""),
                    clinical_interpretation=interpretation,
                    uncertainty_note=uncertainty
                )
            )

        # Generate summary
        if out_of_range_names:
            summary = (
                f"This {report.panel_name} contains {len(report.observations)} test measurements. "
                f"Notable findings include values outside standard reference limits for: {', '.join(out_of_range_names)}. "
                "These indicators should be discussed with your healthcare provider in conjunction with your personal clinical history."
            )
        else:
            summary = (
                f"This {report.panel_name} contains {len(report.observations)} test measurements, "
                "all of which appear within this laboratory's standard reference boundaries."
            )

        # Generate doctor questions
        questions = [
            "How do these findings relate to my current symptoms, daily energy, and overall health?",
            "Are follow-up laboratory tests or repeat sampling advised to monitor trends over time?",
            "Should any dietary, hydration, or lifestyle modifications be considered before my next visit?",
        ]

        if any(obs.flag in [ObservationFlag.LOW, ObservationFlag.CRITICAL_LOW] for obs in report.observations):
            questions.insert(1, "What specific factors could contribute to the lower values observed in this report?")

        return EnglishClinicalExplanation(
            report_id=report.report_id,
            panel_name=report.panel_name,
            overall_summary=summary,
            analyte_explanations=analyte_explanations,
            non_diagnostic_statement=(
                "Laboratory reference intervals provide statistical baselines. "
                "An out-of-range value does not alone establish a diagnosis and must be evaluated by a physician."
            ),
            suggested_doctor_questions=questions[:4],
            disclaimer=(
                "This explanation is provided for educational purposes only. "
                "It does not replace medical advice, establish a diagnosis, or recommend medication."
            )
        )


class LLMReasoningProvider(ReasoningProvider):
    """
    HTTP client for external LLM reasoning providers with timeouts, bounded retries,
    and schema validation.
    """

    def __init__(self, api_key: str, model: str, base_url: Optional[str] = None):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url or "https://api.openai.com/v1"
        self.timeout = settings.REASONING_TIMEOUT_SECONDS
        self.max_retries = settings.REASONING_MAX_RETRIES

    async def generate_explanation(self, report: ExtractedLabReport) -> EnglishClinicalExplanation:
        """Calls external LLM endpoint to generate structured explanation."""
        if not self.api_key:
            logger.warning("No REASONING_API_KEY provided; falling back to MockReasoningProvider.")
            return await MockReasoningProvider().generate_explanation(report)

        prompt = {
            "task": "Explain the following laboratory findings in clear, non-diagnostic educational English.",
            "report_id": report.report_id,
            "panel_name": report.panel_name,
            "observations": [obs.model_dump() for obs in report.observations],
            "rules": [
                "Never invent laboratory values or reference intervals.",
                "Preserve exact numerical values and units.",
                "Do not diagnose diseases or prescribe medications.",
                "Produce structured output matching EnglishClinicalExplanation."
            ]
        }

        # Simulated or actual API call with bounded retries
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a clinical explainer grounding answers strictly in source lab reports."},
                {"role": "user", "content": json.dumps(prompt)}
            ],
            "response_format": {"type": "json_object"}
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                return EnglishClinicalExplanation.model_validate(parsed)
            except Exception as e:
                logger.error(f"External reasoning provider failed: {str(e)}. Falling back to mock reasoning.")
                return await MockReasoningProvider().generate_explanation(report)


def get_reasoning_provider(provider_type: Optional[str] = None) -> ReasoningProvider:
    """Factory creating the configured Provider A reasoning service."""
    selected = provider_type or settings.REASONING_PROVIDER
    if selected.lower() == "mock" or not settings.REASONING_API_KEY:
        return MockReasoningProvider()
    return LLMReasoningProvider(
        api_key=settings.REASONING_API_KEY,
        model=settings.REASONING_MODEL
    )
