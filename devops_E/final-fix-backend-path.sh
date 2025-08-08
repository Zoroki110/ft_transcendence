#!/bin/bash

echo "🔧 Correction finale de tous les chemins backend"

# Dans tous les fichiers docker-compose
for file in docker/docker-compose*.yml; do
    echo "📝 Correction de $file"
    
    # Remplacer tous les chemins backend par backend_a
    sed -i 's|context: ../../backend|context: ../../backend_a|g' "$file"
    sed -i 's|dockerfile: ../devops_E/docker/backend/|dockerfile: ../devops_E/docker/backend_a/|g' "$file"
    
    # Afficher les lignes modifiées
    echo "   Context lines:"
    grep -n "context.*backend" "$file" || echo "   Aucun contexte backend trouvé"
done

echo "✅ Correction terminée"
