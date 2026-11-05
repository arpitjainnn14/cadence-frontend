# Cadence: frontend

The web app for **Cadence**, a personal subscription tracker (formerly "Subs"). It's an installable PWA (Add to Home Screen on iPhone) with dark and light themes, built to the Claude Design mockups.

The backend lives in `../subscription_tracker` (FastAPI). Its API contract is `../subscription_tracker/docs/FRONTEND_CONTEXT.md`.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 (use --port if it's taken)
npm test           # vitest
npm run build      # type-check + production build into dist/
```

In dev, the app talks to a **mock API** running in the browser (MSW), so no backend is needed. Any email and password signs you in, except the password `wrong`, which shows the error state. The mock data resets on every reload.

To use the real backend instead:

1. Start it on port 8000 (`uvicorn app.main:app --reload --port 8000`).
2. Set `VITE_USE_MOCKS=false` in `.env.development` (or in an untracked `.env.development.local`).

Vite forwards `/api/*` to `localhost:8000`, so the browser still sees a single origin.

## How it fits together

```
src/
  api/          client.ts   fetch wrapper: cookies, CSRF header, single-flight refresh
                endpoints.ts one typed function per backend endpoint
                types.ts    TypeScript copy of the API contract
  data/         queries.ts  TanStack Query hooks (caching + refetch after changes)
  lib/          money/date formatting, billing cycles, merchant brands, card looks, web push
  components/   design pieces: CardArt, SubRow, Segmented, Donut, Sheet, Toast...
  layout/       AppShell: sidebar (≥900px) or floating dock (phone)
  screens/      Login, Home, Subscriptions, Insights, Cards, CardDetail, Settings,
                SubscriptionSheet (add/edit), AddCardSheet
  ui/           UiContext (open sheet, toast), useIsDesktop, useWidth
  mocks/        MSW handlers + in-memory fake database (dev only, not in the build)
public/
  sw.js         service worker: shows push notifications, opens the app on tap
  manifest.webmanifest, icons/  (icons come from `npm run icons`)
```

### Why some things are the way they are

- **No tokens in JavaScript.** The backend keeps login in httpOnly cookies, which an XSS bug can't read. We never use localStorage or sessionStorage for auth.
- **CSRF header.** Every POST/PUT/PATCH/DELETE copies the readable `csrf_token` cookie into `X-CSRF-Token`. Another website can make your browser send cookies, but it can't read them, so it can't forge that header.
- **Single-flight refresh.** When several requests get a 401 at once, they all wait on one `/api/auth/refresh` call. The backend rotates refresh tokens, and a second parallel refresh would look like token theft. This behaviour is tested in `src/api/client.test.ts`.
- **Same origin.** In production, `vercel.json` rewrites `/api/*` to Cloud Run, so cookies are first-party (which iOS Safari needs). Never call the Cloud Run URL directly. Before deploying, replace `CLOUD_RUN_URL` in `vercel.json`.
- **Filtering on the client.** The Subscriptions screen fetches everything once and filters and sorts in the browser. That way every tab can show its count and switching is instant.
- **No chart library.** Each donut slice is one SVG circle with a dash pattern, which is tiny and animates smoothly.
- **Push on iPhone.** Notifications only work once Cadence is installed to the Home Screen. Settings detects when it isn't and explains what to do.
- **Light / dark.** The theme is a `data-theme` attribute on `<html>`; `src/index.css` swaps every colour variable for it, so components never check the theme themselves. A tiny script in `index.html` applies it before the first paint (no flash). It follows the phone's setting until you pick one with the half-circle button on Home, the sidebar switch, or Settings.
- **The name lives in one place.** `src/brand.tsx` holds the app name, tagline and logo mark. `index.html`, `public/manifest.webmanifest` and `public/sw.js` repeat the name because they can't import code, and `npm run icons` redraws the app icon.
- **₹ and $ are never converted.** ₹ totals cover ₹ subscriptions only; $ subscriptions are totalled in $ and shown beside them ("₹2,815/mo + $30/mo"). The rule lives in `src/lib/money.ts`. Insights charts are ₹ only, with a separate "Paid in USD" list.
- **Domain.** Production is `https://cadence.arpitjain.me` (set as the Vercel project's custom domain); nothing in the code hard-codes it.
