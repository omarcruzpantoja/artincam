#!/bin/bash
set -e  # exit on error

# ----- CONFIG -----
VERSION=1.25.3                   # Go version (check https://go.dev/dl/)
ARCH=arm64                       # arm64 for 64-bit OS, armv6l for 32-bit OS
INSTALL_DIR="$HOME/.local/share" # Install location
GOROOT="$INSTALL_DIR/go"
GOPATH="$INSTALL_DIR/gopath"

# ----- DETECT SHELL -----
case "$(basename "$SHELL")" in
  zsh)  SHELL_RC="$HOME/.zshrc" ;;
  bash) SHELL_RC="$HOME/.bashrc" ;;
  fish) SHELL_RC="$HOME/.config/fish/config.fish" ;;
  *)    echo "❌ Unsupported shell: $SHELL"; exit 1 ;;
esac

# ----- DOWNLOAD & EXTRACT -----
echo "📦 Downloading Go $VERSION for $ARCH..."
wget -q "https://go.dev/dl/go${VERSION}.linux-${ARCH}.tar.gz" -O /tmp/go.tar.gz

echo "📂 Installing to $GOROOT..."
rm -rf "$GOROOT"
tar -C "$INSTALL_DIR" -xzf /tmp/go.tar.gz
rm /tmp/go.tar.gz

# ----- UPDATE RC FILE -----
echo "🧩 Updating $SHELL_RC..."
grep -Ev "GOROOT|GOPATH|go/bin" "$SHELL_RC" 2>/dev/null > "${SHELL_RC}.tmp" || true
mv "${SHELL_RC}.tmp" "$SHELL_RC"

cat >> "$SHELL_RC" <<EOF

# --- Go $VERSION ---
export GOROOT=$GOROOT
export GOPATH=$GOPATH
export PATH=\$PATH:\$GOROOT/bin:\$GOPATH/bin
EOF

# ----- RELOAD ENVIRONMENT -----
# shellcheck disable=SC1090
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


# ----- CREATE DB ------
# DB_PATH="artincam-be/src/db/artincam-be.db"

# # Ensure db folder exists
# mkdir -p "$(dirname "$DB_PATH")"

# # Create SQLite database file (if not exists)
# if [ ! -f "$DB_PATH" ]; then
#     echo "📦 Creating SQLite database at $DB_PATH..."
#     sqlite3 "$DB_PATH" "VACUUM;"
#     echo "✅ Database created."
# else
#     echo "ℹ️ Database already exists at $DB_PATH"
# fi

# # Optional: verify
# file "$DB_PATH"
