#!/bin/bash
# Check status of all services

echo "🔍 Checking Transcendence Services Status..."
echo "==========================================="

# Function to check HTTP endpoint
check_http() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    echo -n "📡 $name: "
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_code"; then
        echo "✅ UP"
    else
        echo "❌ DOWN"
    fi
}

# Function to check TCP port
check_tcp() {
    local name=$1
    local host=$2
    local port=$3
    
    echo -n "🔌 $name: "
    if nc -z "$host" "$port" 2>/dev/null; then
        echo "✅ UP"
    else
        echo "❌ DOWN"
    fi
}

# Check Docker containers
echo "🐳 Docker Containers:"
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🌐 HTTP Endpoints:"
check_http "Frontend" "http://localhost:80"
check_http "Backend API" "http://localhost:3000/health"
check_http "Grafana" "http://localhost:3001/api/health"
check_http "Prometheus" "http://localhost:9090/-/healthy"

echo ""
echo "🔌 TCP Services:"
check_tcp "PostgreSQL" "localhost" "5432"
check_tcp "Redis" "localhost" "6379"

echo ""
echo "💾 Disk Usage:"
df -h | grep -E "(Filesystem|/dev/)"

echo ""
echo "🧠 Memory Usage:"
free -h

echo ""
echo "⚡ CPU Usage:"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print "CPU Usage: " 100 - $1 "%"}'

echo ""
echo "📊 Container Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
