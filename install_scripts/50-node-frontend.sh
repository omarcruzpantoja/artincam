#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/lib.sh"

need_cmd curl

SRC_DIR="$ROOT_DIR/artincam-fe"
[[ -d "$SRC_DIR" ]] || die "Frontend source dir not found: $SRC_DIR"

# --- fnm (Node manager) ---
FNM_DIR="$HOME/.local/share/fnm"
FNM_BIN="$FNM_DIR/fnm"
FNM_VERSION="${FNM_VERSION:-1.38.1}"

if [[ -x "$FNM_BIN" ]]; then
  log "fnm already installed: $("$FNM_BIN" --version)"
else
  log "Installing fnm..."
  curl -fsSL https://fnm.vercel.app/install | bash
fi

# Make fnm available in this non-interactive script run
export PATH="$FNM_DIR:$PATH"
need_cmd fnm

# Ensure fnm version (reinstall if mismatch)
if ! fnm --version | grep -q "$FNM_VERSION"; then
  warn "fnm version mismatch. Expected $FNM_VERSION. Reinstalling..."
  curl -fsSL https://fnm.vercel.app/install | bash
  need_cmd fnm
  fnm --version | grep -q "$FNM_VERSION" || die "fnm install failed to reach version $FNM_VERSION"
fi

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

# --- pnpm ---
PNPM_VERSION="${PNPM_VERSION:-10.28.2}"

if command -v pnpm >/dev/null 2>&1; then
  INSTALLED_PNPM="$(pnpm --version || true)"
  if [[ "$INSTALLED_PNPM" == "$PNPM_VERSION" ]]; then
    log "pnpm already installed: v$INSTALLED_PNPM"
  else
    warn "pnpm installed (v$INSTALLED_PNPM) differs from target (v$PNPM_VERSION). Reinstalling."
    npm i -g "pnpm@$PNPM_VERSION"
  fi
else
  log "Installing pnpm v$PNPM_VERSION..."
  npm i -g "pnpm@$PNPM_VERSION"
fi

need_cmd pnpm

log "Building frontend..."
cd "$SRC_DIR"

pnpm install
pnpm run build

[[ -d "dist" ]] || die "Frontend build did not produce dist/ at: $SRC_DIR/dist"
log "Frontend build complete (dist/ ready)."
