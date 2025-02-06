# Builder stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --production=false
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Clean npm cache and remove unnecessary files
RUN rm -rf /var/cache/apk/* && \
    rm -rf /tmp/*

ENV NODE_ENV production
ENV NEXT_PUBLIC_API_URL http://localhost/api    

EXPOSE 3000
CMD ["node", "server.js"]
