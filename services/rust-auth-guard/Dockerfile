# Multi-stage Rust build for ultra-small container footprint
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

CMD ["/app/rust-auth-guard"]
