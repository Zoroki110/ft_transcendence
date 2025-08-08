#!/bin/sh
# Health check script for backend

# Check if the application is responding
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "Backend is healthy"
    exit 0
else
    echo "Backend is unhealthy"
    exit 1
fi
