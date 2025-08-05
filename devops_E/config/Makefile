# Makefile for Transcendence DevOps

.PHONY: help build up down logs test clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build all Docker images
	@echo "🏗️  Building all services..."
	@./ci_cd/scripts/build.sh

up: ## Start development environment
	@echo "🚀 Starting development environment..."
	@docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d

down: ## Stop all services
	@echo "🛑 Stopping all services..."
	@docker-compose down

logs: ## Show logs for all services
	@docker-compose logs -f

test: ## Run all tests
	@echo "🧪 Running tests..."
	@./ci_cd/scripts/test.sh

clean: ## Clean up Docker resources
	@echo "🧹 Cleaning up..."
	@docker system prune -f
	@docker volume prune -f

prod-up: ## Start production environment
	@echo "🚀 Starting production environment..."
	@docker-compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up -d

status: ## Show status of all services
	@docker-compose ps
