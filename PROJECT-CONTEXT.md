# Rivego Automation System - Project Context

> **For Antigravity AI**: This document provides full context on the Rivego project to enable seamless continuation across sessions.

## 🎯 What is Rivego?

Rivego is a **B2B SaaS platform** for managing restaurant/commerce clients, subscriptions, billing (SEPA via GoCardless), invoicing (Zoho), and automated workflows. It's built with **Next.js 15**, **Supabase**, and deployed on an **Oracle Cloud server**.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                     │
├─────────────────────────────────────────────────────────────┤
│  /admin/*        → Admin dashboard, clients, tasks, quotes  │
│  /quote/[id]     → Client-facing quote signing (DocuSeal)   │
│  /cancel/[token] → Client cancellation flow                 │
│  /services/*     → Marketing pages                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (API Routes)                   │
├─────────────────────────────────────────────────────────────┤
│  /api/clients    → CRUD operations                          │
│  /api/tasks      → Task management                          │
│  /api/gocardless → SEPA mandate creation & webhooks         │
│  /api/docuseal   → Quote PDF signing                        │
│  /api/cron/*     → Scheduled jobs (cancellations, tasks)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE (Supabase)                    │
├─────────────────────────────────────────────────────────────┤
│  clients, subscriptions, invoices, tasks, mandates, etc.    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Key Directories

| Path | Purpose |
|------|---------|
| `src/app/admin/` | Admin UI (dashboard, clients, tasks, quote builder, portfolio) |
| `src/app/api/` | API routes (clients, tasks, GoCardless, DocuSeal, CRON) |
| `src/lib/db/` | Database schema SQL files and Supabase client |
| `src/lib/gocardless/` | GoCardless SEPA integration |
| `src/lib/tasks/` | Task generation utilities |
| `src/components/` | Reusable React components |

---

## 🔑 Key Integrations

| Service | Purpose | Config Location |
|---------|---------|-----------------|
| **Supabase** | Database & Auth | `.env.local` → `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` |
| **GoCardless** | SEPA Direct Debit | `.env.local` → `GOCARDLESS_ACCESS_TOKEN` |
| **DocuSeal** | PDF Quote Signing | `.env.local` → `DOCUSEAL_API_KEY` |
| **Zoho Books** | Invoicing | `.env.local` → `ZOHO_*` variables |

---

## 🖥️ Deployment

| Environment | URL | Method |
|-------------|-----|--------|
| **Oracle Cloud** | `http://141.253.116.210:3000` | Mutagen sync from local |

### Mutagen Sync Commands
```bash
# Check sync status
mutagen sync list

# Force sync
mutagen sync flush rivego

# SSH to server
ssh oracle
cd ~/Rivego
npm run dev -- --hostname 0.0.0.0
```

---

## ✅ Completed Features

- [x] Admin dashboard with white theme
- [x] Client management (CRUD, subscriptions, invoices)
- [x] Quote builder with PDF generation
- [x] DocuSeal signature integration
- [x] GoCardless SEPA mandate flow
- [x] Cancellation workflow with email preview
- [x] Task management with recurring task generation
- [x] CRON jobs for automated processing

---

## 🔧 Common Tasks

### Run locally
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

### Apply database migrations
Upload SQL files from `src/lib/db/migrations/` to Supabase SQL Editor.

---

## 📝 Quick Start for New Session

1. Clone or access the repo
2. Read this file for context
3. Check `task.md` for current progress
4. Check `walkthrough.md` for detailed implementation notes
5. Run `npm run dev` and continue where left off

---

*Last updated: January 2026*
