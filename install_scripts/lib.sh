#!/usr/bin/env bash
set -euo pipefail

# ---- PATH bootstrap for non-interactive shells ----
# Go (system)
if [[ -x /usr/local/go/bin/go ]]; then
  export PATH="/usr/local/go/bin:$PATH"
fi

# Go (user installs)
if [[ -d "$HOME/go/bin" ]]; then
  export PATH="$HOME/go/bin:$PATH"
fi

# uv default install path
if [[ -d "$HOME/.local/bin" ]]; then
  export PATH="$HOME/.local/bin:$PATH"
fi

# fnm default install path
if [[ -d "$HOME/.local/share/fnm" ]]; then
  export PATH="$HOME/.local/share/fnm:$PATH"
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
  # trailing slashes matter: copy contents
  sudo_if_needed rsync -a --delete "${src%/}/" "${dst%/}/"
}
