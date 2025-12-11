#!/bin/bash
set -e

# -----------------------------
# CONFIGURATION
# -----------------------------
SERVICE_NAME="artincam-pi-agent"

INSTALL_DIR="/opt/artincam/camera"
VENV_PYTHON="$INSTALL_DIR/.venv/bin/python"
AGENT_SCRIPT="$INSTALL_DIR/main.py"

ENV_FILE="$INSTALL_DIR/pi-agent.env"
USER="root"   # change to "pi" if preferred
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"

# -----------------------------
# CHECK IF SERVICE EXISTS
# -----------------------------
if systemctl list-unit-files | grep -q "^$SERVICE_NAME.service"; then
    echo "✔️ Service '$SERVICE_NAME' already exists. Skipping installation."
    exit 0
fi

echo "🆕 Setting up Artincam Pi Agent service..."

# -----------------------------
# CREATE ENV FILE IF MISSING
# -----------------------------
if [ ! -f "$ENV_FILE" ]; then
    sudo mkdir -p "$INSTALL_DIR"

    sudo tee "$ENV_FILE" >/dev/null <<EOF
# Artincam Pi Agent Environment Variables
BACKEND_HOST="localhost:8080"
ARTINCAM_AGENT_ID="dbc44ea8-1854-4a11-8359-01ca2e0d8e76"
EOF

    echo "✅ Created default env file at: $ENV_FILE"
else
    echo "ℹ️ Env file already exists at $ENV_FILE — not overwriting."
fi

sudo chmod 600 "$ENV_FILE"

# -----------------------------
# WARN IF PYTHON OR SCRIPT MISSING
# -----------------------------
if [ ! -x "$VENV_PYTHON" ]; then
    echo "⚠️ WARNING: Python venv not found:"
    echo "   $VENV_PYTHON"
    echo "   Create it before starting the service (uv venv / python -m venv)."
fi

if [ ! -f "$AGENT_SCRIPT" ]; then
    echo "⚠️ WARNING: Agent entry script not found:"
    echo "   $AGENT_SCRIPT"
    echo "   Update AGENT_SCRIPT in this installer if your filename differs."
fi

# -----------------------------
# WRITE SYSTEMD SERVICE FILE
# -----------------------------
echo "📝 Writing systemd service: $SERVICE_FILE"

sudo tee "$SERVICE_FILE" >/dev/null <<EOF
[Unit]
Description=Artincam Pi Camera Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
EnvironmentFile=-$ENV_FILE
ExecStart=$VENV_PYTHON $AGENT_SCRIPT
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Created service definition at $SERVICE_FILE"

sudo chmod 644 "$SERVICE_FILE"

# -----------------------------
# RELOAD SYSTEMD
# -----------------------------
echo "🔄 Reloading systemd..."
sudo systemctl daemon-reload

# -----------------------------
# ENABLE + START SERVICE
# -----------------------------
echo "🚀 Enabling $SERVICE_NAME..."
sudo systemctl enable "$SERVICE_NAME"

echo "▶️ Starting service..."
sudo systemctl start "$SERVICE_NAME"

echo ""
echo "🎉 Pi Agent service '$SERVICE_NAME' installed and running."
echo "📄 Logs: sudo journalctl -u $SERVICE_NAME -f"
echo "📁 Env : $ENV_FILE"
echo ""
