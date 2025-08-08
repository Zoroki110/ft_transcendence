#!/bin/bash
echo "🔧 Nettoyage et fix de la section environment backend_a"

# Créer un nouveau docker-compose temporaire
cp docker/docker-compose.yml docker/docker-compose.yml.backup

# Extraire tout sauf la section backend_a
sed '/backend_a:/,/^[[:space:]]*[a-zA-Z]/{ /^[[:space:]]*[a-zA-Z]/!d; /backend_a:/d; }' docker/docker-compose.yml > temp_compose.yml

# Ajouter la section backend_a corrigée
cat >> temp_compose.yml << 'BACKEND_SECTION'

  backend_a:
    build:
      context: ../../backend_a
      dockerfile: ../devops_E/docker/backend/Dockerfile
    container_name: transcendence-backend-a
    ports:
      - "3000:3000"
    environment:
      - POSTGRES_HOST=database
      - POSTGRES_PORT=5432
      - POSTGRES_DB=transcendence_dev
      - POSTGRES_USER=transcendence
      - POSTGRES_PASSWORD=dev_secure_f8a9c2e1b4d7
      - DATABASE_URL=postgresql://transcendence:dev_secure_f8a9c2e1b4d7@database:5432/transcendence_dev
      - NODE_ENV=development
    env_file:
      - ../environments/.env.dev
    depends_on:
      - database
    networks:
      - transcendence-network
    healthcheck:
      test: ["CMD", "./healthcheck.sh"]
      interval: 30s
      timeout: 10s
      retries: 3
BACKEND_SECTION

# Remplacer le fichier
mv temp_compose.yml docker/docker-compose.yml

echo "✅ docker-compose.yml corrigé"
