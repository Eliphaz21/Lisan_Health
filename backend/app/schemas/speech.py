"""
Pydantic schemas for Addis AI TTS Voice Synthesis.
"""

from typing import Optional
from pydantic import BaseModel, Field


class SynthesisRequest(BaseModel):
    """Payload to request audio speech synthesis for an explanation."""
    text: str = Field(..., min_length=1, description="Text to synthesize into natural speech")
    language: str = Field(default="am", description="Language code ('am', 'om', 'en')")
    voice: Optional[str] = Field(default=None, description="Requested voice model (e.g., 'hanna', 'chala')")
    audio_format: str = Field(default="wav", description="Audio container format ('wav', 'mp3')")


class SynthesisResponse(BaseModel):
    """Metadata response for synthesized speech."""
    audio_id: str = Field(description="Unique identifier / content hash of the audio clip")
    audio_url: str = Field(description="Relative stream URL for web playback")
    format: str = Field(description="Audio format mime/extension")
    duration_seconds: float = Field(description="Estimated or measured audio duration in seconds")
    cached: bool = Field(description="Whether the audio was retrieved from local cache")
    language: str = Field(description="Language of synthesized speech")
    voice: str = Field(description="Voice identifier used for synthesis")
