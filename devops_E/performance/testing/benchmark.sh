#!/bin/bash
# Performance benchmark script

echo "⚡ Transcendence Performance Benchmark"
echo "====================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if curl is available
if ! command_exists curl; then
    echo "❌ curl is required but not installed."
    exit 1
fi

# Backend API benchmark
echo "🔧 Testing Backend API Performance..."
echo "URL: http://localhost:3000/health"

# Simple response time test
echo "📊 Response Time Test (10 requests):"
for i in {1..10}; do
    response_time=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:3000/health)
    echo "  Request $i: ${response_time}s"
done

# Concurrent requests test
echo ""
echo "🚀 Concurrent Requests Test (50 concurrent):"
time_start=$(date +%s.%N)
for i in {1..50}; do
    curl -o /dev/null -s http://localhost:3000/health &
done
wait
time_end=$(date +%s.%N)
duration=$(echo "$time_end - $time_start" | bc)
echo "  50 concurrent requests completed in: ${duration}s"

# Frontend benchmark
echo ""
echo "🎨 Testing Frontend Performance..."
echo "URL: http://localhost:80"

frontend_time=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:80)
echo "  Frontend load time: ${frontend_time}s"

# Database connection test
echo ""
echo "💾 Testing Database Performance..."
db_start=$(date +%s.%N)
docker-compose exec -T database psql -U transcendence -d transcendence -c "SELECT 1;" > /dev/null
db_end=$(date +%s.%N)
db_duration=$(echo "$db_end - $db_start" | bc)
echo "  Database query time: ${db_duration}s"

echo ""
echo "✅ Benchmark completed!"
echo ""
echo "📋 Performance Summary:"
echo "  Backend API: < 0.1s (good), < 0.5s (acceptable)"
echo "  Frontend: < 1s (good), < 3s (acceptable)"  
echo "  Database: < 0.01s (good), < 0.1s (acceptable)"
