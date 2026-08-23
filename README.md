# 40 Days of Hardware

Personal tracker for the 40-day hardware challenge (Wed Aug 5 → Sun Sep 13, 2026).
Vite + React + TypeScript, Supabase for persistence, deployed on Vercel. Anyone can
read; only you (signed in with Google) can edit — enforced in the database.

Light/dark theme toggle lives in the top-right; the choice is remembered.

## Pages

- **Calendar** (`/`) — all 40 days colored by block, click a day for its detail page.
- **Day** (`/day/:n`) — five sections (intro, activity, question, X post, resources).
  Each has fixed content (filled in `days.ts`) and, right below it, an inline notes
  area: click the text to type, click away to render. Notes are markdown with LaTeX
  (`$…$` / `$$…$$`) and images (paste or drag-drop); they autosave per section.
- **Shopping** (`/shopping`) — editable parts table with purchased checkboxes, plus
  **Import CSV** (columns: part name, what it does, days required for, related
  concept(s), link, purchased — a header row is auto-detected).
- **Resources** (`/resources`) — a list of links.

All fixed and note content renders markdown + LaTeX + raw HTML, so `days.ts` content
can include equations, GIFs, and embedded animations/video.

Interactive HTML (e.g. a Claude artifact) can be dropped straight into any note:
paste the whole file inside a fenced block tagged `embed` and it runs in a
sandboxed, auto-sized iframe that follows the site's light/dark toggle
(`src/components/HtmlEmbed.tsx`). The claude.ai viewer preamble is stripped
automatically, so copying the full artifact source is fine.

    ```embed
    <style>…</style>
    <div>…</div>
    <script>…</script>
    ```

## Setup (~5 minutes)

1. **Supabase**: create a project at [supabase.com](https://supabase.com), open the
   SQL editor, and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
2. **Env**: `cp .env.example .env.local` and fill in the project URL + anon key
   (Dashboard → Project Settings → API).
3. **Run**: `npm install && npm run dev`.

Without the env vars the app still runs — it just shows a banner and doesn't save.

## Editing access (Google sign-in)

Editing is locked to one Google account; everyone else can only read. The rule is
enforced by Supabase row-level security, not just the UI, so the anon key in the
page can't be used to write.

1. **Set your email** in [`supabase/schema.sql`](supabase/schema.sql): change the
   address inside `is_owner()` to your Google account email, then run the file in
   the SQL editor (safe to re-run over the earlier version).
2. **Create Google OAuth credentials**: in the
   [Google Cloud Console](https://console.cloud.google.com) → APIs & Services →
   Credentials → Create OAuth client ID → *Web application*. Under **Authorized
   redirect URIs** add your Supabase callback:
   `https://YOUR-PROJECT.supabase.co/auth/v1/callback`. Copy the client ID + secret.
3. **Enable Google in Supabase**: Dashboard → Authentication → Providers → Google →
   enable, paste the client ID + secret, save.
4. **Set the app URLs**: Dashboard → Authentication → URL Configuration → set
   **Site URL** and add to **Redirect URLs** both `http://localhost:3000` (dev) and
   your Vercel URL (prod).
5. *(Optional)* add `VITE_OWNER_EMAIL=you@gmail.com` to `.env.local` so a signed-in
   non-owner doesn't even see edit controls.

Then click **Sign in** in the app, authorize with Google, and the edit controls
appear. Sign out and it's read-only again.

## Deploy to Vercel

Push to GitHub, import the repo in Vercel (framework preset: Vite), and add the
environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optionally
`VITE_OWNER_EMAIL`). `vercel.json` handles the SPA routing rewrite. After the first
deploy, add the Vercel URL to Supabase's Redirect URLs (step 4 above) so Google
sign-in works in production.

## Editing content

- **Day content** (intro / activity / question / X post / resources) lives in
  [`src/data/days.ts`](src/data/days.ts) as markdown strings — see the comment at
  the top of that file for the format. Topics, dates, and blocks are already seeded.
- **Block names/colors** live in [`src/data/blocks.ts`](src/data/blocks.ts).
- Notes, shopping items, and resources are edited in the app and stored in Supabase.
