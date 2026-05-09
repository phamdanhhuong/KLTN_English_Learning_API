#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  VocabuRex Speech Fallback — Oracle Cloud ARM VM Setup
#  Installs Faster-Whisper (STT) + Piper (TTS)
#  Run as: bash setup_vm.sh
# ═══════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODELS_DIR="$SCRIPT_DIR/models"
PIPER_DIR="$SCRIPT_DIR/piper"

echo "╔═══════════════════════════════════════════════╗"
echo "║  VocabuRex Speech Fallback Setup (ARM64)      ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# ─── 1. System dependencies ─────────────────────────
echo "📦 Installing system dependencies..."
sudo apt-get update -qq
sudo apt-get install -y -qq python3 python3-pip python3-venv ffmpeg wget

# ─── 2. Python virtual environment ──────────────────
echo "🐍 Setting up Python venv..."
if [ ! -d "$SCRIPT_DIR/venv" ]; then
    python3 -m venv "$SCRIPT_DIR/venv"
fi
source "$SCRIPT_DIR/venv/bin/activate"

echo "📦 Installing Python dependencies..."
pip install --upgrade pip -q
pip install -r "$SCRIPT_DIR/requirements.txt" -q

# ─── 3. Download Piper TTS binary (aarch64) ─────────
echo ""
echo "🔊 Setting up Piper TTS..."
mkdir -p "$PIPER_DIR"

PIPER_VERSION="2023.11.14-2"
PIPER_ARCHIVE="piper_linux_aarch64.tar.gz"
PIPER_URL="https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}/${PIPER_ARCHIVE}"

if [ ! -f "$PIPER_DIR/piper" ]; then
    echo "   📥 Downloading Piper binary (ARM64)..."
    wget -q "$PIPER_URL" -O "/tmp/${PIPER_ARCHIVE}"
    tar -xzf "/tmp/${PIPER_ARCHIVE}" -C "$PIPER_DIR" --strip-components=1
    rm "/tmp/${PIPER_ARCHIVE}"
    chmod +x "$PIPER_DIR/piper"
    echo "   ✅ Piper binary installed"
else
    echo "   ✅ Piper binary already exists"
fi

# ─── 4. Download Piper voice model ──────────────────
echo ""
echo "🎤 Downloading Piper voice model (en_US-amy-medium)..."
mkdir -p "$MODELS_DIR/piper"

MODEL_BASE="en_US-amy-medium"
MODEL_URL_BASE="https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium"

if [ ! -f "$MODELS_DIR/piper/${MODEL_BASE}.onnx" ]; then
    echo "   📥 Downloading model..."
    wget -q "${MODEL_URL_BASE}/${MODEL_BASE}.onnx" -O "$MODELS_DIR/piper/${MODEL_BASE}.onnx"
    wget -q "${MODEL_URL_BASE}/${MODEL_BASE}.onnx.json" -O "$MODELS_DIR/piper/${MODEL_BASE}.onnx.json"
    echo "   ✅ Voice model downloaded"
else
    echo "   ✅ Voice model already exists"
fi

# ─── 5. Pre-download Faster-Whisper model ───────────
echo ""
echo "🎙️ Pre-downloading Faster-Whisper 'base' model..."
python3 -c "
from faster_whisper import WhisperModel
print('   📥 Downloading model (this may take a minute)...')
model = WhisperModel('base', device='cpu', compute_type='int8')
print('   ✅ Whisper base model ready')
"

# ─── 6. Create .env file ────────────────────────────
echo ""
echo "📝 Creating .env file..."
cat > "$SCRIPT_DIR/.env" << EOF
# Speech Fallback Configuration
WHISPER_MODEL=base
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8
PIPER_MODEL_PATH=$MODELS_DIR/piper/${MODEL_BASE}.onnx
PIPER_CONFIG_PATH=$MODELS_DIR/piper/${MODEL_BASE}.onnx.json
PIPER_BINARY=$PIPER_DIR/piper
PORT=8090
EOF

# ─── 7. Create systemd service ──────────────────────
echo ""
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/speech-fallback.service > /dev/null << EOF
[Unit]
Description=VocabuRex Speech Fallback (Faster-Whisper + Piper)
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$SCRIPT_DIR
EnvironmentFile=$SCRIPT_DIR/.env
ExecStart=$SCRIPT_DIR/venv/bin/python -m uvicorn app:app --host 0.0.0.0 --port 8090
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable speech-fallback
sudo systemctl start speech-fallback

# ─── 8. Verify ──────────────────────────────────────
echo ""
echo "⏳ Waiting for service to start..."
sleep 5

if curl -s http://localhost:8090/health | grep -q '"status":"ok"'; then
    echo ""
    echo "╔═══════════════════════════════════════════════╗"
    echo "║  ✅ Speech Fallback Service is RUNNING!       ║"
    echo "║                                               ║"
    echo "║  STT: http://localhost:8090/stt/transcribe    ║"
    echo "║  TTS: http://localhost:8090/tts/synthesize    ║"
    echo "║  Health: http://localhost:8090/health          ║"
    echo "║  Docs: http://localhost:8090/docs              ║"
    echo "║                                               ║"
    echo "║  Managed by: systemctl status speech-fallback ║"
    echo "╚═══════════════════════════════════════════════╝"
else
    echo "⚠️  Service may still be starting. Check with:"
    echo "   sudo systemctl status speech-fallback"
    echo "   curl http://localhost:8090/health"
fi

echo ""
echo "📌 Next: Update your KLTN API .env to add:"
echo "   FALLBACK_STT_URL=http://localhost:8090"
echo "   FALLBACK_TTS_URL=http://localhost:8090"
