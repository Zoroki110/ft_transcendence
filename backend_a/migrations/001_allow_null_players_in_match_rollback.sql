-- Rollback: Remettre les contraintes NOT NULL pour player1_id et player2_id
-- Date: 2025-10-15
-- ATTENTION: Ce rollback supprimera tous les matches avec des joueurs NULL (TBD)

-- Supprimer les matches avec des joueurs NULL avant de remettre la contrainte
DELETE FROM match WHERE player1_id IS NULL OR player2_id IS NULL;

-- Remettre la contrainte NOT NULL sur player1_id
ALTER TABLE match ALTER COLUMN player1_id SET NOT NULL;

-- Remettre la contrainte NOT NULL sur player2_id
ALTER TABLE match ALTER COLUMN player2_id SET NOT NULL;
