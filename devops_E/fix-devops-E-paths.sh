#!/bin/bash
echo "🔧 Correction de tous les chemins pour devops_E"

# Dans tous les fichiers docker-compose
for file in docker/docker-compose*.yml; do
    echo "📝 Correction de $file"
    
    # Corriger tous les chemins devops → devops_E
    sed -i 's|../devops_E/|../devops_E/|g' "$file"
    
done

# Corriger aussi dans les scripts si nécessaire
find . -name "*.sh" -exec sed -i 's|/devops_E/|/devops_E/|g' {} \;

echo "✅ Tous les chemins corrigés pour devops_E"

# Vérification
echo "🔍 Chemins dockerfile dans docker-compose.yml :"
grep "dockerfile:" docker/docker-compose.yml
