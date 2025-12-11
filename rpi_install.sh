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
  sudo rm -rf "$GOROOT"
  sudo tar -C "$INSTALL_DIR" -xzf ./go.tar.gz
  rm ./go.tar.gz

  echo "✅ Go $VERSION installed."
fi

# ----- ENSURE PATH ENTRY FOR GOROOT -----
GO_PATH_LINE="export PATH=\$PATH:$INSTALL_DIR/go/bin"

if ! grep -Fxq "$GO_PATH_LINE" "$SHELL_RC"; then
    echo "$GO_PATH_LINE" >> "$SHELL_RC"
    echo "🛠️ Added Go toolchain bin to PATH in $SHELL_RC"
fi

# Make available to *this* script immediately
export PATH="$PATH:$INSTALL_DIR/go/bin"


# ----- ENSURE PATH ENTRY FOR GOPATH/bin -----
GOPATH_BIN="$(go env GOPATH)/bin"
GO_GOPATH_LINE="export PATH=\$PATH:$GOPATH_BIN"

if ! grep -Fxq "$GO_GOPATH_LINE" "$SHELL_RC"; then
    echo "$GO_GOPATH_LINE" >> "$SHELL_RC"
    echo "🛠️ Added GOPATH bin to PATH in $SHELL_RC"
fi

# Make available to *this* script immediately
export PATH="$PATH:$GOPATH_BIN"


# ----- VERIFY INSTALL -----
if command -v go >/dev/null; then
    echo "✅ Installed: $(go version)"

    echo "📦 Installing swag CLI..."
    go install github.com/swaggo/swag/cmd/swag@latest

    echo "📦 Installing goose CLI..."
    go install -tags='no_clickhouse no_libsql no_mssql no_mysql no_vertica no_ydb' github.com/pressly/goose/v3/cmd/goose@latest
    echo "🎉 Go $VERSION installed successfully."
else
    echo "❌ Go not found in PATH. Run: source $SHELL_RC"
    exit 1
fi

# ------ COMPILE BACKEND -----
echo "🔧 Preparing backend..."
cd artincam-be

echo "📦 Installing backend dependencies..."
make install

echo "🏗️ Building backend..."
make build

echo "🛠️ Running DB migrations..."
export GOOSE_DRIVER=sqlite3
export GOOSE_DBSTRING=src/db/artincam-be.db
export GOOSE_MIGRATION_DIR=src/db/migrations
make migrate-only

cd ../

# ----- Set up agent script -----
echo "🔧 Setting up agent script..."
cd camera

echo "📦 Installing uv tool..."

if command -v uv >/dev/null 2>&1 && [ "$(uv --version)" = "uv 0.9.17" ]; then
    echo "✔️ uv 0.9.17 already installed — skipping installation."
else
    echo "⬇️ Installing uv 0.9.17..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
fi


if [ ! -d ".venv" ]; then
    uv venv --system-site-packages
else
    echo "📦 .venv already exists — skipping creation"
fi

uv sync --all-extras
cd ../

# ----- SETUP FRTONTEND -----

# Download and install fnm:
if command -v fnm >/dev/null 2>&1; then
    echo "✔️ fnm already installed — skipping installation."
else
    echo "⬇️ Installing fnm..."
    curl -o- https://fnm.vercel.app/install | bash
fi

FNM_PATH="/home/zacpi/.local/share/fnm"
if [ -d "$FNM_PATH" ]; then
    export PATH="$FNM_PATH:$PATH"
    eval "`fmn env `"
fi

# Download and install Node.js:
fnm install 24
fnm default 24

cd artincam-frontend
npm install
npm run build

cd ..

# ----- SETUP NGINX -----
sudo apt install -y nginx

./rpi_update_fe_app.sh

echo "Please restart your terminal or run 'source $SHELL_RC' to apply changes."
