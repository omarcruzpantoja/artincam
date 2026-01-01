#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"

need_cmd apt
need_cmd sudo

log "Installing nginx..."
sudo_if_needed apt update
sudo_if_needed apt install -y nginx

log "Enabling nginx..."
sudo_if_needed systemctl enable nginx
sudo_if_needed systemctl restart nginx
