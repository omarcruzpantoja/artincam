#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/lib.sh"

need_cmd curl

SRC_DIR="$ROOT_DIR/artincam-fe"
[[ -d "$SRC_DIR" ]] || die "Frontend source dir not found: $SRC_DIR"

# --- fnm (Node manager) ---
FNM_DIR="$HOME/.local/share/fnm"
FNM_BIN="$FNM_DIR/fnm"

if [[ -x "$FNM_BIN" ]]; then
  log "fnm already installed: $("$FNM_BIN" --version)"
else
  log "Installing fnm..."
  curl -fsSL https://fnm.vercel.app/install | bash
fi

# Make fnm available in this non-interactive script run
export PATH="$FNM_DIR:$PATH"
need_cmd fnm

# Initialize fnm environment (sets PATH for selected Node version)
eval "$(fnm env --use-on-cd)"

# --- Node.js ---
NODE_VERSION="${NODE_VERSION:-24}"

# Avoid reinstalling Node if already present
if fnm list | grep -q "v$NODE_VERSION"; then
  log "Node v$NODE_VERSION already installed via fnm."
else
  log "Installing Node v$NODE_VERSION..."
  fnm install "$NODE_VERSION"
fi

fnm default "$NODE_VERSION"

need_cmd node
need_cmd npm

log "Building frontend..."
cd "$SRC_DIR"

npm install
npm run build

[[ -d "dist" ]] || die "Frontend build did not produce dist/ at: $SRC_DIR/dist"
log "Frontend build complete (dist/ ready)."
