# 📚 Guide Complet pgAdmin 4 - Installation et Configuration

## 🎯 Objectif
Ce guide vous explique étape par étape comment installer et configurer PostgreSQL + pgAdmin 4 pour votre plateforme d'affiliation YouTube.

---

## 📥 ÉTAPE 1 : Téléchargement et Installation

### 1.1 Télécharger PostgreSQL + pgAdmin
1. **Aller sur le site officiel** : https://www.postgresql.org/download/
2. **Choisir votre système** : Windows
3. **Télécharger la version recommandée** (PostgreSQL 15 ou 16)
4. **Lancer l'installation** :
   - Suivre l'assistant d'installation
   - **Important** : Cocher pgAdmin 4 lors de l'installation

### 1.2 Installation par défaut
- **Utilisateur** : postgres
- **Mot de passe** : Choisissez un mot de passe simple (ex: `password123`)
- **Port** : 5432 (laisser par défaut)
- **Répertoire** : C:\Program Files\PostgreSQL\15\ (ou version installée)

---

## 🚀 ÉTAPE 2 : Premier Démarrage de pgAdmin

### 2.1 Lancer pgAdmin
1. **Rechercher** : "pgAdmin 4" dans le menu Démarrer
2. **Première ouverture** :
   - Définir un mot de passe maître pour pgAdmin
   - Ce mot de passe protège votre interface pgAdmin (différent du mot de passe PostgreSQL)

### 2.2 Interface pgAdmin
- **Panneau gauche** : Serveurs et bases de données
- **Panneau central** : Requêtes SQL et résultats
- **Panneau droit** : Propriétés et statistiques

---

## 🔧 ÉTAPE 3 : Connexion à PostgreSQL

### 3.1 Créer une connexion serveur
1. **Clic droit** sur "Servers" → "Create" → "Server..."
2. **Onglet General** :
   - **Name** : `Local PostgreSQL`
3. **Onglet Connection** :
   - **Host name/address** : `localhost`
   - **Port** : `5432`
   - **Username** : `postgres`
   - **Password** : Votre mot de passe PostgreSQL (ex: `password123`)
4. **Tester la connexion** : Bouton "Save" puis connexion automatique

### 3.2 Vérifier la connexion
- Le serveur devrait apparaître en vert dans le panneau gauche
- Vous devriez voir les bases système : postgres, template0, template1

---

## 🗄️ ÉTAPE 4 : Créer la Base de Données

### 4.1 Via pgAdmin (Méthode graphique)
1. **Clic droit** sur votre serveur → "Create" → "Database..."
2. **Nom de la base** : `affiliation_db`
3. **Propriétaire** : `postgres`
4. **Cliquez "Save"**

### 4.2 Via SQL (Méthode script)
1. **Ouvrir l'éditeur SQL** :
   - Clic droit sur votre serveur → "Query Tool"
2. **Copier-coller le script** :
   ```sql
   CREATE DATABASE affiliation_db;
   ```
3. **Exécuter** : Bouton "Execute" (ou F5)

---

## 📋 ÉTAPE 5 : Configuration du Projet

### 5.1 Variables d'environnement
Modifier le fichier `backend/.env` :
```env
DATABASE_URL="postgresql://postgres:password123@localhost:5432/affiliation_db"
```

**⚠️ Important** : Remplacez `password123` par votre vrai mot de passe PostgreSQL

### 5.2 Tester la connexion
```bash
cd backend
npm run dev
```

**Résultat attendu** : "Connecté à PostgreSQL via Prisma" dans les logs

---

## 🔄 ÉTAPE 6 : Migration Prisma

### 6.1 Créer les tables
```bash
cd backend
npx prisma migrate dev --name init
```

### 6.2 Générer le client Prisma
```bash
npx prisma generate
```

### 6.3 Vérifier dans pgAdmin
- Rafraîchir la base `affiliation_db`
- Vous devriez voir toutes les tables créées automatiquement

---

## 🧪 ÉTAPE 7 : Tests de Fonctionnement

### 7.1 Test API
```bash
# Tester la santé de l'API
curl http://localhost:5000/api/health
```

### 7.2 Test Authentification
```bash
# Inscription test
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","username":"testuser"}'
```

### 7.3 Vérifier dans pgAdmin
- Rafraîchir la table `users`
- Vous devriez voir l'utilisateur créé

---

## 🔧 Dépannage Courant

### Problème : "Connection refused"
**Solution** :
1. Vérifier que PostgreSQL est démarré (services Windows)
2. Vérifier le port 5432 (netstat -ano | findstr 5432)
3. Vérifier le firewall Windows

### Problème : "Password authentication failed"
**Solution** :
1. Vérifier le mot de passe dans pgAdmin
2. Réinitialiser le mot de passe PostgreSQL si nécessaire

### Problème : "Database does not exist"
**Solution** :
1. Créer la base manuellement dans pgAdmin
2. Vérifier le nom dans DATABASE_URL

---

## 📊 Interface pgAdmin - Utilisation Quotidienne

### Naviguer dans les données
1. **Déplier** : Servers → Local PostgreSQL → Databases → affiliation_db
2. **Tables** : Voir toutes les tables créées par Prisma
3. **Clic droit** sur une table → "View/Edit Data" → "All Rows"

### Exécuter des requêtes
1. **Query Tool** : Clic droit sur base → Query Tool
2. **Exemples** :
   ```sql
   SELECT * FROM users;
   SELECT COUNT(*) FROM clicks WHERE created_at > NOW() - INTERVAL '1 day';
   ```

### Sauvegarde/Restauration
1. **Backup** : Clic droit sur base → Backup
2. **Restore** : Clic droit sur base → Restore

---

## 🎉 Félicitations !

Votre environnement PostgreSQL + pgAdmin est maintenant configuré ! Vous pouvez :

- ✅ Créer des utilisateurs via l'API
- ✅ Voir les données en temps réel dans pgAdmin
- ✅ Déboguer les requêtes SQL
- ✅ Gérer la base de données graphiquement

**Prochaine étape** : Tester l'inscription utilisateur et vérifier que les données apparaissent dans pgAdmin.