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
  ./install.sh [--all] [--system] [--go] [--backend] [--agent] [--frontend] [--nginx] [--mediamtx] [--services] [--deploy-frontend] [--update-scripts] [--pull-update-scripts] [--yes]

Options:
  --all                Run everything (default if no flags provided)
  --system             Install apt/system prerequisites
  --go                 Install Go toolchain
  --backend            Build backend + run migrations
  --agent              Install python agent deps (uv/venv/sync)
  --nginx              Install nginx
  --mediamtx           Install MediaMTX + config + systemd service
  --services           Install systemd services (backend + pi-agent)
  --deploy-frontend    Deploy built frontend + configure nginx site
  --update-scripts     Install/update scripts (local update mechanism)
  --pull-update-scripts Install/pull update scripts (git-based updater)
  --yes                Non-interactive where possible
  -h|--help            Show help

Notes:
  - Run as a normal user. The scripts will sudo when needed.
  - If PATH updates were made, restart your terminal or: source ~/.bashrc
EOF
}

DO_SYSTEM=0
DO_GO=0
DO_BACKEND=0
DO_AGENT=0
DO_NGINX=0
DO_MEDIAMTX=0
DO_SERVICES=0
DO_DEPLOY_FRONTEND=0
DO_UPDATE_SCRIPTS=0
DO_PULL_UPDATE_SCRIPTS=0
AUTO_YES=0

# Default behavior: run everything
if [[ $# -eq 0 ]]; then
  DO_SYSTEM=1
  DO_GO=1
  DO_BACKEND=1
  DO_AGENT=1
  DO_NGINX=1
  DO_MEDIAMTX=1
  DO_SERVICES=1
  DO_DEPLOY_FRONTEND=1
  DO_UPDATE_SCRIPTS=1
  DO_PULL_UPDATE_SCRIPTS=1
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --all)
      DO_SYSTEM=1
      DO_GO=1
      DO_BACKEND=1
      DO_AGENT=1
      DO_NGINX=1
      DO_MEDIAMTX=1
      DO_SERVICES=1
      DO_DEPLOY_FRONTEND=1
      DO_UPDATE_SCRIPTS=1
      DO_PULL_UPDATE_SCRIPTS=1
      ;;
    --system)            DO_SYSTEM=1 ;;
    --go)                DO_GO=1 ;;
    --backend)           DO_BACKEND=1 ;;
    --agent)             DO_AGENT=1 ;;
    --nginx)             DO_NGINX=1 ;;
    --mediamtx)          DO_MEDIAMTX=1 ;;
    --services)          DO_SERVICES=1 ;;
    --deploy-frontend)   DO_DEPLOY_FRONTEND=1 ;;
    --update-scripts)    DO_UPDATE_SCRIPTS=1 ;;
    --pull-update-scripts) DO_PULL_UPDATE_SCRIPTS=1 ;;
    --yes)               AUTO_YES=1 ;;
    -h|--help)           usage; exit 0 ;;
    *)                   echo "Unknown arg: $1"; usage; exit 1 ;;
  esac
  shift
done

export ROOT_DIR SCRIPTS_DIR AUTO_YES

log "Root: $ROOT_DIR"

# Always run preflight first
run_step "$SCRIPTS_DIR/00-preflight.sh"

(( DO_SYSTEM           )) && run_step "$SCRIPTS_DIR/10-system-prereqs.sh"
(( DO_GO               )) && run_step "$SCRIPTS_DIR/20-go.sh"
(( DO_BACKEND          )) && run_step "$SCRIPTS_DIR/30-backend.sh"
(( DO_AGENT            )) && run_step "$SCRIPTS_DIR/40-python-agent.sh"
(( DO_NGINX            )) && run_step "$SCRIPTS_DIR/60-nginx.sh"
(( DO_MEDIAMTX         )) && run_step "$SCRIPTS_DIR/70-mediamtx.sh"
(( DO_SERVICES         )) && run_step "$SCRIPTS_DIR/80-services.sh"
(( DO_DEPLOY_FRONTEND  )) && run_step "$SCRIPTS_DIR/90-deploy-frontend.sh"
(( DO_UPDATE_SCRIPTS   )) && run_step "$SCRIPTS_DIR/95-install-update-scripts.sh"
(( DO_PULL_UPDATE_SCRIPTS )) && run_step "$SCRIPTS_DIR/96-install-pull-update-scripts.sh"

log "Done. If PATH updates were made, restart your terminal or: source ~/.bashrc"
