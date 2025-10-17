# Pages Front-end Essentielles MVP

## Pages Publiques
- **Landing Page** (`/`) : Présentation plateforme, inscription
- **Login/Signup** (`/auth`) : Authentification utilisateurs
- **Tracking Pixel** (`/r/:token`) : Redirection affiliée (pas de UI, logique backend)

## Dashboard Affilié (`/dashboard`)
- **Vue d'ensemble** : Balance, vues totales, commissions du mois
- **Liens affiliés** : Liste des liens actifs avec stats (clics, vues, conversions)
- **Historique commissions** : Tableau des gains par campagne/niveau
- **Demandes payout** : Formulaire et historique des retraits

## Dashboard Créateur (`/creator`)
- **Campagnes** : Créer/éditer campagnes vidéo
- **Stats campagnes** : Vues, coût total, ROI
- **Liens générés** : Liste des liens affiliés par campagne
- **Paiements** : Historique des dépenses

## Pages Admin (`/admin`) - Phase 2
- **Utilisateurs** : Gestion comptes, stats globales
- **Fraude** : Revue des clics/vues suspects
- **Paiements** : Validation payouts, stats financières

## Composants Réutilisables
- **Header/Navbar** : Navigation selon rôle utilisateur
- **Charts** : Graphiques stats (Chart.js ou Recharts)
- **Tables** : Listes avec pagination et filtres
- **Forms** : Création campagnes, demandes payout
- **Modals** : Confirmations, détails

## Layout Responsive
- **Mobile-first** : Design adaptatif pour tous appareils
- **Dark/Light mode** : Thème switchable
- **Loading states** : Skeletons et spinners
- **Error handling** : Messages d'erreur user-friendly

## Intégrations
- **API calls** : Axios/Fetch pour communication backend
- **Auth** : JWT token management, refresh automatique
- **Real-time** : WebSocket pour updates live (optionnel MVP)