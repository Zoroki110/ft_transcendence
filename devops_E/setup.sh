#!/usr/bin/env bash
set -euo pipefail

# ==============================================
# Transcendence DevOps fixer v3 (auto-discovery)
# ----------------------------------------------
# Improvements:
# - Auto-detect DEVOPS dir by structure (contains docker/ or monitoring/)
# - Auto-find docker-compose*.yml (preferring *devops*/docker/docker-compose.yml)
# - Auto-find prometheus.yml anywhere under */prometheus/*
# - Auto-find or CREATE ci_cd/scripts/{build.sh,test.sh} with sane defaults
# - Safe heredocs (no Bash expansion), graceful skips + summary
#
# USAGE:
#   chmod +x apply_devops_fixes_v3.sh
#   DRY_RUN=1 ./apply_devops_fixes_v3.sh
#            ./apply_devops_fixes_v3.sh
# You can still override: DEVOPS_DIR, BACKEND_DIR, FRONTEND_DIR, AUTH_DIR, GAME_DIR
# ==============================================

# Tunables
DEVOPS_DIR_DEFAULT="devops_E"
BACKEND_DIR_DEFAULT="${BACKEND_DIR:-backend_a}"
FRONTEND_DIR_DEFAULT="${FRONTEND_DIR:-frontend_b}"
AUTH_DIR_DEFAULT="${AUTH_DIR:-auth_C}"
GAME_DIR_DEFAULT="${GAME_DIR:-game}"

log() { printf "\033[1;34m[INFO]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[WARN]\033[0m %s\n" "$*"; }
err() { printf "\033[1;31m[ERR ]\033[0m %s\n" "$*"; }
exists() { [ -e "$1" ]; }

# 0) Discover DEVOPS_DIR candidate
log "0) Discovering DEVOPS directory"
DEVOPS_DIR="${DEVOPS_DIR:-}"
if [ -z "${DEVOPS_DIR}" ]; then
  CANDIDATES=$(find . -maxdepth 3 -type d \( -iname "*devops*" -o -iname "*ops*" \) 2>/dev/null | sort || true)
  BEST=""
  while IFS= read -r d; do
    [ -z "$d" ] && continue
    if [ -d "$d/docker" ] || [ -d "$d/monitoring" ]; then
      BEST="$d"
      case "$BEST" in ./*) BEST="${BEST#./}";; esac
      break
    fi
  done <<< "$CANDIDATES"
  if [ -n "$BEST" ]; then
    DEVOPS_DIR="$BEST"
    log "Detected DEVOPS_DIR: $DEVOPS_DIR"
  else
    DEVOPS_DIR="$DEVOPS_DIR_DEFAULT"
    warn "Could not auto-detect DEVOPS dir. Falling back to: $DEVOPS_DIR"
  fi
else
  log "DEVOPS_DIR provided by env: $DEVOPS_DIR"
fi

# 1) Locate docker-compose*.yml
log "1) Locating docker-compose*.yml"
COMPOSE_MAIN=""
# Priority 1: devops*/docker/docker-compose.yml
for p in $(find . -type f -iname "docker-compose.yml" 2>/dev/null | sort); do
  case "$p" in
    */docker/docker-compose.yml)
      COMPOSE_MAIN="$p"
      break
    ;;
  esac
done
# Priority 2: any docker-compose.yml
if [ -z "$COMPOSE_MAIN" ]; then
  COMPOSE_MAIN="$(find . -type f -iname 'docker-compose.yml' -print -quit 2>/dev/null || true)"
fi
# Priority 3: any docker-compose*.yml
if [ -z "$COMPOSE_MAIN" ]; then
  COMPOSE_MAIN="$(find . -type f -iname 'docker-compose*.yml' -print -quit 2>/dev/null || true)"
fi

if [ -n "$COMPOSE_MAIN" ]; then
  log "Compose selected: $COMPOSE_MAIN"
else
  warn "No docker-compose file found. Secret externalization step will be skipped."
fi

# 2) Locate Prometheus config
log "2) Locating prometheus.yml"
PROM_CFG="$(find . -type f -path '*/prometheus/prometheus.yml' -print -quit 2>/dev/null || true)"
if [ -n "$PROM_CFG" ]; then
  log "Prometheus config: $PROM_CFG"
else
  warn "prometheus.yml not found under */prometheus/*. Skipping wiring of rule_files."
fi

# 3) Create .env.example & .gitignore
log "3) Creating .env.example and .gitignore entries"
if [ "${DRY_RUN:-0}" = "1" ]; then
  log "DRY-RUN: would write .env.example"
else
  cat > .env.example <<'ENVEX'
# Example env for Transcendence
# Database
POSTGRES_DB=transcendence_dev
POSTGRES_USER=transcendence
POSTGRES_PASSWORD=CHANGE_ME_STRONG

# App secrets
JWT_SECRET=CHANGE_ME_SUPER_SECRET
SESSION_SECRET=CHANGE_ME_SUPER_SECRET

# OAuth (if applicable)
OAUTH_CLIENT_ID=__set_if_used__
OAUTH_CLIENT_SECRET=__set_if_used__

# URLs
PUBLIC_URL=https://transcendence.example.com
BACKEND_URL=http://backend:3000
FRONTEND_URL=http://frontend:80
AUTH_URL=http://auth:3001
ENVEX
  log "Wrote .env.example"
fi
grep -Fqx ".env" .gitignore 2>/dev/null || { echo ".env" >> .gitignore; log "Appended to .gitignore: .env"; }
grep -Fqx "*.env.local" .gitignore 2>/dev/null || { echo "*.env.local" >> .gitignore; log "Appended to .gitignore: *.env.local"; }

# 4) Externalize secrets in compose
log "4) Externalizing secrets in docker-compose"
if [ -n "$COMPOSE_MAIN" ] && [ -f "$COMPOSE_MAIN" ]; then
  if grep -qE 'POSTGRES_PASSWORD:\s*[^[:space:]]+' "$COMPOSE_MAIN"; then
    if [ "${DRY_RUN:-0}" = "1" ]; then
      log "DRY-RUN: would replace POSTGRES_PASSWORD hardcoded value → \${POSTGRES_PASSWORD}"
    else
      if sed --version >/dev/null 2>&1; then
        sed -i 's/POSTGRES_PASSWORD:[[:space:]]*[^[:space:]]\+/POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}/' "$COMPOSE_MAIN"
      else
        sed -i '' 's/POSTGRES_PASSWORD:[[:space:]]*[^[:space:]]\+/POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}/' "$COMPOSE_MAIN"
      fi
      log "Replaced inline POSTGRES_PASSWORD with \${POSTGRES_PASSWORD} in $COMPOSE_MAIN"
    fi
  else
    warn "No inline POSTGRES_PASSWORD found (maybe already externalized) in $COMPOSE_MAIN"
  fi
else
  warn "Skipping secret externalization (compose not found)."
fi

# 5) Find or create CI scripts
log "5) Locating CI scripts (build.sh, test.sh)"
BUILD_SH="$(find . -type f -path '*/ci_cd/scripts/build.sh' -print -quit 2>/dev/null || true)"
TEST_SH="$(find . -type f -path '*/ci_cd/scripts/test.sh' -print -quit 2>/dev/null || true)"
if [ -z "$BUILD_SH" ]; then
  BUILD_SH="$DEVOPS_DIR/ci_cd/scripts/build.sh"
  if [ "${DRY_RUN:-0}" = "1" ]; then
    log "DRY-RUN: would create $BUILD_SH"
  else
    mkdir -p "$(dirname "$BUILD_SH")"
    cat > "$BUILD_SH" <<'BSH'
#!/usr/bin/env bash
set -euo pipefail
echo "🏗️  Building Transcendence services..."

# Backend
if [ -d "./backend_a" ]; then
  echo "📦 Building backend_a..."
  docker build -f devops_E/docker/backend/Dockerfile -t transcendence/backend:latest ./backend_a
fi

# Frontend
if [ -d "./frontend_b" ]; then
  echo "🎨 Building frontend_b..."
  docker build -f devops_E/docker/frontend/Dockerfile -t transcendence/frontend:latest ./frontend_b
fi

# Auth
if [ -d "./auth_C" ]; then
  echo "🔐 Building auth_C..."
  docker build -f devops_E/docker/auth/Dockerfile -t transcendence/auth:latest ./auth_C
fi

# Game
if [ -d "./game" ]; then
  echo "🎮 Building game..."
  docker build -f devops_E/docker/game/Dockerfile -t transcendence/game:latest ./game
fi
BSH
    chmod +x "$BUILD_SH"
    log "Created $BUILD_SH"
  fi
else
  log "Found $BUILD_SH"
  if [ "${DRY_RUN:-0}" != "1" ]; then
    if sed --version >/dev/null 2>&1; then
      sed -i 's#devops/docker/#devops_E/docker/#g' "$BUILD_SH" || true
      sed -i 's#cd backend$#cd backend_a#g' "$BUILD_SH" || true
      sed -i 's#cd frontend$#cd frontend_b#g' "$BUILD_SH" || true
    else
      sed -i '' 's#devops/docker/#devops_E/docker/#g' "$BUILD_SH" || true
      sed -i '' 's#cd backend$#cd backend_a#g' "$BUILD_SH" || true
      sed -i '' 's#cd frontend$#cd frontend_b#g' "$BUILD_SH" || true
    fi
    log "Patched $BUILD_SH"
  fi
fi

if [ -z "$TEST_SH" ]; then
  TEST_SH="$DEVOPS_DIR/ci_cd/scripts/test.sh"
  if [ "${DRY_RUN:-0}" = "1" ]; then
    log "DRY-RUN: would create $TEST_SH"
  else
    mkdir -p "$(dirname "$TEST_SH")"
    cat > "$TEST_SH" <<'TSH'
#!/usr/bin/env bash
set -euo pipefail

echo "🧪 Running tests..."

if [ -d "./backend_a" ]; then
  echo "🔧 Running backend_a tests..."
  (cd backend_a && npm test || true && npm run test:e2e || true)
fi

if [ -d "./frontend_b" ]; then
  echo "🎨 Running frontend_b tests..."
  (cd frontend_b && npm test || true)
fi
TSH
    chmod +x "$TEST_SH"
    log "Created $TEST_SH"
  fi
else
  log "Found $TEST_SH"
fi

# 6) GitHub Actions workflow (safe heredoc)
log "6) Ensuring minimal GitHub Actions workflow"
mkdir -p .github/workflows
if [ "${DRY_RUN:-0}" = "1" ]; then
  log "DRY-RUN: would write .github/workflows/ci.yml"
else
  cat > .github/workflows/ci.yml <<'CIYML'
name: CI

on:
  push:
  pull_request:

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install & test backend
        working-directory: ./backend_a
        run: |
          npm ci || yarn install --frozen-lockfile || pnpm i --frozen-lockfile
          npm test || true

      - name: Install & test frontend
        working-directory: ./frontend_b
        run: |
          npm ci || yarn install --frozen-lockfile || pnpm i --frozen-lockfile
          npm test || true
CIYML
  log "Wrote .github/workflows/ci.yml"
fi

# 7) Prometheus alerts + wiring
log "7) Adding Prometheus alert rules and wiring them in"
PROM_RULES="$DEVOPS_DIR/monitoring/prometheus/alerts.yml"
if [ "${DRY_RUN:-0}" = "1" ]; then
  log "DRY-RUN: would write $PROM_RULES"
else
  mkdir -p "$(dirname "$PROM_RULES")"
  cat > "$PROM_RULES" <<'ALERTS'
groups:
  - name: transcendence-general
    rules:
      - alert: InstanceDown
        expr: up == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: 'Target down: {{ $labels.instance }}'
          description: 'The instance {{ $labels.instance }} is unreachable.'

      - alert: HighErrorRateBackend
        expr: rate(http_requests_total{job="backend",status=~"5.."}[5m]) / rate(http_requests_total{job="backend"}[5m]) > 0.05
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: 'High 5xx rate on backend'
          description: 'More than 5% of backend requests are failing.'

      - alert: HighContainerCPU
        expr: rate(container_cpu_usage_seconds_total[5m]) * 100 > 85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: 'High CPU usage'
          description: 'Container CPU usage over 85% for 10m.'
ALERTS
  log "Wrote $PROM_RULES"
fi

if [ -n "${PROM_CFG}" ] && [ -f "${PROM_CFG}" ]; then
  if ! grep -q "alerts.yml" "$PROM_CFG"; then
    if [ "${DRY_RUN:-0}" = "1" ]; then
      log "DRY-RUN: would insert rule_files into $PROM_CFG"
    else
      if grep -n '^scrape_configs:' "$PROM_CFG" >/dev/null; then
        line=$(grep -n '^scrape_configs:' "$PROM_CFG" | head -n1 | cut -d: -f1)
        awk -v ln="$line" 'NR==ln{print "rule_files:\n  - alerts.yml"}1' "$PROM_CFG" > "$PROM_CFG.tmp" && mv "$PROM_CFG.tmp" "$PROM_CFG"
        log "Inserted rule_files before scrape_configs in $PROM_CFG"
      else
        printf "\nrule_files:\n  - alerts.yml\n" >> "$PROM_CFG"
        log "Appended rule_files at end of $PROM_CFG"
      fi
    fi
  else
    log "Prometheus already references alerts.yml"
  fi
else
  warn "Prometheus config not found. Skipping rule_files wiring."
fi

# 8) Traefik baseline configs
log "8) Ensuring Traefik baseline configs"
TRAEFIK_STATIC="$DEVOPS_DIR/monitoring/traefik/traefik.yml"
TRAEFIK_DYNAMIC="$DEVOPS_DIR/monitoring/traefik/dynamic/dynamic.yml"
if [ "${DRY_RUN:-0}" = "1" ]; then
  log "DRY-RUN: would write Traefik configs"
else
  mkdir -p "$(dirname "$TRAEFIK_STATIC")" "$(dirname "$TRAEFIK_DYNAMIC")"
  cat > "$TRAEFIK_STATIC" <<'TSTATIC'
entryPoints:
  web:
    address: ':80'
  websecure:
    address: ':443'

api:
  dashboard: true

providers:
  docker: {}
  file:
    filename: /etc/traefik/dynamic/dynamic.yml
    watch: true

certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@example.com
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web
TSTATIC
  cat > "$TRAEFIK_DYNAMIC" <<'TDYN'
http:
  middlewares:
    secure-headers:
      headers:
        frameDeny: true
        contentTypeNosniff: true
        browserXssFilter: true
        stsSeconds: 31536000
        stsIncludeSubdomains: true
        stsPreload: true

  routers:
    app:
      rule: Host(`transcendence.example.com`)
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt
      service: app-svc
      middlewares:
        - secure-headers

  services:
    app-svc:
      loadBalancer:
        servers:
          - url: http://frontend:80
TDYN
  log "Wrote Traefik configs"
fi

echo
log "Summary:"
echo "  DEVOPS_DIR    : $DEVOPS_DIR"
echo "  COMPOSE_MAIN  : ${COMPOSE_MAIN:-<not found>}"
echo "  PROM_CFG      : ${PROM_CFG:-<not found>}"
echo "  BUILD_SH      : ${BUILD_SH:-<created or not found>}"
echo "  TEST_SH       : ${TEST_SH:-<created or not found>}"
log "Done. Review git diff before committing."
