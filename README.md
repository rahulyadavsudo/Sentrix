# Sentrix - Autonomous SRE & Multi-Cloud Kubernetes Control Plane

Sentrix is an enterprise-grade **Site Reliability Engineering (SRE) & Kubernetes Autonomous Control Plane**. It unifies real-time container telemetry, eBPF kernel tracing, OpenTelemetry distributed tracing, AI-driven root cause analysis (RCA), progressive canary rollouts, multi-cloud disaster recovery, and 1-click self-healing into a single, intuitive interface.

---

## 🌟 Table of Contents
- [Executive Overview](#executive-overview)
- [How Sentrix Helps in Day-to-Day Operations](#how-sentrix-helps-in-day-to-day-operations)
- [Core Architecture & Capabilities](#core-architecture--capabilities)
- [Key Modules & Feature Breakdown](#key-modules--feature-breakdown)
- [Interactive Controls & Simulations Explained](#interactive-controls--simulations-explained)
- [Security & RBAC Least-Privilege Model](#security--rbac-least-privilege-model)
- [Technology Stack](#technology-stack)
- [Getting Started & Local Development](#getting-started--local-development)

---

## 🚀 Executive Overview

Modern cloud architectures span hundreds of microservices across multiple cloud providers (**Google Cloud GKE, AWS EKS, Azure AKS, and Bare-Metal edge nodes**). When outages, cascading latency spikes, or memory leaks occur, engineering teams often waste precious hours switching between disparate monitoring dashboards, log aggregators, and terminal windows.

**Sentrix solves this by acting as an Autonomous Sentry**:
1. **Detects**: Ingests sub-second metrics, eBPF kernel telemetry, and distributed traces.
2. **Diagnoses**: Leverages Gemini AI models to analyze logs, trace spans, and flamegraphs to deliver instant Root Cause Analysis (RCA).
3. **Remediates**: Executes safe, policy-governed automated healing actions (rolling restarts, horizontal pod scaling, circuit breaking, DNS traffic shifting, and Helm rollbacks).

---

## 💼 How Sentrix Helps in Day-to-Day Operations

### 1. **For Site Reliability Engineers (SREs)**
- **No More 3:00 AM Alert Fatigue**: Sentrix filters noise, groups correlated errors, and initiates autonomous runbooks before SLO error budgets are depleted.
- **Predictive OOM Watchdog**: Catches memory leaks hours before the Linux kernel triggers an `OOMKilled (Exit Code 137)` pod termination.
- **Flamegraph & Kernel Visibility**: Instantly identify bottleneck functions and CPU hotspots using eBPF kernel probes without code instrumentation.

### 2. **For DevOps & Platform Engineers**
- **Unified Multi-Cloud Federation**: Monitor GKE, EKS, AKS, and edge clusters from one central dashboard.
- **GitOps & Helm CRD Registry**: Inspect Custom Resource Definitions (KEDA, Istio, Prometheus Operator) and perform instant 1-click Helm release rollbacks.
- **Secret Security**: Manage HashiCorp Vault secrets, rotation schedules, and MTLS certificates with zero plaintext exposure.

### 3. **For Developers & Engineering Leads**
- **Continuous Load Testing & Chaos Simulations**: Stress-test services with synthetic traffic and chaos faults (latency injection, pod kills, network drops) before releasing to production.
- **Progressive Delivery & Canary Rollouts**: Safely route 10% → 25% → 50% → 100% of user traffic to new container versions with automatic rollbacks if error rates exceed thresholds.
- **FinOps Cloud Cost Optimization**: Identify underutilized nodes, oversized CPU/memory requests, and idle pods to cut monthly cloud spend.

---

## 🛠 Core Architecture & Capabilities

```
                  ┌──────────────────────────────────────────────┐
                  │          SENTRIX WEB CONTROL PLANE           │
                  │   (React 18 + Vite + Tailwind CSS + D3.js)   │
                  └──────────────────────┬───────────────────────┘
                                         │ REST API / WebSocket
                  ┌──────────────────────▼───────────────────────┐
                  │        SENTRIX SERVER ENGINE (Node/Express)  │
                  └──────┬───────────────────────┬──────────────┬┘
                         │                       │              │
       ┌─────────────────▼────────┐   ┌──────────▼──────────┐   │
       │   Gemini SRE AI Copilot  │   │  Auto-Heal Policy   │   │
       │  (Automated Root Cause)  │   │  & Runbook Engine   │   │
       └──────────────────────────┘   └─────────────────────┘   │
                                                                │
  ┌─────────────────────────────────────────────────────────────▼──────────────────────────┐
  │                           FEDERATED KUBERNETES FLEET PLANE                             │
  │  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────┐  │
  │  │ Google Cloud GKE │    │  Amazon AWS EKS  │    │ Microsoft Azure  │    │ BareMetal│  │
  │  │  (Primary Ingress│    │   (Secondary)    │    │      (AKS)       │    │  (Edge)  │  │
  │  └──────────────────┘    └──────────────────┘    └──────────────────┘    └──────────┘  │
  └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Key Modules & Feature Breakdown

| Module | Purpose & Capabilities |
| :--- | :--- |
| **Cluster Topology & Health** | Real-time interactive node and pod map with CPU/RAM gauges, pod statuses, and service dependencies. |
| **Multi-Cluster Fleet Manager** | Global control plane with 1-click kubeconfig onboarding, API ping latency, and DNS traffic weight sliders. |
| **Predictive Leak Radar** | Memory growth trajectory modeling to forecast OOM crashes before they impact users. |
| **Distributed Tracing & Flamegraph** | End-to-end OpenTelemetry trace visualizer with call waterfalls, span durations, and hierarchical CPU flamegraphs. |
| **eBPF Kernel Tracer** | Low-overhead kernel telemetry tracking syscalls, TCP retransmissions, socket drops, and page faults. |
| **Incident Hub & Gemini Copilot** | Active incident triage board paired with an interactive AI SRE assistant for instant troubleshooting. |
| **Auto-Heal Policy Engine** | Configurable auto-remediation rules (restart, scale, isolate, rollback) with safe execution cooldowns. |
| **Canary Control Panel** | Progressive delivery orchestrator with real-time error budget tracking and instant emergency rollbacks. |
| **Disaster Recovery (DR) Hub** | Automated cross-region failover between GCP, AWS, and Azure with state backup synchronization. |
| **KEDA Event-Driven Autoscaler** | ScaledObject manager for queue-based and event-driven pod scaling (Kafka, RabbitMQ, Redis, Prometheus). |
| **Zero-Trust Secrets Vault** | Enterprise KMS & HashiCorp Vault manager with automated lease rotations and secret masking. |
| **FinOps Cloud Cost Optimizer** | Real-time resource waste detection, over-provisioning alerts, and automated right-sizing recommendations. |
| **Runbook Automation Studio** | Low-code executable SRE runbooks for diagnostic dumps, database failovers, and cache warming. |

---

## ⚡ Interactive Controls & Simulations Explained

Sentrix provides realistic simulation triggers to test your SRE alerting and auto-healing workflows:

1. **`Simulate Incident` (Memory Leak / Latency Spike / Pod Crash)**:
   - Triggers real-time alert notifications and displays root-cause diagnosis.
   - If **Auto-Healing** is active, Sentrix automatically resolves the incident without manual intervention.

2. **`Inject Leak Alert`**:
   - Simulates a slow memory leak in targeted microservices (`payment-gateway`, `auth-service`).
   - Demonstrates how predictive radar warns the team prior to hard OOM limits.

3. **`Dispatch CI/CD Run`**:
   - Triggers an automated build, linting, Trivy container security scan, and Helm staging release.

4. **`Trigger Pipeline / Canary Rollout`**:
   - Gradually shifts live ingress traffic (10% → 50% → 100%) to test new deployment stability.

---

## 🔒 Security & RBAC Least-Privilege Model

Sentrix enforces **Zero-Write Least-Privilege Observability**:
- **Read-Only Inspection**: Ingests only `[get, list, watch]` permissions across Pods, Nodes, Metrics, and Ingresses.
- **Mutation Safeguards**: Disallows cluster-admin write, patch, or delete privileges.
- **Built-in RBAC Generator**: Provides production-ready YAML for `ClusterRole`, `ClusterRoleBinding`, and restricted `ServiceAccount` creation.

---

## 💻 Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, D3.js, Motion
- **Backend Server**: Node.js, Express, TypeScript, tsx, esbuild
- **Intelligence**: Gemini API (@google/genai) for autonomous SRE reasoning & diagnostic summaries
- **Observability Standards**: OpenTelemetry trace formats, eBPF schema, Prometheus metrics, Kubernetes v1.31+ API specs

---

## 🚀 Getting Started & Deployment Guides

For complete, detailed instructions for every platform, refer to the dedicated **[DEPLOYMENT.md](./DEPLOYMENT.md)** guide.

### 1. Local Machine / Bare-Metal

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional)
cp .env.example .env

# 3. Start development server with live reload (port 3000)
npm run dev

# Or build & start in production mode:
npm run build
npm run start
```
Open **`http://localhost:3000`** in your browser.

---

### 2. Docker & Docker Compose

```bash
# Run with Docker Compose
docker compose up -d

# Or build and run standalone container
docker build -t sentrix-sre .
docker run -d -p 3000:3000 -e GEMINI_API_KEY="your-key" sentrix-sre
```

---

### 3. Kubernetes Deployment (GKE, EKS, AKS, K3s)

```bash
# Apply deployment and service manifests
kubectl apply -f sentrix-k8s.yaml
```

---

### 4. Cloud Deployments (Cloud Run, AWS App Runner, Azure Container Apps, Render)

- **Google Cloud Run**: `gcloud run deploy sentrix --source . --port 3000 --allow-unauthenticated`
- **Render / Railway / Fly.io**: Build Command: `npm install && npm run build`, Start Command: `npm run start` (or `node dist/server.cjs`), Port: `3000`.

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for step-by-step cloud configuration guides.

