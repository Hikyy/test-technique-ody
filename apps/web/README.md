# @ody/web

Next.js 15 App Router · Tailwind v4 · `@ody/ui` (V11 Editorial Light + Charts).

## Dev

```bash
pnpm install
cp .env.example .env.local
pnpm --filter @ody/web dev
```

Open http://localhost:3000 — root redirects to `/login`. Authenticated shell is at `/` (Accueil).

## Stack

- Server Components by default. `"use client"` only for forms / interactive charts.
- Tokens come from `@ody/ui/styles/tokens.css` (Tailwind v4 `@theme`).
- API base: `NEXT_PUBLIC_API_URL` (wired in J2).
