# Diagramme Base de Données

## Relations Principales

```
User (1) ──── (N) Campaign
  │              │
  │              │
  │              └─── (N) AffiliateLink
  │                     │
  │                     ├── (N) Click
  │                     └── (N) View ─── (N) Commission
  │
  ├── (N) Commission
  └── (N) Payout
```

## Détail des Modèles

### User
- **Clés** : id (PK), email (unique), username (unique)
- **Relations** :
  - campaigns (1-N) : Campagnes créées
  - affiliateLinks (1-N) : Liens affiliés générés
  - clicks (1-N) : Clics trackés
  - views (1-N) : Vues trackées
  - commissions (1-N) : Commissions gagnées
  - payouts (1-N) : Demandes de retrait
  - referrals (1-N) : Utilisateurs parrainés

### Campaign
- **Clés** : id (PK), youtubeUrl, videoId
- **Relations** :
  - user (N-1) : Créateur de la campagne
  - affiliateLinks (1-N) : Liens affiliés
  - views (1-N) : Vues générées

### AffiliateLink
- **Clés** : id (PK), token (unique)
- **Index** : token, (userId + campaignId)
- **Relations** :
  - user (N-1) : Affilié propriétaire
  - campaign (N-1) : Campagne liée
  - clicks (1-N) : Clics sur ce lien
  - views (1-N) : Vues via ce lien

### Click
- **Clés** : id (PK)
- **Index** : (affiliateLinkId + createdAt), ipAddress
- **Relations** :
  - affiliateLink (N-1)
  - user (N-1) : Optionnel

### View
- **Clés** : id (PK)
- **Index** : (affiliateLinkId + isValid), (campaignId + createdAt), (ipAddress + createdAt)
- **Relations** :
  - affiliateLink (N-1)
  - campaign (N-1)
  - user (N-1) : Optionnel

### Commission
- **Clés** : id (PK)
- **Index** : (userId + status), (level + status)
- **Relations** :
  - user (N-1) : Bénéficiaire
  - view (N-1) : Vue source (optionnel)

### Payout
- **Clés** : id (PK)
- **Relations** :
  - user (N-1) : Demandeur

## Règles Métier
- **Multi-niveaux** : Commissions sur 3 niveaux maximum
- **Validation** : Vues validées après 30s minimum
- **Anti-fraude** : Score calculé par IP, fréquence, user-agent
- **Hold time** : 24h avant attribution commissions

## Optimisations
- **Index composites** : Pour requêtes fréquentes (stats, validation)
- **Partitionnement** : Tables clicks/views par date (futur)
- **Cache** : Redis pour sessions et stats fréquentes