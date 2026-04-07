#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/lib.sh"

# Where update scripts live
BIN_DIR="/opt/artincam/bin"

log "Installing Artincam update scripts into $BIN_DIR"
ensure_dir "$BIN_DIR"
sudo_if_needed chmod 755 "$BIN_DIR"

# Helper to write executable scripts
write_exec() {
  local path="$1"
  shift
  ensure_dir "$(dirname "$path")"
  sudo_if_needed tee "$path" >/dev/null <<EOF
$*
EOF
  sudo_if_needed chmod 755 "$path"
  log "Installed: $path"
}

# -----------------------------
# Backend updater
# -----------------------------
write_exec "$BIN_DIR/update_backend.sh" '#!/usr/bin/env bash
set -euo pipefail

# Ensure Go + user tools available (non-interactive shell safe)
export PATH="/usr/local/go/bin:$HOME/go/bin:$HOME/.local/bin:$PATH"

ROOT_DIR="${ROOT_DIR:-$(pwd)}"
INSTALL_SCRIPTS="${INSTALL_SCRIPTS:-$ROOT_DIR/install_scripts}"

# Build + deploy backend
"$INSTALL_SCRIPTS/30-backend.sh"

# Load backend env if present (for goose)
BE_DIR="${ARTINCAM_BACKEND_DIR:-/opt/artincam/artincam-be}"
if [[ -f "$BE_DIR/backend.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$BE_DIR/backend.env"
  set +a
fi

# Run migrations
( cd "$BE_DIR" && make migrate-only )

# Restart service
sudo systemctl restart artincam-be

echo "✅ Backend updated + migrated + restarted"
'

# -----------------------------
# Camera agent updater
# -----------------------------
write_exec "$BIN_DIR/update_agent.sh" '#!/usr/bin/env bash
set -euo pipefail

export PATH="$HOME/.local/bin:$PATH"

ROOT_DIR="${ROOT_DIR:-$(pwd)}"
INSTALL_SCRIPTS="${INSTALL_SCRIPTS:-$ROOT_DIR/install_scripts}"

"$INSTALL_SCRIPTS/40-python-agent.sh"

sudo systemctl restart artincam-pi-agent

echo "✅ Camera agent updated + restarted"
'

# -----------------------------
# Frontend updater
# -----------------------------
write_exec "$BIN_DIR/update_frontend.sh" '#!/usr/bin/env bash
set -euo pipefail

export PATH="$HOME/.local/share/fnm:$HOME/.local/bin:$PATH"

ROOT_DIR="${ROOT_DIR:-$(pwd)}"
INSTALL_SCRIPTS="${INSTALL_SCRIPTS:-$ROOT_DIR/install_scripts}"

"$INSTALL_SCRIPTS/90-deploy-frontend.sh"

echo "✅ Frontend rebuilt + deployed"
'

# -----------------------------
# Update ALL
# -----------------------------
write_exec "$BIN_DIR/update_all.sh" '#!/usr/bin/env bash
set -euo pipefail

/opt/artincam/bin/update_backend.sh
/opt/artincam/bin/update_agent.sh
/opt/artincam/bin/update_frontend.sh

echo "✅ All Artincam components updated"
'

log "All update scripts installed successfully."
