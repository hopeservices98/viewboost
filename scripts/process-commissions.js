#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const { validatePendingViews } = require('../backend/controllers/viewController');
const { checkAndUpdateUserLevel } = require('../backend/controllers/authController');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Démarrage du traitement automatique des commissions...');

  try {
    // 1. Valider les vues en attente (plus de 24h)
    console.log('📊 Validation des vues en attente...');
    await validatePendingViews();

    // 2. Désactiver les campagnes terminées
    console.log('🎯 Vérification des campagnes terminées...');
    await deactivateCompletedCampaigns();

    // 3. Calculer les statistiques globales
    console.log('📈 Mise à jour des statistiques...');
    await updateGlobalStats();

    // 4. Nettoyer les anciens logs
    console.log('🧹 Nettoyage des anciens logs...');
    await cleanupOldLogs();

    console.log('✅ Traitement terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du traitement:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Désactiver les campagnes qui ont atteint leur objectif
async function deactivateCompletedCampaigns() {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { status: 'ACTIVE' },
      include: {
        _count: {
          select: { views: { where: { isValid: true } } }
        }
      }
    });

    for (const campaign of campaigns) {
      if (campaign._count.views >= campaign.maxViews) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'COMPLETED' }
        });

        console.log(`📍 Campagne ${campaign.id} désactivée (objectif atteint)`);
      }
    }
  } catch (error) {
    console.error('Erreur désactivation campagnes:', error);
  }
}

// Mettre à jour les statistiques globales
async function updateGlobalStats() {
  try {
    // Statistiques des utilisateurs actifs
    const activeUsers = await prisma.user.count({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours
        }
      }
    });

    // Total des commissions payées aujourd'hui
    const todayCommissions = await prisma.commission.aggregate({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        },
        status: 'APPROVED'
      },
      _sum: { amount: true }
    });

    console.log(`👥 Utilisateurs actifs (30j): ${activeUsers}`);
    console.log(`💰 Commissions aujourd'hui: ${todayCommissions._sum.amount || 0} Ar`);

  } catch (error) {
    console.error('Erreur mise à jour stats:', error);
  }
}

// Nettoyer les anciens logs (plus de 90 jours)
async function cleanupOldLogs() {
  try {
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const deletedLogs = await prisma.requestLog.deleteMany({
      where: { createdAt: { lt: cutoffDate } }
    });

    const deletedFraudLogs = await prisma.fraudLog.deleteMany({
      where: { createdAt: { lt: cutoffDate } }
    });

    console.log(`🗑️ Nettoyé: ${deletedLogs.count} logs requêtes, ${deletedFraudLogs.count} logs fraude`);

  } catch (error) {
    console.error('Erreur nettoyage logs:', error);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

module.exports = { main };