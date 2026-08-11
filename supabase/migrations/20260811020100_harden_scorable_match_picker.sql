revoke execute on function public.list_scorable_player_matches(uuid) from public;
revoke execute on function public.list_scorable_player_matches(uuid) from anon;
revoke execute on function public.list_scorable_player_matches(uuid) from authenticated;
grant execute on function public.list_scorable_player_matches(uuid) to service_role;
