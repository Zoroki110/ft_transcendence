#!/bin/sh
# Health check script for frontend

if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo "Frontend is healthy"
    exit 0
else
    echo "Frontend is unhealthy"
    exit 1
fi
