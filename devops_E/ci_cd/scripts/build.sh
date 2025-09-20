#!/bin/bash
# Build script for all services

set -e
echo "🏗️ Building all services..."
docker-compose -f devops_E/docker/docker-compose.yml build
echo "✅ Build completed!"
