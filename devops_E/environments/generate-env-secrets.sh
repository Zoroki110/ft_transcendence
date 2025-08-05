#!/bin/bash

# 🔑 Script de génération des secrets pour .env.dev
# Usage: ./generate-env-secrets.sh

set -e

echo "🔑 Génération des secrets sécurisés pour .env.dev"
echo "================================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to generate random string
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-${1:-32}
}

# Function to generate hex string
generate_hex() {
    openssl rand -hex ${1:-16}
}

# Backup original file if it exists
if [ -f ".env.dev" ]; then
    cp .env.dev .env.dev.backup
    echo -e "${YELLOW}📋 Backup créé: .env.dev.backup${NC}"
fi

# Generate the enhanced .env.dev file
cat > .env.dev << EOF
# =======================================================
# TRANSCENDENCE - Development Environment Variables
# =======================================================
# 🔧 Generated on: $(date)
# ⚠️  Remember to configure OAuth keys manually!
# =======================================================

# 🗄️ DATABASE CONFIGURATION
POSTGRES_HOST=database
POSTGRES_PORT=5432
POSTGRES_DB=transcendence_dev
POSTGRES_USER=transcendence
POSTGRES_PASSWORD=dev_$(generate_hex 12)
DATABASE_URL=postgresql://transcendence:dev_$(generate_hex 12)@database:5432/transcendence_dev

# 🔧 BACKEND CONFIGURATION
NODE_ENV=development
PORT=3000
DEBUG=true
LOG_LEVEL=debug

# 🔐 JWT & AUTHENTICATION
JWT_SECRET=$(generate_secret 64)
JWT_ACCESS_TOKEN_EXPIRES_IN=24h
JWT_REFRESH_TOKEN_EXPIRES_IN=7d
JWT_REFRESH_SECRET=$(generate_secret 64)

# 🍪 SESSION & COOKIES
SESSION_SECRET=$(generate_secret 48)
COOKIE_SECRET=$(generate_secret 32)
COOKIE_SECURE=false
COOKIE_HTTP_ONLY=true
COOKIE_MAX_AGE=86400000

# 🔒 ENCRYPTION & SECURITY
ENCRYPTION_KEY=$(generate_secret 32)
BCRYPT_ROUNDS=10
PASSWORD_MIN_LENGTH=8
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 🌐 CORS CONFIGURATION
CORS_ORIGIN=http://localhost:80,http://localhost:5173,http://localhost:3001
CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
CORS_CREDENTIALS=true

# 🎨 FRONTEND CONFIGURATION
VITE_API_URL=http://localhost:3000
VITE_APP_TITLE=Transcendence Dev
VITE_APP_VERSION=1.0.0-dev
VITE_NODE_ENV=development
VITE_DEBUG=true
VITE_ENABLE_DEVTOOLS=true

# 🛡️ OAUTH 42 SCHOOL (⚠️ CONFIGURE MANUALLY!)
OAUTH_42_CLIENT_ID=your_42_client_id
OAUTH_42_CLIENT_SECRET=your_42_client_secret
OAUTH_42_CALLBACK_URL=http://localhost:3000/auth/42/callback
OAUTH_42_SCOPE=public

# 🔍 GOOGLE OAUTH (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# 📦 REDIS CONFIGURATION
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_URL=redis://redis:6379/0
REDIS_TTL=3600

# 📊 MONITORING & METRICS
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
PROMETHEUS_METRICS_PATH=/metrics

# 📈 GRAFANA
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin_$(generate_hex 8)
GRAFANA_PORT=3001
GRAFANA_DOMAIN=localhost

# 📝 LOGGING CONFIGURATION
LOG_FORMAT=combined
LOG_FILE_PATH=./logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5
LOG_DATE_PATTERN=YYYY-MM-DD

# 🎮 GAME ENGINE CONFIGURATION
GAME_WEBSOCKET_PORT=3002
GAME_MAX_PLAYERS_PER_ROOM=4
GAME_ROOM_CLEANUP_INTERVAL=300000
GAME_PING_INTERVAL=25000
GAME_PING_TIMEOUT=60000
GAME_MAX_SPECTATORS=10

# 🏆 TOURNAMENT SYSTEM
TOURNAMENT_MAX_PARTICIPANTS=32
TOURNAMENT_REGISTRATION_TIMEOUT=300000
TOURNAMENT_MATCH_TIMEOUT=600000

# 🔄 2FA CONFIGURATION
TWO_FA_SERVICE_NAME=Transcendence Dev
TWO_FA_ISSUER=Transcendence
TWO_FA_WINDOW=2
TWO_FA_STEP=30

# 📧 EMAIL CONFIGURATION (Optional - for notifications)
EMAIL_ENABLED=false
EMAIL_HOST=localhost
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=noreply@transcendence.dev

# 🚨 ALERTING (Optional)
ALERT_WEBHOOK_URL=
SLACK_WEBHOOK_URL=
DISCORD_WEBHOOK_URL=

# 📤 FILE UPLOAD
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif
UPLOAD_DEST=./uploads
AVATAR_MAX_SIZE=1048576

# 🌍 INTERNATIONALIZATION
DEFAULT_LANGUAGE=en
SUPPORTED_LANGUAGES=en,fr,es,de
TIMEZONE=Europe/Paris

# ⚡ PERFORMANCE
API_TIMEOUT=30000
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_IDLE_TIMEOUT=10000
CACHE_TTL=300

# 🔧 DEVELOPMENT TOOLS
ENABLE_SWAGGER=true
SWAGGER_PATH=/api/docs
ENABLE_PLAYGROUND=true
HOT_RELOAD=true

# 🏥 HEALTH CHECKS
HEALTH_CHECK_TIMEOUT=5000
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_THRESHOLD=3

# 🐳 DOCKER SPECIFIC
DOCKER_BUILDKIT=1
COMPOSE_DOCKER_CLI_BUILD=1

# 🎯 APPLICATION URLS
APP_URL=http://localhost:80
API_URL=http://localhost:3000
WEBSOCKET_URL=ws://localhost:3002
EOF

echo -e "${GREEN}✅ Fichier .env.dev généré avec succès!${NC}"
echo ""
echo "🔑 Secrets générés automatiquement:"
echo "   - JWT_SECRET (64 caractères)"
echo "   - JWT_REFRESH_SECRET (64 caractères)"  
echo "   - SESSION_SECRET (48 caractères)"
echo "   - COOKIE_SECRET (32 caractères)"
echo "   - ENCRYPTION_KEY (32 caractères)"
echo "   - POSTGRES_PASSWORD (24 caractères)"
echo "   - GRAFANA_ADMIN_PASSWORD (16 caractères)"
echo ""
echo -e "${YELLOW}⚠️  N'oublie pas de configurer manuellement:${NC}"
echo "   - OAUTH_42_CLIENT_ID (sur intra.42.fr)"
echo "   - OAUTH_42_CLIENT_SECRET (sur intra.42.fr)"
echo "   - GOOGLE_CLIENT_ID (optionnel)"
echo "   - GOOGLE_CLIENT_SECRET (optionnel)"
echo ""
echo "📋 Variables ajoutées pour Transcendence:"
echo "   🎮 Configuration Game Engine (WebSocket, rooms)"
echo "   🏆 Système de tournois"
echo "   🔄 Authentification 2FA"
echo "   📤 Upload de fichiers (avatars)"
echo "   🌍 Internationalisation (multi-langues)"
echo "   ⚡ Optimisations performance"
echo "   🏥 Health checks"
echo "   📝 Logging avancé"
echo ""
echo -e "${GREEN}🚀 Prochaines étapes:${NC}"
echo "1. Configurer les clés OAuth 42"
echo "2. Tester: docker-compose config"
echo "3. Démarrer: ./tools/development/setup-dev-env.sh"
echo ""
echo "📖 Guide OAuth 42: https://profile.intra.42.fr/oauth/applications"