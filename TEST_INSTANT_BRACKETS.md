# Test : Tournois avec Brackets Instantanés

## 🎯 Fonctionnalité

Les tournois **sans date de début prévue** offrent maintenant une expérience utilisateur améliorée :
- Les brackets sont générés immédiatement à la création
- Les joueurs sont redirigés automatiquement vers les brackets
- Les slots se remplissent au fur et à mesure que les joueurs rejoignent
- Le tournoi démarre automatiquement quand tous les slots sont remplis

## ✅ Scénarios de test

### Test 1 : Création d'un tournoi sans date

**Étapes :**
1. Se connecter en tant qu'utilisateur
2. Aller sur `/tournaments/create`
3. Remplir le formulaire :
   - Nom : "Test Tournoi Instantané"
   - Description : "Test des brackets instantanés"
   - Type : Single Elimination
   - Max participants : 4
   - **Ne PAS renseigner de date de début** ⚠️
4. Cliquer sur "Créer le tournoi"

**Résultat attendu :**
- ✅ Le tournoi est créé
- ✅ Redirection automatique vers `/tournaments/{id}/brackets`
- ✅ Le créateur apparaît dans le premier slot du premier match
- ✅ Les autres slots affichent "TBD"
- ✅ Status du tournoi : `open` (pas encore `in_progress`)

### Test 2 : Rejoindre un tournoi avec brackets instantanés

**Étapes :**
1. Se connecter avec un **autre utilisateur** (User2)
2. Aller sur `/tournaments/{id}` (le tournoi créé au Test 1)
3. Cliquer sur "Rejoindre le tournoi"

**Résultat attendu :**
- ✅ Le joueur rejoint le tournoi
- ✅ Redirection automatique vers `/tournaments/{id}/brackets`
- ✅ Le nom du joueur apparaît dans le deuxième slot TBD
- ✅ Les brackets se sont mis à jour en temps réel

### Test 3 : Remplissage progressif des brackets

**Étapes :**
1. Répéter le Test 2 avec User3 et User4
2. Observer l'évolution des brackets après chaque inscription

**Résultat attendu :**
- ✅ Après User3 : 3 slots remplis, 1 TBD restant
- ✅ Après User4 (dernier joueur) :
  - Tous les slots sont remplis
  - Le tournoi passe automatiquement en status `in_progress`
  - Un `startDate` est automatiquement défini
  - Les matches sont prêts à être joués

### Test 4 : Comparaison avec un tournoi avec date

**Étapes :**
1. Créer un tournoi **avec une date de début**
2. Rejoindre le tournoi

**Résultat attendu :**
- ✅ Pas de génération automatique des brackets
- ✅ Pas de redirection vers les brackets
- ✅ Le créateur doit manuellement "Démarrer le tournoi" quand complet

## 🔍 Points de vérification backend

### Logs à surveiller dans la console backend :

```bash
# Lors de la création d'un tournoi sans date :
🎯 INSTANT BRACKETS: No scheduled date, generating brackets immediately with TBD slots
🎯 GENERATING BRACKETS WITH TBD SLOTS: { tournamentId: X }
🎯 Creating 2 matches with TBD slots for 4 max participants
✅ BRACKETS WITH TBD: 2 matches created with TBD slots

# Lors du join d'un joueur :
🔍 JOIN TOURNAMENT: { tournamentId: X, userId: Y }
✅ JOIN SUCCESS: { tournamentId: X, userId: Y, participantCount: 2, status: 'open' }
🎯 ASSIGNING PLAYER TO TBD SLOT: { userId: Y, username: 'User2' }
✅ ASSIGNED: User2 to match Z as player2

# Lors du join du dernier joueur :
🚀 AUTO-START: All slots filled, starting tournament automatically!
```

## 🐛 Tests négatifs

### Test 5 : Tournoi avec date → pas de brackets instantanés

**Étapes :**
1. Créer un tournoi **avec** startDate
2. Vérifier que les brackets ne sont PAS générés automatiquement

**Résultat attendu :**
- ✅ `bracketGenerated = false`
- ✅ Pas de redirection automatique vers brackets
- ✅ Comportement classique préservé

### Test 6 : Accès aux brackets avant complétion

**Étapes :**
1. Créer un tournoi sans date avec 8 slots
2. Rejoindre avec seulement 2 joueurs
3. Accéder à `/tournaments/{id}/brackets`

**Résultat attendu :**
- ✅ Les brackets sont accessibles
- ✅ 2 slots remplis, 6 slots "TBD"
- ✅ Status : `open` (pas encore `in_progress`)
- ✅ Les matches ne peuvent pas encore être joués

## 📊 Structure de la base de données

### Table `tournament`
```sql
-- Pour un tournoi avec brackets instantanés :
bracketGenerated = true
startDate = null (au début)
status = 'open' (jusqu'à ce que tous les joueurs rejoignent)
```

### Table `match`
```sql
-- Matches avec slots TBD :
player1_id = 1 (créateur)
player2_id = null (TBD)
tournament_id = X
round = 1
bracket_position = 0
status = 'pending'
```

## 🎮 Flow complet

```
Créateur
  ↓ Crée tournoi sans date
  ↓ → Redirection vers /brackets
  ↓ Voit son nom + TBD slots

User2
  ↓ Rejoint
  ↓ → Redirection vers /brackets
  ↓ Son nom remplace un TBD

User3
  ↓ Rejoint
  ↓ → Redirection vers /brackets
  ↓ Son nom remplace un TBD

User4 (dernier)
  ↓ Rejoint
  ↓ → AUTO-START ! 🚀
  ↓ Status = IN_PROGRESS
  ↓ startDate = NOW()
  ↓ Tous peuvent jouer
```

## 🔄 Pour annuler/recommencer

Si besoin de reset pendant les tests :

```bash
# Via l'API (nécessite authentification admin)
DELETE /tournaments/admin/clear-all

# Ou via la base de données
DELETE FROM match;
DELETE FROM tournament_participants;
DELETE FROM tournament;
```

## 📝 Notes importantes

- ⚠️ Cette fonctionnalité s'active **uniquement** si `startDate` est `null` ou non défini
- ⚠️ Le créateur est automatiquement inscrit et placé dans le premier slot
- ⚠️ Les joueurs peuvent voir les brackets se remplir en temps réel
- ⚠️ Le tournoi démarre automatiquement dès que le dernier joueur rejoint
