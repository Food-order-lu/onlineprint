# onlineprint.lu - Master Task List

## ✅ Phase 1: Foundation (Complete)
- [x] Basic site structure (HTML/CSS/JS)
- [x] Product configurator with dynamic pricing
- [x] Admin dashboard structure
- [x] **Complete product catalog** (19 products, 8 categories)
  - [x] Business cards (10 variants)
  - [x] Flyers (A6, A5, A4, DIN lang) - 13 variants
  - [x] Posters/Affiches (A3, A2, A1)
  - [x] Brochures & Dépliants (2v, 3v)
  - [x] Stickers/Autocollants (papier, vinyle)
  - [x] Roll-ups & Banners
  - [x] Menus Restaurant
  - [x] Papeterie (en-tête, enveloppes)
  - [x] Textile (T-shirts, Polos)

## 🟡 Phase 2: Backend & Database
- [ ] Set up proper backend (Node.js/Express or PHP)
- [ ] Database design (MySQL/PostgreSQL)
  - [ ] Customers table (VAT, company, address, phone, email)
  - [ ] Products & Variants tables
  - [ ] Orders table (with status workflow)
  - [ ] Pricing tiers (admin-editable)
  - [ ] Discount tiers (customer groups)
- [ ] File upload system (server-side storage)
- [ ] API endpoints for frontend

## ✅ Phase 3: Checkout & Orders (Complete)
- [x] Checkout flow with customer forms (particulier/société)
- [x] Order creation and storage
- [x] Order confirmation page
- [x] File upload indication
- [x] Quality disclaimer acceptance

## ✅ Phase 3b: TVA & Facturation (Complete)
- [x] **TVA Luxembourg (17%)** par défaut
- [x] **Autoliquidation** pour B2B intra-UE
- [x] Option TVA pour particuliers étrangers (compte client)
- [x] Génération factures HTML/PDF
- [x] Numérotation séquentielle factures

## 🟡 Phase 4: Admin Panel
- [ ] Product management (add/edit/delete)
- [ ] **Custom pricing per product/quantity** (editable grid)
- [ ] Order management with full details
- [ ] Manual order processing workflow:
  - [ ] View order → Upload supplier confirmation
  - [ ] AI/manual verification step
  - [ ] Add tracking number
- [ ] Margin reports (€ and % per order and average)
- [ ] Customer management

## 🔴 Phase 5: Payments (Stripe)
- [ ] Stripe integration (sandbox first)
- [ ] Payment intent creation
- [ ] Webhook handling
- [ ] Invoice generation
- [ ] Test with sandbox cards

## 🔴 Phase 6: Security
- [ ] 2FA authentication
  - [ ] SMS verification (Twilio)
  - [ ] Email confirmation (Resend)
- [ ] Secure password hashing
- [ ] HTTPS enforcement
- [ ] Input sanitization
- [ ] SQL injection prevention
- [ ] CSRF protection
- [ ] Rate limiting

## 🟢 Phase 7: Customer Features
- [ ] B2B discount system
  - [ ] Base discount for registered companies
  - [ ] Higher discount for first 2 orders
- [ ] Customer portal (order history, reorder)
- [ ] Saved addresses
- [ ] Company VAT validation

## 🟣 Phase 8: Testing & Launch
- [ ] Complete product testing
- [ ] Price calculation verification
- [ ] Order flow testing
- [ ] Payment testing (Stripe sandbox)
- [ ] Security audit
- [ ] Performance testing
- [ ] Mobile responsiveness
- [ ] Cross-browser testing
- [ ] Launch checklist

## Configuration Phase (User-driven)
- [ ] User adds/removes products
- [ ] User sets prices and margins
- [ ] User configures discounts
- [ ] User tests all scenarios
