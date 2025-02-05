# Builder stage
FROM rust:1.83 AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src/ ./src
COPY migrations/ ./migrations

RUN cargo build --release

# Production stage
FROM debian:bookworm-slim AS production
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/release/livepool-server .
COPY --from=builder /app/migrations ./migrations

RUN chmod +x ./livepool-server

EXPOSE 8080
CMD ["./livepool-server"]