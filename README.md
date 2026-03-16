# Gold Tracker

A full-stack web application that tracks live gold spot prices (XAU/USD) with a real-time 24-hour chart, automatic hourly data collection, and email alerts when the price moves more than 1% in an hour.

**Stack:** Next.js 16 · Tailwind CSS · Supabase (PostgreSQL) · Recharts · Resend · Vercel (hosting + Cron)

---

## Features

- **Live gold price chart** — 24-hour line chart that auto-refreshes every 5 minutes
- **Current price display** — prominently shown with % change vs the previous hour
- **Hourly data collection** — Vercel Cron fetches gold prices from MetalpriceAPI every hour
- **Email alerts** — subscribers receive an email when price moves ±1% within an hour
- **Opt-in / opt-out** — users can subscribe or unsubscribe without creating an account
- **Minimalist design** — Zara-inspired clean UI, fully responsive for mobile
- **Secure** — API keys stored as environment variables, cron endpoint protected by a shared secret

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── cron/fetch-gold-price/route.ts   # Vercel Cron – fetches & stores price, sends alerts
│   │   ├── prices/route.ts                  # GET last 24h prices for the chart
│   │   └── alerts/subscribe/route.ts        # POST subscribe / DELETE unsubscribe
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                             # Main dashboard
├── components/
│   ├── GoldPriceChart.tsx                   # Recharts line chart + price display
│   └── AlertSignup.tsx                      # Email opt-in form
└── lib/
    ├── supabase.ts                          # Supabase client (anon + service role)
    └── resend.ts                            # Email template + send helper
supabase/
└── migrations/
    └── 001_initial.sql                      # Database schema
vercel.json                                  # Cron schedule (every hour)
```

---

## Setup Instructions

### 1. Clone & install

```bash
git clone https://github.com/<your-username>/funproject
cd funproject
npm install
```

### 2. Supabase

The Supabase project is already provisioned at `https://zbojyyhaqaqlftyizuli.supabase.co`. The project URL and publishable key are pre-filled in `.env.local.example`.

1. Go to the [Supabase Dashboard](https://supabase.com) → **SQL Editor** and run the contents of `supabase/migrations/001_initial.sql` to set up the schema (first-time only).
2. Copy your **Service Role** key from **Settings → API** and set it as `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

> **Using only the Anon key?**  
> If you don't have a Service Role key, you can use the Anon (Publishable) key for `SUPABASE_SERVICE_ROLE_KEY` as well.  
> The migration already includes RLS policies that allow the anon role to insert and update data.

### 3. MetalpriceAPI

1. Sign up at [metalpriceapi.com](https://metalpriceapi.com) (free tier: 100 requests/month).
2. Copy your API key from the dashboard.

### 4. Resend (email alerts)

1. Sign up at [resend.com](https://resend.com).
2. Create an API key from the dashboard.
3. Set `RESEND_FROM_EMAIL` to a sender address on your verified domain (e.g. `alerts@yourdomain.com`).

> **Testing without a verified domain?**  
> Use `onboarding@resend.dev` as `RESEND_FROM_EMAIL` — Resend allows this for development/testing.

### 5. Environment variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key (safe for client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (secret) key — use anon key if not available |
| `METAL_PRICE_API_KEY` | MetalpriceAPI key |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Sender email (verified Resend domain, or `onboarding@resend.dev` for testing) |
| `CRON_SECRET` | Random secret to protect the cron endpoint |

Generate a cron secret:
```bash
openssl rand -hex 32
```

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** To populate the chart locally, manually seed the database with test data or call the cron endpoint with your secret:
> ```bash
> curl -X GET http://localhost:3000/api/cron/fetch-gold-price \
>   -H "Authorization: Bearer YOUR_CRON_SECRET"
> ```

### 7. Deploy to Vercel

1. Push to GitHub and import the repository in [vercel.com/new](https://vercel.com/new).
2. Add all environment variables (same as `.env.local`) in **Project Settings → Environment Variables**.
3. Also add `CRON_SECRET` there — Vercel will automatically inject it as the `Authorization` header for cron jobs.
4. Deploy. The `vercel.json` configures the cron job to run at the top of every hour.

---

## How It Works

### Data flow

```
Vercel Cron (every hour)
  → GET /api/cron/fetch-gold-price
      → MetalpriceAPI (fetch XAU/USD spot)
      → Supabase (insert price row)
      → Check if |Δ%| ≥ 1%
          → Resend (email all opted-in subscribers)

Browser (every 5 min)
  → GET /api/prices
      → Supabase (last 24h prices)
      → Recharts line chart rendered client-side
```

### Security

- `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` are **never exposed to the browser** — used only in server-side route handlers.
- The cron endpoint requires `Authorization: Bearer <CRON_SECRET>` and returns 401 otherwise.
- Supabase Row-Level Security is enabled. Anonymous users can read `gold_prices` and the app's server-side routes can insert/update using the configured key.

---

## License

MIT
