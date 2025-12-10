#!/bin/bash
set -e  # exit on error

# ----- DETECT SHELL -----
case "$(basename "$SHELL")" in
  zsh)  SHELL_RC="$HOME/.zshrc" ;;
  bash) SHELL_RC="$HOME/.bashrc" ;;
  fish) SHELL_RC="$HOME/.config/fish/config.fish" ;;
  *)    echo "❌ Unsupported shell: $SHELL"; exit 1 ;;
esac

# ----- INSTALL GO -----
# ----- CONFIG -----
VERSION=1.25.3                   # Go version (check https://go.dev/dl/)
ARCH=arm64                       # arm64 for 64-bit OS, armv6l for 32-bit OS
INSTALL_DIR="/usr/local" # Install location
GOROOT="$INSTALL_DIR/go"
GOPATH="$INSTALL_DIR/gopath"

# ----- CHECK EXISTING GO INSTALL -----
if command -v go >/dev/null 2>&1; then
    INSTALLED_VER=$(go version | awk '{print $3}')
    echo "✅ Go is already installed: $INSTALLED_VER"
    echo "Skipping installation..."
else

  # ----- DOWNLOAD & EXTRACT -----
  echo "📦 Downloading Go $VERSION for $ARCH..."
  wget -q "https://go.dev/dl/go${VERSION}.linux-${ARCH}.tar.gz" -O ./go.tar.gz

  echo "📂 Installing to $GOROOT..."
  rm -rf "$GOROOT"
  tar -C "$INSTALL_DIR" -xzf ./go.tar.gz
  rm ./go.tar.gz

  echo "✅ Go $VERSION installed."
fi

# ----- ENSURE PATH ENTRY -----
GO_PATH_LINE="export PATH=\$PATH:$INSTALL_DIR/go/bin"

if ! grep -Fxq "$GO_PATH_LINE" "$SHELL_RC"; then
    echo "$GO_PATH_LINE" >> "$SHELL_RC"
    echo "🛠️ Added Go to PATH in $SHELL_RC"
    export PATH=$PATH:$INSTALL_DIR/go/bin
else
    echo "ℹ️ PATH entry already exists in $SHELL_RC"
fi

# ----- RELOAD ENVIRONMENT -----
source "$SHELL_RC"

# ----- VERIFY INSTALL -----
if command -v go >/dev/null; then
    echo "✅ Installed: $(go version)"
    echo "📦 Installing swag CLI..."
    go install github.com/swaggo/swag/cmd/swag@latest
    echo "🎉 Go $VERSION installed successfully."
else
    echo "❌ Go not found in PATH. Run: source $SHELL_RC"
    exit 1
fi

echo "Please restart your terminal or run 'source $SHELL_RC' to apply changes."