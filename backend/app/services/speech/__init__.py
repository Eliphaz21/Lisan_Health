"""Speech synthesis services."""

from backend.app.services.speech.tts import (
    TTSService,
    get_tts_service,
    generate_synthetic_wav,
)

__all__ = ["TTSService", "get_tts_service", "generate_synthetic_wav"]
