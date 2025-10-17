#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configuration SMS (à adapter selon l'API utilisée)
const SMS_CONFIG = {
  apiKey: process.env.SMS_API_KEY,
  apiUrl: process.env.SMS_API_URL,
  sender: 'ViewBoost'
};

async function main() {
  console.log('📱 Démarrage de l\'envoi des notifications...');

  try {
    // 1. Notifications de nouvelles campagnes
    await sendCampaignNotifications();

    // 2. Notifications de commissions gagnées
    await sendCommissionNotifications();

    // 3. Notifications de niveaux atteints
    await sendLevelUpNotifications();

    // 4. Rappels de paiement disponible
    await sendPayoutReminders();

    console.log('✅ Notifications envoyées avec succès !');

  } catch (error) {
    console.error('❌ Erreur envoi notifications:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Notifier les affiliés des nouvelles campagnes
async function sendCampaignNotifications() {
  try {
    // Récupérer les notifications non envoyées
    const notifications = await prisma.campaignNotification.findMany({
      where: {
        sentAt: null,
        type: 'CAMPAIGN_CREATED'
      },
      include: {
        user: true,
        campaign: true
      },
      take: 50 // Limiter pour éviter surcharge
    });

    for (const notification of notifications) {
      const message = `🚀 Nouvelle campagne ViewBoost: ${notification.campaign.title} (${notification.campaign.maxViews} vues disponibles)`;

      // Envoyer SMS si numéro disponible
      if (notification.user.phoneNumber) {
        await sendSMS(notification.user.phoneNumber, message);
      }

      // Marquer comme envoyé
      await prisma.campaignNotification.update({
        where: { id: notification.id },
        data: { sentAt: new Date() }
      });
    }

    console.log(`📤 ${notifications.length} notifications de campagne envoyées`);

  } catch (error) {
    console.error('Erreur notifications campagnes:', error);
  }
}

// Notifier les gains de commissions
async function sendCommissionNotifications() {
  try {
    // Commissions gagnées dans les dernières 24h non notifiées
    const recentCommissions = await prisma.commission.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        status: 'APPROVED'
      },
      include: {
        user: true,
        view: {
          include: {
            affiliateLink: {
              include: { campaign: true }
            }
          }
        }
      }
    });

    // Grouper par utilisateur
    const userCommissions = {};
    recentCommissions.forEach(comm => {
      if (!userCommissions[comm.userId]) {
        userCommissions[comm.userId] = {
          user: comm.user,
          total: 0,
          count: 0
        };
      }
      userCommissions[comm.userId].total += comm.amount;
      userCommissions[comm.userId].count += 1;
    });

    // Envoyer notifications
    for (const [userId, data] of Object.entries(userCommissions)) {
      if (data.total >= 100) { // Seulement si gain significatif
        const message = `💰 Félicitations ! Vous avez gagné ${data.total} Ar (${data.count} commissions) sur ViewBoost`;

        if (data.user.phoneNumber) {
          await sendSMS(data.user.phoneNumber, message);
        }
      }
    }

    console.log(`💰 Notifications commissions envoyées pour ${Object.keys(userCommissions).length} utilisateurs`);

  } catch (error) {
    console.error('Erreur notifications commissions:', error);
  }
}

// Notifier les montées de niveau
async function sendLevelUpNotifications() {
  try {
    // Utilisateurs montés de niveau récemment
    const recentLevelUps = await prisma.user.findMany({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    for (const user of recentLevelUps) {
      // Vérifier si niveau changé récemment (logique simplifiée)
      const message = `⭐ Félicitations ! Vous êtes passé niveau ${user.level} sur ViewBoost !`;

      if (user.phoneNumber) {
        await sendSMS(user.phoneNumber, message);
      }
    }

  } catch (error) {
    console.error('Erreur notifications niveaux:', error);
  }
}

// Rappels de paiement disponible
async function sendPayoutReminders() {
  try {
    // Utilisateurs avec solde > 1000 Ar et dernier paiement > 30 jours
    const usersNeedingPayout = await prisma.user.findMany({
      where: {
        balance: { gte: 1000 },
        payouts: {
          none: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        }
      }
    });

    for (const user of usersNeedingPayout) {
      const message = `💸 Rappel: ${user.balance} Ar disponibles pour retrait sur ViewBoost`;

      if (user.phoneNumber) {
        await sendSMS(user.phoneNumber, message);
      }
    }

    console.log(`💸 Rappels paiement envoyés pour ${usersNeedingPayout.length} utilisateurs`);

  } catch (error) {
    console.error('Erreur rappels paiement:', error);
  }
}

// Fonction d'envoi SMS (à adapter selon l'API)
async function sendSMS(phoneNumber, message) {
  try {
    // Simulation - remplacer par vraie API SMS
    console.log(`📱 SMS vers ${phoneNumber}: ${message}`);

    // Exemple avec une API SMS générique:
    /*
    const response = await fetch(SMS_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SMS_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        to: phoneNumber,
        from: SMS_CONFIG.sender,
        message: message
      })
    });

    if (!response.ok) {
      throw new Error(`SMS API error: ${response.status}`);
    }
    */

    return true;
  } catch (error) {
    console.error(`Erreur envoi SMS vers ${phoneNumber}:`, error);
    return false;
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

module.exports = { main, sendSMS };