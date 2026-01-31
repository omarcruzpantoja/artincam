#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"

BIN_DIR="/opt/artincam/bin"
ensure_dir "$BIN_DIR"
sudo_if_needed chmod 755 "$BIN_DIR"

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

# ------------------------------------------------------------
# Pull latest repo + rebuild/redeploy ALL + restart services
# ------------------------------------------------------------
write_exec "$BIN_DIR/pull_update_all.sh" '#!/usr/bin/env bash
set -euo pipefail

# Make sure tools are reachable in non-interactive/sudo contexts
export PATH="/usr/local/bin:/usr/local/go/bin:$HOME/go/bin:$HOME/.local/bin:$HOME/.local/share/fnm:$PATH"

REPO_DIR="${REPO_DIR:-/opt/artincam}"
INSTALL_SCRIPTS="${INSTALL_SCRIPTS:-$REPO_DIR/install_scripts}"

# Basic sanity
if [[ ! -d "$REPO_DIR/.git" ]]; then
  echo "❌ REPO_DIR is not a git repo: $REPO_DIR"
  echo "   Set REPO_DIR to your repo path (the folder containing .git)."
  exit 1
fi

cd "$REPO_DIR"

echo "⬇️  Pulling latest code in $REPO_DIR..."
git pull

# Ensure update scripts exist / are current (regenerate them each pull)
echo "🧩 (Re)installing update scripts..."
sudo "$INSTALL_SCRIPTS/95-install-update-scripts.sh"

# Export ROOT_DIR so update scripts work from anywhere
export ROOT_DIR="$REPO_DIR"

echo "🏗️  Updating ALL components..."
sudo /opt/artincam/bin/update_all.sh

echo "✅ Pull + update-all complete."
echo "🔎 Logs:"
echo "   sudo journalctl -u artincam-be -f"
echo "   sudo journalctl -u artincam-pi-agent -f"
'

log "Installed pull updater: $BIN_DIR/pull_update_all.sh"
