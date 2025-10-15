# Migrations de Base de Données

Ce dossier contient les migrations SQL pour la base de données du projet Transcendence.

## 📋 Liste des migrations

### 001 - Autoriser NULL pour les joueurs dans les matches
**Fichier:** `001_allow_null_players_in_match.sql`
**Date:** 2025-10-15
**Objectif:** Permettre les brackets avec slots TBD pour les tournois sans date prévue

**Changements:**
- `match.player1_id` : `NOT NULL` → `NULL`
- `match.player2_id` : `NOT NULL` → `NULL`

**Raison:** Pour les tournois sans date planifiée, les brackets sont générés immédiatement avec des slots "TBD" (To Be Determined). Ces slots sont représentés par des valeurs NULL en base de données jusqu'à ce qu'un joueur rejoigne et soit assigné à ce slot.

## 🚀 Comment appliquer une migration

### Méthode 1 : Via psql

```bash
# Se connecter à la base de données
psql -U your_username -d transcendence_db

# Appliquer la migration
\i backend_a/migrations/001_allow_null_players_in_match.sql

# Vérifier
\d match
```

### Méthode 2 : Via docker-compose

```bash
# Si votre base de données tourne dans Docker
docker exec -i transcendence_db psql -U postgres -d transcendence_db < backend_a/migrations/001_allow_null_players_in_match.sql
```

### Méthode 3 : Via une ligne de commande

```bash
psql -U postgres -d transcendence_db -f backend_a/migrations/001_allow_null_players_in_match.sql
```

## ↩️ Comment rollback une migration

Si vous devez annuler une migration :

```bash
psql -U postgres -d transcendence_db -f backend_a/migrations/001_allow_null_players_in_match_rollback.sql
```

⚠️ **ATTENTION:** Le rollback de la migration 001 supprimera tous les matches avec des joueurs NULL (slots TBD).

## ✅ Vérifier l'état de la base de données

Après avoir appliqué une migration, vérifiez que tout fonctionne :

```sql
-- Vérifier que les colonnes acceptent NULL
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'match'
AND column_name IN ('player1_id', 'player2_id');

-- Doit retourner :
--  column_name | is_nullable
-- -------------+-------------
--  player1_id  | YES
--  player2_id  | YES
```

## 📝 Bonnes pratiques

1. **Toujours faire un backup** avant d'appliquer une migration en production
2. **Tester la migration** en environnement de développement d'abord
3. **Vérifier les données** après la migration
4. **Garder les fichiers de rollback** pour pouvoir annuler si nécessaire

## 🔍 Debugging

Si la migration échoue :

```sql
-- Voir les contraintes actuelles
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'match'::regclass;

-- Voir la structure de la table
\d match

-- Voir s'il y a des foreign keys qui posent problème
SELECT * FROM pg_constraint WHERE conrelid = 'match'::regclass;
```

## 📚 Ressources

- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [TypeORM Migrations](https://typeorm.io/migrations)
