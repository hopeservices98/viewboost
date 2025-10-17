const { PrismaClient } = require('@prisma/client');
const aiEngine = require('../../ai-engine');

const prisma = new PrismaClient();

// Middleware de détection de fraude avancée
const advancedFraudDetection = async (req, res, next) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';
    const referrer = req.get('Referrer') || '';

    // 1. Vérifications de base
    const basicChecks = await performBasicChecks(clientIP, userAgent, req);

    // 2. Analyse comportementale
    const behavioralAnalysis = await analyzeBehavioralPatterns(clientIP, req);

    // 3. Vérifications géographiques (si activé)
    const geoCheck = await performGeoCheck(clientIP);

    // 4. IA avancée (si activé)
    const aiAnalysis = process.env.USE_AI_VALIDATION === 'true'
      ? await aiEngine.detectFraud({
          ipAddress: clientIP,
          userAgent,
          referrer,
          requestCount: behavioralAnalysis.requestCount,
          timeWindow: behavioralAnalysis.timeWindow
        })
      : { isFraud: false, confidence: 0 };

    // Calculer score global de fraude
    const fraudScore = calculateFraudScore({
      basicChecks,
      behavioralAnalysis,
      geoCheck,
      aiAnalysis
    });

    // Attacher les résultats à la requête
    req.fraudAnalysis = {
      score: fraudScore,
      isSuspicious: fraudScore > 0.7,
      details: {
        basicChecks,
        behavioralAnalysis,
        geoCheck,
        aiAnalysis
      }
    };

    // Log d'audit pour analyses futures
    await logFraudAnalysis(clientIP, fraudScore, req.fraudAnalysis);

    // Bloquer automatiquement les scores très élevés
    if (fraudScore > 0.9) {
      return res.status(403).json({
        error: 'Activité suspecte détectée',
        code: 'FRAUD_BLOCKED'
      });
    }

    next();
  } catch (error) {
    console.error('Erreur détection fraude:', error);
    // En cas d'erreur, continuer mais marquer comme suspect
    req.fraudAnalysis = {
      score: 0.5,
      isSuspicious: true,
      error: true
    };
    next();
  }
};

// Vérifications de base
async function performBasicChecks(clientIP, userAgent, req) {
  const issues = [];

  // 1. Vérifier liste noire IP
  const blacklistedIP = await prisma.blacklistedIP.findUnique({
    where: { ip: clientIP }
  });
  if (blacklistedIP) {
    issues.push({ type: 'BLACKLISTED_IP', severity: 'high' });
  }

  // 2. Vérifier user-agent suspects
  const suspiciousPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /headless/i, /selenium/i, /phantom/i
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    issues.push({ type: 'SUSPICIOUS_USER_AGENT', severity: 'high' });
  }

  // 3. Vérifier headers manquants ou suspects
  if (!req.get('Accept-Language') || !req.get('Accept-Encoding')) {
    issues.push({ type: 'MISSING_HEADERS', severity: 'medium' });
  }

  return issues;
}

// Analyse comportementale
async function analyzeBehavioralPatterns(clientIP, req) {
  const timeWindow = 60 * 1000; // 1 minute
  const now = new Date();

  // Compter les requêtes récentes depuis cette IP
  const recentRequests = await prisma.requestLog.count({
    where: {
      ipAddress: clientIP,
      createdAt: {
        gte: new Date(now.getTime() - timeWindow)
      }
    }
  });

  // Vérifier les patterns de requêtes
  const requestPattern = await analyzeRequestPattern(clientIP, timeWindow);

  return {
    requestCount: recentRequests,
    timeWindow,
    pattern: requestPattern,
    isBotLike: recentRequests > 50 || requestPattern.isSuspicious
  };
}

// Analyse des patterns de requêtes
async function analyzeRequestPattern(clientIP, timeWindow) {
  const requests = await prisma.requestLog.findMany({
    where: {
      ipAddress: clientIP,
      createdAt: {
        gte: new Date(Date.now() - timeWindow)
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  if (requests.length < 5) return { isSuspicious: false };

  // Calculer intervalles entre requêtes
  const intervals = [];
  for (let i = 1; i < requests.length; i++) {
    intervals.push(requests[i].createdAt - requests[i-1].createdAt);
  }

  // Vérifier si les intervalles sont trop réguliers (bot)
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, interval) => {
    return sum + Math.pow(interval - avgInterval, 2);
  }, 0) / intervals.length;

  const regularity = Math.sqrt(variance) / avgInterval;

  return {
    isSuspicious: regularity < 0.1, // Très régulier = suspect
    avgInterval,
    regularity
  };
}

// Vérification géographique (basique)
async function performGeoCheck(clientIP) {
  // Pour une implémentation complète, utiliser un service comme MaxMind
  // Ici, vérification basique des plages IP connues pour le VPN/proxy
  const knownVPNRanges = [
    // Exemples de plages VPN connues
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16'
  ];

  // Simulation - dans la vraie implémentation, utiliser une lib comme 'ip-range-check'
  const isVPN = knownVPNRanges.some(range => {
    // Logique simplifiée
    return clientIP.startsWith('10.') ||
           clientIP.startsWith('172.') ||
           clientIP.startsWith('192.168.');
  });

  return {
    isVPN,
    country: 'Unknown', // À implémenter avec un service géo
    isHighRisk: isVPN
  };
}

// Calcul du score global de fraude
function calculateFraudScore(analysis) {
  let score = 0;

  // Poids des différentes vérifications
  const weights = {
    basicChecks: 0.4,
    behavioralAnalysis: 0.3,
    geoCheck: 0.2,
    aiAnalysis: 0.1
  };

  // Score des vérifications de base
  const basicScore = analysis.basicChecks.reduce((sum, issue) => {
    const severityWeights = { low: 0.2, medium: 0.5, high: 1.0 };
    return sum + (severityWeights[issue.severity] || 0.5);
  }, 0) / Math.max(analysis.basicChecks.length, 1);

  // Score comportemental
  const behavioralScore = analysis.behavioralAnalysis.isBotLike ? 0.8 : 0;

  // Score géographique
  const geoScore = analysis.geoCheck.isHighRisk ? 0.6 : 0;

  // Score IA
  const aiScore = analysis.aiAnalysis.confidence || 0;

  // Calcul pondéré
  score = (
    basicScore * weights.basicChecks +
    behavioralScore * weights.behavioralAnalysis +
    geoScore * weights.geoCheck +
    aiScore * weights.aiAnalysis
  );

  return Math.min(score, 1); // Max 1
}

// Logging d'audit
async function logFraudAnalysis(clientIP, score, analysis) {
  try {
    await prisma.fraudLog.create({
      data: {
        ipAddress: clientIP,
        score,
        details: analysis,
        endpoint: 'unknown', // Sera rempli par le middleware appelant
        userAgent: analysis.details?.basicChecks?.[0]?.userAgent || ''
      }
    });
  } catch (error) {
    console.error('Erreur logging fraude:', error);
  }
}

// Middleware pour logging des requêtes
const requestLogger = async (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;

  try {
    await prisma.requestLog.create({
      data: {
        ipAddress: clientIP,
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('User-Agent') || '',
        referrer: req.get('Referrer') || ''
      }
    });
  } catch (error) {
    console.error('Erreur logging requête:', error);
  }

  next();
};

module.exports = {
  advancedFraudDetection,
  requestLogger
};