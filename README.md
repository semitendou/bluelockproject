# Project Ego — Cloud Edition

A cloud-connected productivity app, built with plain JavaScript and Supabase.

- Frontend entry: `index.html`, `app.js`, `styles.css`
- State model: `model.mjs`; Supabase adapter: `cloud-store.mjs`
- Build: `npm run build` (writes `dist/`)
- Tests and build: `npm run check`
- Local server: `npm start`, then http://localhost:4173/
- Production: https://bluelockproject.vercel.app/

## Player progress

Data is stored in the existing Supabase `public.player_data` table and secured with per-user row-level security. Supabase Auth sessions may be stored in the browser. Progress is not written to browser localStorage by the cloud build. When a save fails, use Settings > Retry Save before closing the tab. Old browser data can be imported manually under Settings > Check Local Data; do not reset existing cloud progress without exporting it first.

## Deployment

This repository is linked to Vercel. The `main` branch deploys to production. Vercel builds using `npm run build` and serves `dist/`, as specified in `vercel.json`.

Do not commit secret keys. The publishable Supabase client key in `app.js` is intentionally public; RLS protects player data. For security, the older repository's historical `.env.local` contents should be reviewed and any leaked secrets rotated. Removing the file from the latest commit does **not** rewrite Git history.
