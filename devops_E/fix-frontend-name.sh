#!/bin/bash
# Fix frontend service name backend → frontend_b

echo "🎨 Correction du nom de service frontend → frontend_b"

# Dans docker-compose.yml
sed -i 's/frontend:/frontend_b:/g' docker/docker-compose.yml
sed -i 's/transcendence-frontend/transcendence-frontend-b/g' docker/docker-compose.yml
sed -i 's/- frontend$/- frontend_b/g' docker/docker-compose.yml
sed -i 's/http:\/\/frontend:/http://frontend_b:/g' docker/docker-compose.yml

# Dans docker-compose.dev.yml  
sed -i 's/frontend:/frontend_b:/g' docker/docker-compose.dev.yml
sed -i 's/- frontend$/- frontend_b/g' docker/docker-compose.dev.yml

# Dans docker-compose.prod.yml
sed -i 's/frontend:/frontend_b:/g' docker/docker-compose.prod.yml
sed -i 's/- frontend$/- frontend_b/g' docker/docker-compose.prod.yml

# Dans les configs nginx qui pointent vers le frontend
find docker/nginx -name "*.conf" -exec sed -i 's/frontend:/frontend_b:/g' {} \;
find docker/nginx -name "*.conf" -exec sed -i 's/upstream frontend/upstream frontend_b/g' {} \;

echo "✅ Correction frontend terminée"
echo "🔍 Vérification :"
grep -n "frontend" docker/docker-compose.yml
