# Affiliation Booster AI - Plateforme d'Affiliation YouTube

🚀 **Plateforme d'affiliation YouTube avec IA intégrée** pour automatiser les gains des créateurs de contenu et affiliés.

## 🏗️ Architecture

- **Backend**: Node.js + Express + PostgreSQL + Prisma
- **IA**: OpenAI API (détection fraude, recommandations, chatbot)
- **Frontend**: Next.js + TailwindCSS (à venir)
- **Déploiement**: Docker + Docker Compose

## 📋 Fonctionnalités

### Phase 1 (MVP)
- ✅ Authentification JWT
- ✅ Gestion utilisateurs (créateurs/affiliés)
- 🔄 Création campagnes YouTube
- 🔄 Génération liens affiliés
- 🔄 Tracking clics et vues
- 🔄 Calcul commissions multi-niveaux

### Phase 2 (IA)
- ✅ Module IA avec OpenAI
- 🔄 Détection automatique de fraude
- 🔄 Recommandations personnalisées
- 🔄 Chatbot support IA

### Phase 3 (Automatisation)
- 🔄 Paiements automatiques
- 🔄 Notifications webhooks
- 🔄 Optimisation campagnes IA

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (ou utiliser Docker)

### Installation

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd affiliation-booster-ai
   ```

2. **Configuration**
   ```bash
   # Copier les fichiers .env
   cp backend/.env.example backend/.env
   cp ai-engine/.env.example ai-engine/.env

   # Éditer les variables d'environnement
   # Ajouter votre OPENAI_API_KEY
   ```

3. **Démarrage avec Docker (recommandé)**
   ```bash
   # Construire et démarrer tous les services
   docker-compose up --build

   # Ou en arrière-plan
   docker-compose up -d --build
   ```

4. **Migration base de données**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Démarrage manuel (sans Docker)**
   ```bash
   # Terminal 1: Base de données
   # Installer PostgreSQL localement

   # Terminal 2: Backend
   cd backend
   npm install
   npm run dev

   # Terminal 3: IA (optionnel)
   cd ai-engine
   npm install
   ```

## 📊 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Profil utilisateur

### Santé système
- `GET /api/health` - État des services

## 🗂️ Structure du Projet

```
affiliation-booster-ai/
├── backend/              # API Express.js
│   ├── controllers/      # Logique métier
│   ├── routes/          # Endpoints API
│   ├── middleware/      # Auth, sécurité
│   ├── prisma/          # Schéma base de données
│   └── Dockerfile
├── ai-engine/           # Module IA OpenAI
├── frontend/            # Next.js (à venir)
├── scripts/             # Automatisations SQL
├── docs/                # Documentation
├── docker-compose.yml   # Orchestration
└── README.md
```

## 🔧 Configuration

### Variables d'environnement

**Backend (.env)**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/affiliation_db
JWT_SECRET=votre_cle_jwt_secrete
OPENAI_API_KEY=votre_cle_openai
PORT=5000
```

**IA (.env)**
```env
OPENAI_API_KEY=votre_cle_openai
OPENAI_MODEL=gpt-3.5-turbo
```

## 🧪 Tests

```bash
# Tests backend
cd backend
npm test

# Tests IA
cd ai-engine
npm test
```

## 🚢 Déploiement

### Production
```bash
# Build production
docker-compose -f docker-compose.prod.yml up --build
```

### Variables production
- Utiliser des secrets Docker
- Configurer HTTPS
- Base de données managée (RDS, etc.)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commit les changements
4. Push et créer une PR

## 📝 Licence

MIT License - voir LICENSE pour plus de détails.

## 📞 Support

- Issues GitHub pour les bugs
- Discussions pour les questions
- Email pour support premium

---

**Développé avec ❤️ pour la communauté YouTube**