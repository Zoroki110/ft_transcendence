#!/bin/sh
# Simple health check for frontend

if curl -f http://localhost:5173 > /dev/null 2>&1; then
    echo "Frontend is healthy"
    exit 0
else
    echo "Frontend is unhealthy" 
    exit 1
fi
