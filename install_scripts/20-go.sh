#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"

GO_VERSION="${GO_VERSION:-1.25.3}"
INSTALL_DIR="${GO_INSTALL_DIR:-/usr/local}"
GOROOT="$INSTALL_DIR/go"

ARCH="$(uname -m)"
case "$ARCH" in
  aarch64|arm64) GO_ARCH="arm64" ;;
  x86_64)        GO_ARCH="amd64" ;;
  armv7l)        GO_ARCH="armv6l" ;;
  *) die "Unsupported arch for Go: $ARCH" ;;
esac

TARBALL="go${GO_VERSION}.linux-${GO_ARCH}.tar.gz"
URL="https://go.dev/dl/${TARBALL}"

# ---- Install / update Go (do NOT rely on PATH) ----
if [[ -x "/usr/local/go/bin/go" ]]; then
  INSTALLED="$(/usr/local/go/bin/go version | awk '{print $3}')"
  if [[ "$INSTALLED" == "go${GO_VERSION}" ]]; then
    log "Go already installed: $INSTALLED"
  else
    warn "Go installed ($INSTALLED) differs from target (go${GO_VERSION}). Reinstalling."
    need_cmd curl
    TMP_DIR="$(mktemp -d)"; trap 'rm -rf "$TMP_DIR"' EXIT
    curl -fsSL "$URL" -o "$TMP_DIR/go.tgz"
    sudo_if_needed rm -rf "$GOROOT"
    sudo_if_needed tar -C "$INSTALL_DIR" -xzf "$TMP_DIR/go.tgz"
  fi
else
  need_cmd curl
  TMP_DIR="$(mktemp -d)"; trap 'rm -rf "$TMP_DIR"' EXIT
  log "Downloading Go ${GO_VERSION} (${GO_ARCH})..."
  curl -fsSL "$URL" -o "$TMP_DIR/go.tgz"
  log "Installing Go to $GOROOT..."
  sudo_if_needed rm -rf "$GOROOT"
  sudo_if_needed tar -C "$INSTALL_DIR" -xzf "$TMP_DIR/go.tgz"
fi

# ---- Ensure PATH persisted for interactive shells (bash/zsh) ----
SHELL_NAME="$(basename "${SHELL:-bash}")"
case "$SHELL_NAME" in
  bash) SHELL_RC="$HOME/.bashrc" ;;
  zsh)  SHELL_RC="$HOME/.zshrc" ;;
  *)    SHELL_RC="$HOME/.bashrc"; warn "Unknown shell ($SHELL_NAME). Updating ~/.bashrc" ;;
esac

GO_PATH_LINE='export PATH="/usr/local/go/bin:$HOME/go/bin:$PATH"'
if ! grep -Fxq "$GO_PATH_LINE" "$SHELL_RC" 2>/dev/null; then
  echo "" >> "$SHELL_RC"
  echo "# Go toolchain" >> "$SHELL_RC"
  echo "$GO_PATH_LINE" >> "$SHELL_RC"
  log "Added Go to PATH in $SHELL_RC"
fi

# Make available to *this* script run
export PATH="/usr/local/go/bin:$HOME/go/bin:$PATH"

log "Installed: $(/usr/local/go/bin/go version)"

# ---- Install Go CLIs ----
SWAG_VERSION="${SWAG_VERSION:-latest}"
GOOSE_VERSION="${GOOSE_VERSION:-latest}"

log "Installing Go CLIs (swag, goose)..."
go install "github.com/swaggo/swag/cmd/swag@${SWAG_VERSION}"
go install -tags='no_clickhouse no_libsql no_mssql no_mysql no_vertica no_ydb' \
  "github.com/pressly/goose/v3/cmd/goose@${GOOSE_VERSION}"

# ---- Make Go CLIs globally accessible (fixes sudo/systemd PATH issues) ----
GOPATH_BIN="$(go env GOPATH)/bin"
for tool in swag goose; do
  if [[ -x "$GOPATH_BIN/$tool" ]]; then
    sudo_if_needed cp "$GOPATH_BIN/$tool" "/usr/local/bin/$tool"
    sudo_if_needed chmod +x "/usr/local/bin/$tool"
    log "Installed global $tool -> /usr/local/bin/$tool"
  else
    warn "Expected tool not found at $GOPATH_BIN/$tool"
  fi
done
