# 3-Tier App — ArgoCD Rollback Demo

A production-style 3-tier application for testing **ArgoCD automatic rollback** using the GitOps pattern.

```
Frontend (Nginx) → Backend (Node.js/Express) → Database (PostgreSQL)
```

---

## Repository Structure

```
3tier-app/                 ← This repo (app code + Dockerfiles)
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/index.html     ← Dashboard UI
└── backend/
    ├── Dockerfile
    ├── package.json
    └── src/index.js        ← Express API
```

---

## Quick Start

### 1. Start Minikube
```bash
minikube start --driver=docker --memory=4096 --cpus=2
```

### 2. Build images inside Minikube
```bash
chmod +x build-and-load.sh
bash build-and-load.sh
```

### 3. Push GitOps repo to GitHub
Push the `3tier-gitops/` directory as a separate repo, then update the `repoURL` in:
```
3tier-gitops/argocd/application.yaml
```

### 4. Apply ArgoCD Application
```bash
kubectl apply -f ../3tier-gitops/argocd/application.yaml
```

### 5. Access the app
```bash
minikube ip       # Get the IP
# Then open: http://<minikube-ip>:30080
```

### 6. Run rollback test
```bash
cd ../3tier-gitops
export GITOPS_REPO_DIR=$(pwd)
bash test-rollback.sh
```

---

## API Endpoints

| Method | Path          | Description              |
|--------|---------------|--------------------------|
| GET    | `/health`     | Health + DB status + uptime |
| GET    | `/api/version`| Current image version    |
| GET    | `/api/data`   | All records from PostgreSQL |
| GET    | `/api/stats`  | Aggregated stats by status |

---

## Rollback Mechanism

| Scenario | How it works |
|----------|-------------|
| **Self-Heal** | You `kubectl patch` deployment to bad image → ArgoCD reverts to Git state |
| **Bad commit** | You commit `v2-broken` tag → ArgoCD syncs → `ImagePullBackOff` → run `argocd app rollback` |

> **Note**: `selfHeal: true` handles drift from Git automatically. For a bad *Git commit*, you use `argocd app rollback <revision>` or revert the commit.
