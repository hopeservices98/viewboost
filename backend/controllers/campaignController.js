const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../middleware/auth');

const prisma = new PrismaClient();

// Créer une campagne avec objectif de vues
const createCampaign = async (req, res) => {
  try {
    const { title, description, youtubeUrl, costPerView, maxViews } = req.body;
    const userId = req.user.id;

    // Validation
    if (!title || !youtubeUrl || !maxViews || maxViews <= 0) {
      return res.status(400).json({
        error: 'Titre, URL YouTube et objectif de vues requis'
      });
    }

    // Extraire l'ID de la vidéo YouTube
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({ error: 'URL YouTube invalide' });
    }

    // Créer la campagne
    const campaign = await prisma.campaign.create({
      data: {
        title,
        description,
        youtubeUrl,
        videoId,
        costPerView: costPerView || 0.01,
        maxViews,
        userId
      }
    });

    // Créditer 100 Ar au créateur pour sa première vue
    await prisma.user.update({
      where: { id: userId },
      data: {
        balance: { increment: 100 },
        totalEarned: { increment: 100 }
      }
    });

    // Log du bonus créateur
    await prisma.userBalanceLog.create({
      data: {
        userId,
        amount: 100,
        type: 'CREATOR_FIRST_VIEW',
        description: `Bonus création campagne: ${title}`
      }
    });

    // Notifier tous les affiliés de la nouvelle campagne
    await notifyAffiliatesOfNewCampaign(campaign.id);

    res.status(201).json({
      message: 'Campagne créée avec succès',
      campaign,
      bonus: '100 Ar crédités pour votre première vue'
    });
  } catch (error) {
    console.error('Erreur création campagne:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Désactiver campagne si objectif atteint
const checkAndUpdateCampaignStatus = async (campaignId) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { views: { where: { isValid: true } } }
    });

    if (!campaign) return;

    const validViews = campaign.views.length;

    if (validViews >= campaign.maxViews && campaign.status === 'ACTIVE') {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'COMPLETED' }
      });

      // Notifier les affiliés de la fin de campagne
      await notifyCampaignCompletion(campaignId);
    }
  } catch (error) {
    console.error('Erreur vérification statut campagne:', error);
  }
};

// Notifier tous les affiliés d'une nouvelle campagne
const notifyAffiliatesOfNewCampaign = async (campaignId) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { title: true, maxViews: true }
    });

    // Récupérer tous les affiliés (users avec role AFFILIATE)
    const affiliates = await prisma.user.findMany({
      where: { role: 'AFFILIATE' },
      select: { id: true, phoneNumber: true }
    });

    // Créer notifications en DB
    const notifications = affiliates.map(affiliate => ({
      campaignId,
      userId: affiliate.id,
      type: 'CAMPAIGN_CREATED',
      message: `Nouvelle campagne disponible: ${campaign.title} (${campaign.maxViews} vues)`
    }));

    await prisma.campaignNotification.createMany({
      data: notifications
    });

    // TODO: Envoyer SMS si numéro disponible
    // await sendBulkSMS(affiliates.filter(a => a.phoneNumber), message);

  } catch (error) {
    console.error('Erreur notification nouvelle campagne:', error);
  }
};

// Notifier la fin d'une campagne
const notifyCampaignCompletion = async (campaignId) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { title: true }
    });

    // Récupérer affiliés ayant des liens sur cette campagne
    const affiliateLinks = await prisma.affiliateLink.findMany({
      where: { campaignId },
      select: { userId: true }
    });

    const notifications = affiliateLinks.map(link => ({
      campaignId,
      userId: link.userId,
      type: 'CAMPAIGN_COMPLETED',
      message: `Campagne terminée: ${campaign.title}`
    }));

    await prisma.campaignNotification.createMany({
      data: notifications
    });

  } catch (error) {
    console.error('Erreur notification fin campagne:', error);
  }
};

// Lister campagnes de l'utilisateur
const getUserCampaigns = async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { userId: req.user.id },
      include: {
        _count: {
          select: {
            affiliateLinks: true,
            views: { where: { isValid: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ campaigns });
  } catch (error) {
    console.error('Erreur récupération campagnes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Fonction utilitaire pour extraire ID YouTube
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

module.exports = {
  createCampaign,
  getUserCampaigns,
  checkAndUpdateCampaignStatus,
  notifyAffiliatesOfNewCampaign,
  notifyCampaignCompletion
};