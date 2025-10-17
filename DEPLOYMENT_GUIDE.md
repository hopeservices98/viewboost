# 🚀 Guide Déploiement ViewBoost sur Render

## 📋 Prérequis
- Compte GitHub avec repo `hopeservices98/viewboost`
- Compte Render (gratuit disponible)
- Clé API OpenAI (pour fonctionnalités IA)

---

## 🗄️ ÉTAPE 1 : Créer Base de Données PostgreSQL

### 1.1 Aller sur Render Dashboard
- Se connecter sur [render.com](https://render.com)
- Cliquer **"New"** → **"PostgreSQL"**

### 1.2 Configuration PostgreSQL
```
Name: viewboost-db
Database: viewboost_prod
User: viewboost_user
Region: Frankfurt (Europe) - Recommended
Plan: Free (ou Starter $7/mois)
```

### 1.3 Récupérer l'URL de connexion
- Après création, aller dans **"Settings"**
- Copier **"Internal Database URL"** :
```
postgresql://viewboost_user:password@host:5432/viewboost_prod
```

---

## 🔧 ÉTAPE 2 : Déployer le Backend

### 2.1 Créer Web Service Backend
- Cliquer **"New"** → **"Web Service"**
- **Connect GitHub** : Sélectionner `hopeservices98/viewboost`
- **Root Directory** : `backend`

### 2.2 Configuration Backend
```
Name: viewboost-backend
Runtime: Node
Build Command: npm install && npx prisma generate && npx prisma migrate deploy
Start Command: npm start
Plan: Free (ou Starter $7/mois)
Region: Frankfurt (Europe)
```

### 2.3 Variables d'environnement Backend
Aller dans **"Environment"** et ajouter :

```
# Database
DATABASE_URL=postgresql://viewboost_user:password@host:5432/viewboost_prod

# JWT
JWT_SECRET=votre_jwt_secret_super_securise_ici_au_moins_32_caracteres
JWT_EXPIRES_IN=7d

# OpenAI (optionnel pour MVP)
OPENAI_API_KEY=votre_cle_openai_ici

# Server
NODE_ENV=production
PORT=10000

# Security
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Commissions
COMMISSION_LEVEL_1=0.05
COMMISSION_LEVEL_2=0.02
COMMISSION_LEVEL_3=0.01
HOLD_TIME_HOURS=24

# Anti-Fraud
MIN_WATCH_TIME=30
MAX_CLICKS_PER_IP_DAY=3
MAX_VIEWS_PER_IP_DAY=5
```

### 2.4 Déployer Backend
- Cliquer **"Create Web Service"**
- Attendre le déploiement (~5-10 minutes)
- **URL Backend** : `https://viewboost-backend.onrender.com`

---

## 🎨 ÉTAPE 3 : Déployer le Frontend

### 3.1 Créer Static Site Frontend
- Cliquer **"New"** → **"Static Site"**
- **Connect GitHub** : Sélectionner `hopeservices98/viewboost`
- **Root Directory** : `frontend-next`

### 3.2 Configuration Frontend
```
Name: viewboost-frontend
Build Command: npm run build
Publish Directory: out
Plan: Free
Region: Frankfurt (Europe)
```

### 3.3 Variables d'environnement Frontend
```
NEXT_PUBLIC_API_URL=https://viewboost-backend.onrender.com
```

### 3.4 Déployer Frontend
- Cliquer **"Create Static Site"**
- Attendre le déploiement (~3-5 minutes)
- **URL Frontend** : `https://viewboost-frontend.onrender.com`

---

## 🧪 ÉTAPE 4 : Tester le Déploiement

### 4.1 Vérifier Backend
Visiter : `https://viewboost-backend.onrender.com/api/health`
- Doit retourner : `{"status":"OK","version":"1.0.0"}`

### 4.2 Vérifier Frontend
Visiter : `https://viewboost-frontend.onrender.com`
- Page d'accueil doit charger
- Navigation doit fonctionner

### 4.3 Tester Authentification
1. Aller sur `/auth/register`
2. Créer un compte test
3. Se connecter
4. Accéder au dashboard

### 4.4 Tester API
- **Login** : POST `/api/auth/login`
- **Profile** : GET `/api/auth/profile`
- **Dashboard** : GET `/api/analytics/dashboard`

---

## 🔧 ÉTAPE 5 : Dépannage Commun

### 5.1 Erreur Build Backend
```bash
# Vérifier logs Render
# Problème fréquent : Prisma migration
npx prisma migrate deploy
```

### 5.2 Erreur Base de Données
```bash
# Vérifier DATABASE_URL
# Format correct :
postgresql://user:pass@host:5432/dbname
```

### 5.3 Erreur Frontend
```bash
# Vérifier NEXT_PUBLIC_API_URL
# Doit pointer vers backend Render
```

### 5.4 Erreur CORS
- Ajouter domaine frontend dans backend CORS
- Ou utiliser proxy Render

---

## 📊 ÉTAPE 6 : Monitoring & Logs

### 6.1 Logs Backend
- Aller dans Render Dashboard → Backend Service
- Onglet **"Logs"** pour voir erreurs temps réel

### 6.2 Métriques
- **Response Time** : < 500ms idéal
- **Uptime** : > 99.9%
- **Errors** : Monitor 4xx/5xx

### 6.3 Base de Données
- Vérifier connexions actives
- Monitor usage stockage

---

## 🚀 ÉTAPE 7 : Optimisations Production

### 7.1 Performance
```bash
# Activer compression
app.use(compression());

# Cache statique
app.use(express.static('public', { maxAge: '1y' }));
```

### 7.2 Sécurité
```bash
# Headers sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));
```

### 7.3 Monitoring
- Ajouter **Sentry** pour erreurs
- **UptimeRobot** pour monitoring
- **LogRocket** pour analytics utilisateur

---

## 💰 ÉTAPE 8 : Passage en Production Payante

### 8.1 Upgrade Plans
```
Backend: Starter ($7/mois) - 750 heures
Database: Starter ($7/mois) - 1GB stockage
Frontend: Free (illimité)
```

### 8.2 Domaines Personnalisés
- **Backend** : `api.viewboost.com`
- **Frontend** : `app.viewboost.com`

---

## 🎯 Checklist Déploiement

- [ ] PostgreSQL créé sur Render
- [ ] Backend déployé avec variables d'env
- [ ] Frontend déployé avec API_URL
- [ ] Tests fonctionnels passés
- [ ] Logs vérifiés (pas d'erreurs)
- [ ] Performance acceptable
- [ ] Domaines configurés (optionnel)

---

## 🎊 Félicitations !

Votre plateforme **ViewBoost** est maintenant en production mondiale ! 🚀

**URLs de production :**
- Frontend : `https://viewboost-frontend.onrender.com`
- Backend : `https://viewboost-backend.onrender.com`

**Prochaines étapes :**
1. **Marketing** : Promouvoir votre plateforme
2. **Utilisateurs** : Inviter beta-testers
3. **Feedback** : Collecter avis utilisateurs
4. **Améliorations** : Ajouter nouvelles fonctionnalités

**🎉 Bonne chance avec ViewBoost !**