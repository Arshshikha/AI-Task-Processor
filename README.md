# AI Task Processing Platform

A containerized, production-grade AI Task Processing Platform built using the MERN stack (MongoDB, Express, React, Node.js), a Python background worker, Redis, Docker, and Kubernetes, configured for GitOps deployment via Argo CD.

---

## Features
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing.
- **Asynchronous Task Queue**: Task creation instantly schedules text operations via a Redis broker.
- **Python worker processing**: Consumes tasks and runs operations (`uppercase`, `lowercase`, `reverse`, `word_count`).
- **Interactive UI**: Sleek dark-mode dashboard with statistics, real-time task status badges, and terminal-style console logs.
- **Kubernetes Ready**: Complete manifests including Namespace, Services, ConfigMaps, Secrets, Ingress, and Autoscaling (HPA).
- **GitOps Compliant**: Organized for automatic synchronization with Argo CD.

---

## Directory Structure

```
├── backend/               # Node.js + Express API
├── frontend/              # React + Vite Client (Nginx unprivileged web server)
├── worker/                # Python Background Worker
├── k8s/                   # Kubernetes Manifests
├── docker-compose.yml     # Local orchestration configuration
├── architecture.md        # Architecture design documentation
└── README.md              # Setup instructions
```

---

## Local Development Setup

Follow these steps to build and run the entire platform locally in seconds using Docker Compose.

### Prerequisites
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose).

### Running the Platform
1. Clone or download the workspace repository.
2. In the root directory, run the following command to build and launch all services:
   ```bash
   docker-compose up --build
   ```
3. Once running, open your browser and navigate to:
   - **Frontend (React Client)**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:5000](http://localhost:5000)
   - **Backend Health Check**: [http://localhost:5000/healthz](http://localhost:5000/healthz)

---

## Kubernetes Deployment (GitOps / Argo CD)

We provide modular manifests inside the `k8s/` folder. For Argo CD / GitOps tracking, copy the contents of the `k8s/` folder into your dedicated **Infrastructure Repository**.

### Manual Cluster Deployment
If you want to apply the configuration directly to your local cluster (e.g., K3s, Minikube, or Docker Desktop K8s):

1. **Create Namespace**:
   ```bash
   kubectl apply -f k8s/namespace.yaml
   ```

2. **Deploy Secrets & ConfigMaps**:
   ```bash
   kubectl apply -f k8s/secrets.yaml
   # Note: Update jwt-secret inside k8s/secrets.yaml with a base64 encoded value for production.
   kubectl apply -f k8s/configmap.yaml
   ```

3. **Deploy Databases (MongoDB & Redis)**:
   ```bash
   kubectl apply -f k8s/mongodb.yaml
   kubectl apply -f k8s/redis.yaml
   ```

4. **Deploy Application Components (API, Frontend & Worker)**:
   ```bash
   kubectl apply -f k8s/backend.yaml
   kubectl apply -f k8s/frontend.yaml
   kubectl apply -f k8s/worker.yaml
   ```

5. **Apply Ingress Controller Configuration**:
   ```bash
   kubectl apply -f k8s/ingress.yaml
   ```

### Argo CD Configuration (GitOps)
To deploy using GitOps:
1. Create a repository on GitHub/GitLab for your Infrastructure manifests and commit all files in the `k8s/` directory.
2. In your Argo CD dashboard, click **New App**.
3. Configure the application:
   - **Application Name**: `ai-task-processing`
   - **Project**: `default`
   - **Sync Policy**: `Automatic` (with prune resources and self-heal enabled)
   - **Source Repository URL**: *Your Infrastructure Repository URL*
   - **Revision**: `HEAD` (or `main`)
   - **Path**: `./`
   - **Destination Cluster**: `https://kubernetes.default.svc`
   - **Namespace**: `ai-task-platform` (matches namespace.yaml)
4. Click **Create** and watch Argo CD automatically provision all workloads.
