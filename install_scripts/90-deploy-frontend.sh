#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"

FRONTEND_NAME="${FRONTEND_NAME:-artincam-fe}"
FRONTEND_ROOT="${FRONTEND_ROOT:-/var/www/${FRONTEND_NAME}}"
FRONTEND_BUILD_DIR="${FRONTEND_BUILD_DIR:-$ROOT_DIR/artincam-fe/dist}"

NGINX_SITE_AVAILABLE="/etc/nginx/sites-available/${FRONTEND_NAME}"
NGINX_SITE_ENABLED="/etc/nginx/sites-enabled/${FRONTEND_NAME}"

[[ -d "$FRONTEND_BUILD_DIR" ]] || die "Frontend build directory not found: $FRONTEND_BUILD_DIR"

log "Deploying frontend to $FRONTEND_ROOT"
ensure_dir "$FRONTEND_ROOT"
sudo_if_needed rsync -a --delete "${FRONTEND_BUILD_DIR%/}/" "${FRONTEND_ROOT%/}/"

log "Writing nginx site config: $NGINX_SITE_AVAILABLE"
sudo_if_needed tee "$NGINX_SITE_AVAILABLE" >/dev/null <<EOF
server {
    listen 80;
    server_name _;

    root ${FRONTEND_ROOT};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
}
EOF

if [[ ! -L "$NGINX_SITE_ENABLED" ]]; then
  sudo_if_needed ln -s "$NGINX_SITE_AVAILABLE" "$NGINX_SITE_ENABLED"
  log "Enabled nginx site: ${FRONTEND_NAME}"
fi

if [[ -L /etc/nginx/sites-enabled/default ]]; then
  sudo_if_needed rm /etc/nginx/sites-enabled/default
  log "Disabled default nginx site"
fi

log "Testing nginx config..."
sudo_if_needed nginx -t

log "Reloading nginx..."
sudo_if_needed systemctl reload nginx

log "Frontend deployed and nginx reloaded."
