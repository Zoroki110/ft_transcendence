# 🚀 Deployment Guide

## Environments

### Development
- **URL**: http://localhost
- **Database**: PostgreSQL (local container)
- **Hot Reload**: Enabled
- **Debug**: Enabled

### Staging
- **URL**: https://staging.transcendence.com
- **Database**: PostgreSQL (staging server)
- **SSL**: Let's Encrypt
- **Monitoring**: Full monitoring stack

### Production
- **URL**: https://transcendence.com
- **Database**: PostgreSQL (production server)
- **SSL**: Let's Encrypt
- **Monitoring**: Full monitoring stack
- **Backup**: Automated daily backups

## Deployment Process

### Staging Deployment
```bash
# Deploy to staging
./ci_cd/scripts/deploy-staging.sh

# Check deployment
curl -f https://staging.transcendence.com/health
```

### Production Deployment
```bash
# Deploy to production (requires approval)
./ci_cd/scripts/deploy-production.sh

# Verify deployment
./tools/utilities/service-status.sh
```

## Blue-Green Deployment

For zero-downtime deployments:

```bash
# Deploy new version to green environment
./deployment/strategies/blue-green/deploy-blue-green.sh

# Switch traffic after verification
./deployment/strategies/blue-green/switch-traffic.sh
```

## Rollback

In case of issues:

```bash
# Quick rollback
./ci_cd/scripts/rollback.sh

# Or manual rollback
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml down
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up -d --scale backend=2
```
