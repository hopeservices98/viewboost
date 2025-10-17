const express = require('express');
const {
  getUserCommissions,
  getUserBalance,
  approveCommissions,
  getCommissionStats
} = require('../controllers/commissionController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Routes utilisateur
router.get('/', authenticateToken, getUserCommissions);
router.get('/balance', authenticateToken, getUserBalance || ((req, res) => res.status(501).json({ error: 'Not implemented' })));

// Routes admin
router.post('/approve', authenticateToken, requireRole('ADMIN'), approveCommissions || ((req, res) => res.status(501).json({ error: 'Not implemented' })));
router.get('/stats', authenticateToken, requireRole('ADMIN'), getCommissionStats || ((req, res) => res.status(501).json({ error: 'Not implemented' })));

module.exports = router;