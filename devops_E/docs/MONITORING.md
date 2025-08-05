# 📊 Monitoring Guide

## Overview

Our monitoring stack includes:
- **Prometheus**: Metrics collection
- **Grafana**: Visualization and dashboards
- **AlertManager**: Alert routing and notifications
- **ELK Stack**: Centralized logging

## Accessing Monitoring

### Local Development
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090
- Kibana: http://localhost:5601

### Production
- Grafana: https://monitoring.transcendence.com
- Prometheus: https://prometheus.transcendence.com (internal only)

## Key Metrics

### Backend Metrics
- Response time (95th percentile)
- Request rate (requests/second)
- Error rate (percentage)
- Database connection pool usage
- CPU and memory usage

### Frontend Metrics
- Page load time
- Core Web Vitals (LCP, FID, CLS)
- JavaScript errors
- User sessions

### Infrastructure Metrics
- Container resource usage
- Database performance
- Network latency
- Disk usage

## Alerts

### Critical Alerts (Immediate Response)
- Service down (> 1 minute)
- High error rate (> 5%)
- Database connection failures
- SSL certificate expiry (< 7 days)

### Warning Alerts (Monitor Closely)
- High response time (> 500ms)
- High CPU usage (> 80%)
- High memory usage (> 85%)
- Disk space low (< 10% free)

## Dashboard Overview

### Main Dashboard
- System overview
- Service health status
- Key performance indicators
- Recent alerts

### Backend Dashboard
- API endpoint performance
- Database queries
- Authentication metrics
- Game session statistics

### Frontend Dashboard
- User experience metrics
- Page performance
- Error tracking
- User flow analytics
