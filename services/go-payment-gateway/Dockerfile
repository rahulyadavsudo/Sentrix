# Multi-stage Go build with Distroless scratch image
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

ENTRYPOINT ["/payment-gateway"]
