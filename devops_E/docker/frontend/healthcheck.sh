#!/bin/sh
# Health check script pour frontend Vite

# Configuration
HOST=${HOST:-localhost}
PORT=${PORT:-80}
HEALTH_ENDPOINT=${HEALTH_ENDPOINT:-/health}

# Check if the frontend is responding
if curl -f -s "http://${HOST}:${PORT}${HEALTH_ENDPOINT}" > /dev/null 2>&1; then
    echo "✅ Vite frontend is healthy"
    exit 0
else
    echo "❌ Vite frontend is unhealthy"
    # Try main page as fallback
    if curl -f -s "http://${HOST}:${PORT}/" > /dev/null 2>&1; then
        echo "⚠️  Main page responds but /health endpoint missing"
        exit 0
    fi
    exit 1
fi