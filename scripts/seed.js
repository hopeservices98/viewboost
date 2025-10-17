const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Créer un utilisateur test (créateur)
    const hashedPassword = await bcrypt.hash('password123', 12);

    const creator = await prisma.user.upsert({
      where: { email: 'creator@test.com' },
      update: {},
      create: {
        email: 'creator@test.com',
        password: hashedPassword,
        username: 'creator',
        role: 'CREATOR',
        balance: 0,
      },
    });

    // Créer un utilisateur affilié
    const affiliate = await prisma.user.upsert({
      where: { email: 'affiliate@test.com' },
      update: {},
      create: {
        email: 'affiliate@test.com',
        password: hashedPassword,
        username: 'affiliate',
        role: 'AFFILIATE',
        balance: 0,
        referredBy: creator.id,
      },
    });

    console.log('✅ Utilisateurs créés:', { creator: creator.id, affiliate: affiliate.id });

    // Créer une campagne de test
    const campaign = await prisma.campaign.create({
      data: {
        title: 'Ma Vidéo Gaming Épique',
        description: 'Découvrez les meilleurs astuces gaming !',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoId: 'dQw4w9WgXcQ',
        costPerView: 0.01,
        maxViews: 1000,
        status: 'ACTIVE',
        userId: creator.id,
      },
    });

    console.log('✅ Campagne créée:', campaign.id);

    // Créer un lien affilié
    const affiliateLink = await prisma.affiliateLink.create({
      data: {
        campaignId: campaign.id,
        userId: affiliate.id,
      },
    });

    console.log('✅ Lien affilié créé:', affiliateLink.token);

    // Créer quelques vues et commissions pour les tests
    const view = await prisma.view.create({
      data: {
        affiliateLinkId: affiliateLink.id,
        campaignId: campaign.id,
        userId: affiliate.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        watchTime: 45,
        isValid: true,
        fraudScore: 0.1,
      },
    });

    const commission = await prisma.commission.create({
      data: {
        userId: affiliate.id,
        viewId: view.id,
        amount: 0.01,
        level: 1,
        status: 'APPROVED',
      },
    });

    // Mettre à jour le solde de l'utilisateur
    await prisma.user.update({
      where: { id: affiliate.id },
      data: { balance: 0.01 },
    });

    console.log('✅ Vue et commission créées');
    console.log('✅ Solde mis à jour');

    console.log('\n🎉 Seeding terminé avec succès!');
    console.log('\n📋 Données de test créées:');
    console.log('👤 Créateur: creator@test.com / password123');
    console.log('👥 Affilié: affiliate@test.com / password123');
    console.log('🎬 Campagne: Ma Vidéo Gaming Épique');
    console.log('🔗 Lien affilié:', `http://localhost:5000/r/${affiliateLink.token}`);
    console.log('💰 Solde affilié: $0.01');

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seeding
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seed };