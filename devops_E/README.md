# 🏗️ DevOps Configuration - Transcendence

This directory contains all the DevOps configuration for the Transcendence project.

## 🚀 Quick Start

### Development Environment

1. **Clone the repository and navigate to the project root**
2. **Start the development environment:**
   ```bash
   cd devops
   docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d
   ```

3. **Check services status:**
   ```bash
   docker-compose ps
   ```

### Production Deployment

```bash
cd devops
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up -d
```

## 📁 Structure Overview

- `docker/` - Docker configurations and compose files
- `ci_cd/` - Continuous Integration and Deployment pipelines
- `environments/` - Environment-specific configurations
- `monitoring/` - Prometheus, Grafana, and logging setup
- `security/` - SSL certificates and security configurations
- `backup/` - Backup and restore scripts
- `docs/` - Detailed documentation

## Arborescence
/devops/ 
│
├── 🐳 /docker/                          # CONTENEURISATION
│   │   📦 Transforme ton code en containers isolés et reproductibles  
│   │
│   ├── docker-compose.yml               # 🎼 Chef d'orchestre : démarre tous les services ensemble
│   ├── docker-compose.dev.yml           # 🔧 Version développement (hot reload, debug)
│   ├── docker-compose.prod.yml          # 🚀 Version production (optimisée, sécurisée)
│   │
│   ├── /backend/                        # 🔧 MODULE 1: Configuration Backend Framework
│   │   ├── Dockerfile                   # 📋 Instructions pour créer l'image backend
│   │   ├── Dockerfile.dev               # 📋 Version développement avec hot reload
│   │   ├── healthcheck.sh               # 🏥 Vérifie si le backend répond correctement
│   │   └── entrypoint.sh                # 🚪 Script de démarrage (migrations, etc.)
│   │
│   ├── /frontend/                       # 🎨 MODULE 2: Configuration Frontend Framework  
│   │   ├── Dockerfile                   # 📋 Build production avec Nginx
│   │   ├── Dockerfile.dev               # 📋 Développement avec Vite HMR
│   │   ├── nginx.conf                   # 🌐 Configuration serveur web
│   │   └── healthcheck.sh               # 🏥 Vérifie si le frontend charge
│   │
│   ├── /database/                       # 💾 Configuration Base de Données
│   │   └── init/01-create-databases.sql # 🏗️ Crée les DBs au premier démarrage
│   │
│   └── /nginx/                          # 🌐 Reverse Proxy (point d'entrée unique)
│       ├── nginx.conf                   # ⚡ Route les requêtes vers les bons services
│       └── ssl/                         # 🔒 Certificats HTTPS
│
├── 🚀 /ci_cd/                           # INTÉGRATION & DÉPLOIEMENT CONTINU
│   │   🔄 Automatise tests, build et déploiement à chaque commit
│   │
│   ├── /github_actions/                 # 🤖 Pipelines automatiques GitHub
│   │   ├── ci.yml                       # ✅ Tests automatiques à chaque push
│   │   ├── cd-staging.yml               # 🎭 Déploie vers staging automatiquement
│   │   └── cd-production.yml            # 🚀 Déploie vers production avec validation
│   │
│   └── /scripts/                        # 🛠️ Scripts réutilisables
│       ├── build.sh                     # 🏗️ Construit toutes les images Docker
│       ├── test.sh                      # 🧪 Lance tous les tests
│       ├── deploy-staging.sh            # 🎭 Déploiement staging
│       └── deploy-production.sh         # 🚀 Déploiement production
│
├── 🌍 /environments/                    # GESTION ENVIRONNEMENTS
│   │   ⚙️ Configuration différente selon dev/staging/prod
│   │
│   ├── .env.dev                         # 🔧 Variables développement (DB locale, debug ON)
│   ├── .env.staging                     # 🎭 Variables staging (DB staging, tests E2E)
│   ├── .env.prod                        # 🚀 Variables production (DB prod, optimisations)
│   │
│   ├── /secrets/                        # 🔐 Mots de passe et clés chiffrés
│   │   ├── dev/                         # 🔐 Secrets développement
│   │   ├── staging/                     # 🔐 Secrets staging  
│   │   └── prod/                        # 🔐 Secrets production
│   │
│   └── /config/                         # ⚙️ Configurations spécifiques par env
│
├── 📊 /monitoring/                      # SURVEILLANCE & MÉTRIQUES
│   │   👀 Surveille la santé et performance de tous tes services
│   │
│   ├── /prometheus/                     # 📈 Collecte des métriques
│   │   ├── prometheus.yml               # ⚙️ Quelles métriques collecter et où
│   │   ├── rules/backend-alerts.yml     # 🚨 Alertes si API lente ou en panne
│   │   └── targets/                     # 🎯 Services à surveiller
│   │
│   ├── /grafana/                        # 📊 Dashboards visuels
│   │   ├── dashboards/                  # 📈 Graphiques temps réel
│   │   │   ├── backend-performance.json # 📊 Performance API (temps réponse, erreurs)
│   │   │   ├── frontend-metrics.json    # 📊 Métriques utilisateur (load time, errors)
│   │   │   └── database-monitoring.json # 📊 Performance DB (requêtes, connexions)
│   │   └── provisioning/                # 🤖 Configuration automatique
│   │
│   ├── /logging/                        # 📝 Centralisation des logs
│   │   ├── /elasticsearch/              # 🔍 Stockage et indexation des logs
│   │   ├── /kibana/                     # 📊 Interface de recherche dans les logs
│   │   └── /fluentd/                    # 📡 Collecte logs de tous les containers
│   │
│   └── /alerting/                       # 🚨 Système d'alertes
│       ├── alertmanager.yml             # 🚨 Quand et comment alerter
│       └── notification-templates/      # 📧 Templates Slack/Email/Discord
│
├── 🔒 /security/                        # SÉCURITÉ
│   │   🛡️ Protection contre les vulnérabilités et attaques
│   │
│   ├── /ssl/                            # 🔐 Certificats HTTPS
│   │   ├── letsencrypt-setup.sh         # 🤖 Génération automatique SSL
│   │   └── ssl-renew.sh                 # 🔄 Renouvellement automatique
│   │
│   ├── /scanning/                       # 🔍 Scan sécurité
│   │   ├── security-scan.sh             # 🔍 Cherche vulnérabilités dans le code
│   │   ├── docker-scan.sh               # 🔍 Scan images Docker
│   │   └── dependency-check.sh          # 🔍 Vulnérabilités dans les dépendances
│   │
│   └── /policies/                       # 📋 Règles de sécurité
│       ├── network-policy.yml           # 🌐 Restrictions réseau
│       └── access-control.yml           # 🔐 Contrôle d'accès
│
├── 💾 /backup/                          # SAUVEGARDE & RESTAURATION
│   │   💼 Protège tes données contre la perte
│   │
│   ├── /scripts/                        # 🤖 Scripts automatisés
│   │   ├── backup-all.sh                # 💾 Sauvegarde complète (DB + fichiers)
│   │   ├── backup-database.sh           # 🗄️ DB uniquement
│   │   ├── restore-all.sh               # ↩️ Restauration complète
│   │   └── verify-backup.sh             # ✅ Vérifie intégrité backup
│   │
│   ├── /cron/                           # ⏰ Planification automatique
│   │   ├── daily-backup.cron            # 📅 Sauvegarde quotidienne
│   │   └── weekly-backup.cron           # 📅 Sauvegarde hebdomadaire
│   │
│   └── /retention/                      # 🗂️ Gestion anciens backups
│       └── cleanup-old-backups.sh       # 🧹 Supprime les vieux backups
│
├── ⚡ /performance/                     # OPTIMISATION PERFORMANCE
│   │   🏃‍♂️ Assure que ton app est rapide et réactive
│   │
│   ├── /testing/                        # 🧪 Tests de charge
│   │   ├── k6-tests/load-test.js        # 📈 Simule 1000 utilisateurs simultanés
│   │   ├── stress-test.js               # 💪 Teste limites du système
│   │   └── benchmark.sh                 # 📊 Compare performances avant/après
│   │
│   └── /optimization/                   # ⚡ Configurations optimisées
│       ├── nginx-tuning.conf            # 🌐 Nginx haute performance
│       ├── postgres-tuning.sql          # 🗄️ DB optimisée
│       └── backend-optimization.yml     # 🔧 Backend optimisé
│
├── 🚀 /deployment/                      # STRATÉGIES DÉPLOIEMENT
│   │   🎯 Déploie sans casser la production
│   │
│   ├── /strategies/                     # 📋 Différentes méthodes
│   │   ├── blue-green/                  # 🔵🟢 Deux environnements identiques
│   │   ├── rolling/                     # 🔄 Mise à jour progressive
│   │   └── canary/                      # 🐦 Test sur petit % utilisateurs
│   │
│   └── /infrastructure/                 # 🏗️ Infrastructure as Code
│       ├── terraform/                   # ☁️ Provisioning cloud automatique
│       └── ansible/                     # 🤖 Configuration serveurs
│
├── 🛠️ /tools/                          # OUTILS UTILITAIRES
│   │   🔧 Scripts pour simplifier le développement
│   │
│   ├── /development/                    # 👨‍💻 Aide développement
│   │   ├── setup-dev-env.sh             # 🚀 Setup complet en 1 commande
│   │   ├── reset-dev-data.sh            # 🔄 Reset données dev
│   │   └── generate-test-data.sh        # 🎲 Génère données de test
│   │
│   ├── /maintenance/                    # 🧹 Maintenance système
│   │   ├── maintenance-mode.sh          # 🚧 Active mode maintenance
│   │   ├── database-cleanup.sh          # 🧹 Nettoie la DB
│   │   └── log-rotation.sh              # 📝 Rotation des logs
│   │
│   └── /utilities/                      # 🔧 Utilitaires divers
│       ├── service-status.sh            # 📊 Status de tous les services
│       ├── resource-monitor.sh          # 💻 Monitoring ressources
│       └── port-checker.sh              # 🔌 Vérifie ports disponibles
│
├── 📚 /docs/                            # DOCUMENTATION
│   │   📖 Guides pour toi et ton équipe
│   │
│   ├── README.md                        # 🏠 Point d'entrée documentation
│   ├── SETUP.md                         # 🚀 Installation pas à pas
│   ├── DEPLOYMENT.md                    # 🚀 Guide déploiement
│   ├── MONITORING.md                    # 📊 Comment utiliser le monitoring
│   ├── TROUBLESHOOTING.md               # 🔧 Résolution problèmes courants
│   │
│   └── /runbooks/                       # 📋 Procédures d'urgence
│       ├── database-down.md             # 🚨 Que faire si DB en panne
│       ├── high-cpu-usage.md            # 🚨 CPU à 100%
│       └── ssl-certificate-expiry.md    # 🚨 Certificat SSL expiré
│
└── ⚙️ /config/                         # CONFIGURATIONS GLOBALES
    │   🎛️ Configurations partagées
    │
    ├── .gitignore                       # 🙈 Fichiers à ignorer par Git
    ├── Makefile                         # 🔨 Commandes raccourcies
    └── /templates/                      # 📋 Templates réutilisables

## 🛠️ Available Scripts

### Build Services
```bash
./ci_cd/scripts/build.sh
```

### Run Tests
```bash
./ci_cd/scripts/test.sh
```

### Deploy to Staging
```bash
./ci_cd/scripts/deploy-staging.sh
```

## 📊 Monitoring

- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090

## 🔧 Configuration

Copy `.env.example` to `.env.dev` and fill in your environment variables:

```bash
cp environments/.env.example environments/.env.dev
```

## 📚 Documentation

For detailed documentation, see the `docs/` directory:

- [Setup Guide](docs/SETUP.md)
- [Deployment Guide](docs/DEPLOYMENT.md)  
- [Monitoring Guide](docs/MONITORING.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## 🆘 Need Help?

Check the troubleshooting guide or create an issue in the project repository.
