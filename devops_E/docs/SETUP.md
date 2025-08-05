# 🛠️ Setup Guide - DevOps

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

## Initial Setup

### 1. Environment Configuration

```bash
# Copy environment template
cp environments/.env.example environments/.env.dev

# Edit with your values
nano environments/.env.dev
```

### 2. Development Environment

```bash
# Start all services
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Database Setup

The database will be automatically initialized with the scripts in `docker/database/init/`.

### 4. SSL Setup (Production)

```bash
# Generate SSL certificates
./security/ssl/letsencrypt-setup.sh your-domain.com
```

## Troubleshooting

### Port Conflicts
If you have port conflicts, modify the ports in `docker-compose.yml`.

### Database Connection Issues
Check that the database service is running and the connection parameters are correct.

### Build Issues
Clear Docker cache: `docker system prune -a`
