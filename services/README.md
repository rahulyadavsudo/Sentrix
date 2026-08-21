# Polyglot Microservices Architecture

This repository contains the full source code for the microservices running in the Kubernetes cluster:

- **`services/rust-auth-guard`**: High-performance Rust service using Tokio & Actix-web for sub-millisecond JWT authentication and eBPF socket tracing.
- **`services/go-payment-gateway`**: High-concurrency Go service utilizing goroutine worker pools and channels for resilient payment processing.
- **`services/py-ai-fraud-detector`**: Python FastAPI microservice running predictive machine learning models (Linear Regression & Holt-Winters) for real-time anomaly detection.
- **`services/order-processor-node`**: Node.js / TypeScript event consumer processing asynchronous order queue pipelines.
