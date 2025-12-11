#!/bin/bash

# ----- CONFIG: FRONTEND / NGINX -----
FRONTEND_NAME="artincam-fe"
FRONTEND_ROOT="/var/www/$FRONTEND_NAME"
FRONTEND_BUILD_DIR="artincam-fe/dist"  # override by exporting FRONTEND_BUILD_DIR
NGINX_SITE_AVAILABLE="/etc/nginx/sites-available/$FRONTEND_NAME"
NGINX_SITE_ENABLED="/etc/nginx/sites-enabled/$FRONTEND_NAME"

echo "📁 Preparing frontend directory at $FRONTEND_ROOT"

# Ensure build dir exists
if [ ! -d "$FRONTEND_BUILD_DIR" ]; then
  echo "❌ Frontend build directory not found: $FRONTEND_BUILD_DIR"
  echo "   Build your frontend (e.g. npm run build) or set FRONTEND_BUILD_DIR."
  exit 1
fi

# Create web root and copy built files
sudo mkdir -p "$FRONTEND_ROOT"
sudo cp -r "$FRONTEND_BUILD_DIR"/. "$FRONTEND_ROOT"/

echo "✅ Copied frontend build from $FRONTEND_BUILD_DIR to $FRONTEND_ROOT"

# ----- NGINX SERVER BLOCK -----
echo "📝 Writing Nginx config to $NGINX_SITE_AVAILABLE"

sudo tee "$NGINX_SITE_AVAILABLE" >/dev/null <<EOF
server {
    listen 80;
    server_name _;

    root $FRONTEND_ROOT;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
}
EOF


# Enable site (symlink)
if [ ! -L "$NGINX_SITE_ENABLED" ]; then
  sudo ln -s "$NGINX_SITE_AVAILABLE" "$NGINX_SITE_ENABLED"
  echo "🔗 Enabled Nginx site $FRONTEND_NAME"
else
  echo "ℹ️ Nginx site $FRONTEND_NAME already enabled"
fi

# Optionally disable default site
if [ -L /etc/nginx/sites-enabled/default ]; then
  sudo rm /etc/nginx/sites-enabled/default
  echo "🔧 Disabled default Nginx site"
fi

# Test and reload Nginx
echo "🔎 Testing Nginx configuration..."
sudo nginx -t

echo "🔁 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Nginx is serving artincam-fe from $FRONTEND_ROOT"
echo "   Visit: http://localhost"
