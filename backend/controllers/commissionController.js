const { PrismaClient } = require('@prisma/client');
const { checkAndUpdateUserLevel } = require('./authController');

const prisma = new PrismaClient();

// Calculer et attribuer les commissions multi-niveaux
const calculateMultiLevelCommissions = async (viewId) => {
  try {
    const view = await prisma.view.findUnique({
      where: { id: viewId },
      include: {
        affiliateLink: {
          include: {
            user: true,
            campaign: true
          }
        }
      }
    });

    if (!view || !view.affiliateLink) return;

    const affiliate = view.affiliateLink.user;
    const campaign = view.affiliateLink.campaign;
    const commissionAmount = campaign.costPerView;

    // Niveau 1: Affilié direct (5% de commission)
    const level1Commission = commissionAmount * 0.05;
    await createCommission(view.id, affiliate.id, level1Commission, 1);

    // Niveau 2: Parrain de l'affilié (2% de commission)
    if (affiliate.referredBy) {
      const level2Affiliate = await prisma.user.findUnique({
        where: { id: affiliate.referredBy }
      });

      if (level2Affiliate) {
        const level2Commission = commissionAmount * 0.02;
        await createCommission(view.id, level2Affiliate.id, level2Commission, 2);
      }
    }

    // Niveau 3: Parrain du parrain (1% de commission)
    if (affiliate.referredBy) {
      const level2Affiliate = await prisma.user.findUnique({
        where: { id: affiliate.referredBy }
      });

      if (level2Affiliate?.referredBy) {
        const level3Affiliate = await prisma.user.findUnique({
          where: { id: level2Affiliate.referredBy }
        });

        if (level3Affiliate) {
          const level3Commission = commissionAmount * 0.01;
          await createCommission(view.id, level3Affiliate.id, level3Commission, 3);
        }
      }
    }

  } catch (error) {
    console.error('Erreur calcul commissions multi-niveaux:', error);
  }
};

// Créer une commission
const createCommission = async (viewId, userId, amount, level) => {
  try {
    // Créer la commission
    const commission = await prisma.commission.create({
      data: {
        viewId,
        userId,
        amount,
        level
      }
    });

    // Créditer le solde utilisateur
    await prisma.user.update({
      where: { id: userId },
      data: {
        balance: { increment: amount },
        totalEarned: { increment: amount }
      }
    });

    // Log de la transaction
    await prisma.userBalanceLog.create({
      data: {
        userId,
        amount,
        type: 'COMMISSION',
        description: `Commission niveau ${level}: ${amount} Ar`
      }
    });

    // Vérifier montée de niveau
    await checkAndUpdateUserLevel(userId);

    return commission;
  } catch (error) {
    console.error('Erreur création commission:', error);
    throw error;
  }
};

// Obtenir les commissions d'un utilisateur
const getUserCommissions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      userId: req.user.id,
      ...(status && { status })
    };

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        view: {
          include: {
            affiliateLink: {
              include: {
                campaign: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: parseInt(limit)
    });

    const total = await prisma.commission.count({ where });

    res.json({
      commissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération commissions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Approuver une commission (Admin)
const approveCommission = async (req, res) => {
  try {
    const { id } = req.params;

    const commission = await prisma.commission.update({
      where: { id },
      data: {
        status: 'APPROVED',
        paidAt: new Date()
      }
    });

    res.json({ commission });
  } catch (error) {
    console.error('Erreur approbation commission:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Statistiques des commissions
const getCommissionStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await prisma.commission.groupBy({
      by: ['level', 'status'],
      where: { userId },
      _sum: { amount: true },
      _count: true
    });

    const totalEarned = await prisma.commission.aggregate({
      where: { userId },
      _sum: { amount: true }
    });

    res.json({
      stats,
      totalEarned: totalEarned._sum.amount || 0
    });
  } catch (error) {
    console.error('Erreur stats commissions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Obtenir le solde d'un utilisateur
const getUserBalance = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { balance: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ balance: user.balance });
  } catch (error) {
    console.error('Erreur récupération solde:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  calculateMultiLevelCommissions,
  createCommission,
  getUserCommissions,
  approveCommission,
  getCommissionStats
};