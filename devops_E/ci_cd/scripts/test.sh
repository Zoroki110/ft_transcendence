#!/bin/bash
# Test script for all services

set -e

echo "🧪 Running tests for Transcendence..."

# Backend tests
echo "🔧 Running backend tests..."
cd backend_a
npm run test
npm run test:e2e
cd ..

# Frontend tests
echo "🎨 Running frontend tests..."
cd frontend_b
npm run test
cd ..

echo "✅ All tests passed!"
