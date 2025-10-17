# Règles Anti-Fraude MVP

## Règles de Base pour le Tracking

### Clics
- **IP unique par lien** : Maximum 3 clics par IP et par lien affilié sur 24h
- **Fréquence** : Maximum 10 clics par minute par IP
- **User-Agent** : Bloquer les bots connus (liste de user-agents suspects)
- **Durée minimum** : Le clic doit mener à une vue validée dans les 5 minutes

### Vues
- **Temps de visionnage minimum** : 30 secondes pour validation
- **IP unique** : Maximum 5 vues par IP et par campagne sur 24h
- **Géolocalisation** : Vérifier cohérence IP/pays (optionnel pour MVP)
- **Device fingerprinting** : Détecter changements suspects d'appareil

## Score de Fraude
- **0-0.3** : Confiance élevée (commission normale)
- **0.3-0.7** : Risque moyen (commission réduite de 50%)
- **0.7-1.0** : Haute suspicion (pas de commission)

## Validation Automatique
- **Cron job** : Validation des vues toutes les 5 minutes
- **Hold time** : 24h avant attribution des commissions
- **Review manuel** : Seuils > 0.7 nécessitent validation humaine

## Intégration IA
- **Détection avancée** : Utiliser OpenAI pour analyser patterns complexes
- **Apprentissage** : Le système apprend des faux positifs/négatifs

## Mesures Préventives
- **Rate limiting** : 100 requêtes/minute par IP
- **CAPTCHA** : Pour clics suspects
- **Logging** : Tous les événements trackés pour audit