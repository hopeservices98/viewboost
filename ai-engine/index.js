const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIEngine {
  async detectFraud(clickData) {
    // Logique de détection de fraude avec IA
    const prompt = `Analyser ces données de clic pour détecter une potentielle fraude: ${JSON.stringify(clickData)}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
      });

      return {
        isFraud: response.choices[0].message.content.includes('fraud'),
        confidence: 0.8, // Placeholder
      };
    } catch (error) {
      console.error('Erreur IA:', error);
      return { isFraud: false, confidence: 0 };
    }
  }

  async recommendOptimization(userData) {
    // Recommandations pour optimiser les partages
    const prompt = `Donner des conseils pour maximiser les gains d'affiliation: ${JSON.stringify(userData)}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Erreur IA:', error);
      return 'Conseil par défaut: Partagez sur plusieurs plateformes.';
    }
  }

  async chatbotResponse(message, context) {
    // Réponses automatiques du chatbot
    const prompt = `Répondre en tant que support affilié: ${message}. Contexte: ${JSON.stringify(context)}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Erreur IA:', error);
      return 'Désolé, je ne peux pas répondre pour le moment.';
    }
  }
}

module.exports = new AIEngine();