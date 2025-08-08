#!/bin/bash
# Forcer les variables d'environnement backend

# Trouver la ligne env_file et ajouter environment après
sed -i '/backend_a:/,/networks:/ {
    /env_file:/a\
    environment:\
      - POSTGRES_HOST=database\
      - POSTGRES_PORT=5432\
      - POSTGRES_DB=transcendence_dev\
      - POSTGRES_USER=transcendence\
      - POSTGRES_PASSWORD=dev_secure_f8a9c2e1b4d7\
      - DATABASE_URL=postgresql://transcendence:dev_secure_f8a9c2e1b4d7@database:5432/transcendence_dev\
      - NODE_ENV=development
}' docker/docker-compose.yml

echo "✅ Variables environnement forcées pour backend_a"
