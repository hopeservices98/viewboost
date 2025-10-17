const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../middleware/auth');

const prisma = new PrismaClient();

// Inscription utilisateur
const register = async (req, res) => {
  try {
    const { email, password, username, referredBy, phoneNumber } = req.body;

    // Validation basique
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, mot de passe et nom d\'utilisateur requis' });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email ou nom d\'utilisateur déjà utilisé' });
    }

    // Vérifier le parrain si fourni
    if (referredBy) {
      const referrer = await prisma.user.findUnique({
        where: { id: referredBy }
      });
      if (!referrer) {
        return res.status(400).json({ error: 'Parrain non trouvé' });
      }

      // Créditer le parrain avec 1000 Ar
      await prisma.user.update({
        where: { id: referredBy },
        data: {
          balance: { increment: 1000 },
          totalEarned: { increment: 1000 }
        }
      });

      // Log du bonus parrainage
      await prisma.userBalanceLog.create({
        data: {
          userId: referredBy,
          amount: 1000,
          type: 'REFERRAL_BONUS',
          description: `Bonus parrainage nouvel utilisateur: ${username}`
        }
      });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        referredBy,
        phoneNumber
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        balance: true,
        level: true,
        createdAt: true
      }
    });

    // Générer le token
    const token = generateToken(user.id);

    // Créer les missions de base pour le nouvel utilisateur
    await createDefaultMissions(user.id);

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user,
      token,
      referralBonus: referredBy ? '1000 Ar crédités à votre parrain' : null
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Créer les missions par défaut pour un nouvel utilisateur
const createDefaultMissions = async (userId) => {
  const defaultMissions = [
    {
      missionType: 'CREATE_FIRST_CAMPAIGN',
      reward: 500
    },
    {
      missionType: 'GET_FIRST_AFFILIATE',
      reward: 200
    },
    {
      missionType: 'EARN_FIRST_COMMISSION',
      reward: 300
    },
    {
      missionType: 'COMPLETE_PROFILE',
      reward: 100
    }
  ];

  await prisma.userMission.createMany({
    data: defaultMissions.map(mission => ({
      userId,
      ...mission
    }))
  });
};

// Vérifier et mettre à jour le niveau utilisateur
const checkAndUpdateUserLevel = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalEarned: true, level: true }
    });

    if (!user) return;

    let newLevel = 'BRONZE';

    if (user.totalEarned >= 50000) newLevel = 'DIAMOND';
    else if (user.totalEarned >= 15000) newLevel = 'PLATINUM';
    else if (user.totalEarned >= 5000) newLevel = 'GOLD';
    else if (user.totalEarned >= 1000) newLevel = 'SILVER';

    if (newLevel !== user.level) {
      await prisma.user.update({
        where: { id: userId },
        data: { level: newLevel }
      });

      // Bonus de montée de niveau
      const levelBonus = {
        'SILVER': 500,
        'GOLD': 1000,
        'PLATINUM': 2000,
        'DIAMOND': 5000
      }[newLevel] || 0;

      if (levelBonus > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            balance: { increment: levelBonus },
            totalEarned: { increment: levelBonus }
          }
        });

        await prisma.userBalanceLog.create({
          data: {
            userId,
            amount: levelBonus,
            type: 'LEVEL_UPGRADE',
            description: `Bonus montée niveau ${newLevel}`
          }
        });
      }
    }
  } catch (error) {
    console.error('Erreur vérification niveau:', error);
  }
};

// Connexion utilisateur
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Générer le token
    const token = generateToken(user.id);

    res.json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        balance: user.balance,
        level: user.level
      },
      token,
      accessToken: token // Pour compatibilité frontend
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Obtenir le profil utilisateur
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        balance: true,
        level: true,
        totalEarned: true,
        missionsCompleted: true,
        phoneNumber: true,
        createdAt: true,
        _count: {
          select: {
            affiliateLinks: true,
            commissions: true,
            referrals: true,
            campaigns: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Erreur profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  checkAndUpdateUserLevel,
  createDefaultMissions
};