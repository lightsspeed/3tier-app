#!/usr/bin/env bash
# =============================================================================
# build-and-load.sh
# Builds Docker images inside Minikube's Docker daemon and loads them.
# Run this from the 3tier-app/ directory.
# =============================================================================
set -euo pipefail

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

log()  { echo -e "${BLUE}[BUILD]${NC} $*"; }
ok()   { echo -e "${GREEN}[OK]${NC}    $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $*"; }

# ── Check prerequisites ───────────────────────────────────────────────────────
for cmd in docker minikube; do
  if ! command -v $cmd &>/dev/null; then
    echo -e "${RED}[ERROR]${NC} '$cmd' not found. Please install it first."; exit 1
  fi
done

log "Pointing Docker CLI to Minikube's daemon..."
eval $(minikube docker-env)

# ── Build images ──────────────────────────────────────────────────────────────
log "Building three-tier-frontend:v1 ..."
docker build -t three-tier-frontend:v1 ./frontend/
ok "Frontend image built"

log "Building three-tier-backend:v1 ..."
docker build -t three-tier-backend:v1 ./backend/
ok "Backend image built"

echo ""
ok "All images are now available in Minikube's Docker daemon."
echo -e "${YELLOW}Image list:${NC}"
docker images | grep three-tier

echo ""
echo -e "${GREEN}✅ Ready!${NC} Now push your GitOps repo and apply the ArgoCD application:"
echo "   kubectl apply -f ../3tier-gitops/argocd/application.yaml"
