#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/local/go/bin:$HOME/go/bin:$PATH"
source "$(dirname "$0")/lib.sh"

need_cmd make
need_cmd go

# Where the service expects code/binary
INSTALL_DIR="${ARTINCAM_BACKEND_DIR:-/opt/artincam/artincam-be}"
BIN_PATH="$INSTALL_DIR/bin/artincam"

SRC_DIR="$ROOT_DIR/artincam-be"
[[ -d "$SRC_DIR" ]] || die "Backend source dir not found: $SRC_DIR"

log "Deploying backend source to $INSTALL_DIR"
rsync_deploy "$SRC_DIR" "$INSTALL_DIR"

log "Building backend (in $INSTALL_DIR)"
cd "$INSTALL_DIR"

make install
make build

# Your Makefile guarantees this output
[[ -f "$BIN_PATH" ]] || die "Expected backend binary not found at: $BIN_PATH"
sudo_if_needed chmod +x "$BIN_PATH" || true

log "Backend build/deploy complete: $BIN_PATH"
