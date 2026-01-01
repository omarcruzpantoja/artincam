#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"

need_cmd curl
need_cmd python3

INSTALL_DIR="${ARTINCAM_AGENT_DIR:-/opt/artincam/camera}"
SRC_DIR="$ROOT_DIR/camera"
[[ -d "$SRC_DIR" ]] || die "Agent source dir not found: $SRC_DIR"

# Install uv (pinned)
UV_VERSION="${UV_VERSION:-0.9.17}"

if have_cmd uv; then
  log "uv present: $(uv --version)"
else
  log "Installing uv..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
fi

export PATH="$HOME/.local/bin:$PATH"
need_cmd uv

log "Deploying agent source to $INSTALL_DIR"
rsync_deploy "$SRC_DIR" "$INSTALL_DIR"

cd "$INSTALL_DIR"

if [[ ! -d ".venv" ]]; then
  log "Creating venv..."
  uv venv --system-site-packages
else
  log ".venv exists — skipping venv creation"
fi

log "Syncing python deps..."
uv sync --all-extras

log "Agent deploy complete."
