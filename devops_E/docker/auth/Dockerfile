# Dockerfile for Auth Service (auth_c)
FROM node:20-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache dumb-init curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci 2>/dev/null || npm install

# Copy source code
COPY . .

# Build if possible
RUN npm run build 2>/dev/null || echo "No build step"

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S auth -u 1001 -G nodejs && \
    chown -R auth:nodejs /app

USER auth

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

ENTRYPOINT ["dumb-init", "--"]

# Smart startup
CMD ["sh", "-c", "if [ -f 'dist/main.js' ]; then node dist/main.js; else npm run start:dev || npm start; fi"]