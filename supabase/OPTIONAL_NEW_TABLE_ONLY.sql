-- ONLY for a BRAND NEW Supabase project with no player_data table.
-- DO NOT run on the existing production database without inspecting it first.
-- The current live Blue Lock project already uses player_data.
CREATE TABLE IF NOT EXISTS public.player_data (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.player_data ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.player_data FROM anon,authenticated;
GRANT SELECT, INSERT, UPDATE ON public.player_data TO authenticated;

CREATE POLICY "player data select owned" ON public.player_data
 FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "player data insert owned" ON public.player_data
 FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "player data update owned" ON public.player_data
 FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id)
 WITH CHECK ((SELECT auth.uid()) = user_id);
-- Client-side deletion is intentionally not granted; reset overwrites only the current user's JSON.
