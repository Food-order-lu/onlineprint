# PrintFlow Pro - E-Commerce Impression

Plateforme e-commerce print-on-demand professionnelle avec configurateur produit, gestion workflow admin, et tracking fournisseurs.

## 🚀 Fonctionnalités

### Client
- **Homepage moderne** avec gradient hero et showcase catégories
- **Catalogue produits** avec filtres et recherche
- **Configurateur interactif** : quantité, format, papier, finition, upload fichiers
- **Calcul prix temps réel** avec tarifs par paliers
- **Panier et checkout** avec adresses et paiement
- **Espace client** : commandes, profil, adresses, tracking

### Admin
- **Dashboard opérationnel** avec KPIs en temps réel
- **Workflow complet commandes** :
  - NEW → FILES_OK / FILES_ISSUE
  - ORDERED_WITH_SUPPLIER (avec référence fournisseur)
  - SUPPLIER_INVOICE_UPLOADED → matching automatique
  - SHIPPED (tracking GLS + email auto)
  - DELIVERED
- **Gestion produits** avec import CSV
- **Matching factures fournisseurs** avec tolérance configurable
- **Emails transactionnels** automatiques
- **Audit logs** de toutes les actions

## 📦 Stack Technique

- **Framework** : Next.js 15 (App Router)
- **Database** : SQLite + Prisma ORM  
- **Styling** : Vanilla CSS avec design system premium
- **Auth** : NextAuth.js v5 (RBAC)
- **Email** : Nodemailer avec templates
- **Files** : Upload local (ready for cloud)
- **Payments** : Stripe (test mode)

## 🛠️ Installation

```bash
# Installer les dépendances (Node.js requis)
cd printflow-pro
npm install

# Créer la base de données
npx prisma db push

# Charger les données démo
npx prisma db seed

# Lancer le serveur dev
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## 👥 Comptes de test

**Admin** :
- Email : `admin@printflow.com`
- Password : `admin123`

**Client** :
- Email : `client@example.com`
- Password : `client123`

## 📚 Données démo

- 2 produits : Cartes de Visite et Flyers
- Variantes multiples (formats, papiers, finitions)
- Paliers de prix (50, 100, 250, 500, 1000, 2500, 5000)
- 1 commande exemple avec workflow

## 📄 Import CSV

Template CSV disponible : `/public/samples/product-import-template.csv`

Colonnes : category_slug, product_name, sku, format, paper_weight, print_sides, min_quantity, supplier_cost, margin_percent

## 🎯 Workflow Admin

1. **Validation fichiers** : Admin valide ou signale problème
2. **Commande fournisseur** : Ajout référence + copie rapide infos
3. **Upload facture** : Auto-matching quantité/montant/SKU
4. **Expédition** : Ajout tracking → email automatique client
5. **Audit complet** : Traçabilité de toutes les actions

## 📧 Emails automatiques

- Confirmation commande
- Problème fichiers (avec lien correction)
- Tracking expédition
- Templates éditables en admin

## 🔐 Sécurité

- RBAC (ADMIN, OPS, SUPPORT, ACCOUNTING, CUSTOMER)
- Audit logs complets
- Validation uploads
- Hashing passwords (bcrypt)

## 📱 Responsive

Design mobile-first, optimisé tablettes et desktop.

## 🌍 Multi-langue / Multi-devise

Architecture prête pour FR/DE/EN et EUR/CHF (actuellement FR + EUR actifs).

## 📝 Légal

Pages CGV, Confidentialité, Mentions légales conformes RGPD/UE.

## 🎨 Design

- Gradient moderne purple/pink
- Animations micro-interactions
- Typographie Inter (Google Fonts)
- Components réutilisables (cards, buttons, badges, alerts)

---

**PrintFlow Pro** © 2025 - Plateforme print-on-demand professionnelle
