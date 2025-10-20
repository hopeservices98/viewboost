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

# SOLUTION RADICALE: Supprimer TOUTES les migrations et utiliser seulement db push
RUN rm -rf prisma/migrations

# Nettoyer complètement la base de données
RUN sleep 10 && PGPASSWORD=$DATABASE_URL psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;"

# Générer le client Prisma
RUN npx prisma generate

# Créer les tables directement depuis le schéma (pas de migrations)
RUN npx prisma db push --accept-data-loss --force-reset --skip-generate

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