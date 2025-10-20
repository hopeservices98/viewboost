# Dockerfile pour le backend
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances (incluant postinstall qui génère Prisma)
RUN npm ci --only=production

# Copier le code source
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Appliquer les migrations Prisma en production
RUN npx prisma migrate deploy

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Changer les permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Exposer le port
EXPOSE 5000

# Commande de démarrage
CMD ["npm", "start"]