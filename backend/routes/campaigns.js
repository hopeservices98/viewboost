const express = require('express');
const {
  createCampaign,
  getUserCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign
} = require('../controllers/campaignController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Créer une campagne (ouvert à tous les utilisateurs pour le MVP)
router.post('/', createCampaign);

// Lister les campagnes de l'utilisateur connecté
router.get('/', getUserCampaigns);

// Obtenir une campagne spécifique
router.get('/:id', getCampaign || ((req, res) => res.status(501).json({ error: 'Not implemented' })));

// Mettre à jour une campagne
router.put('/:id', requireRole('CREATOR', 'ADMIN'), updateCampaign || ((req, res) => res.status(501).json({ error: 'Not implemented' })));

// Supprimer une campagne
router.delete('/:id', requireRole('CREATOR', 'ADMIN'), deleteCampaign || ((req, res) => res.status(501).json({ error: 'Not implemented' })));

module.exports = router;