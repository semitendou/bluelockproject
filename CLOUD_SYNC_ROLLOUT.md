# Blue Lock cloud-sync rollout (review before merge)

This branch removes tracked build dependencies and a previously committed environment file from the next commit, and updates .gitignore. It deliberately does **not** deploy the replacement app or modify the production Supabase database.

## Existing app

The current `src/data/storage.js` already stores player data in Supabase using `player_data` keyed by `user_id`, but it uses browser localStorage as the primary working cache and falls back to it on cloud failures. The complete rebuilt Project Ego version uses a Supabase-first save layer and has been packaged separately for integration; that replacement is **not included in this branch**.

## Preconditions

1. Restore/verify Supabase project `dgszraobdhaewaflhvni` is `ACTIVE`, and audit public.player_data RLS SELECT / INSERT / UPDATE own-row policies.
2. Ensure Vercel has `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` configured in the Vercel project before merging, since the tracked `.env.local` is removed here.
3. Revoke or rotate any secret credentials ever exposed in the public Git history. Removing tracked files does not purge Git history.
4. Merge the separate rebuilt source only after isolated preview and authenticated, real-backend sync testing. Preserve cloud records; never import old local data automatically.

This is a security and integration preparation branch, not a finished rollout.
