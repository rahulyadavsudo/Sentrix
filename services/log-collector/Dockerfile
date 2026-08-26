# Multi-stage ultra-secure minimal scratch container for Go Log Collector
FROM golang:1.23-alpine AS builder

WORKDIR /app
COPY go.mod ./
RUN go mod download || true

COPY . .
# Compile statically with zero CGO dependencies and stripped debug symbols
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o /app/log-collector main.go

# Production Distroless Stage (Minimal attack surface, non-root user)
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /
COPY --from=builder /app/log-collector /log-collector

USER 65532:65532
EXPOSE 8085

ENTRYPOINT ["/log-collector"]
