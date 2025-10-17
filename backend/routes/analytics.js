const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// Middleware d'authentification
router.use(authenticateToken);

// Stats dashboard utilisateur
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;

    // Balance actuelle
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true, totalEarned: true }
    });

    // Commissions du mois en cours
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyCommissions = await prisma.commission.aggregate({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
        status: 'APPROVED'
      },
      _sum: { amount: true },
      _count: true
    });

    // Clics du mois
    const monthlyClicks = await prisma.click.count({
      where: {
        affiliateLink: { userId },
        createdAt: { gte: startOfMonth },
        isValid: true
      }
    });

    // Vues du mois
    const monthlyViews = await prisma.view.count({
      where: {
        affiliateLink: { userId },
        createdAt: { gte: startOfMonth },
        isValid: true
      }
    });

    // Liens actifs
    const activeLinks = await prisma.affiliateLink.count({
      where: { userId }
    });

    res.json({
      balance: user?.balance || 0,
      totalEarned: user?.totalEarned || 0,
      monthlyCommissions: monthlyCommissions._sum.amount || 0,
      monthlyClicks,
      monthlyViews,
      activeLinks,
      commissionCount: monthlyCommissions._count
    });
  } catch (error) {
    console.error('Erreur stats dashboard:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Stats clics avec filtres
router.get('/clicks', async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const clicks = await prisma.click.groupBy({
      by: ['createdAt'],
      where: {
        affiliateLink: { userId },
        createdAt: { gte: startDate },
        isValid: true
      },
      _count: true,
      orderBy: { createdAt: 'asc' }
    });

    res.json({ clicks });
  } catch (error) {
    console.error('Erreur stats clics:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Stats vues avec filtres
router.get('/views', async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const views = await prisma.view.groupBy({
      by: ['createdAt'],
      where: {
        affiliateLink: { userId },
        createdAt: { gte: startDate },
        isValid: true
      },
      _count: true,
      orderBy: { createdAt: 'asc' }
    });

    res.json({ views });
  } catch (error) {
    console.error('Erreur stats vues:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Stats revenus avec filtres
router.get('/revenue', async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const revenue = await prisma.commission.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        createdAt: { gte: startDate },
        status: 'APPROVED'
      },
      _sum: { amount: true },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ revenue });
  } catch (error) {
    console.error('Erreur stats revenus:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;