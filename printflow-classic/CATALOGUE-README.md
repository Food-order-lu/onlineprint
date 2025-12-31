# Catalogue Produits - onlineprint.lu

## Structure du fichier CSV

Le fichier `product-catalog-template.csv` contient la structure complète des produits inspirée de wir-machen-druck.de.

### Colonnes expliquées

| Colonne | Description | Exemple |
|---------|-------------|---------|
| `category_slug` | Identifiant unique de la catégorie (URL-friendly) | `cartes-visite` |
| `category_name` | Nom affiché de la catégorie | `Cartes de visite` |
| `category_icon` | Emoji pour la catégorie | `📇` |
| `product_slug` | Identifiant unique du produit | `cartes-visite-standard` |
| `product_name` | Nom affiché du produit | `Cartes de visite standard` |
| `product_description` | Description courte | `Format classique 85x55mm...` |
| `variant_sku` | Code SKU unique de la variante | `CV-STD-001` |
| `format` | Dimensions ou format | `85x55mm`, `A5`, `A4` |
| `paper_type` | Type de papier | `Couché mat`, `Couché brillant` |
| `paper_weight` | Grammage | `300g`, `350g`, `170g` |
| `print_sides` | Faces imprimées | `RECTO` ou `RECTO_VERSO` |
| `finish` | Finition | `Sans finition`, `Pelliculage mat`, `Vernis sélectif` |
| `lead_time_days` | Délai de production en jours | `5` |
| `qty_50_cost` | Coût fournisseur pour 50 ex. | `8.50` |
| `qty_100_cost` | Coût fournisseur pour 100 ex. | `7.20` |
| `qty_250_cost` | Coût fournisseur pour 250 ex. | `5.80` |
| `qty_500_cost` | Coût fournisseur pour 500 ex. | `4.50` |
| `qty_1000_cost` | Coût fournisseur pour 1000 ex. | `3.20` |
| `qty_2500_cost` | Coût fournisseur pour 2500 ex. | `2.50` |
| `qty_5000_cost` | Coût fournisseur pour 5000 ex. | `2.00` |
| `margin_percent` | Marge bénéficiaire (%) | `55` (= prix vente = coût × 1.55) |

## Catégories disponibles

1. **cartes-visite** - Cartes de visite 📇
2. **flyers** - Flyers 📄
3. **affiches** - Affiches 🖼️
4. **depliants** - Dépliants 📑
5. **brochures** - Brochures 📚
6. **autocollants** - Autocollants ✨
7. **roll-ups** - Roll-ups & Kakémonos 🎪
8. **baches** - Bâches & Banderoles 🏗️
9. **packaging** - Packaging 📦
10. **papeterie** - Papeterie ✉️

## Comment utiliser ce fichier

### 1. Sélectionner vos produits
1. Ouvrez le fichier CSV dans Excel ou Google Sheets
2. **Supprimez les lignes** des produits que vous ne souhaitez pas vendre
3. **Modifiez les prix** selon vos coûts réels fournisseur
4. **Ajustez les marges** selon votre stratégie commerciale

### 2. Importer dans onlineprint.lu
1. Sauvegardez votre fichier modifié
2. Utilisez l'interface Admin > Import CSV
3. Le système créera automatiquement les catégories, produits et variantes

### 3. Exemple de sélection minimale

Pour commencer avec seulement les essentiels, gardez:
- **Cartes de visite standard** (4 variantes)
- **Flyers A5** (4 variantes)
- **Affiches A3** (2 variantes)

Cela vous donne 10 variantes pour tester le site avant d'élargir.

## Calcul des prix

Le prix de vente TTC est calculé automatiquement:

```
Prix HT = Coût fournisseur × (1 + marge% / 100)
Prix TTC = Prix HT × 1.17 (Luxembourg: TVA 17%)
```

### Exemple:
- Coût fournisseur: 7.20€ (100 cartes de visite)
- Marge: 55%
- Prix HT: 7.20 × 1.55 = 11.16€
- Prix TTC: 11.16 × 1.17 = **13.06€**

## Notes importantes

- Les SKU doivent être **uniques** pour chaque variante
- Les slugs doivent être en **minuscules sans accents** et utiliser des tirets
- Les coûts sont en **EUR** et correspondent aux prix fournisseur hors TVA
