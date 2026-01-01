#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"

BIN_DIR="/opt/artincam/bin"
ensure_dir "$BIN_DIR"

write_exec() {
  local path="$1"
  shift
  ensure_dir "$(dirname "$path")"
  sudo_if_needed tee "$path" >/dev/null <<EOF
$*
EOF
  sudo_if_needed chmod 755 "$path"
  log "Installed update script: $path"
}

# Update repo + rebuild + restart backend
write_exec "$BIN_DIR/pull_update_backend.sh" '#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/artincam/repo}"
INSTALL_SCRIPTS="${INSTALL_SCRIPTS:-$REPO_DIR/install_scripts}"

cd "$REPO_DIR"
git pull

export ROOT_DIR="$REPO_DIR"
sudo "$INSTALL_SCRIPTS/95-install-update-scripts.sh" >/dev/null 2>&1 || true
sudo /opt/artincam/bin/update_backend.sh
'
