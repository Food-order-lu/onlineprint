# Implementation Plan - Rivego Platform

# [Goal Description]
Automate monthly invoicing, resolve contract/cancellation bugs, and implement a new **Referral System (Parrainage)**.

## User Review Required
> [!IMPORTANT]
> **Referral Logic:**
> - **Identifier:** VAT Number will be used as the Referral Code.
> - **Referee Reward:** 20% off for the first 2 months.
> - **Referrer Reward:** 20% off their next invoice (stackable?).
> - **Automation:** System will automatically apply these discounts during invoice generation.

## Proposed Changes

### Database Schema
#### [MODIFY] [Client Table]
- Add `referral_code` (string, unique) -> defaults to VAT Number.
- Add `referred_by` (uuid, fk to clients.id).

### Subscription Flow
#### [MODIFY] [Confirmation API]
- Accept `referral_code` in the confirmation payload.
- Lookup referrer.
- Link accounts.
- Create `Discount` records (or metadata on subscription).

### Invoicing Logic
#### [MODIFY] [Generate Monthly Invoices]
- Check for active discounts.
- Apply percentage reduction before calculating total.

### Frontend
#### [MODIFY] [Client Profile]
- Show "Parrainé par: [Company Name]" if applicable.
- Show "Code Parrainage: [VAT Number]".

---

## Completed Tasks (Debugging)
- [x] **Contract Generation:** Fixed crash by handling undefined subscriptions.
- [x] **Cancellation:** Fixed button to use DELETE method.
- [x] **Report Ingestion:** Now queues charges instead of separate invoices.
- [x] **Server Sync:** Full sync and restart performed.

