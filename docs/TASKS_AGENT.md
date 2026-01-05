# Quote to Subscription Automation

## Tasks

### Phase 1: Auto-Create Subscriptions
- [x] Modify confirm/route.ts to fetch quote
- [x] Auto-create subscriptions for recurring items
- [x] Remove setup_subscriptions task creation

### Phase 2: Proration on Cancellation
- [x] Calculate prorated amount on cancel
- [x] Create one-time charge for proration
- [x] Test mid-month cancellation

### Phase 3: Critical Bug Fixes
- [x] Fix contract generation crash (undefined subscriptions)
- [x] Fix contract generation pdf error (server-side rendering)
- [x] Fix subscription cancellation (DELETE method)
- [x] Fix monthly invoicing (filter 0€, consolidate charges)
- [x] Fix report ingestion flow (queue as pending charge)

### Phase 4: UI & Signing Flow Refinements
- [x] **Dashboard:** Hide "Objectifs Commerciaux" by default (toggle/admin only).
- [x] **DocuSeal:** Fix layout (Signature bottom, Date/Agreement above).
- [x] **DocuSeal:** Change "Bon pour accord" to handwritten field.
- [x] **Quote Sync:** Auto-create subscriptions on webhook signature.

### Phase 5: Referral System (Parrainage) [ACTIVE]
#### [NEW] Public Registration Page (`/register` or `/join`)
- **Self-Service:** New clients can sign up themselves.
- **Fields:** Company Name, VAT, Contact Name, Email, Phone, **Parrain (TVA)**.
- **Logic:**
    - Checks if Parrain VAT exists in `clients`.
    - Creates new client in `pending_confirmation` status.
    - Applies `referral_code` (New Client's VAT) and `referred_by` (Parrain's ID).

#### [MODIFY] Quote/Subscription Flow
- Automation of the 20% discount for 2 months (Referee).
- Automation of the reward for Referrer (e.g., Credit Note or Next Invoice Discount).

### Phase 6: Verification
- [ ] Validate Contract PDF generation
- [ ] Validate Referral Flow
- [ ] Validate Contract PDF generation
- [ ] Validate Referral Flow
