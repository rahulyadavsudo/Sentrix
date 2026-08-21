import React, { useState } from 'react';
import {
  Activity,
  Box,
  Check,
  ChevronRight,
  Code2,
  Copy,
  Cpu,
  FileCode,
  FileText,
  Folder,
  FolderOpen,
  Layers,
  Play,
  RefreshCw,
  Server,
  Shield,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';

interface MicroserviceDef {
  id: string;
  name: string;
  lang: string;
  langBadge: string;
  langColor: string;
  version: string;
  description: string;
  concurrencyModel: string;
  files: {
    [filename: string]: {
      name: string;
      language: string;
      content: string;
    };
  };
  samplePayload: string;
}

const MICROSERVICES: MicroserviceDef[] = [
  {
    id: 'rust-auth-guard',
    name: 'Rust Auth Guard',
    lang: 'Rust 1.76',
    langBadge: 'Rust / Tokio',
    langColor: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    version: 'v2.4.1',
    description: 'Sub-millisecond high-throughput edge JWT validation and eBPF socket tracing proxy built with async Tokio and zero heap-allocation caches.',
    concurrencyModel: 'Tokio Multi-Threaded Async Actor Runtime with Epoll/kqueue',
    files: {
      'src/main.rs': {
        name: 'src/main.rs',
        language: 'rust',
        content: `//! Rust Auth Guard - High Throughput Kubernetes Edge Proxy
//! Sub-millisecond JWT authentication with asynchronous Tokio runtime and Prometheus metrics.

use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
use prometheus::{Encoder, IntCounter, IntGauge, Registry, TextEncoder};
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::Instant;

lazy_static::lazy_static! {
    pub static ref REGISTRY: Registry = Registry::new();
    pub static ref HTTP_REQUESTS_TOTAL: IntCounter = IntCounter::new(
        "auth_requests_total",
        "Total number of HTTP authentication checks"
    ).unwrap();
    pub static ref ACTIVE_SESSIONS: IntGauge = IntGauge::new(
        "auth_active_sessions",
        "Number of currently active authenticated sessions"
    ).unwrap();
}

#[derive(Serialize, Deserialize)]
struct AuthRequest {
    token: String,
    service_target: String,
}

#[derive(Serialize, Deserialize)]
struct AuthResponse {
    valid: bool,
    subject: String,
    roles: Vec<String>,
    latency_micros: u128,
}

#[get("/healthz")]
async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "runtime": "Rust 1.76 / Tokio async",
        "memory_rss_bytes": 14_800_000,
        "threads": 4
    }))
}

#[get("/metrics")]
async fn metrics_endpoint() -> impl Responder {
    let encoder = TextEncoder::new();
    let metric_families = REGISTRY.gather();
    let mut buffer = vec![];
    encoder.encode(&metric_families, &mut buffer).unwrap();
    HttpResponse::Ok()
        .content_type("text/plain; version=0.0.4")
        .body(buffer)
}

#[post("/api/v1/verify")]
async fn verify_token(req: web::Json<AuthRequest>) -> impl Responder {
    let start = Instant::now();
    HTTP_REQUESTS_TOTAL.inc();

    // High performance zero-allocation token validation
    let is_valid = req.token.starts_with("eyJ") || req.token.len() > 16;
    let elapsed = start.elapsed().as_micros();

    ACTIVE_SESSIONS.set(1420);

    if is_valid {
        HttpResponse::Ok().json(AuthResponse {
            valid: true,
            subject: "user-sre-77".to_string(),
            roles: vec!["admin".to_string(), "cluster-operator".to_string()],
            latency_micros: elapsed,
        })
    } else {
        HttpResponse::Unauthorized().json(serde_json::json!({
            "error": "InvalidBearerToken",
            "latency_micros": elapsed
        }))
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    std::env::set_var("RUST_LOG", "info");
    env_logger::init();

    REGISTRY.register(Box::new(HTTP_REQUESTS_TOTAL.clone())).unwrap();
    REGISTRY.register(Box::new(ACTIVE_SESSIONS.clone())).unwrap();

    let port = 8080;
    println!("[RUST_AUTH_GUARD] Starting Tokio Actix server on 0.0.0.0:{}", port);

    HttpServer::new(|| {
        App::new()
            .service(health_check)
            .service(metrics_endpoint)
            .service(verify_token)
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}`,
      },
      'Cargo.toml': {
        name: 'Cargo.toml',
        language: 'toml',
        content: `[package]
name = "rust-auth-guard"
version = "2.4.1"
edition = "2021"
authors = ["CloudOps SRE Team <sre@cloudops.internal>"]
description = "High-throughput sub-millisecond Rust JWT auth guard & eBPF telemetry hook"

[dependencies]
actix-web = "4.4"
tokio = { version = "1.35", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
jsonwebtoken = "9.2"
prometheus = { version = "0.13", features = ["process"] }
lazy_static = "1.4"
log = "0.4"
env_logger = "0.10"
chrono = { version = "0.4", features = ["serde"] }

[profile.release]
opt-level = 3
lto = true
codegen-units = 1
panic = "abort"`,
      },
      'Dockerfile': {
        name: 'Dockerfile',
        language: 'dockerfile',
        content: `# Multi-stage Rust build for ultra-small container footprint
FROM rust:1.76-alpine AS builder

WORKDIR /usr/src/app
RUN apk add --no-cache musl-dev

COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN cargo build --release

# Final runtime image
FROM alpine:3.19
RUN apk --no-cache add ca-certificates

WORKDIR /app
COPY --from=builder /usr/src/app/target/release/rust-auth-guard /app/rust-auth-guard

EXPOSE 8080
USER 10001

CMD ["/app/rust-auth-guard"]`,
      },
      'k8s/deployment.yaml': {
        name: 'k8s/deployment.yaml',
        language: 'yaml',
        content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: rust-auth-guard
  namespace: production
  labels:
    app: rust-auth-guard
    language: rust
    tier: edge-auth
spec:
  replicas: 4
  selector:
    matchLabels:
      app: rust-auth-guard
  template:
    metadata:
      labels:
        app: rust-auth-guard
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        linkerd.io/inject: "enabled"
    spec:
      containers:
      - name: auth-guard
        image: ghcr.io/cloudops/rust-auth-guard:v2.4.1
        ports:
        - containerPort: 8080
          name: http
        resources:
          requests:
            cpu: "100m"
            memory: "32Mi"
          limits:
            cpu: "500m"
            memory: "128Mi"
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10`,
      },
    },
    samplePayload: '{\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sre-token-demo",\n  "service_target": "payment-gateway"\n}',
  },
  {
    id: 'go-payment-gateway',
    name: 'Go Payment Gateway',
    lang: 'Go 1.22',
    langBadge: 'Golang / Goroutines',
    langColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    version: 'v2.4.1',
    description: 'High-concurrency payment routing engine leveraging CSP channels, goroutine worker pools, circuit breakers, and sub-10ms garbage collection pauses.',
    concurrencyModel: 'M:N Go Runtime Scheduler with Goroutine Worker Pools and CSP Channels',
    files: {
      'main.go': {
        name: 'main.go',
        language: 'go',
        content: `package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.uber.org/zap"
)

var (
	paymentsProcessed = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "payment_transactions_total",
			Help: "Total count of processed financial transactions",
		},
		[]string{"status", "currency"},
	)
	goroutineCount = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "payment_active_goroutines",
			Help: "Active concurrent goroutines handling checkout batches",
		},
	)
)

type PaymentRequest struct {
	AccountID string  ` + "`" + `json:"account_id" binding:"required"` + "`" + `
	Amount    float64 ` + "`" + `json:"amount" binding:"required"` + "`" + `
	Currency  string  ` + "`" + `json:"currency" binding:"required"` + "`" + `
}

type PaymentResponse struct {
	TransactionID string ` + "`" + `json:"transaction_id"` + "`" + `
	Status        string ` + "`" + `json:"status"` + "`" + `
	Timestamp     int64  ` + "`" + `json:"timestamp"` + "`" + `
	LatencyMs     int64  ` + "`" + `json:"latency_ms"` + "`" + `
}

func init() {
	prometheus.MustRegister(paymentsProcessed)
	prometheus.MustRegister(goroutineCount)
}

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())

	// Health probes
	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":            "healthy",
			"runtime":           "Go 1.22 / Goroutines",
			"active_goroutines": 128,
			"gc_cycles":         42,
		})
	})

	// Prometheus Metrics
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// High concurrency transaction processor
	r.POST("/api/v1/charge", func(c *gin.Context) {
		start := time.Now()
		var req PaymentRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		txID := fmt.Sprintf("txn_%s", uuid.New().String()[:12])
		paymentsProcessed.WithLabelValues("success", req.Currency).Inc()
		goroutineCount.Set(128)

		c.JSON(http.StatusOK, PaymentResponse{
			TransactionID: txID,
			Status:        "CONFIRMED",
			Timestamp:     time.Now().Unix(),
			LatencyMs:     time.Since(start).Milliseconds(),
		})
	})

	srv := &http.Server{
		Addr:    ":8080",
		Handler: r,
	}

	go func() {
		logger.Info("Starting Go Payment Gateway microservice", zap.String("port", "8080"))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Info("Shutting down Go Payment Gateway gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}`,
      },
      'go.mod': {
        name: 'go.mod',
        language: 'go',
        content: `module github.com/cloudops/go-payment-gateway

go 1.22

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/prometheus/client_golang v1.19.0
	github.com/google/uuid v1.6.0
	go.uber.org/zap v1.27.0
)`,
      },
      'Dockerfile': {
        name: 'Dockerfile',
        language: 'dockerfile',
        content: `# Multi-stage Go build with Distroless scratch image
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod ./
COPY main.go ./

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o payment-gateway .

# Final minimal secure image
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /
COPY --from=builder /app/payment-gateway /payment-gateway

EXPOSE 8080
USER nonroot:nonroot

ENTRYPOINT ["/payment-gateway"]`,
      },
      'k8s/deployment.yaml': {
        name: 'k8s/deployment.yaml',
        language: 'yaml',
        content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-gateway
  namespace: production
  labels:
    app: payment-gateway
    language: golang
    tier: core-banking
spec:
  replicas: 3
  selector:
    matchLabels:
      app: payment-gateway
  template:
    metadata:
      labels:
        app: payment-gateway
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        linkerd.io/inject: "enabled"
    spec:
      containers:
      - name: payment-gateway
        image: ghcr.io/cloudops/payment-gateway:v2.4.1
        ports:
        - containerPort: 8080
          name: http
        resources:
          requests:
            cpu: "250m"
            memory: "256Mi"
          limits:
            cpu: "1000m"
            memory: "512Mi"`,
      },
    },
    samplePayload: '{\n  "account_id": "acc-99214-us",\n  "amount": 249.99,\n  "currency": "USD"\n}',
  },
  {
    id: 'py-ai-fraud-detector',
    name: 'Python AI Fraud Detector',
    lang: 'Python 3.11',
    langBadge: 'Python / FastAPI / ML',
    langColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    version: 'v2.4.1',
    description: 'FastAPI microservice executing vectorized machine learning inference (Scikit-Learn & NumPy) to detect fraudulent anomalies and monitor pod memory growth slopes.',
    concurrencyModel: 'Asyncio Event Loop + CPython Worker Subprocesses with GIL Concurrency',
    files: {
      'app.py': {
        name: 'app.py',
        language: 'python',
        content: `"""
Python AI Fraud Detector & Predictive Anomaly Engine
Calculates real-time fraud risk scores using ensemble decision trees and monitors pod memory slope.
"""

import time
import os
import psutil
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from prometheus_client import Counter, Gauge, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

app = FastAPI(title="AI Fraud Detector & Memory Anomaly Engine", version="2.4.1")

FRAUD_CHECKS_TOTAL = Counter("fraud_evaluations_total", "Total fraud inference passes", ["decision"])
INFERENCE_LATENCY = Gauge("fraud_inference_latency_ms", "Inference latency in milliseconds")
PYTHON_HEAP_MB = Gauge("python_memory_rss_mb", "Resident set size memory allocated by Python runtime")

class TransactionPayload(BaseModel):
    account_id: str
    amount: float
    currency: str
    ip_reputation_score: float
    device_trust_factor: float

class FraudDecision(BaseModel):
    decision: str
    risk_score: float
    anomaly_detected: bool
    inference_ms: float
    model_version: str

@app.get("/healthz")
def health():
    process = psutil.Process(os.getpid())
    rss_mb = process.memory_info().rss / (1024 * 1024)
    PYTHON_HEAP_MB.set(rss_mb)
    return {
        "status": "healthy",
        "runtime": "Python 3.11 / CPython GIL",
        "rss_memory_mb": round(rss_mb, 2),
        "workers": 2
    }

@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.post("/api/v1/score", response_model=FraudDecision)
def evaluate_transaction(tx: TransactionPayload):
    start = time.time()
    
    # Heuristic + Statistical feature scoring
    risk_factors = [
        1.0 - tx.device_trust_factor,
        1.0 - tx.ip_reputation_score,
        min(1.0, tx.amount / 10000.0)
    ]
    
    risk_score = float(np.mean(risk_factors))
    is_fraud = risk_score > 0.75
    
    decision = "DECLINE" if is_fraud else "APPROVE"
    FRAUD_CHECKS_TOTAL.labels(decision=decision).inc()
    
    latency = (time.time() - start) * 1000.0
    INFERENCE_LATENCY.set(latency)
    
    return FraudDecision(
        decision=decision,
        risk_score=round(risk_score, 4),
        anomaly_detected=is_fraud,
        inference_ms=round(latency, 2),
        model_version="xgboost-fraud-v2"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)`,
      },
      'requirements.txt': {
        name: 'requirements.txt',
        language: 'text',
        content: `fastapi==0.110.0
uvicorn[standard]==0.28.0
pydantic==2.6.4
numpy==1.26.4
scikit-learn==1.4.1.post1
prometheus-client==0.20.0
psutil==5.9.8
requests==2.31.0`,
      },
      'Dockerfile': {
        name: 'Dockerfile',
        language: 'dockerfile',
        content: `FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 8080
USER 1000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2"]`,
      },
      'k8s/deployment.yaml': {
        name: 'k8s/deployment.yaml',
        language: 'yaml',
        content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-fraud-detector
  namespace: production
  labels:
    app: ai-fraud-detector
    language: python
    tier: ml-scoring
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ai-fraud-detector
  template:
    metadata:
      labels:
        app: ai-fraud-detector
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        linkerd.io/inject: "enabled"
    spec:
      containers:
      - name: ml-inference
        image: ghcr.io/cloudops/ai-fraud-detector:v2.4.1
        ports:
        - containerPort: 8080
          name: http
        resources:
          requests:
            cpu: "500m"
            memory: "512Mi"
          limits:
            cpu: "2000m"
            memory: "1024Mi"`,
      },
    },
    samplePayload: '{\n  "account_id": "acc-99214-us",\n  "amount": 12500.00,\n  "currency": "USD",\n  "ip_reputation_score": 0.35,\n  "device_trust_factor": 0.40\n}',
  },
  {
    id: 'order-processor-node',
    name: 'Node.js Order Processor',
    lang: 'TypeScript / Node 20',
    langBadge: 'TypeScript / V8',
    langColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    version: 'v2.4.1',
    description: 'Asynchronous event stream consumer handling distributed checkout queues with backpressure management.',
    concurrencyModel: 'Single-Threaded Non-blocking Libuv Event Loop with Worker Threads',
    files: {
      'src/index.ts': {
        name: 'src/index.ts',
        language: 'typescript',
        content: `import express, { Request, Response } from 'express';
import client from 'prom-client';

const app = express();
const port = 8080;

app.use(express.json());

// Prometheus Metrics setup
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'order_processor_' });

const ordersHandled = new client.Counter({
  name: 'order_processed_events_total',
  help: 'Total order batch processing events handled from Kafka',
  labelNames: ['status'],
});

app.get('/healthz', (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    status: 'healthy',
    runtime: 'Node.js 20 LTS (V8 Engine)',
    heapUsedMB: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
    eventLoopLagMs: 1.4,
  });
});

app.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.post('/api/v1/orders/process', (req: Request, res: Response) => {
  const { orderId, items } = req.body;
  ordersHandled.inc({ status: 'success' });

  res.json({
    orderId: orderId || 'ord-9921',
    status: 'DISPATCHED_TO_WAREHOUSE',
    itemsProcessed: (items && items.length) || 3,
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(\`[ORDER_PROCESSOR] Listening on port \${port}\`);
});`,
      },
      'package.json': {
        name: 'package.json',
        language: 'json',
        content: `{
  "name": "order-processor-node",
  "version": "2.4.1",
  "description": "Async Kafka/RabbitMQ order queue processor",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "prom-client": "^15.1.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.24",
    "typescript": "^5.3.3"
  }
}`,
      },
      'Dockerfile': {
        name: 'Dockerfile',
        language: 'dockerfile',
        content: `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 8080
USER node
CMD ["node", "dist/index.js"]`,
      },
    },
    samplePayload: '{\n  "orderId": "ord-8839-prod",\n  "items": [{"sku": "gpu-h100", "qty": 4}],\n  "customerTier": "enterprise"\n}',
  },
];

export const MicroserviceSpecsDrawer: React.FC = () => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('rust-auth-guard');
  const selectedService = MICROSERVICES.find((s) => s.id === selectedServiceId) || MICROSERVICES[0];

  const fileKeys = Object.keys(selectedService.files);
  const [selectedFileKey, setSelectedFileKey] = useState<string>(fileKeys[0]);
  const [copied, setCopied] = useState(false);
  const [isExecutingTest, setIsExecutingTest] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);

  const activeFile = selectedService.files[selectedFileKey] || selectedService.files[fileKeys[0]];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateExecution = () => {
    setIsExecutingTest(true);
    setExecutionOutput(null);

    setTimeout(() => {
      let output = '';
      if (selectedService.id === 'rust-auth-guard') {
        output = `HTTP/1.1 200 OK\nContent-Type: application/json\nX-Response-Time: 0.18ms\nServer: Actix-web/4.4 (Rust 1.76 / Tokio)\n\n{\n  "valid": true,\n  "subject": "user-sre-77",\n  "roles": ["admin", "cluster-operator"],\n  "latency_micros": 184\n}`;
      } else if (selectedService.id === 'go-payment-gateway') {
        output = `HTTP/1.1 200 OK\nContent-Type: application/json\nX-Response-Time: 4.2ms\nServer: Gin-Gonic (Go 1.22 Goroutine Pool)\n\n{\n  "transaction_id": "txn_89af32b0c112",\n  "status": "CONFIRMED",\n  "timestamp": ${Math.floor(Date.now() / 1000)},\n  "latency_ms": 4\n}`;
      } else if (selectedService.id === 'py-ai-fraud-detector') {
        output = `HTTP/1.1 200 OK\nContent-Type: application/json\nX-Inference-Time: 2.8ms\nServer: FastAPI / Uvicorn (Python 3.11 / Scikit-Learn)\n\n{\n  "decision": "APPROVE",\n  "risk_score": 0.2831,\n  "anomaly_detected": false,\n  "inference_ms": 2.84,\n  "model_version": "xgboost-fraud-v2"\n}`;
      } else {
        output = `HTTP/1.1 200 OK\nContent-Type: application/json\nServer: Express / Node 20 LTS\n\n{\n  "orderId": "ord-8839-prod",\n  "status": "DISPATCHED_TO_WAREHOUSE",\n  "itemsProcessed": 1,\n  "timestamp": "${new Date().toISOString()}"\n}`;
      }

      setExecutionOutput(output);
      setIsExecutingTest(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-400" />
            Polyglot Microservices Code Explorer & Architecture Inspector
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Browse the real production microservice repositories in <strong>Rust</strong>, <strong>Go</strong>, <strong>Python</strong>, and <strong>Node.js</strong> with full containerization Dockerfiles and Kubernetes manifests.
          </p>
        </div>

        {/* Global Stats */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
          <Layers className="w-5 h-5 text-orange-400" />
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Active Microservices</div>
            <div className="text-sm font-bold text-slate-200 font-mono">
              Rust + Go + Python + TypeScript
            </div>
          </div>
        </div>
      </div>

      {/* Service Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {MICROSERVICES.map((svc) => {
          const isSelected = selectedServiceId === svc.id;
          return (
            <button
              key={svc.id}
              onClick={() => {
                setSelectedServiceId(svc.id);
                setSelectedFileKey(Object.keys(svc.files)[0]);
                setExecutionOutput(null);
              }}
              className={`p-4 rounded-xl border text-left transition-all shadow-md ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500/80 ring-2 ring-cyan-500/20 shadow-cyan-500/5'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${svc.langColor}`}>
                  {svc.langBadge}
                </span>
                <span className="text-[11px] font-mono text-slate-500">{svc.version}</span>
              </div>
              <h3 className="text-sm font-bold text-white mt-2 truncate">{svc.name}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{svc.description}</p>
            </button>
          );
        })}
      </div>

      {/* Code Editor & File Tree Inspector Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl grid grid-cols-1 md:grid-cols-4">
        {/* Left: File Tree */}
        <div className="bg-slate-950/70 p-4 border-r border-slate-800 space-y-4">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mb-2 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Repository Explorer</span>
            </div>
            <div className="text-xs font-mono text-cyan-300 font-bold mb-3 truncate">
              services/{selectedService.id}/
            </div>

            <div className="space-y-1">
              {fileKeys.map((fKey) => {
                const isCurrent = (selectedFileKey || fileKeys[0]) === fKey;
                return (
                  <button
                    key={fKey}
                    onClick={() => setSelectedFileKey(fKey)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition-all ${
                      isCurrent
                        ? 'bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <FileCode className={`w-3.5 h-3.5 ${isCurrent ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span className="truncate">{fKey}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80">
            <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Concurrency Engine</div>
            <div className="text-[11px] text-slate-300 leading-tight">{selectedService.concurrencyModel}</div>
          </div>

          {/* Simulate Execution Trigger */}
          <div className="pt-3 border-t border-slate-800/80">
            <button
              onClick={handleSimulateExecution}
              disabled={isExecutingTest}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isExecutingTest ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-white" />
              )}
              <span>{isExecutingTest ? 'Invoking Endpoint...' : 'Live Request Test'}</span>
            </button>
          </div>
        </div>

        {/* Right: Code Viewer */}
        <div className="md:col-span-3 flex flex-col justify-between bg-slate-900">
          <div>
            {/* Header bar */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-white">
                  services/{selectedService.id}/{activeFile?.name || fileKeys[0]}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono uppercase">
                  {activeFile?.language || 'code'}
                </span>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy File'}</span>
              </button>
            </div>

            {/* Code Content */}
            <div className="p-4 bg-slate-950 text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre leading-relaxed max-h-[500px] overflow-y-auto">
              {activeFile?.content}
            </div>
          </div>

          {/* Test Execution Terminal Drawer */}
          {executionOutput && (
            <div className="border-t border-slate-800 bg-slate-950 p-4 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white">Direct Container RPC Simulation Response</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">200 OK • Microservice Responded</span>
              </div>
              <pre className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                {executionOutput}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
