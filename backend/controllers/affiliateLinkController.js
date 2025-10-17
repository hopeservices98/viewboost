const { PrismaClient } = require('@prisma/client');
const { randomBytes } = require('crypto');

const prisma = new PrismaClient();

// Générer un token unique pour les liens affiliés
function generateAffiliateToken() {
  return randomBytes(16).toString('hex');
}

// Créer un lien affilié pour une campagne
const createAffiliateLink = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user.id;

    // Vérifier que la campagne existe et appartient à un créateur
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        user: {
          select: { role: true }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }

    // Vérifier que l'utilisateur n'est pas le créateur de la campagne
    if (campaign.userId === userId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas créer de lien affilié pour votre propre campagne' });
    }

    // Vérifier si l'utilisateur a déjà un lien pour cette campagne
    const existingLink = await prisma.affiliateLink.findFirst({
      where: {
        campaignId,
        userId
      }
    });

    if (existingLink) {
      return res.status(400).json({
        error: 'Vous avez déjà un lien affilié pour cette campagne',
        link: existingLink
      });
    }

    // Générer un token unique
    let token;
    let attempts = 0;
    do {
      token = generateAffiliateToken();
      attempts++;
      if (attempts > 10) {
        return res.status(500).json({ error: 'Erreur génération token' });
      }
    } while (await prisma.affiliateLink.findUnique({ where: { token } }));

    // Créer le lien affilié
    const affiliateLink = await prisma.affiliateLink.create({
      data: {
        token,
        campaignId,
        userId
      },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            youtubeUrl: true,
            costPerView: true
          }
        },
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    // Générer l'URL complète
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const affiliateUrl = `${baseUrl}/r/${token}`;

    res.status(201).json({
      message: 'Lien affilié créé avec succès',
      affiliateLink: {
        ...affiliateLink,
        url: affiliateUrl
      }
    });
  } catch (error) {
    console.error('Erreur création lien affilié:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Lister les liens affiliés de l'utilisateur
const getUserAffiliateLinks = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const affiliateLinks = await prisma.affiliateLink.findMany({
      where: { userId },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            youtubeUrl: true,
            costPerView: true,
            status: true
          }
        },
        _count: {
          select: {
            clicks: true,
            views: {
              where: { isValid: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    });

    const total = await prisma.affiliateLink.count({ where: { userId } });

    // Ajouter les URLs complètes
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const linksWithUrls = affiliateLinks.map(link => ({
      ...link,
      url: `${baseUrl}/r/${link.token}`
    }));

    res.json({
      affiliateLinks: linksWithUrls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération liens affiliés:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Obtenir un lien affilié spécifique
const getAffiliateLink = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const affiliateLink = await prisma.affiliateLink.findFirst({
      where: {
        id,
        userId
      },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            youtubeUrl: true,
            costPerView: true,
            status: true
          }
        },
        _count: {
          select: {
            clicks: true,
            views: {
              where: { isValid: true }
            }
          }
        }
      }
    });

    if (!affiliateLink) {
      return res.status(404).json({ error: 'Lien affilié non trouvé' });
    }

    // Ajouter l'URL complète
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const linkWithUrl = {
      ...affiliateLink,
      url: `${baseUrl}/r/${affiliateLink.token}`
    };

    res.json({ affiliateLink: linkWithUrl });
  } catch (error) {
    console.error('Erreur récupération lien affilié:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Supprimer un lien affilié
const deleteAffiliateLink = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const affiliateLink = await prisma.affiliateLink.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!affiliateLink) {
      return res.status(404).json({ error: 'Lien affilié non trouvé' });
    }

    // Vérifier s'il y a des vues validées
    const validViewsCount = await prisma.view.count({
      where: {
        affiliateLinkId: id,
        isValid: true
      }
    });

    if (validViewsCount > 0) {
      return res.status(400).json({
        error: 'Impossible de supprimer un lien avec des vues validées'
      });
    }

    // Supprimer le lien (Prisma gère la cascade)
    await prisma.affiliateLink.delete({
      where: { id }
    });

    res.json({ message: 'Lien affilié supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression lien affilié:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Redirection des liens affiliés (route publique)
const redirectAffiliateLink = async (req, res) => {
  try {
    const { token } = req.params;

    // Trouver le lien affilié
    const affiliateLink = await prisma.affiliateLink.findUnique({
      where: { token },
      include: {
        campaign: true,
        user: {
          select: { id: true, username: true }
        }
      }
    });

    if (!affiliateLink) {
      return res.status(404).json({ error: 'Lien affilié invalide' });
    }

    if (affiliateLink.campaign.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Campagne inactive' });
    }

    // Enregistrer le clic (avec protection anti-fraude basique)
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Vérifier la fréquence de clics pour cette IP
    const recentClicks = await prisma.click.count({
      where: {
        affiliateLinkId: affiliateLink.id,
        ipAddress: clientIP,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000) // Dernière minute
        }
      }
    });

    if (recentClicks >= 10) {
      return res.status(429).json({ error: 'Trop de clics détectés' });
    }

    // Créer l'enregistrement du clic
    await prisma.click.create({
      data: {
        affiliateLinkId: affiliateLink.id,
        ipAddress: clientIP,
        userAgent,
        referrer: req.get('Referer')
      }
    });

    // Mettre à jour les compteurs
    await prisma.affiliateLink.update({
      where: { id: affiliateLink.id },
      data: {
        clicks: {
          increment: 1
        }
      }
    });

    // Rediriger vers la vidéo YouTube
    res.redirect(affiliateLink.campaign.youtubeUrl);
  } catch (error) {
    console.error('Erreur redirection lien affilié:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  createAffiliateLink,
  getUserAffiliateLinks,
  getAffiliateLink,
  deleteAffiliateLink,
  redirectAffiliateLink
};