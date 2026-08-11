-- A full unique constraint lets ON CONFLICT infer the idempotency key while
-- PostgreSQL still permits multiple NULL client ids.
drop index if exists public.league_chat_messages_author_client_idx;

alter table public.league_chat_messages
  add constraint league_chat_messages_author_client_key
  unique (author_player_id, client_message_id);
