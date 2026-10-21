from datetime import datetime, timezone
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Schema for basic liveness probe."""
    status: str = Field(default="healthy", description="Service operational status")
    version: str = Field(description="Application version")
    environment: str = Field(description="Running environment name")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO-8601 UTC timestamp of check"
    )


class ReadinessResponse(BaseModel):
    """Schema for readiness probe verifying dependencies."""
    status: str = Field(default="ready", description="Overall readiness status")
    version: str = Field(description="Application version")
    storage_ready: bool = Field(description="Whether local storage directories are writable")
    reasoning_provider: str = Field(description="Configured Provider A backend")
    localization_provider: str = Field(description="Configured Provider B backend")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO-8601 UTC timestamp of check"
    )
