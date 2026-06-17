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
import re
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
PIPER_VI_MODEL_PATH = os.getenv("PIPER_VI_MODEL_PATH", "./models/piper/vi_VN-vivos-medium.onnx")
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
            logger.warning(f"⚠️  Piper English model not found at {PIPER_MODEL_PATH}")
            logger.info("📥 Download with: piper --download-dir ./models/piper --model en_US-amy-medium")
            piper_available = False
            
        if not Path(PIPER_VI_MODEL_PATH).exists():
            logger.warning(f"⚠️  Piper Vietnamese model not found at {PIPER_VI_MODEL_PATH}")
            logger.info("📥 Download with: piper --download-dir ./models/piper --model vi_VN-vivos-medium")


# ─── STT Endpoint ──────────────────────────────────

@app.post("/stt/transcribe")
async def transcribe(
    audio_file: UploadFile = File(...),
    language: Optional[str] = Form(default="auto"),
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

        # Workaround: Whisper 'base' often misclassifies short Vietnamese audio as French, Chinese, etc.
        # If the detected language is not English or Vietnamese, force it to Vietnamese and retry.
        if (language == "auto" or not language) and info.language not in ["en", "vi"]:
            logger.info(f"Language misdetected as '{info.language}'. Forcing retry with 'vi'.")
            segments, info = whisper_model.transcribe(
                tmp_path,
                language="vi",
                beam_size=1,
                best_of=1,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=500),
            )

        text_parts = []
        total_confidence = 0.0
        count = 0
        for segment in segments:
            text_parts.append(segment.text.strip())
            total_confidence += getattr(segment, 'avg_logprob', 0.0)
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


@app.post("/stt/transcribe/v2")
async def transcribe_v2(
    audio_file: UploadFile = File(...),
    language: Optional[str] = Form(default="auto"),
    reference_text: Optional[str] = Form(default=""),
    compare_pronunciation: Optional[bool] = Form(default=False),
    analyze_fluency: Optional[bool] = Form(default=False),
):
    """Transcribe audio using Faster-Whisper with detailed ASRResponseDTO format."""
    from datetime import datetime
    start_time = datetime.now()

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

        # Workaround: Whisper 'base' often misclassifies short Vietnamese audio as French, Chinese, etc.
        # If the detected language is not English or Vietnamese, force it to Vietnamese and retry.
        if (language == "auto" or not language) and info.language not in ["en", "vi"]:
            logger.info(f"Language misdetected as '{info.language}'. Forcing retry with 'vi'.")
            segments, info = whisper_model.transcribe(
                tmp_path,
                language="vi",
                beam_size=1,
                best_of=1,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=500),
            )

        text_parts = []
        total_confidence = 0.0
        count = 0
        words = []
        
        for segment in segments:
            text_parts.append(segment.text.strip())
            total_confidence += getattr(segment, 'avg_logprob', 0.0)
            count += 1
            if hasattr(segment, 'words') and segment.words:
                for w in segment.words:
                    words.append({
                        "word": w.word.strip(),
                        "start_time": w.start,
                        "end_time": w.end,
                        "confidence": getattr(w, 'probability', 1.0)
                    })

        full_text = " ".join(text_parts)
        avg_confidence = (total_confidence / count) if count > 0 else 0.0
        # Convert log prob to 0-1 confidence (approximate)
        confidence = min(1.0, max(0.0, 1.0 + avg_confidence))

        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        actual_utterance = {
            "text": full_text,
            "phonemes": [],
            "words": words or [{"word": full_text, "start_time": 0.0, "end_time": info.duration, "confidence": confidence}] if full_text else [],
            "confidence": confidence,
            "duration": info.duration
        }

        # Fallback doesn't support complex comparison/fluency analysis, returning default values
        total_score = confidence * 100
        pronunciation_grade = "A" if total_score >= 80 else "B" if total_score >= 60 else "C"

        return {
            "success": True,
            "audio_file_path": audio_file.filename,
            "reference_text": reference_text or "",
            "actual_utterance": actual_utterance,
            "word_comparisons": [],
            "overall_pronunciation_score": total_score,
            "fluency_score": total_score,
            "accuracy_score": total_score,
            "total_score": total_score,
            "pronunciation_grade": pronunciation_grade,
            "statistics": {
                "words_spoken": len(words) if words else len(full_text.split()),
                "duration_seconds": info.duration,
                "words_per_minute": len(full_text.split()) / (info.duration / 60) if info.duration > 0 else 0
            },
            "feedback": {
                "strengths": ["Clear audio recording (Fallback mode)"],
                "weaknesses": [],
                "suggestions": ["Using fallback STT model, detailed analysis is limited."]
            },
            "processing_time_ms": processing_time,
            "timestamp": datetime.now().isoformat(),
            "whisper_model_used": WHISPER_MODEL
        }
    except Exception as e:
        logger.error(f"STT error: {e}")
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        return JSONResponse(
            status_code=200,  # Or 500, but use case returns object with success=False
            content={
                "success": False,
                "audio_file_path": audio_file.filename if hasattr(audio_file, 'filename') else "unknown",
                "reference_text": reference_text or "",
                "actual_utterance": {
                    "text": "", "phonemes": [], "words": [], "confidence": 0.0, "duration": 0.0
                },
                "word_comparisons": [],
                "overall_pronunciation_score": 0.0,
                "fluency_score": 0.0,
                "accuracy_score": 0.0,
                "total_score": 0.0,
                "pronunciation_grade": "F",
                "statistics": {
                    "words_spoken": 0, "duration_seconds": 0.0, "words_per_minute": 0.0
                },
                "feedback": {
                    "strengths": [], "weaknesses": [], "suggestions": []
                },
                "processing_time_ms": processing_time,
                "timestamp": datetime.now().isoformat(),
                "whisper_model_used": WHISPER_MODEL,
                "error_message": str(e)
            }
        )
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


def is_vietnamese(text: str) -> bool:
    """Simple heuristic to check if text contains Vietnamese characters."""
    vn_chars = re.compile(r'[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]', re.IGNORECASE)
    return bool(vn_chars.search(text))


@app.post("/tts/synthesize")
async def synthesize(request: TTSRequest):
    """Synthesize speech using Piper TTS. Returns WAV audio."""
    if not piper_available:
        raise HTTPException(503, "Piper TTS not available")
        
    model_path = PIPER_VI_MODEL_PATH if is_vietnamese(request.text) else PIPER_MODEL_PATH
    
    # Fallback to English model if Vietnamese model doesn't exist
    if not Path(model_path).exists():
        logger.warning(f"Model {model_path} not found, falling back to {PIPER_MODEL_PATH}")
        model_path = PIPER_MODEL_PATH

    try:
        # Piper reads from stdin, writes WAV to stdout
        proc = subprocess.run(
            [
                PIPER_BINARY,
                "--model", model_path,
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
