# Multi-stage Dockerfile pour Vite - Production optimisée

# ====================================
# Stage 1: Build
# ====================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy package files pour cache optimal
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false && \
    npm cache clean --force

# Copy source code
COPY . .

# Build pour production avec Vite
RUN npm run build

# ====================================
# Stage 2: Production avec Nginx
# ====================================
FROM nginx:alpine AS production

# Copy built assets depuis builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy configuration Nginx optimisée pour SPA
COPY nginx.conf /etc/nginx/nginx.conf

# Copy health check script
COPY healthcheck.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/healthcheck.sh

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]