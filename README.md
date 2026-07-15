# 50 Days of Hardware

Personal tracker for the 50-day hardware challenge (Mon Jul 20 → Mon Sep 7, 2026).
Vite + React + TypeScript, Supabase for persistence, deployed on Vercel. No auth —
single user.

## Pages

- **Calendar** (`/`) — all 50 days colored by block, click a day for its detail page.
- **Day** (`/day/:n`) — topic, the five content sections, and a markdown notes editor
  (autosaves; paste or drag-drop images to upload them).
- **Shopping** (`/shopping`) — editable parts table with purchased checkboxes.
- **Resources** (`/resources`) — a list of links.

## Setup (~5 minutes)

1. **Supabase**: create a project at [supabase.com](https://supabase.com), open the
   SQL editor, and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
2. **Env**: `cp .env.example .env.local` and fill in the project URL + anon key
   (Dashboard → Project Settings → API).
3. **Run**: `npm install && npm run dev`.

Without the env vars the app still runs — it just shows a banner and doesn't save.

## Deploy to Vercel

Push to GitHub, import the repo in Vercel (framework preset: Vite), and add the two
environment variables. `vercel.json` handles the SPA routing rewrite.

## Editing content

- **Day content** (intro / activity / question / X post / resources) lives in
  [`src/data/days.ts`](src/data/days.ts) as markdown strings — see the comment at
  the top of that file for the format. Topics, dates, and blocks are already seeded.
- **Block names/colors** live in [`src/data/blocks.ts`](src/data/blocks.ts).
- Notes, shopping items, and resources are edited in the app and stored in Supabase.
