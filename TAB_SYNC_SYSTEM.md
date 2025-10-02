# 🚀 Système de Synchronisation Inter-Onglets

## 🎯 Objectif

Quand un tournoi se lance (passe en status `IN_PROGRESS`), **tous les onglets connectés sur le même navigateur** sont automatiquement notifiés et se rechargent pour refléter les changements.

## ⚙️ Architecture

### 1. 🔗 Communication Inter-Onglets (`/src/utils/tabSync.ts`)
- Utilise l'API **BroadcastChannel** du navigateur
- Permet l'envoi de messages entre tous les onglets du même domaine
- Types d'événements : `TOURNAMENT_STARTED`, `FORCE_REFRESH`, `REFRESH_STATS`

### 2. 🎣 Hooks React (`/src/hooks/useTabSync.ts`)
- **`useTabSync()`** : Hook principal pour envoyer/recevoir des notifications
- **`useTournamentAutoRefresh()`** : Auto-refresh quand un tournoi démarre
- **`useStatsSync()`** : Synchronisation des statistiques entre onglets

### 3. 👀 Surveillance des Tournois (`/src/hooks/useTournamentWatcher.ts`)
- **`useTournamentWatcher()`** : Surveille tous les tournois toutes les 5 secondes
- **`useSpecificTournamentWatcher()`** : Surveille un tournoi spécifique
- Détecte les changements de statut `FULL/OPEN` → `IN_PROGRESS`

### 4. 🎛️ Gestionnaire Central (`/src/components/TabSyncManager.tsx`)
- Composant invisible intégré dans l'App
- Active tous les systèmes de synchronisation
- Gère les permissions de notification

## 🧪 Comment Tester

### **Test 1: Simulation Manuelle**
1. **Ouvre 2-3 onglets** sur `/profile`
2. **Clique sur "🏆 Test Tournoi Started"** dans l'un des onglets (widget en bas à droite)
3. **Observe :** Tous les autres onglets se rechargent automatiquement après 2 secondes

### **Test 2: Tournoi Réel**
1. **Crée un tournoi** avec 2 participants max
2. **Ouvre plusieurs onglets** connectés avec différents utilisateurs
3. **Inscris 2 participants** au tournoi
4. **Lance le tournoi** (generate brackets)
5. **Observe :** Tous les onglets se rechargent automatiquement

### **Test 3: Vérification Console**
Logs à surveiller :
```
🔗 TabSync: Canal de communication initialisé
🏆 TOURNAMENT WATCHER: Tournoi 1 vient de démarrer !
🔗 TabSync: Message envoyé [TOURNAMENT_STARTED]
🏆 AUTO-REFRESH: Tournoi 1 démarré, rechargement de la page...
```

## 📱 Notifications Navigateur

Le système demande automatiquement la permission et affiche :
- **🏆 Tournoi Démarré !** 
- *"Le tournoi X vient de commencer. La page va se recharger."*

## 🔧 Widgets de Debug

### **En Haut à Droite (DebugStorage)**
- Affiche l'utilisateur connecté dans cet onglet
- Statut du token sessionStorage
- État de connexion en temps réel

### **En Bas à Droite (TabSyncDebugger)**
- **Test Tournoi Started** : Simule le démarrage d'un tournoi
- **Test Force Refresh** : Force le rechargement de tous les onglets
- **Test Stats Refresh** : Déclenche une synchronisation des stats

## 🎮 Intégration

Le système est **automatiquement actif** sur toutes les pages grâce à :
```tsx
// Dans App.tsx
<TabSyncManager />
```

### **Pages Concernées**
- ✅ **Toutes les pages** : Auto-refresh sur démarrage de tournoi
- ✅ **Pages de profil** : Synchronisation des stats
- ✅ **Pages de tournoi** : Surveillance spécifique

## 🚨 Cas d'Usage Résolus

### **Problème Initial**
> "Si on lance une partie entre 2 joueurs dans le matchmaking sur 2 onglets du même navigateur, il faut que ça refresh automatiquement quand le tournoi se lance"

### **Solution Implémentée**
✅ **Sessions séparées** : `sessionStorage` isole les utilisateurs par onglet  
✅ **Communication inter-onglets** : BroadcastChannel synchronise les événements  
✅ **Auto-refresh** : Tous les onglets se rechargent automatiquement  
✅ **Notifications** : L'utilisateur est prévenu avant le rechargement  

## 🔄 Flux Complet

1. **Utilisateur A** (onglet 1) et **Utilisateur B** (onglet 2) s'inscrivent au tournoi
2. **Créateur** lance le tournoi (`generate-brackets`)
3. **Backend** passe le tournoi en statut `IN_PROGRESS`  
4. **TournamentWatcher** détecte le changement toutes les 5 secondes
5. **TabSync** diffuse `TOURNAMENT_STARTED` à tous les onglets
6. **Notification** s'affiche pendant 2 secondes
7. **Auto-refresh** recharge tous les onglets automatiquement

## ⚡ Performance

- **Polling léger** : Vérification toutes les 5 secondes seulement
- **Cache intelligent** : Évite les requêtes inutiles
- **Messages optimisés** : Transmission uniquement des données nécessaires
- **Cleanup automatique** : Nettoyage des listeners au démontage

**Le système est maintenant prêt ! 🚀**