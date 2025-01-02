# Development stage
FROM rust:1.83 AS development
WORKDIR /usr/src/app
# Install wait-for-it
RUN apt-get update && apt-get install -y wait-for-it
COPY . .
RUN cargo install cargo-watch
EXPOSE 8080
CMD ["cargo", "watch", "-x", "run"]

# Builder stage
FROM rust:1.83 AS builder
WORKDIR /usr/src/app
COPY . .
RUN cargo build --release

# Production stage
FROM debian:bullseye-slim AS production
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/target/release/live-pool .
EXPOSE 8080
CMD ["./live-pool"]
