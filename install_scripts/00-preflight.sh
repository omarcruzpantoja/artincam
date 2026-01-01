#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"

need_cmd bash
need_cmd uname

if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
  die "Do not run as root. Run as a normal user; sudo will be used when needed."
fi

if [[ -z "${ROOT_DIR:-}" ]]; then
  die "ROOT_DIR is not set. Export ROOT_DIR (repo root) before running."
fi

ARCH="$(uname -m)"
log "Detected arch: $ARCH"

if ! is_pi; then
  warn "Not detected as a Raspberry Pi. Continuing anyway."
fi

# Repo sanity checks (warn only)
[[ -d "$ROOT_DIR/artincam-be" ]] || warn "Missing folder: artincam-be"
[[ -d "$ROOT_DIR/camera" ]]      || warn "Missing folder: camera"
[[ -d "$ROOT_DIR/artincam-fe" ]] || warn "Missing folder: artincam-fe"
