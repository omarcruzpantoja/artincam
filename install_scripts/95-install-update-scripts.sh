#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"

BIN_DIR="/opt/artincam/bin"
ensure_dir "$BIN_DIR"
sudo_if_needed chmod 755 "$BIN_DIR"

# Helper: write executable script
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

# --- update_backend.sh ---
write_exec "$BIN_DIR/update_backend.sh" '#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-$(pwd)}"
INSTALL_SCRIPTS="${INSTALL_SCRIPTS:-$ROOT_DIR/install_scripts}"

bash "$INSTALL_SCRIPTS/30-backend.sh"

# Run migrations (uses env file if you want; otherwise set vars here)
BE_DIR="${ARTINCAM_BACKEND_DIR:-/opt/artincam/artincam-be}"
if [[ -f "$BE_DIR/backend.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$BE_DIR/backend.env"
  set +a
fi

if command -v make >/dev/null 2>&1; then
  (cd "$BE_DIR" && make migrate-only) || true
fi

sudo systemctl restart artincam-be
echo "✅ Backend updated + service restarted"
'

# --- update_agent.sh ---
write_exec "$BIN_DIR/update_agent.sh" '#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-$(pwd)}"
INSTALL_SCRIPTS="${INSTALL_SCRIPTS:-$ROOT_DIR/install_scripts}"

bash "$INSTALL_SCRIPTS/40-python-agent.sh"
sudo systemctl restart artincam-pi-agent
echo "✅ Agent updated + service restarted"
'

# --- update_frontend.sh ---
write_exec "$BIN_DIR/update_frontend.sh" '#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-$(pwd)}"
INSTALL_SCRIPTS="${INSTALL_SCRIPTS:-$ROOT_DIR/install_scripts}"

bash "$INSTALL_SCRIPTS/50-node-frontend.sh"
bash "$INSTALL_SCRIPTS/90-deploy-frontend.sh"
echo "✅ Frontend updated + nginx reloaded"
'
