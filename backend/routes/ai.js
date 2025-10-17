const express = require('express');
const { authenticateToken } = require('../middleware/auth');
// const aiEngine = require('../../ai-engine'); // Temporairement désactivé

const router = express.Router();

// Middleware d'authentification pour toutes les routes IA
router.use(authenticateToken);

// Obtenir des recommandations IA personnalisées
router.post('/recommendations', async (req, res) => {
  try {
    // Temporairement désactivé - retourner une réponse par défaut
    // const { userData } = req.body;
    // const recommendation = await aiEngine.recommendOptimization(userData);
    res.json({ recommendation: 'Fonctionnalité IA temporairement indisponible. Partagez sur plusieurs plateformes pour maximiser vos gains.' });
  } catch (error) {
    console.error('Erreur recommandations IA:', error);
    res.status(500).json({ error: 'Erreur lors de la génération des recommandations' });
  }
});

// Détection de fraude IA
router.post('/fraud-detection', async (req, res) => {
  try {
    // Temporairement désactivé - retourner une réponse par défaut
    // const { clickData } = req.body;
    // const result = await aiEngine.detectFraud(clickData);
    res.json({ isFraud: false, confidence: 0 });
  } catch (error) {
    console.error('Erreur détection fraude IA:', error);
    res.status(500).json({ error: 'Erreur lors de l\'analyse anti-fraude' });
  }
});

// Réponse du chatbot IA
router.post('/chatbot', async (req, res) => {
  try {
    // Temporairement désactivé - retourner une réponse par défaut
    // const { message, context } = req.body;
    // const response = await aiEngine.chatbotResponse(message, context);
    res.json({ response: 'Désolé, le chatbot IA est temporairement indisponible. Veuillez réessayer plus tard.' });
  } catch (error) {
    console.error('Erreur chatbot IA:', error);
    res.status(500).json({ error: 'Erreur lors de la génération de la réponse' });
  }
});

module.exports = router;