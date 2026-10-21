import os
from pathlib import Path
from fastapi import APIRouter, status
from backend.app.core.config import settings
from backend.app.schemas.health import HealthResponse, ReadinessResponse

router = APIRouter(tags=["Health & Monitoring"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Service Liveness Check",
    description="Returns HTTP 200 with operational status, version, and ISO timestamp."
)
async def get_health() -> HealthResponse:
    """Liveness probe endpoint."""
    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT
    )


@router.get(
    "/ready",
    response_model=ReadinessResponse,
    status_code=status.HTTP_200_OK,
    summary="Service Readiness Check",
    description="Validates that internal dependencies and storage paths are available."
)
async def get_readiness() -> ReadinessResponse:
    """Readiness probe validating storage directories."""
    # Check storage directory writability
    storage_ready = True
    for directory in [settings.UPLOAD_DIR, settings.AUDIO_OUTPUT_DIR]:
        try:
            path = Path(directory)
            path.mkdir(parents=True, exist_ok=True)
            test_file = path / ".write_test"
            test_file.touch()
            test_file.unlink(missing_ok=True)
        except Exception:
            storage_ready = False
            break

    overall_status = "ready" if storage_ready else "degraded"

    return ReadinessResponse(
        status=overall_status,
        version=settings.VERSION,
        storage_ready=storage_ready,
        reasoning_provider=settings.REASONING_PROVIDER,
        localization_provider="addis_ai",
    )
