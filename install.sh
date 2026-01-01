#!/usr/bin/env bash
set -euo pipefail

# Orchestrator entrypoint
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$ROOT_DIR/install_scripts"

# shellcheck source=/dev/null
source "$SCRIPTS_DIR/lib.sh"

usage() {
  cat <<'EOF'
Usage:
  ./install.sh [--all] [--system] [--go] [--backend] [--agent] [--frontend] [--nginx] [--yes]

Options:
  --all       Run everything (default if no flags provided)
  --system    Install apt/system prerequisites
  --go        Install Go toolchain
  --backend   Build backend + run migrations
  --agent     Install python agent deps (uv/venv/sync)
  --frontend  Install node + build frontend
  --nginx     Install nginx (and optionally drop a sample site)
  --yes       Non-interactive where possible
  -h|--help   Show help

Notes:
  - Run as a normal user. The scripts will sudo when needed.
EOF
}

DO_SYSTEM=0
DO_GO=0
DO_BACKEND=0
DO_AGENT=0
DO_FRONTEND=0
DO_NGINX=0
AUTO_YES=0

if [[ $# -eq 0 ]]; then
  DO_SYSTEM=1 DO_GO=1 DO_BACKEND=1 DO_AGENT=1 DO_FRONTEND=1 DO_NGINX=1
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --all)      DO_SYSTEM=1 DO_GO=1 DO_BACKEND=1 DO_AGENT=1 DO_FRONTEND=1 DO_NGINX=1 ;;
    --system)   DO_SYSTEM=1 ;;
    --go)       DO_GO=1 ;;
    --backend)  DO_BACKEND=1 ;;
    --agent)    DO_AGENT=1 ;;
    --frontend) DO_FRONTEND=1 ;;
    --nginx)    DO_NGINX=1 ;;
    --yes)      AUTO_YES=1 ;;
    -h|--help)  usage; exit 0 ;;
    *)          echo "Unknown arg: $1"; usage; exit 1 ;;
  esac
  shift
done

export ROOT_DIR SCRIPTS_DIR AUTO_YES

log "Root: $ROOT_DIR"

run_step "$SCRIPTS_DIR/00-preflight.sh"

(( DO_SYSTEM ))   && run_step "$SCRIPTS_DIR/10-system-prereqs.sh"
(( DO_GO ))       && run_step "$SCRIPTS_DIR/20-go.sh"
(( DO_BACKEND ))  && run_step "$SCRIPTS_DIR/30-backend.sh"
(( DO_AGENT ))    && run_step "$SCRIPTS_DIR/40-python-agent.sh"
(( DO_FRONTEND )) && run_step "$SCRIPTS_DIR/50-node-frontend.sh"
(( DO_NGINX ))    && run_step "$SCRIPTS_DIR/60-nginx.sh"

log "Done. If PATH updates were made, restart your terminal or: source ~/.bashrc"
