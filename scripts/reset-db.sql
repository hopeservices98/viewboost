-- Script pour nettoyer complètement la base de données ViewBoost
-- À exécuter avant la création des nouvelles tables

-- Supprimer toutes les tables existantes dans l'ordre des dépendances
DROP TABLE IF EXISTS "Commission" CASCADE;
DROP TABLE IF EXISTS "View" CASCADE;
DROP TABLE IF EXISTS "Click" CASCADE;
DROP TABLE IF EXISTS "AffiliateLink" CASCADE;
DROP TABLE IF EXISTS "Campaign" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Supprimer les types enum s'ils existent
DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "Status" CASCADE;

-- Nettoyer les éventuels indexes et contraintes restantes
DROP INDEX IF EXISTS "User_email_key" CASCADE;
DROP INDEX IF EXISTS "AffiliateLink_token_key" CASCADE;
DROP INDEX IF EXISTS "Campaign_youtubeUrl_key" CASCADE;