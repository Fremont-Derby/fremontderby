-- Ensure service_role can execute the public seasons registration RPC used by GET /api/seasons.
grant execute on function public.list_public_season_registration() to service_role;

-- PostgREST may need a schema reload after grant changes in some projects:
-- NOTIFY pgrst, 'reload schema';
