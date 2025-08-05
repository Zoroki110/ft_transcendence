#!/bin/bash
# Test script for all services

set -e

echo "🧪 Running tests for Transcendence..."

# Backend tests
echo "🔧 Running backend tests..."
cd backend
npm run test
npm run test:e2e
cd ..

# Frontend tests
echo "🎨 Running frontend tests..."
cd frontend
npm run test
cd ..

echo "✅ All tests passed!"
