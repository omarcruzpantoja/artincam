#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"

need_cmd curl

SRC_DIR="$ROOT_DIR/artincam-fe"
[[ -d "$SRC_DIR" ]] || die "Frontend source dir not found: $SRC_DIR"

# Install fnm if missing
if have_cmd fnm; then
  log "fnm already installed."
else
  log "Installing fnm..."
  curl -fsSL https://fnm.vercel.app/install | bash
fi

export PATH="$HOME/.local/share/fnm:$PATH"
need_cmd fnm
eval "$(fnm env --use-on-cd)"

NODE_VERSION="${NODE_VERSION:-24}"
fnm install "$NODE_VERSION"
fnm default "$NODE_VERSION"

need_cmd node
need_cmd npm

log "Building frontend..."
cd "$SRC_DIR"
npm install
npm run build

[[ -d "dist" ]] || die "Frontend build did not produce dist/ at: $SRC_DIR/dist"
log "Frontend build complete (dist/ ready)."
