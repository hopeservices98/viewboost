require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

// Routes
const authRoutes = require('./routes/auth');

const app = express();
const prisma = new PrismaClient();

// Middleware de sécurité
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
});
app.use(limiter);

// Middleware de logging et détection fraude
// Temporairement désactivé pour éviter les erreurs de déploiement
// const { requestLogger, advancedFraudDetection } = require('./middleware/fraudDetection');
// app.use(requestLogger);

// Appliquer la détection fraude sur les routes sensibles
// Temporairement désactivé pour éviter les erreurs de déploiement
// app.use('/api/auth', advancedFraudDetection);
// app.use('/api/campaigns', advancedFraudDetection);
// app.use('/api/affiliate-links', advancedFraudDetection);
// app.use('/api/clicks', advancedFraudDetection);
// app.use('/api/views', advancedFraudDetection);

// Test de connexion Prisma
prisma.$connect()
  .then(() => console.log('Connecté à PostgreSQL via Prisma'))
  .catch((err) => console.error('Erreur de connexion Prisma:', err));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/affiliate-links', require('./routes/affiliateLinks'));
app.use('/api/clicks', require('./routes/clicks'));
app.use('/api/views', require('./routes/views'));
app.use('/api/commissions', require('./routes/commissions'));
app.use('/api/payouts', require('./routes/payouts'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/analytics', require('./routes/analytics'));

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Route de test simple
app.get('/api/test', (req, res) => {
  res.json({
    ok: true,
    message: 'Route de test fonctionne',
    timestamp: new Date().toISOString()
  });
});

// Route d'accueil
app.get('/', (req, res) => {
  res.json({
    message: 'API Affiliation YouTube avec IA',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      campaigns: '/api/campaigns',
      affiliateLinks: '/api/affiliate-links',
      clicks: '/api/clicks',
      views: '/api/views',
      commissions: '/api/commissions',
      payouts: '/api/payouts',
      ai: '/api/ai',
      analytics: '/api/analytics',
      health: '/api/health'
    }
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur globale:', err);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM reçu, fermeture propre...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT reçu, fermeture propre...');
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = app;