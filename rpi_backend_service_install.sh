#!/bin/bash
set -e

# -----------------------------
# CONFIGURATION
# -----------------------------
SERVICE_NAME="artincam-be"
INSTALL_DIR="/opt/artincam/artincam-be"
BINARY_PATH="$INSTALL_DIR/bin/artincam"
WORKING_DIR="$INSTALL_DIR"                         # working directory for ExecStart
ENV_FILE="$INSTALL_DIR/backend.env"
USER="root"                                        # or "pi" or another service user
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"

# -----------------------------
# CHECK IF SERVICE EXISTS
# -----------------------------
if systemctl list-unit-files | grep -q "^$SERVICE_NAME.service"; then
    echo "✔️ Service '$SERVICE_NAME' already exists. Skipping installation."
    exit 0
fi

echo "🆕 Creating backend environment file..."

# -----------------------------
# CREATE ENV FILE IF MISSING
# -----------------------------
if [ ! -f "$ENV_FILE" ]; then
    sudo mkdir -p "$INSTALL_DIR"

    sudo tee "$ENV_FILE" >/dev/null <<EOF
# Artincam Backend Environment Variables

GOOSE_DRIVER=sqlite3
GOOSE_DBSTRING=src/db/zacpi-be.db
GOOSE_MIGRATION_DIR=src/db/migrations
EOF

    echo "✅ Created default env file at: $ENV_FILE"
else
    echo "ℹ️ Env file already exists at $ENV_FILE — not overwriting."
fi

sudo chmod 600 "$ENV_FILE"

echo "🆕 Creating systemd service: $SERVICE_FILE"

# -----------------------------
# WRITE SYSTEMD SERVICE FILE
# -----------------------------
sudo tee "$SERVICE_FILE" >/dev/null <<EOF
[Unit]
Description=Artincam Backend Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$WORKING_DIR
EnvironmentFile=$ENV_FILE
ExecStart=$BINARY_PATH
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Service file created at $SERVICE_FILE"

# -----------------------------
# FILE CHECKS
# -----------------------------
if [ ! -f "$BINARY_PATH" ]; then
    echo "⚠️ WARNING: Backend binary not found at $BINARY_PATH"
    echo "   Make sure your build step installs the binary before starting the service."
fi

# -----------------------------
# PERMISSIONS
# -----------------------------
sudo chmod 644 "$SERVICE_FILE"

# -----------------------------
# RELOAD SYSTEMD
# -----------------------------
echo "🔄 Reloading systemd..."
sudo systemctl daemon-reload

# -----------------------------
# ENABLE + START SERVICE
# -----------------------------
echo "🚀 Enabling service to start on boot..."
sudo systemctl enable "$SERVICE_NAME"

echo "▶️ Starting service..."
sudo systemctl start "$SERVICE_NAME"

echo ""
echo "🎉 Backend service '$SERVICE_NAME' installed and started successfully."
echo "📄 Logs: sudo journalctl -u $SERVICE_NAME -f"
echo ""
