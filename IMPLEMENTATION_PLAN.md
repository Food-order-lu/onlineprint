# onlineprint.lu - Plan d'Implémentation Complet

## Vue d'ensemble

Plateforme e-commerce d'impression inspirée de wir-machen-druck.de avec:
- Catalogue complet (cartes de visite, flyers, affiches, textile, etc.)
- Workflow de commande semi-manuel (en attendant l'API wir-machen-druck)
- Paiement Stripe
- Système B2B avec remises
- Sécurité 2FA (SMS + Email)

---

## User Review Required

> [!IMPORTANT]
> **Choix technologique requis:**
> 1. **Backend**: Node.js/Express ou PHP ? (je recommande Node.js pour Stripe)
> 2. **Base de données**: MySQL ou PostgreSQL ?
> 3. **Hébergement prévu**: VPS, Vercel, ou autre ?
> 4. **Domaine email**: Quel domaine pour Resend ? (ex: noreply@onlineprint.lu)

> [!WARNING]
> **Configuration manuelle requise:**
> - Les prix doivent être copiés manuellement de wir-machen-druck.de
> - Cette phase sera lente comme vous l'avez mentionné
> - Je mettrai en place l'interface admin pour faciliter la saisie

---

## Architecture Proposée

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
│  HTML/CSS/JS (actuel) ou Next.js (recommandé pour Stripe)   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND API                             │
│                    Node.js + Express                         │
│  - Products API                                              │
│  - Orders API                                                │
│  - Auth API (2FA)                                            │
│  - Payments (Stripe)                                         │
│  - File Upload                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE                                │
│                   PostgreSQL/MySQL                           │
│  - customers (VAT, company, address, phone, email)          │
│  - products, variants, pricing_tiers                        │
│  - orders, order_items                                      │
│  - files (uploads)                                          │
│  - discount_tiers                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVICES EXTERNES                          │
│  - Stripe (Paiements)                                       │
│  - Resend (Emails)                                          │
│  - Twilio (SMS 2FA)                                         │
│  - Cloud Storage (Fichiers)                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Phases de Développement

### Phase 1: Catalogue Produit Complet 
**Durée estimée: 2-3 jours**

Produits à ajouter (focus restaurant/publicité):

| Catégorie | Produits |
|-----------|----------|
| Cartes de visite | Standard, Premium, Créatives |
| Flyers | A6, A5, A4, DIN lang |
| Affiches | A3, A2, A1, B1, B2 |
| Dépliants | 2 volets, 3 volets, Z-fold |
| Brochures | Agrafées, Dos carré collé |
| Menus | Carte menu, Porte-menu |
| Autocollants | Papier, Vinyle, Découpe |
| Roll-ups | 85cm, 100cm, 120cm |
| Bâches/Banners | PVC, Mesh |
| Habillage véhicule | Lettrage, Full wrap |
| Textile | T-shirts, Polos, Vestes |
| Objets promo | Stylos, Verres, Mugs |
| Papeterie | En-tête, Enveloppes, Blocs |

---

### Phase 2: Backend & Base de Données
**Durée estimée: 3-4 jours**

#### Schéma DB (Prisma/SQL)

```sql
-- Clients B2B
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  vat_number VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(50) DEFAULT 'Luxembourg',
  phone VARCHAR(30),
  discount_tier_id UUID,
  orders_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tiers de remise
CREATE TABLE discount_tiers (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  discount_percent DECIMAL(5,2),
  min_orders INT DEFAULT 0
);

-- Commandes avec workflow
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE,
  customer_id UUID REFERENCES customers(id),
  status ENUM('pending','paid','processing','ordered','shipped','delivered'),
  total_ht DECIMAL(10,2),
  total_ttc DECIMAL(10,2),
  supplier_cost DECIMAL(10,2),
  margin_eur DECIMAL(10,2),
  margin_pct DECIMAL(5,2),
  stripe_payment_id VARCHAR(255),
  supplier_order_doc TEXT, -- URL du document fournisseur
  tracking_number VARCHAR(100),
  tracking_email TEXT, -- Contenu email tracking
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### Phase 3: Checkout & Validation Fichiers
**Durée estimée: 2-3 jours**

#### Formulaire Client
- Nom de société (obligatoire)
- Numéro TVA (optionnel mais recommandé)
- Adresse complète
- Email (confirmation requise)
- Téléphone (pour 2FA SMS)

#### Upload Fichiers
- **Obligatoire** pour produits d'impression
- Recto ET Verso si double-face
- Formats: PDF, JPG, PNG, AI, PSD, EPS
- Limite: 100 Mo par fichier

> [!CAUTION]
> **Disclaimer qualité (affiché):**
> "La qualité d'impression dépend de la résolution de vos fichiers. onlineprint.lu ne peut être tenu responsable de la qualité d'impression si les fichiers fournis sont en basse résolution. Minimum recommandé: 300 DPI."

---

### Phase 4: Admin Panel
**Durée estimée: 3-4 jours**

#### Fonctionnalités Admin

1. **Gestion Produits**
   - Tableau avec tous les produits
   - Éditeur de prix par quantité (grille Excel-like)
   - Activation/désactivation produits

2. **Workflow Commandes**
   ```
   Nouvelle → Payée → En traitement → Commandée → Expédiée → Livrée
   ```
   - Upload document confirmation fournisseur
   - Vérification auto (comparaison commande)
   - Champ pour numéro de tracking
   - Historique des modifications

3. **Rapports Marges**
   - Marge par commande (€ et %)
   - Marge moyenne mensuelle
   - Top produits par marge
   - Export CSV

---

### Phase 5: Stripe Integration
**Durée estimée: 2 jours**

```javascript
// Flux de paiement
1. Client valide panier → Création PaymentIntent
2. Affichage formulaire Stripe Elements
3. Paiement réussi → Webhook reçu
4. Commande marquée "payée"
5. Email confirmation envoyé
```

#### Mode Test (Sandbox)
- Clé publique: pk_test_xxx
- Clé secrète: sk_test_xxx
- Cartes test: 4242 4242 4242 4242

---

### Phase 6: Sécurité 2FA
**Durée estimée: 2 jours**

1. **Inscription**
   - Email + mot de passe
   - Confirmation email (Resend)
   - Validation numéro téléphone (SMS Twilio)

2. **Connexion**
   - Email + mot de passe
   - Code SMS ou Email (choix utilisateur)
   - Session sécurisée (JWT + refresh token)

3. **Best Practices**
   - bcrypt pour mots de passe
   - Rate limiting sur login
   - Logs de sécurité
   - Headers HTTPS

---

### Phase 7: Système B2B
**Durée estimée: 1 jour**

| Tier | Conditions | Remise |
|------|-----------|--------|
| Standard | Nouveau client | 0% |
| Welcome | 1ère et 2ème commande | 10% |
| Business | 3+ commandes | 5% |
| VIP | Sur demande | 15% |

---

## Plan de Test

### Tests Fonctionnels
- [ ] Chaque produit configurable
- [ ] Prix corrects pour toutes les quantités
- [ ] Upload fichiers fonctionne
- [ ] Checkout complet
- [ ] Paiement Stripe (sandbox)
- [ ] Emails envoyés
- [ ] Admin workflow complet

### Tests Sécurité
- [ ] Injection SQL
- [ ] XSS
- [ ] CSRF
- [ ] Rate limiting
- [ ] 2FA fonctionnel

### Checklist Pré-Lancement
- [ ] SSL/HTTPS actif
- [ ] Stripe en mode live
- [ ] Backup DB configuré
- [ ] Monitoring en place
- [ ] CGV et mentions légales

---

## Prochaines Étapes

1. **Vous confirmez** les choix technologiques (backend, DB)
2. **Je crée** le catalogue produit complet
3. **Phase configuration** (vous ajustez les prix)
4. **Je développe** le backend et paiements
5. **Phase test** ensemble
6. **Lancement**
