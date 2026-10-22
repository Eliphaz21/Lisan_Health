"""
Unit and Integration Tests for Addis AI TTS Voice Synthesis Service & Endpoints.
"""

import io
from pathlib import Path
import wave
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.schemas.speech import SynthesisRequest
from backend.app.services.speech.tts import (
    TTSService,
    generate_synthetic_wav,
    get_tts_service,
)


def test_generate_synthetic_wav_valid_riff_header():
    """Validates that synthetic WAV generator produces a valid 16-bit PCM WAV stream."""
    wav_bytes = generate_synthetic_wav(duration_seconds=1.0, sample_rate=16000)
    assert len(wav_bytes) > 44  # Standard WAV header size is 44 bytes

    # Verify standard RIFF/WAVE header
    assert wav_bytes[:4] == b"RIFF"
    assert wav_bytes[8:12] == b"WAVE"

    # Verify wave parsing
    buffer = io.BytesIO(wav_bytes)
    with wave.open(buffer, "rb") as wf:
        assert wf.getnchannels() == 1
        assert wf.getsampwidth() == 2  # 16-bit
        assert wf.getframerate() == 16000
        assert wf.getnframes() == 16000


@pytest.mark.asyncio
async def test_tts_service_synthesize_and_cache(tmp_path: Path):
    """Verifies that synthesis generates audio on disk and subsequent calls hit cache."""
    service = TTSService(cache_dir=tmp_path)
    req = SynthesisRequest(
        text="ይህ የሂሞግሎቢን ምርመራ ውጤት ነው።",
        language="am"
    )

    # First call: not cached
    resp1 = await service.synthesize(req)
    assert resp1.cached is False
    assert resp1.language == "am"
    assert resp1.voice == "hanna"
    assert resp1.audio_url == f"/api/v1/speech/audio/{resp1.audio_id}"

    # Verify file exists on disk
    audio_path = service.get_audio_path(resp1.audio_id)
    assert audio_path.exists()
    assert audio_path.stat().st_size > 0

    # Second call: cached
    resp2 = await service.synthesize(req)
    assert resp2.cached is True
    assert resp2.audio_id == resp1.audio_id


def test_api_synthesize_and_stream_endpoints():
    """Integration test: Synthesize Amharic speech then stream audio bytes."""
    client = TestClient(app)

    # 1. Synthesize
    synth_req = {
        "text": "ይህ የተሟላ የደም ምርመራ ማብራሪያ ነው።",
        "language": "am"
    }
    synth_resp = client.post("/api/v1/speech/synthesize", json=synth_req)
    assert synth_resp.status_code == 200
    data = synth_resp.json()
    assert "audio_id" in data
    assert "audio_url" in data
    audio_id = data["audio_id"]

    # 2. Stream audio
    stream_resp = client.get(f"/api/v1/speech/audio/{audio_id}")
    assert stream_resp.status_code == 200
    assert "audio/wav" in stream_resp.headers["content-type"]
    assert len(stream_resp.content) > 100
    assert stream_resp.content[:4] == b"RIFF"


def test_api_stream_audio_not_found():
    """Integration test: Non-existent audio ID returns 404."""
    client = TestClient(app)
    response = client.get("/api/v1/speech/audio/non_existent_id_9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_api_synthesize_empty_text_rejected():
    """Integration test: Empty text returns 400 or 422."""
    client = TestClient(app)
    response = client.post("/api/v1/speech/synthesize", json={"text": "   ", "language": "am"})
    assert response.status_code == 400
