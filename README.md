# GoFlazz — Phase 1 (Next.js, UI Only)

Self-custodial crypto wallet on Arbitrum One. Crypto should be as easy as using GoPay.

This is **Phase 1 of 5**: UI only, no blockchain connection. All balances, assets,
and activity are simulated data in `src/data/mock.ts`. Send/Receive/Pay are wired
as real pages/navigation but the actions themselves are stubbed.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Framer Motion, Lucide icons
- Recharts 3.x (balance sparkline)
- `@supabase/supabase-js` (client is created lazily and stays unused until
  Phase 2 — safe to build/deploy with no env vars set)

## Getting started

```bash
npm install
cp .env.local.example .env.local   # optional for Phase 1, needed from Phase 2 on
npm run dev
```

Open http://localhost:3000.

## Project structure

```
src/
  app/
    layout.tsx          root layout, fonts, bottom nav
    page.tsx             home (balance, quick actions, assets, recent activity)
    activity/page.tsx     full activity list with filters
    send/page.tsx          Send stub
    receive/page.tsx       Receive stub (simulated address + copy)
    pay/page.tsx            Pay stub
    settings/page.tsx      placeholder
  components/
    layout/               Logo, TopBar, BottomNav, ActionPageHeader
    home/                  BalanceCard, QuickActions, AssetList
    activity/              ActivityRow
  lib/                    utils.ts, supabaseClient.ts (lazy, safe with no env)
  data/mock.ts             all simulated Phase 1 data
  types/index.ts           shared, fully-typed interfaces
```

## Notes on the "absolute requirements"

- Every `useState` call is generically typed (`useState<string>`, `useState<FilterId>`, etc.) —
  none are left to infer from an empty array/object literal.
- Env vars are read via `process.env.NEXT_PUBLIC_*`; see `.env.local.example`.
- `src/lib/supabaseClient.ts` returns `null` instead of throwing when env vars are
  unset, so a Vercel deploy without Supabase configured still builds and runs.
- Recharts is pinned to `^3.0.0`.
- `next.config.js` is the default Next.js config — no custom webpack/output settings.
- `node_modules` is git-ignored; it is not included in this ZIP.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel — framework preset "Next.js" is auto-detected.
3. No environment variables are required to build Phase 1. If you want the
   Supabase client ready for Phase 2, add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` under Project Settings → Environment Variables.
4. Deploy — build command `next build`, output is handled automatically by the
   Next.js Vercel adapter (no custom output directory needed).

## What's next (Phase 2+)

- Real wallet creation/import + encrypted key storage
- Supabase auth + persisted wallets/settings
- On-chain balance reads on Arbitrum One
- Functional Send/Receive/Pay with real transaction signing
