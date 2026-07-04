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
   - **Source Repository URL**: *Your Infrastructure Repository URL* (e.g., `https://github.com/Arshshikha/ai-task-infra.git`)
   - **Revision**: `HEAD` (or `main`)
   - **Path**: `./`
   - **Destination Cluster**: `https://kubernetes.default.svc`
   - **Namespace**: `ai-task-platform` (matches namespace.yaml)
4. Click **Create** and watch Argo CD automatically provision all workloads.

---

## Production Cloud Deployment (Live URL Setup)

To obtain a **Live Deployment URL** for demonstration purposes, you can deploy the services to free-tier cloud platforms.

### Step 1: Managed Databases Setup
1. **MongoDB**:
   - Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database).
   - In the Network Access tab, add IP address `0.0.0.0/0` (allow access from anywhere) for temporary testing.
   - Go to Database Access and create a database user with password.
   - Copy your connection string: `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority`
2. **Redis**:
   - Create a free Redis instance on [Upstash](https://upstash.com/).
   - Copy the Redis URL: `rediss://default:<password>@<endpoint>:<port>`

### Step 2: Deploy Backend API on Render
1. Sign up on [Render](https://render.com/) and connect your GitHub account.
2. Click **New +** > **Web Service**.
3. Connect the application repository: `AI-Task-Processor`.
4. Configure the service:
   - **Name**: `ai-task-backend`
   - **Runtime**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. Add the following **Environment Variables**:
   - `MONGO_URI`: *Your MongoDB Atlas connection string*
   - `REDIS_URL`: *Your Upstash Redis connection string*
   - `JWT_SECRET`: *A secure random string (e.g., my_super_secret_jwt_key)*
   - `PORT`: `5000`
6. Click **Deploy**. Note down the backend URL once deployed (e.g., `https://ai-task-backend-xxxx.onrender.com`).

### Step 3: Deploy Background Worker on Render
1. In the Render Dashboard, click **New +** > **Background Worker**.
2. Connect the same repository: `AI-Task-Processor`.
3. Configure the worker:
   - **Name**: `ai-task-worker`
   - **Runtime**: `Python`
   - **Root Directory**: `worker`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python worker.py`
4. Add the following **Environment Variables**:
   - `MONGO_URI`: *Your MongoDB Atlas connection string*
   - `REDIS_URL`: *Your Upstash Redis connection string*
5. Click **Deploy**.

### Step 4: Deploy Frontend on Vercel
1. Sign up on [Vercel](https://vercel.com/) and connect your GitHub account.
2. Click **Add New** > **Project** and import the `AI-Task-Processor` repository.
3. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
4. Expand the **Environment Variables** section and add:
   - `VITE_API_URL`: `https://your-backend-backend-xxxx.onrender.com/api` (Replace with your actual Render backend URL, appending `/api` at the end)
5. Click **Deploy**. Vercel will build the frontend and provide your **Live Deployment URL** (e.g., `https://ai-task-frontend-xxxx.vercel.app`).

---

## Argo CD Dashboard Screenshot

The screenshot of the Argo CD Dashboard showing successful synchronization of the application workloads can be found in the root of the repository as:
- [argocd-dashboard.png](file:///c:/Users/arshshikha%20yadav/Documents/Assignment%20Project/argocd-dashboard.png)

