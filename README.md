# Coraléa Private Retreat — CRM

A production-grade Hospitality Intelligence Platform built for Coraléa Private Retreat, West Coast Barbados.

---

## Stack

- **Framework**: Next.js 14 (Pages Router)
- **Backend**: Supabase (PostgreSQL + RLS)
- **Styling**: Tailwind CSS + Custom CSS (luxury obsidian/sand theme)
- **Deployment**: Vercel
- **Charts**: Recharts
- **Icons**: Lucide React

---

## Modules (17 Pages)

| Module | Path | Description |
|---|---|---|
| Dashboard | `/` | Live occupancy, revenue sparkline, today's arrivals |
| Guest Intelligence | `/guests` | Full guest profiles, VIP tiers, preferences, discretion levels |
| Guest Detail | `/guests/[id]` | Deep profile with stay history, preferences, notes |
| New Guest | `/guests/new` | Add guest profile with full preference capture |
| Reservations | `/reservations` | All bookings with status filters |
| Reservation Detail | `/reservations/[id]` | Full booking details, concierge notes |
| New Reservation | `/reservations/new` | Create booking with room selection + pricing |
| Experiences | `/experiences` | Revenue intelligence for all experience categories |
| New Experience | `/experiences/new` | Log yacht charters, spa, dining, excursions |
| Wellness | `/wellness` | Pavilion bookings and service management |
| Events | `/events` | Weddings, corporate events, private dinners |
| New Event | `/events/new` | Create private event with budget tracking |
| Hurricane Response | `/hurricane` | Crisis automation, protocol checklists, storm tracking |
| Revenue Analytics | `/revenue` | Multi-currency P&L, category breakdown, charts |
| Settings | `/settings` | Property config, currency preferences |

---

## Setup

### 1. Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste the contents of `supabase-schema.sql` → Run
3. This creates all tables, RLS policies, indexes, and sample data

### 2. Environment Variables

Create `.env.local` (for local dev) — already exists as placeholder:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Find these in: Supabase Dashboard → Project Settings → API

### 3. Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-detects Next.js

---

## Currencies Supported

| Code | Name |
|---|---|
| USD | US Dollar |
| BBD | Barbadian Dollar |
| GBP | British Pound |
| EUR | Euro |
| CAD | Canadian Dollar |
| KYD | Cayman Dollar |
| TTD | Trinidad Dollar |
| JMD | Jamaican Dollar |

---

## VIP Tiers

- **Standard** — Regular guests
- **Silver** — Returning guests (2+ stays)
- **Gold** — High-value guests ($10k+ lifetime)
- **Platinum** — Elite guests (maximum discretion available)

---

## Design System

Matches the Coraléa website exactly:
- **Void**: `#050505` — page background
- **Obsidian**: `#0a0a0a` — card backgrounds  
- **Sand**: `#c4a882` — primary accent
- **Sand Light**: `#dfc9a8` — secondary accent
- **Gold Dim**: `#8a6e3e` — decorative
- **Fonts**: Cormorant Garamond (display) + Cinzel (labels) + Raleway (body)

---

*Discreet Luxury · Caribbean Soul*
