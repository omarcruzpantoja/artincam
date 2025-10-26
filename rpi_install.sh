#!/bin/bash
set -e  # exit on error

# ----- GOLANG INSTALL -----
VERSION=1.25.3  # check https://go.dev/dl/
ARCH=arm64      # arm64 for 64-bit OS, armv6l for 32-bit OS

INSTALL_DIR="$HOME/.local/share"
GOROOT="$INSTALL_DIR/go"              # toolchain location
GOPATH="$HOME/.local/share/gopath"    # workspace
SHELL_TYPE=$(basename "$SHELL")

echo "Downloading Go $VERSION for $ARCH..."
wget -q https://go.dev/dl/go${VERSION}.linux-${ARCH}.tar.gz -O /tmp/go.tar.gz
echo "Extracting..."
rm -rf "$GOROOT" && tar -C "$INSTALL_DIR" -xzf /tmp/go.tar.gz
rm /tmp/go.tar.gz
echo "Extraction complete."

# pick RC file
if [ "$SHELL_TYPE" = "zsh" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ "$SHELL_TYPE" = "bash" ]; then
    SHELL_RC="$HOME/.bashrc"
elif [ "$SHELL_TYPE" = "fish" ]; then
    SHELL_RC="$HOME/.config/fish/config.fish"
else
    echo "Unsupported shell: $SHELL_TYPE"
    exit 1
fi

echo "Updating $SHELL_RC..."

# clean duplicates first
grep -v "GOROOT" "$SHELL_RC" 2>/dev/null | grep -v "GOPATH" | grep -v "go/bin" > "${SHELL_RC}.tmp" || true
mv "${SHELL_RC}.tmp" "$SHELL_RC"

# add env vars
{
    echo ""
    echo "# --- Go $VERSION ---"
    echo "export GOROOT=$GOROOT"
    echo "export GOPATH=$GOPATH"
    echo 'export PATH=$PATH:$GOROOT/bin:$GOPATH/bin'
} >> "$SHELL_RC"

# reload environment
source "$SHELL_RC"

# verify
if command -v go >/dev/null; then
    echo "Installed: $(go version)"

    # install swag latest
    go install github.com/swaggo/swag/cmd/swag@latest
else
    echo "❌ Go not found in PATH. Run: source $SHELL_RC"
    exit 1
fi

echo "✅ Go $VERSION installed successfully."

# TODO: add mediamtx setup, installation and configuration as a service