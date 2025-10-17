const express = require('express');
const { register, login, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Routes d'authentification
router.post('/register', register);
router.post('/login', login);

// Route protégée pour le profil
router.get('/profile', authenticateToken, getProfile);

module.exports = router;