#!/bin/bash
# Setup development environment

echo "🚀 Setting up Transcendence Development Environment"
echo "=================================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists docker; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites satisfied"

# Create environment file if it doesn't exist
if [ ! -f "environments/.env.dev" ]; then
    echo "📝 Creating development environment file..."
    cp environments/.env.example environments/.env.dev
    echo "⚠️  Please edit environments/.env.dev with your configuration"
fi

# Pull required images
echo "📦 Pulling Docker images..."
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml pull

# Build custom images
echo "🏗️  Building custom images..."
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml build

# Create networks and volumes
echo "🌐 Setting up networks and volumes..."
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up --no-start

# Start services
echo "🚀 Starting development services..."
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check services
echo "🔍 Checking service health..."
./tools/utilities/service-status.sh

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "🌐 Access your application:"
echo "  Frontend: http://localhost:80"
echo "  Backend API: http://localhost:3000"
echo "  Grafana: http://localhost:3001 (admin/admin)"
echo "  Prometheus: http://localhost:9090"
echo ""
echo "📚 Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Restart service: docker-compose restart [service-name]"
