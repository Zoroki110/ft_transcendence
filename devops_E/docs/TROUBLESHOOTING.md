# 🔧 Troubleshooting Guide

## Common Issues

### 1. Services Won't Start

**Symptoms**: `docker-compose up` fails or services crash

**Solutions**:
```bash
# Check logs
docker-compose logs [service-name]

# Check port conflicts
netstat -tulpn | grep :3000

# Clean up and restart
docker-compose down
docker system prune -f
docker-compose up -d
```

### 2. Database Connection Failed

**Symptoms**: Backend can't connect to database

**Solutions**:
```bash
# Check database is running
docker-compose ps database

# Check database logs
docker-compose logs database

# Test connection manually
docker-compose exec database psql -U transcendence -d transcendence

# Reset database
docker-compose down
docker volume rm devops_postgres_data
docker-compose up -d database
```

### 3. Frontend Build Fails

**Symptoms**: Frontend container exits with build errors

**Solutions**:
```bash
# Check Node.js version
docker-compose exec frontend node --version

# Clear npm cache
docker-compose run --rm frontend npm cache clean --force

# Rebuild without cache
docker-compose build --no-cache frontend
```

### 4. SSL Certificate Issues

**Symptoms**: HTTPS not working, certificate errors

**Solutions**:
```bash
# Check certificate status
./security/ssl/check-certificates.sh

# Renew certificates
./security/ssl/ssl-renew.sh

# Generate new certificates
./security/ssl/letsencrypt-setup.sh yourdomain.com
```

### 5. High Memory Usage

**Symptoms**: System running slow, containers being killed

**Solutions**:
```bash
# Check memory usage
docker stats

# Optimize containers
# Reduce memory limits in docker-compose.yml
# Add memory limits to services

# Clean up unused resources
docker system prune -a
docker volume prune
```

### 6. Performance Issues

**Symptoms**: Slow response times, high load

**Solutions**:
```bash
# Check metrics
open http://localhost:3001  # Grafana

# Profile backend
docker-compose exec backend npm run profile

# Check database performance
docker-compose exec database pg_stat_statements

# Scale services
docker-compose up -d --scale backend=3
```

## Emergency Procedures

### Service Down
1. Check service status: `docker-compose ps`
2. Review logs: `docker-compose logs [service]`
3. Restart service: `docker-compose restart [service]`
4. If still down, redeploy: `./ci_cd/scripts/deploy-production.sh`

### Database Corruption
1. Stop all services: `docker-compose down`
2. Restore from backup: `./backup/scripts/restore-database.sh`
3. Verify data integrity
4. Restart services: `docker-compose up -d`

### SSL Certificate Expired
1. Renew certificate: `./security/ssl/ssl-renew.sh`
2. Restart nginx: `docker-compose restart nginx`
3. Verify HTTPS: `curl -I https://yourdomain.com`

## Monitoring Commands

```bash
# Check all services health
./tools/utilities/service-status.sh

# Monitor resources
./tools/utilities/resource-monitor.sh

# Check logs for errors
./tools/utilities/check-errors.sh

# Performance test
./performance/testing/benchmark.sh
```

## Contact

For critical issues:
1. Check this troubleshooting guide
2. Review monitoring dashboards
3. Check recent deployments
4. Contact DevOps team
