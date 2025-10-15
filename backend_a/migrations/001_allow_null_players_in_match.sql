-- Migration: Autoriser les valeurs NULL pour player1_id et player2_id dans la table match
-- Date: 2025-10-15
-- Raison: Permettre les brackets avec slots TBD pour les tournois sans date prévue

-- Modifier la colonne player1_id pour autoriser NULL
ALTER TABLE match ALTER COLUMN player1_id DROP NOT NULL;

-- Modifier la colonne player2_id pour autoriser NULL
ALTER TABLE match ALTER COLUMN player2_id DROP NOT NULL;

-- Vérification: Ces requêtes doivent maintenant fonctionner sans erreur
-- SELECT * FROM match WHERE player1_id IS NULL OR player2_id IS NULL;
