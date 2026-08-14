-- Expose lane private schemas to PostgREST after shared-staging partition.
-- public lane schemas alone are not enough: Workers send Accept-Profile: {lane}_private
-- for privileged surfaces (see src/supabaseSchema.js).
-- Staging / shared non-production only. Do not apply to production.

alter role authenticator set pgrst.db_schemas =
  'public, graphql_public, jfl, dru, gamma, jfl_private, dru_private, gamma_private';

notify pgrst, 'reload config';
notify pgrst, 'reload schema';
