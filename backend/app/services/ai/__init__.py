"""Dual-AI service abstractions and provider clients."""

from backend.app.services.ai.reasoning_provider import (
    ReasoningProvider,
    MockReasoningProvider,
    get_reasoning_provider,
)
from backend.app.services.ai.addis_ai import (
    AddisAIProvider,
    MockAddisAIProvider,
    RESTAddisAIProvider,
    get_addis_ai_provider,
    verify_localization_invariants,
    LocalizationInvariantError,
)

from backend.app.services.ai.pipeline import (
    DualAIPipeline,
    get_dual_ai_pipeline,
    PipelineInvariantError,
)

__all__ = [
    "ReasoningProvider",
    "MockReasoningProvider",
    "get_reasoning_provider",
    "AddisAIProvider",
    "MockAddisAIProvider",
    "RESTAddisAIProvider",
    "get_addis_ai_provider",
    "verify_localization_invariants",
    "LocalizationInvariantError",
    "DualAIPipeline",
    "get_dual_ai_pipeline",
    "PipelineInvariantError",
]

