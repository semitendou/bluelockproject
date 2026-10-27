-- READ ONLY. Run in Supabase SQL Editor for the existing project before deploying publicly.
-- Never share SQL Editor output containing email addresses or private user records.
-- All checks must show row-level security enabled and no anon read/write policies.
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname='public' AND c.relname='player_data';

SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname='public' AND tablename='player_data'
ORDER BY policyname;

SELECT column_name,data_type,is_nullable FROM information_schema.columns
WHERE table_schema='public' AND table_name='player_data' ORDER BY ordinal_position;

SELECT grantee,privilege_type FROM information_schema.role_table_grants
WHERE table_schema='public' AND table_name='player_data'
 AND grantee IN ('anon','authenticated') ORDER BY grantee,privilege_type;

SELECT indexname,indexdef FROM pg_indexes
WHERE schemaname='public' AND tablename='player_data';
