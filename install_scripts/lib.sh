#!/usr/bin/env bash
set -euo pipefail

# ---- Make ROOT_DIR always defined (works in non-interactive shells) ----
# Default ROOT_DIR to the parent directory of this install_scripts folder.
LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
: "${ROOT_DIR:=$(cd "$LIB_DIR/.." && pwd)}"
export ROOT_DIR

# ---- PATH bootstrap for non-interactive shells ----
# Always include /usr/local/bin (common place for globally installed tools)
export PATH="/usr/local/bin:$PATH"

# Go toolchain (system)
if [[ -x /usr/local/go/bin/go ]]; then
  export PATH="/usr/local/go/bin:$PATH"
fi

# Go CLIs installed to GOPATH/bin for the *current* user
if [[ -d "$HOME/go/bin" ]]; then
  export PATH="$HOME/go/bin:$PATH"
fi

# If running under sudo, also include the original user's GOPATH/bin.
# This fixes cases where tools like `swag` were installed as the normal user,
# but build scripts are run with sudo/root.
if [[ -n "${SUDO_USER:-}" && "${SUDO_USER}" != "root" ]]; then
  SUDO_HOME="$(getent passwd "$SUDO_USER" | cut -d: -f6 || true)"
  if [[ -n "${SUDO_HOME:-}" && -d "$SUDO_HOME/go/bin" ]]; then
    export PATH="$SUDO_HOME/go/bin:$PATH"
  fi
fi

# uv default install path
if [[ -d "$HOME/.local/bin" ]]; then
  export PATH="$HOME/.local/bin:$PATH"
fi

# If running under sudo, include original user's ~/.local/bin too
if [[ -n "${SUDO_USER:-}" && "${SUDO_USER}" != "root" ]]; then
  SUDO_HOME="$(getent passwd "$SUDO_USER" | cut -d: -f6 || true)"
  if [[ -n "${SUDO_HOME:-}" && -d "$SUDO_HOME/.local/bin" ]]; then
    export PATH="$SUDO_HOME/.local/bin:$PATH"
  fi
fi

# fnm default install path
if [[ -d "$HOME/.local/share/fnm" ]]; then
  export PATH="$HOME/.local/share/fnm:$PATH"
fi

# If running under sudo, include original user's fnm too
if [[ -n "${SUDO_USER:-}" && "${SUDO_USER}" != "root" ]]; then
  SUDO_HOME="$(getent passwd "$SUDO_USER" | cut -d: -f6 || true)"
  if [[ -n "${SUDO_HOME:-}" && -d "$SUDO_HOME/.local/share/fnm" ]]; then
    export PATH="$SUDO_HOME/.local/share/fnm:$PATH"
  fi
fi

log()  { printf "✅ %s\n" "$*"; }
warn() { printf "⚠️  %s\n" "$*" >&2; }
die()  { printf "❌ %s\n" "$*" >&2; exit 1; }

need_cmd() { command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"; }
have_cmd() { command -v "$1" >/dev/null 2>&1; }

sudo_if_needed() {
  if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
    sudo "$@"
  else
    "$@"
  fi
}

run_step() {
  local step="$1"
  [[ -f "$step" ]] || die "Step not found: $step"
  log "Running: $(basename "$step")"
  bash "$step"
}

is_pi() {
  [[ -f /proc/device-tree/model ]] && grep -qi "raspberry pi" /proc/device-tree/model
}

ensure_dir() {
  local d="$1"
  sudo_if_needed mkdir -p "$d"
}

file_exists() { [[ -f "$1" ]]; }

write_file_if_missing() {
  local path="$1"
  local mode="${2:-644}"

  if file_exists "$path"; then
    log "Exists (not overwriting): $path"
    return 0
  fi

  ensure_dir "$(dirname "$path")"
  sudo_if_needed tee "$path" >/dev/null
  sudo_if_needed chmod "$mode" "$path"
  log "Created: $path"
}

systemd_unit_exists() {
  local name="$1"
  systemctl list-unit-files | awk '{print $1}' | grep -qx "${name}.service"
}

systemd_reload_enable_start() {
  local name="$1"
  sudo_if_needed systemctl daemon-reload
  sudo_if_needed systemctl enable "$name"
  sudo_if_needed systemctl start "$name"
}

systemd_restart() {
  local name="$1"
  sudo_if_needed systemctl restart "$name"
}

rsync_deploy() {
  local src="$1"
  local dst="$2"

  need_cmd rsync
  ensure_dir "$dst"
  sudo_if_needed rsync -a --delete "${src%/}/" "${dst%/}/"
}
