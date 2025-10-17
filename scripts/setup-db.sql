-- Script de configuration de la base de données PostgreSQL
-- À exécuter dans pgAdmin ou psql

-- Créer la base de données
CREATE DATABASE affiliation_db;

-- Créer l'utilisateur (optionnel, ajuster selon vos besoins)
-- CREATE USER affiliation_user WITH PASSWORD 'your_password_here';
-- GRANT ALL PRIVILEGES ON DATABASE affiliation_db TO affiliation_user;

-- Se connecter à la base de données
\c affiliation_db;

-- Extensions utiles (optionnel)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Note: Prisma gérera automatiquement la création des tables avec npx prisma migrate dev