# Makefile pour Transcendence DevOps

.PHONY: help up down logs status clean up-infra up-full

help: ## Affiche cette aide
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up-infra: ## Démarre uniquement l'infrastructure (DB, Redis, Monitoring)
	@echo "🏗️ Démarrage de l'infrastructure..."
	@docker-compose -f docker/docker-compose.yml up -d database redis prometheus grafana cadvisor

up-full: ## Démarre TOUS les services (nécessite que les dossiers backend_a/, frontend_b/ existent)
	@echo "🚀 Démarrage complet..."
	@docker-compose -f docker/docker-compose.yml up -d

up: up-infra ## Alias pour up-infra (par défaut)

down: ## Arrête tous les services
	@echo "🛑 Arrêt de tous les services..."
	@docker-compose -f docker/docker-compose.yml down

logs: ## Affiche les logs de tous les services
	@docker-compose -f docker/docker-compose.yml logs -f

logs-infra: ## Affiche les logs de l'infrastructure uniquement
	@docker-compose -f docker/docker-compose.yml logs -f database redis prometheus grafana

status: ## Vérifie le statut des services
	@echo "🔍 Statut des services:"
	@docker-compose -f docker/docker-compose.yml ps

clean: ## Nettoie les ressources Docker
	@echo "🧹 Nettoyage..."
	@docker system prune -f

config: ## Vérifie la configuration docker-compose
	@echo "⚙️ Vérification de la configuration..."
	@docker-compose -f docker/docker-compose.yml config

setup: ## Setup initial (génère .env si nécessaire)
	@echo "🔧 Setup initial..."
	@if [ ! -f "environments/.env.dev" ]; then \
		echo "📝 Création du fichier .env.dev..."; \
		cd environments && chmod +x generate-env-secrets.sh && ./generate-env-secrets.sh; \
	fi
	@echo "✅ Setup terminé"

check-dirs: ## Vérifie quels dossiers de services existent
	@echo "📁 Vérification des dossiers de services:"
	@if [ -d "../backend_a" ]; then echo "✅ backend_a/ existe"; else echo "❌ backend_a/ manquant"; fi
	@if [ -d "../frontend_b" ]; then echo "✅ frontend_b/ existe"; else echo "❌ frontend_b/ manquant"; fi
	@if [ -d "../auth_c" ]; then echo "✅ auth_c/ existe"; else echo "❌ auth_c/ manquant"; fi
	@if [ -d "../game_d" ]; then echo "✅ game_d/ existe"; else echo "❌ game_d/ manquant"; fi

test-infra: ## Teste l'infrastructure (ports, santé des services)
	@echo "🧪 Test de l'infrastructure..."
	@echo "📊 Prometheus: http://localhost:9090"
	@curl -s http://localhost:9090/-/healthy > /dev/null && echo "✅ Prometheus OK" || echo "❌ Prometheus KO"
	@echo "📈 Grafana: http://localhost:3004"
	@curl -s http://localhost:3004/api/health > /dev/null && echo "✅ Grafana OK" || echo "❌ Grafana KO"
	@echo "💾 PostgreSQL:"
	@docker-compose -f docker/docker-compose.yml exec -T database pg_isready -U transcendence && echo "✅ PostgreSQL OK" || echo "❌ PostgreSQL KO"