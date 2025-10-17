const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Créer une demande de paiement
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { amount, method, paypalEmail, bankDetails } = req.body;
    const userId = req.user.id;

    // Vérifier le solde disponible
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true }
    });

    if (!user || user.balance < amount) {
      return res.status(400).json({
        error: 'Solde insuffisant pour cette demande de paiement'
      });
    }

    // Créer la demande de paiement
    const payout = await prisma.payout.create({
      data: {
        userId,
        amount,
        method,
        paypalEmail,
        bankDetails,
        status: 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      payout
    });
  } catch (error) {
    console.error('Erreur création payout:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la demande' });
  }
});

// Obtenir les payouts de l'utilisateur
router.get('/my-payouts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const payouts = await prisma.payout.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      payouts
    });
  } catch (error) {
    console.error('Erreur récupération payouts:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des payouts' });
  }
});

// Obtenir tous les payouts (admin seulement)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const payouts = await prisma.payout.findMany({
      include: {
        user: {
          select: { username: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      payouts
    });
  } catch (error) {
    console.error('Erreur récupération tous payouts:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des payouts' });
  }
});

// Mettre à jour le statut d'un payout (admin seulement)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const payout = await prisma.payout.update({
      where: { id },
      data: {
        status,
        processedAt: status === 'COMPLETED' ? new Date() : null
      }
    });

    // Si le payout est complété, mettre à jour le solde de l'utilisateur
    if (status === 'COMPLETED') {
      await prisma.user.update({
        where: { id: payout.userId },
        data: {
          balance: {
            decrement: payout.amount
          }
        }
      });

      // Créer un log de balance
      await prisma.userBalanceLog.create({
        data: {
          userId: payout.userId,
          amount: -payout.amount,
          type: 'PAYOUT',
          description: `Paiement ${payout.method} - ${payout.amount}$`
        }
      });
    }

    res.json({
      success: true,
      payout
    });
  } catch (error) {
    console.error('Erreur mise à jour payout:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du payout' });
  }
});

module.exports = router;