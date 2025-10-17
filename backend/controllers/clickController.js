const { PrismaClient } = require('@prisma/client');
const aiEngine = require('../../ai-engine');

const prisma = new PrismaClient();

// Fonction utilitaire pour calculer le score de fraude
function calculateFraudScore(clickData) {
  let score = 0;

  // Vérifications basiques
  const recentClicks = clickData.recentClicks || 0;
  const sameIP = clickData.sameIP || 0;
  const userAgent = clickData.userAgent || '';

  // Score basé sur la fréquence (max 3 clics/IP/jour/lien)
  if (recentClicks > 3) score += 0.5;
  if (recentClicks > 10) score += 0.3;

  // Score basé sur l'IP (max 5 vues/IP/jour/campagne)
  if (sameIP > 5) score += 0.4;

  // User-Agent suspects
  const suspiciousAgents = ['bot', 'crawler', 'spider', 'scraper'];
  if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    score += 0.8;
  }

  return Math.min(score, 1); // Max 1
}

// Enregistrer un clic sur un lien affilié
const trackClick = async (req, res) => {
  try {
    const { token } = req.params;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';
    const referrer = req.get('Referrer') || '';

    // Trouver le lien affilié
    const affiliateLink = await prisma.affiliateLink.findUnique({
      where: { token },
      include: { campaign: true, user: true }
    });

    if (!affiliateLink) {
      return res.status(404).json({ error: 'Lien affilié non trouvé' });
    }

    // Vérifications anti-fraude
    const recentClicks = await prisma.click.count({
      where: {
        affiliateLinkId: affiliateLink.id,
        ipAddress,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h
        }
      }
    });

    // Bloquer si trop de clics depuis cette IP
    if (recentClicks >= 3) {
      return res.status(429).json({ error: 'Trop de clics depuis cette adresse IP' });
    }

    // Calculer le score de fraude
    const fraudScore = calculateFraudScore({
      recentClicks,
      sameIP: recentClicks,
      userAgent
    });

    // Créer le clic
    const click = await prisma.click.create({
      data: {
        affiliateLinkId: affiliateLink.id,
        ipAddress,
        userAgent,
        referrer,
        fraudScore,
        isValid: fraudScore < 0.7 // Valide si score < 0.7
      }
    });

    // Note: Les compteurs sont maintenant calculés dynamiquement via les relations
    // Pas besoin d'incrémenter manuellement les champs supprimés du schéma

    // Rediriger vers la vidéo YouTube
    res.redirect(affiliateLink.campaign.youtubeUrl);

  } catch (error) {
    console.error('Erreur tracking clic:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Obtenir les statistiques de clics
const getClickStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await prisma.click.groupBy({
      by: ['affiliateLinkId'],
      where: {
        affiliateLink: { userId },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours
        }
      },
      _count: { id: true },
      _sum: { fraudScore: true }
    });

    res.json({ stats });
  } catch (error) {
    console.error('Erreur stats clics:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  trackClick,
  getClickStats
};