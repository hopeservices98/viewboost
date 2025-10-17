const express = require('express');
const { trackClick, getClickStats } = require('../controllers/clickController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Route publique pour tracking des clics (redirection)
router.get('/r/:token', trackClick);

// Routes protégées pour les statistiques
router.get('/stats', authenticateToken, getClickStats);

module.exports = router;