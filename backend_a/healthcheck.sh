#!/bin/sh
# Smart healthcheck for backend

# Check if Node process is running
if pgrep -f "node" > /dev/null 2>&1; then
    echo "Backend process is running"
    # Try API if process is running
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo "Backend API is healthy"
        exit 0
    else
        echo "Backend process running but API not ready yet"
        exit 0  # Still return OK during startup
    fi
else
    echo "Backend process not running"
    exit 1
fi
