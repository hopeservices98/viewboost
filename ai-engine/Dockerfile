# Dockerfile pour le module IA
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S aiuser -u 1001

# Changer les permissions
RUN chown -R aiuser:nodejs /app
USER aiuser

# Le module IA sera appelé via API depuis le backend
# Pas de port exposé, c'est un service interne