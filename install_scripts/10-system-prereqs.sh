#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"

need_cmd sudo
need_cmd apt

log "Installing system prerequisites..."
sudo_if_needed apt update

sudo_if_needed apt install -y \
  ca-certificates \
  curl \
  wget \
  tar \
  git \
  make \
  rsync \
  build-essential \
  pkg-config \
  ffmpeg \
  nginx \
  python3 \
  python3-pip

log "System prerequisites installed."
