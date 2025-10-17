const { PrismaClient } = require('@prisma/client');
const { calculateMultiLevelCommissions } = require('./commissionController');
const { checkAndUpdateCampaignStatus } = require('./campaignController');

const prisma = new PrismaClient();

// Enregistrer une vue avec validation
const recordView = async (req, res) => {
  try {
    const { affiliateLinkId, watchTime, userAgent } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    // Validation des données
    if (!affiliateLinkId || watchTime === undefined) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    // Vérifier que le lien affilié existe
    const affiliateLink = await prisma.affiliateLink.findUnique({
      where: { id: affiliateLinkId },
      include: { campaign: true, user: true }
    });

    if (!affiliateLink) {
      return res.status(404).json({ error: 'Lien affilié non trouvé' });
    }

    // Vérifier que la campagne est active
    if (affiliateLink.campaign.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Campagne inactive' });
    }

    // Validation anti-fraude de base
    const fraudCheck = await performBasicFraudCheck(clientIP, affiliateLinkId, watchTime);
    if (fraudCheck.blocked) {
      return res.status(403).json({ error: fraudCheck.reason });
    }

    // Créer la vue
    const view = await prisma.view.create({
      data: {
        affiliateLinkId,
        campaignId: affiliateLink.campaignId,
        userId: affiliateLink.userId,
        ipAddress: clientIP,
        userAgent: userAgent || req.get('User-Agent'),
        watchTime,
        fraudScore: fraudCheck.score,
        isValid: fraudCheck.isValid
      }
    });

    // Si la vue est validée, attribuer les commissions
    if (view.isValid) {
      await calculateMultiLevelCommissions(view.id);
      await checkAndUpdateCampaignStatus(affiliateLink.campaignId);
    }

    res.json({
      message: 'Vue enregistrée',
      view: {
        id: view.id,
        isValid: view.isValid,
        commissionEarned: view.isValid
      }
    });

  } catch (error) {
    console.error('Erreur enregistrement vue:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Validation anti-fraude de base pour les vues
const performBasicFraudCheck = async (clientIP, affiliateLinkId, watchTime) => {
  try {
    // 1. Vérifier temps de visionnage minimum (30 secondes)
    if (watchTime < 30) {
      return {
        blocked: true,
        reason: 'Temps de visionnage insuffisant',
        score: 1.0,
        isValid: false
      };
    }

    // 2. Vérifier limite de vues par IP/campagne (5 vues max/jour)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const viewsToday = await prisma.view.count({
      where: {
        ipAddress: clientIP,
        affiliateLinkId,
        createdAt: { gte: today }
      }
    });

    if (viewsToday >= 5) {
      return {
        blocked: true,
        reason: 'Trop de vues depuis cette IP',
        score: 0.9,
        isValid: false
      };
    }

    // 3. Vérifier unicité device (si disponible)
    // TODO: Implémenter fingerprinting device

    // 4. Calculer score de fraude
    let score = 0;

    // Pénalité pour temps de visionnage trop court
    if (watchTime < 60) score += 0.2;

    // Pénalité pour multiples vues
    if (viewsToday > 2) score += 0.3;

    // Pénalité pour IP suspecte
    if (clientIP.startsWith('10.') || clientIP.startsWith('192.168.')) {
      score += 0.4; // VPN potentiel
    }

    return {
      blocked: false,
      score: Math.min(score, 1.0),
      isValid: score < 0.7, // Valide si score < 70%
      reason: score < 0.7 ? 'Vue validée' : 'Score de fraude élevé'
    };

  } catch (error) {
    console.error('Erreur vérification fraude:', error);
    return {
      blocked: false,
      score: 0.5,
      isValid: true, // En cas d'erreur, accepter par défaut
      reason: 'Erreur vérification'
    };
  }
};

// Valider les vues en attente (cron job)
const validatePendingViews = async () => {
  try {
    const pendingViews = await prisma.view.findMany({
      where: {
        isValid: false,
        validatedAt: null,
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Plus de 24h
        }
      },
      include: {
        affiliateLink: {
          include: { campaign: true }
        }
      }
    });

    for (const view of pendingViews) {
      // Recalculer la validation après 24h
      const fraudCheck = await performBasicFraudCheck(
        view.ipAddress,
        view.affiliateLinkId,
        view.watchTime
      );

      await prisma.view.update({
        where: { id: view.id },
        data: {
          isValid: fraudCheck.isValid,
          fraudScore: fraudCheck.score,
          validatedAt: new Date()
        }
      });

      // Si validée maintenant, attribuer commissions
      if (fraudCheck.isValid && !view.commission) {
        await calculateMultiLevelCommissions(view.id);
        await checkAndUpdateCampaignStatus(view.campaignId);
      }
    }

    console.log(`${pendingViews.length} vues validées`);
  } catch (error) {
    console.error('Erreur validation vues en attente:', error);
  }
};

// Statistiques des vues
const getViewStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Vues par campagne pour cet utilisateur
    const stats = await prisma.affiliateLink.findMany({
      where: { userId },
      include: {
        campaign: true,
        _count: {
          select: {
            views: { where: { isValid: true } },
            clicks: true
          }
        }
      }
    });

    res.json({ stats });
  } catch (error) {
    console.error('Erreur stats vues:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  recordView,
  validatePendingViews,
  getViewStats,
  performBasicFraudCheck
};