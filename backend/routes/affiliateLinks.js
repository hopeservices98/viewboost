const express = require('express');
const {
  createAffiliateLink,
  getUserAffiliateLinks,
  getAffiliateLink,
  deleteAffiliateLink,
  redirectAffiliateLink
} = require('../controllers/affiliateLinkController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Route publique pour la redirection des liens affiliés
router.get('/r/:token', redirectAffiliateLink);

// Toutes les autres routes nécessitent une authentification
router.use(authenticateToken);

// Créer un lien affilié pour une campagne
router.post('/campaigns/:campaignId', createAffiliateLink);

// Lister les liens affiliés de l'utilisateur
router.get('/', getUserAffiliateLinks);

// Obtenir un lien affilié spécifique
router.get('/:id', getAffiliateLink);

// Supprimer un lien affilié
router.delete('/:id', deleteAffiliateLink);

module.exports = router;