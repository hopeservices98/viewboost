#!/usr/bin/env node

/**
 * Script de validation automatique des vues
 * À exécuter toutes les 5 minutes via cron job
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { validateView } = require('../backend/controllers/viewController');

const prisma = new PrismaClient();

async function validatePendingViews() {
  try {
    console.log('🔍 Démarrage validation des vues...');

    // Trouver les vues non validées de plus de 30 secondes
    const pendingViews = await prisma.view.findMany({
      where: {
        isValid: false,
        validatedAt: null,
        createdAt: {
          lt: new Date(Date.now() - 30 * 1000) // 30 secondes
        }
      },
      take: 100 // Traiter par lots
    });

    console.log(`📊 ${pendingViews.length} vues à valider`);

    let validatedCount = 0;
    let invalidCount = 0;

    for (const view of pendingViews) {
      try {
        const isValid = await validateView(view.id);
        if (isValid) {
          validatedCount++;
        } else {
          invalidCount++;
        }
      } catch (error) {
        console.error(`❌ Erreur validation vue ${view.id}:`, error);
      }
    }

    console.log(`✅ Validation terminée: ${validatedCount} valides, ${invalidCount} invalides`);

    // Nettoyer les anciennes vues invalides (plus de 7 jours)
    const deletedCount = await prisma.view.deleteMany({
      where: {
        isValid: false,
        createdAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 jours
        }
      }
    });

    if (deletedCount.count > 0) {
      console.log(`🗑️ ${deletedCount.count} anciennes vues supprimées`);
    }

  } catch (error) {
    console.error('❌ Erreur script validation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  validatePendingViews()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { validatePendingViews };