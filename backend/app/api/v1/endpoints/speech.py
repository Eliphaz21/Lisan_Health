"""
API endpoints for natural voice speech synthesis (TTS) and streaming.
"""

from pathlib import Path
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from backend.app.schemas.speech import SynthesisRequest, SynthesisResponse
from backend.app.services.speech.tts import get_tts_service

router = APIRouter(prefix="/speech", tags=["Voice Synthesis (TTS)"])


@router.post(
    "/synthesize",
    response_model=SynthesisResponse,
    status_code=status.HTTP_200_OK,
    summary="Synthesize Speech Audio (Addis AI TTS)",
    description="Converts localized report text into natural Amharic, Afaan Oromoo, or English speech."
)
async def synthesize_speech(request: SynthesisRequest) -> SynthesisResponse:
    """Synthesizes text into audio and returns streaming metadata."""
    if not request.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text for speech synthesis cannot be empty."
        )

    tts_service = get_tts_service()
    try:
        response = await tts_service.synthesize(request)
        return response
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech synthesis failed: {str(exc)}"
        )


@router.get(
    "/audio/{audio_id}",
    response_class=FileResponse,
    status_code=status.HTTP_200_OK,
    summary="Stream Audio File",
    description="Streams synthesized audio WAV bytes for browser playback."
)
async def stream_audio(audio_id: str):
    """Streams the requested audio WAV file."""
    tts_service = get_tts_service()
    audio_path: Path = tts_service.get_audio_path(audio_id)

    if not audio_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audio file '{audio_id}' not found."
        )

    return FileResponse(
        path=str(audio_path),
        media_type="audio/wav",
        filename=f"{audio_id}.wav"
    )
