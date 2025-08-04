FROM node:18

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier le package.json et package-lock.json (si présent) dans le conteneur
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tout le reste du code
COPY . .

# Exposer le port 3000
EXPOSE 3000

# Démarrer l'application
CMD ["npm", "run", "start"]