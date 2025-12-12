#!/bin/bash
set -e

# -----------------------------
# CONFIG
# -----------------------------
SERVICE_NAME="mediamtx"
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"

MEDIAMTX_VERSION="1.9.5"  # adjust if desired
INSTALL_DIR="/opt/mediamtx"
BIN_PATH="$INSTALL_DIR/mediamtx"

CONFIG_DIR="/etc/mediamtx"
CONFIG_FILE="$CONFIG_DIR/mediamtx.yml"

DOWNLOAD_URL="https://github.com/bluenviron/mediamtx/releases/download/v${MEDIAMTX_VERSION}/mediamtx_v${MEDIAMTX_VERSION}_linux_arm64.tar.gz"

# -----------------------------
# STOP IF SERVICE ALREADY RUNNING
# -----------------------------
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "✔️ '$SERVICE_NAME' service is already running. Skipping install."
    exit 0
fi

# Also skip if service file exists
if systemctl list-unit-files | grep -q "^$SERVICE_NAME.service"; then
    echo "ℹ️ '$SERVICE_NAME' already installed (service file exists)."
    echo "   Start with: sudo systemctl start $SERVICE_NAME"
    exit 0
fi

echo "🆕 Installing MediaMTX $MEDIAMTX_VERSION ..."

# -----------------------------
# DOWNLOAD + INSTALL
# -----------------------------
sudo mkdir -p "$INSTALL_DIR"

TMP_TAR="./mediamtx.tar.gz"
echo "⬇️ Downloading MediaMTX..."
curl -L "$DOWNLOAD_URL" -o "$TMP_TAR"

echo "📦 Extracting to $INSTALL_DIR..."
sudo tar -xzf "$TMP_TAR" -C "$INSTALL_DIR"
rm "$TMP_TAR"

# Ensure binary ends up at $BIN_PATH no matter archive structure
if [ ! -f "$BIN_PATH" ]; then
    FOUND_BIN=$(find "$INSTALL_DIR" -maxdepth 2 -type f -name "mediamtx" | head -n 1)
    if [ -n "$FOUND_BIN" ]; then
        sudo mv "$FOUND_BIN" "$BIN_PATH"
    fi
fi

sudo chmod +x "$BIN_PATH"

if [ ! -x "$BIN_PATH" ]; then
    echo "❌ ERROR: mediamtx binary missing at $BIN_PATH"
    exit 1
fi

echo "✅ MediaMTX binary installed at: $BIN_PATH"

# -----------------------------
# CREATE CONFIG FILE (IF MISSING)
# -----------------------------
sudo mkdir -p "$CONFIG_DIR"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "📝 Creating MediaMTX config: $CONFIG_FILE"

    sudo tee "$CONFIG_FILE" >/dev/null <<'EOF'
############################################################
# Minimal MediaMTX config with dynamic paths
############################################################

logLevel: info
logDestinations: [stdout]

# ---- Enable RTSP for ingest
rtsp: true
rtspAddress: :8554
rtspTransports: [tcp]

# ---- Enable HLS for browser playback
hls: true
hlsAddress: :8888          # HLS HTTP server port
hlsAllowOrigin: "*"        # or set to your frontend origin instead of "*"

# ---- Keep everything else disabled
rtmp: false
webrtc: false
srt: false
metrics: false
api: false
pprof: false
playback: false

# ---- Default path behaviour
pathDefaults:
  source: publisher
  overridePublisher: yes

# ---- Allow any dynamic path
paths:
  all:
    source: publisher
    overridePublisher: yes
EOF

    echo "✅ Wrote default MediaMTX config."
else
    echo "ℹ️ Config already exists at $CONFIG_FILE — not overwriting."
fi

sudo chmod 644 "$CONFIG_FILE"

# -----------------------------
# CREATE SYSTEMD SERVICE
# -----------------------------
echo "📝 Creating systemd service at $SERVICE_FILE"

sudo tee "$SERVICE_FILE" >/dev/null <<EOF
[Unit]
Description=MediaMTX Streaming Server (RTSP + HLS)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=$BIN_PATH $CONFIG_FILE
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

sudo chmod 644 "$SERVICE_FILE"

echo "✅ Created systemd service."

# -----------------------------
# ENABLE + START
# -----------------------------
echo "🔄 Reloading systemd..."
sudo systemctl daemon-reload

echo "🚀 Enabling service..."
sudo systemctl enable "$SERVICE_NAME"

echo "▶️ Starting service..."
sudo systemctl start "$SERVICE_NAME"

echo ""
echo "🎉 MediaMTX installed and running!"
echo "📄 Logs: sudo journalctl -u $SERVICE_NAME -f"
echo "📁 Config: $CONFIG_FILE"
echo "🔍 Binary: $BIN_PATH"
echo ""
