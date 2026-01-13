# Roadmap Rivego - Tâches

## 1. Architecture & Sécurité
- [ ] Séparer l'Admin (app.rivego.lu) du Site Public (rivego.lu)
- [ ] Système "Deuxième Cerveau" (Automatisation totale avec Antigravity) (future)

## 2. Flexibilité Contractuelle
- [ ] Modification complète du profil client (Commissions, Abonnements, Frais)
- [ ] Contrat dynamique : s'adapte au profil actuel
- [ ] Durée résiliation modifiable par client (défaut 2 mois)
- [ ] Checkbox "Mandat SEPA Requis / Non Requis"

## 3. Workflow & Automatisation
- [x] Signature Devis → Création automatique Profil Client
- [ ] Stockage PDF (dévis + contrat) signé dans le Profil (Documents)
- [ ] Création de facture acompte avec le montant acompte sur le dévis
- [ ] Facturation récurrente seulement après "Date Mise en Ligne"
- [x] Séparer visuellement "Devis" et "Contrats" dans Documents

## 4. UI/UX & Dashboard
- [x] Compte à rebours résiliation ("J-63")
- [ ] Afficher les Prospects dans la liste Clients
- [ ] Tous les profils dans la liste Prélèvements (même sans mandat)

## 5. Facturation
- [ ] Vérifier TVA 17% appliquée correctement (Zoho)
- [ ] Bouton "Générer Facture Finale" (en enlevant l'acompte si payé) (solde/clôture)
- [ ] Webhook Zoho pour sync paiements externes

## 6. GloriaFood & Commissions
- [ ] Centraliser rapports GloriaFood dans Profil Client
- [ ] Support Prix Hybride (Fixe + Commission Variable)

## 7. Obsidian / Notes Commerciales (Futur)
- [ ] Sync vault Obsidian vers serveur
- [ ] Parser les notes et métadonnées YAML
- [ ] Lier notes au profil client via client_id
- [ ] Recherche par critères (budget, services, statut)
- [ ] Gérer les photos attachées

## 8. Conditions & Validation
- [x] Bloquer N° TVA (un seul numéro TVA dans la base de données)
