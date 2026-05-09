"""
VocabuRex Speech Fallback Service
Lightweight STT (Faster-Whisper) + TTS (Piper) for Oracle Cloud ARM VM.
Runs on port 8090 as a fallback when the primary speech services are down.
"""

import os
import io
import wave
import logging
import tempfile
import subprocess
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("speech-fallback")

# ─── Configuration ─────────────────────────────────

WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
PIPER_MODEL_PATH = os.getenv("PIPER_MODEL_PATH", "./models/piper/en_US-amy-medium.onnx")
PIPER_CONFIG_PATH = os.getenv("PIPER_CONFIG_PATH", "./models/piper/en_US-amy-medium.onnx.json")
PIPER_BINARY = os.getenv("PIPER_BINARY", "piper")
PORT = int(os.getenv("PORT", "8090"))

# ─── Globals ───────────────────────────────────────

whisper_model = None
piper_available = False

# ─── App ───────────────────────────────────────────

app = FastAPI(title="VocabuRex Speech Fallback", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    global whisper_model, piper_available

    # ── Load Faster-Whisper ──
    logger.info(f"🔄 Loading Faster-Whisper model '{WHISPER_MODEL}' on {WHISPER_DEVICE}...")
    try:
        from faster_whisper import WhisperModel
        whisper_model = WhisperModel(
            WHISPER_MODEL,
            device=WHISPER_DEVICE,
            compute_type=WHISPER_COMPUTE_TYPE,
        )
        logger.info(f"✅ Faster-Whisper '{WHISPER_MODEL}' loaded successfully")
    except Exception as e:
        logger.error(f"❌ Failed to load Faster-Whisper: {e}")

    # ── Check Piper ──
    try:
        result = subprocess.run(
            [PIPER_BINARY, "--version"],
            capture_output=True, text=True, timeout=5,
        )
        piper_available = True
        logger.info(f"✅ Piper TTS available: {result.stdout.strip()}")
    except FileNotFoundError:
        logger.warning("⚠️  Piper binary not found. Trying with full path...")
        # Try common install locations
        for candidate in ["/usr/local/bin/piper", "/usr/bin/piper", "./piper/piper"]:
            if Path(candidate).exists():
                globals()["PIPER_BINARY"] = candidate
                piper_available = True
                logger.info(f"✅ Piper found at {candidate}")
                break
        if not piper_available:
            logger.error("❌ Piper TTS not available. Install with: pip install piper-tts")
    except Exception as e:
        logger.error(f"❌ Piper check failed: {e}")

    # ── Check Piper model ──
    if piper_available:
        if not Path(PIPER_MODEL_PATH).exists():
            logger.warning(f"⚠️  Piper model not found at {PIPER_MODEL_PATH}")
            logger.info("📥 Download with: piper --download-dir ./models/piper --model en_US-amy-medium")
            piper_available = False


# ─── STT Endpoint ──────────────────────────────────

@app.post("/stt/transcribe")
async def transcribe(
    audio_file: UploadFile = File(...),
    language: Optional[str] = Form(default="en"),
):
    """Transcribe audio using Faster-Whisper."""
    if whisper_model is None:
        raise HTTPException(503, "STT model not loaded")

    tmp_path = None
    try:
        content = await audio_file.read()
        suffix = os.path.splitext(audio_file.filename or "audio.wav")[1] or ".wav"

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        segments, info = whisper_model.transcribe(
            tmp_path,
            language=language if language != "auto" else None,
            beam_size=1,          # Faster on CPU
            best_of=1,
            vad_filter=True,      # Skip silence
            vad_parameters=dict(min_silence_duration_ms=500),
        )

        text_parts = []
        total_confidence = 0.0
        count = 0
        for segment in segments:
            text_parts.append(segment.text.strip())
            total_confidence += segment.avg_log_prob
            count += 1

        full_text = " ".join(text_parts)
        avg_confidence = (total_confidence / count) if count > 0 else 0.0
        # Convert log prob to 0-1 confidence (approximate)
        confidence = min(1.0, max(0.0, 1.0 + avg_confidence))

        return {
            "text": full_text,
            "confidence": round(confidence, 3),
            "language": info.language or language,
            "duration_seconds": round(info.duration, 2),
        }
    except Exception as e:
        logger.error(f"STT error: {e}")
        raise HTTPException(500, f"Transcription failed: {e}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass


@app.get("/stt/status")
async def stt_status():
    return {
        "service": "Faster-Whisper",
        "loaded": whisper_model is not None,
        "model": WHISPER_MODEL,
        "device": WHISPER_DEVICE,
    }


# ─── TTS Endpoint ──────────────────────────────────

class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    voice_style: Optional[str] = "friendly"


@app.post("/tts/synthesize")
async def synthesize(request: TTSRequest):
    """Synthesize speech using Piper TTS. Returns WAV audio."""
    if not piper_available:
        raise HTTPException(503, "Piper TTS not available")

    try:
        # Piper reads from stdin, writes WAV to stdout
        proc = subprocess.run(
            [
                PIPER_BINARY,
                "--model", PIPER_MODEL_PATH,
                "--output-raw",
                "--length-scale", "1.0",
                "--sentence-silence", "0.3",
            ],
            input=request.text.encode("utf-8"),
            capture_output=True,
            timeout=30,
        )

        if proc.returncode != 0:
            logger.error(f"Piper error: {proc.stderr.decode()}")
            raise HTTPException(500, f"Piper synthesis failed: {proc.stderr.decode()}")

        raw_pcm = proc.stdout
        if not raw_pcm:
            raise HTTPException(500, "Piper returned empty audio")

        # Wrap raw PCM in WAV header (16-bit mono 22050Hz — Piper default)
        sample_rate = 22050  # Piper default
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(raw_pcm)

        wav_bytes = wav_buffer.getvalue()

        return Response(
            content=wav_bytes,
            media_type="audio/wav",
            headers={
                "Content-Length": str(len(wav_bytes)),
                "Content-Disposition": "inline; filename=speech.wav",
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(500, f"Synthesis failed: {e}")


@app.get("/tts/status")
async def tts_status():
    return {
        "service": "Piper TTS",
        "loaded": piper_available,
        "model": PIPER_MODEL_PATH,
    }


# ─── Health ────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "stt": whisper_model is not None,
        "tts": piper_available,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=PORT, log_level="info")
