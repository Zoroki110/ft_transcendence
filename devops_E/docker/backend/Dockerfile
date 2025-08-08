# Simple Dockerfile for Backend (NestJS) 
FROM node:20-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache dumb-init curl

# Copy package files
COPY package*.json ./

# Install all dependencies + NestJS CLI
RUN npm ci && npm install -g @nestjs/cli

# Copy all source code
COPY . .

# Build if possible
RUN npm run build 2>/dev/null || echo "Build skipped - will run in dev mode"

# Copy health check
COPY healthcheck.sh ./
RUN chmod +x healthcheck.sh

# Create user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD ./healthcheck.sh

ENTRYPOINT ["dumb-init", "--"]

# Smart startup
CMD ["sh", "-c", "if [ -f 'dist/main.js' ]; then node dist/main.js; else npm run start:dev; fi"]
