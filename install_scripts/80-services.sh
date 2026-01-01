#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"

# -------- Backend service --------
BE_SERVICE="artincam-be"
BE_DIR="${ARTINCAM_BACKEND_DIR:-/opt/artincam/artincam-be}"
BE_BIN="$BE_DIR/bin/artincam"
BE_ENV="$BE_DIR/backend.env"
BE_UNIT="/etc/systemd/system/${BE_SERVICE}.service"
BE_USER="${ARTINCAM_SERVICE_USER:-root}"

if ! systemd_unit_exists "$BE_SERVICE"; then
  log "Installing backend env file (if missing)..."
  if [[ ! -f "$BE_ENV" ]]; then
    ensure_dir "$BE_DIR"
    sudo_if_needed tee "$BE_ENV" >/dev/null <<EOF
# Artincam Backend Environment Variables
GOOSE_DRIVER=sqlite3
GOOSE_DBSTRING=src/db/zacpi-be.db
GOOSE_MIGRATION_DIR=src/db/migrations
EOF
    sudo_if_needed chmod 600 "$BE_ENV"
    log "Created: $BE_ENV"
  else
    log "Exists (not overwriting): $BE_ENV"
  fi

  log "Writing backend systemd unit..."
  sudo_if_needed tee "$BE_UNIT" >/dev/null <<EOF
[Unit]
Description=Artincam Backend Service
After=network.target

[Service]
Type=simple
User=${BE_USER}
WorkingDirectory=${BE_DIR}
EnvironmentFile=${BE_ENV}
ExecStart=${BE_BIN}
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF
  sudo_if_needed chmod 644 "$BE_UNIT"
  systemd_reload_enable_start "$BE_SERVICE"
else
  log "Backend service already installed: ${BE_SERVICE}"
fi

# -------- Pi Agent service --------
AG_SERVICE="artincam-pi-agent"
AG_DIR="${ARTINCAM_AGENT_DIR:-/opt/artincam/camera}"
AG_PY="$AG_DIR/.venv/bin/python"
AG_SCRIPT="${ARTINCAM_AGENT_ENTRY:-$AG_DIR/main.py}"
AG_ENV="$AG_DIR/pi-agent.env"
AG_UNIT="/etc/systemd/system/${AG_SERVICE}.service"
AG_USER="${ARTINCAM_SERVICE_USER:-root}"

if ! systemd_unit_exists "$AG_SERVICE"; then
  log "Installing agent env file (if missing)..."
  if [[ ! -f "$AG_ENV" ]]; then
    ensure_dir "$AG_DIR"
    sudo_if_needed tee "$AG_ENV" >/dev/null <<EOF
# Artincam Pi Agent Environment Variables
BACKEND_HOST="localhost:8080"
ARTINCAM_AGENT_ID="dbc44ea8-1854-4a11-8359-01ca2e0d8e76"
EOF
    sudo_if_needed chmod 600 "$AG_ENV"
    log "Created: $AG_ENV"
  else
    log "Exists (not overwriting): $AG_ENV"
  fi

  log "Writing agent systemd unit..."
  sudo_if_needed tee "$AG_UNIT" >/dev/null <<EOF
[Unit]
Description=Artincam Pi Camera Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${AG_USER}
WorkingDirectory=${AG_DIR}
EnvironmentFile=-${AG_ENV}
ExecStart=${AG_PY} ${AG_SCRIPT}
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF
  sudo_if_needed chmod 644 "$AG_UNIT"
  systemd_reload_enable_start "$AG_SERVICE"
else
  log "Agent service already installed: ${AG_SERVICE}"
fi

log "Service setup complete."
