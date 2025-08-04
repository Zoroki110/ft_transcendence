FROM node:18

WORKDIR /app

# Copier le fichier package.json et installer les dépendances
COPY package.json ./
RUN npm install

# Copier tout le reste du code
COPY . .

# Exposer le port de l'application
EXPOSE 3000

# Lancer l'application
CMD ["npm", "run", "start"]