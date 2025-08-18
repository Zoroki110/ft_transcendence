#!/bin/bash
# Build script for all services

set -e

echo "🏗️  Building Transcendence services..."

# Build backend
echo "📦 Building backend..."
docker build -f devops_E/docker/backend/Dockerfile -t transcendence/backend:latest ./backend

# Build frontend
echo "🎨 Building frontend..."
docker build -f devops_E/docker/frontend/Dockerfile -t transcendence/frontend:latest ./frontend

# Build nginx
echo "🌐 Building nginx..."
docker build -f devops_E/docker/nginx/Dockerfile -t transcendence/nginx:latest ./devops_E/docker/nginx

echo "✅ All services built successfully!"
