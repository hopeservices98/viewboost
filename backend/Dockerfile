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

# Solution finale : supprimer manuellement les tables existantes puis les recréer
RUN sleep 20 && PGPASSWORD=$DATABASE_URL npx prisma db execute --file=./scripts/reset-db.sql --schema=./prisma/schema.prisma || npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss --force-reset --skip-generate

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