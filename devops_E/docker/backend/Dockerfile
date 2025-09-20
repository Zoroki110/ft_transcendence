# Dockerfile MINIMAL pour tester rapidement
FROM node:20-alpine

WORKDIR /app

# Install tools
RUN apk add --no-cache curl

# Install NestJS CLI
RUN npm install -g @nestjs/cli

# Copy et install (en tant que root pour éviter problèmes permissions)
COPY package*.json ./
RUN npm install

# Copy code
COPY . .

EXPOSE 3000

# Health check simple
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Start
CMD ["npm", "run", "start:dev"]