#!/bin/bash
echo "🔧 Correction des chemins dans les Dockerfiles"

# Copier les fichiers nécessaires dans les contextes
echo "📁 Copie des fichiers dans backend_a/"
cp docker/backend/healthcheck.sh ../backend_a/ 2>/dev/null || echo "⚠️ healthcheck.sh introuvable"
cp docker/backend/entrypoint.sh ../backend_a/ 2>/dev/null || echo "ℹ️ entrypoint.sh non nécessaire"
cp docker/backend/wait-for-it.sh ../backend_a/ 2>/dev/null || echo "ℹ️ wait-for-it.sh non nécessaire"
chmod +x ../backend_a/*.sh 2>/dev/null

# Corriger le Dockerfile backend
echo "🔧 Correction du Dockerfile backend"
sed -i 's|COPY ../devops_E/docker/backend/|COPY |g' docker/backend/Dockerfile
sed -i 's|COPY ../devops/docker/backend/|COPY |g' docker/backend/Dockerfile

# Vérifier les corrections
echo "✅ Lignes COPY dans le Dockerfile backend :"
grep -n "COPY.*\.sh" docker/backend/Dockerfile

# Vérifier que les fichiers sont bien copiés
echo "📁 Fichiers .sh dans backend_a/ :"
ls -la ../backend_a/*.sh 2>/dev/null || echo "ℹ️ Aucun fichier .sh trouvé"
