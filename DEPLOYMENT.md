# Deployment & Execution Guide for Sentrix Control Plane

This document provides step-by-step instructions for running Sentrix **locally**, in **Docker/Containers**, on **Kubernetes**, and on **Cloud Platforms** (Google Cloud Run, AWS App Runner/ECS, Azure Container Apps, DigitalOcean, Heroku/Render).

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Environment Variables & Configuration](#2-environment-variables--configuration)
3. [Running Locally (Bare-Metal / Developer Machine)](#3-running-locally-bare-metal--developer-machine)
4. [Running with Docker & Docker Compose](#4-running-with-docker--docker-compose)
5. [Deploying to Kubernetes (GKE, EKS, AKS, Minikube, K3s)](#5-deploying-to-kubernetes-gke-eks-aks-minikube-k3s)
6. [Deploying to Cloud Providers](#6-deploying-to-cloud-providers)
   - [Google Cloud Run (Serverless Container)](#a-google-cloud-run)
   - [AWS (App Runner / ECS Fargate)](#b-aws-app-runner--ecs)
   - [Azure Container Apps](#c-azure-container-apps)
   - [Render / Railway / Fly.io](#d-render--railway--flyio)
7. [Production Health Checks & Troubleshooting](#7-production-health-checks--troubleshooting)

---

## 1. Prerequisites

- **Node.js**: `v18.x`, `v20.x`, or `v22.x` (LTS recommended)
- **Package Manager**: `npm` (v9+), `pnpm`, or `yarn`
- **Docker** (Optional, for containerized deployments): `v20.10+`
- **Gemini API Key** (Optional, for AI SRE Copilot & Automated RCA): Get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## 2. Environment Variables & Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

| Variable | Required | Description | Example / Default |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Optional | Powers Gemini 3.7 Flash & 3.1 Pro SRE Copilot | `AIzaSyD...` |
| `NVIDIA_API_KEY` | Optional | Enables DeepSeek-R1 & Llama 3.3 via NVIDIA NIM | `nvapi-...` |
| `CURSOR_API_KEY` | Optional | Enables Claude 3.7 / OpenAI bridge integration | `sk-...` |
| `PORT` | Optional | Internal server listening port | `3000` |
| `NODE_ENV` | Optional | Environment mode (`development` or `production`) | `production` |

> 💡 **Note**: Sentrix includes built-in graceful fallbacks. If no API key is set in `.env`, you can paste or detect keys directly in the **"AI Key & Model Detector"** tab in the web UI at runtime!

---

## 3. Running Locally (Bare-Metal / Developer Machine)

### Quick Start (Development Mode with Live Reload)

```bash
# 1. Clone your project or extract files
cd sentrix

# 2. Install all dependencies
npm install

# 3. Start the unified development server (Vite + Express backend)
npm run dev
```

The application will start on **`http://localhost:3000`**.

### Production Mode (Local Build & Start)

```bash
# 1. Build the frontend client and bundle the backend server
npm run build

# 2. Run the production-bundled server
npm run start
```

---

## 4. Running with Docker & Docker Compose

### Using `docker build` & `docker run`

```bash
# 1. Build the Docker container image
docker build -t sentrix-sre:latest .

# 2. Run container on port 3000
docker run -d \
  --name sentrix \
  -p 3000:3000 \
  -e GEMINI_API_KEY="your-gemini-key" \
  sentrix-sre:latest
```

Open `http://localhost:3000` in your browser.

### Using Docker Compose

```bash
# Start container in detached mode
docker compose up -d

# View real-time server logs
docker compose logs -f

# Stop container
docker compose down
```

---

## 5. Deploying to Kubernetes (GKE, EKS, AKS, Minikube, K3s)

Deploy Sentrix as a Kubernetes Deployment and Service using standard manifests:

```yaml
# sentrix-k8s.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sentrix-control-plane
  labels:
    app: sentrix
spec:
  replicas: 2
  selector:
    matchLabels:
      app: sentrix
  template:
    metadata:
      labels:
        app: sentrix
    spec:
      containers:
      - name: sentrix
        image: sentrix-sre:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: sentrix-secrets
              key: gemini-api-key
              optional: true
        resources:
          requests:
            cpu: "250m"
            memory: "256Mi"
          limits:
            cpu: "1000m"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 15
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: sentrix-service
spec:
  type: ClusterIP # Or LoadBalancer for public IP
  selector:
    app: sentrix
  ports:
  - port: 80
    targetPort: 3000
```

Apply to your cluster:
```bash
kubectl apply -f sentrix-k8s.yaml
```

---

## 6. Deploying to Cloud Providers

### A. Google Cloud Run
Google Cloud Run is ideal for serverless container deployment:

```bash
# 1. Build and push to Google Artifact Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/sentrix:latest

# 2. Deploy to Cloud Run (port 3000)
gcloud run deploy sentrix \
  --image gcr.io/YOUR_PROJECT_ID/sentrix:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars GEMINI_API_KEY="your-key"
```

### B. AWS (App Runner / ECS)
- **AWS App Runner**:
  - Connect your GitHub repository or ECR container image.
  - Set Port to `3000`.
  - Build command: `npm install && npm run build`
  - Start command: `node dist/server.cjs`
- **AWS ECS (Fargate)**:
  - Create a task definition exposing port `3000` with 0.5 vCPU and 1 GB memory.

### C. Azure Container Apps
```bash
az containerapp up \
  --name sentrix-app \
  --resource-group sentrix-rg \
  --location eastus \
  --source . \
  --target-port 3000 \
  --ingress external
```

### D. Render / Railway / Fly.io
- **Render**:
  - Environment: `Node`
  - Build Command: `npm install && npm run build`
  - Start Command: `npm run start` (or `node dist/server.cjs`)
  - Add Environment Variable: `NODE_ENV=production`

- **Fly.io**:
  ```bash
  fly launch
  fly deploy
  ```

---

## 7. Production Health Checks & Troubleshooting

- **Health Check Endpoint**: `GET /api/health` -> Returns `{"status":"ok"}`
- **AI Models Endpoint**: `GET /api/ai/models` -> Returns active model and detected providers
- **Key Inspection**: `POST /api/ai/inspect-key-models` -> Live model inspection against Google, OpenAI, Groq, NVIDIA NIM APIs.

### Common Troubleshooting Tips
1. **Port in use error**: If port 3000 is occupied, set `PORT=3001` or stop the existing process (`kill $(lsof -t -i:3000)`).
2. **Missing dist folder on production start**: Ensure `npm run build` ran successfully before executing `node dist/server.cjs` or `npm run start`.
3. **AI Copilot not responding**: Verify your `GEMINI_API_KEY` in `.env` or use the in-app **"AI Key & Model Detector"** tab to test and verify your key.
