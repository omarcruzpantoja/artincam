#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"

MEDIAMTX_VERSION="${MEDIAMTX_VERSION:-1.15.5}"
INSTALL_DIR="${MEDIAMTX_INSTALL_DIR:-/opt/mediamtx}"
BIN_PATH="$INSTALL_DIR/mediamtx"

CONFIG_DIR="${MEDIAMTX_CONFIG_DIR:-/etc/mediamtx}"
CONFIG_FILE="$CONFIG_DIR/mediamtx.yml"

SERVICE_NAME="mediamtx"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

ARCH="$(uname -m)"
case "$ARCH" in
  aarch64|arm64) DL_ARCH="linux_arm64" ;;
  x86_64)        DL_ARCH="linux_amd64" ;;
  *) die "Unsupported arch for MediaMTX install: $ARCH" ;;
esac

DOWNLOAD_URL="https://github.com/bluenviron/mediamtx/releases/download/v${MEDIAMTX_VERSION}/mediamtx_v${MEDIAMTX_VERSION}_${DL_ARCH}.tar.gz"

# Consider installed if unit file AND binary exist
if [[ -x "$BIN_PATH" && -f "$SERVICE_FILE" ]]; then
  log "MediaMTX already installed (binary + unit exist). Skipping install."
  exit 0
fi

# If unit exists but binary missing, warn and continue install to repair it
if [[ -f "$SERVICE_FILE" && ! -x "$BIN_PATH" ]]; then
  warn "MediaMTX unit exists but binary missing at $BIN_PATH. Repairing install..."
fi

# If binary exists but unit missing, warn and continue to repair unit
if [[ -x "$BIN_PATH" && ! -f "$SERVICE_FILE" ]]; then
  warn "MediaMTX binary exists but unit missing at $SERVICE_FILE. Repairing service..."
fi

log "Installing MediaMTX v${MEDIAMTX_VERSION}..."
ensure_dir "$INSTALL_DIR"

TMP_TAR="$(mktemp -t mediamtx.XXXXXX.tar.gz)"
trap 'rm -f "$TMP_TAR"' EXIT

curl -fsSL "$DOWNLOAD_URL" -o "$TMP_TAR"
sudo_if_needed tar -xzf "$TMP_TAR" -C "$INSTALL_DIR"

# normalize binary location
if [[ ! -f "$BIN_PATH" ]]; then
  FOUND_BIN="$(find "$INSTALL_DIR" -maxdepth 2 -type f -name "mediamtx" | head -n 1 || true)"
  [[ -n "$FOUND_BIN" ]] || die "mediamtx binary not found after extract"
  sudo_if_needed mv "$FOUND_BIN" "$BIN_PATH"
fi
sudo_if_needed chmod +x "$BIN_PATH"

# config
ensure_dir "$CONFIG_DIR"
if [[ ! -f "$CONFIG_FILE" ]]; then
  sudo_if_needed tee "$CONFIG_FILE" >/dev/null <<'EOF'
############################################################
# Minimal MediaMTX config with dynamic paths
############################################################

logLevel: info
logDestinations: [stdout]

rtsp: true
rtspAddress: :8554
rtspTransports: [tcp]

hls: true
hlsAddress: :8888
hlsAllowOrigins: ["*"]

rtmp: false
webrtc: false
srt: false
metrics: false
api: false
pprof: false
playback: false

pathDefaults:
  source: publisher
  overridePublisher: yes

paths:
  all:
    source: publisher
    overridePublisher: yes
EOF
  sudo_if_needed chmod 644 "$CONFIG_FILE"
  log "Wrote default config: $CONFIG_FILE"
else
  log "Config exists (not overwriting): $CONFIG_FILE"
fi

# systemd unit
sudo_if_needed tee "$SERVICE_FILE" >/dev/null <<EOF
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
sudo_if_needed chmod 644 "$SERVICE_FILE"

systemd_reload_enable_start "$SERVICE_NAME"
log "MediaMTX installed and running."
