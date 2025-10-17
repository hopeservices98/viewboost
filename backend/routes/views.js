const express = require('express');
const { trackView, getViewStats, validateViewManual } = require('../controllers/viewController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Route publique pour tracking pixel (pas d'authentification)
router.get('/pixel/:token', trackView || ((req, res) => res.status(501).json({ error: 'Not implemented' })));

// Routes protégées pour les statistiques
router.get('/stats', authenticateToken, getViewStats);

// Route admin pour validation manuelle
router.post('/:viewId/validate', authenticateToken, requireRole('ADMIN'), validateViewManual || ((req, res) => res.status(501).json({ error: 'Not implemented' })));

module.exports = router;