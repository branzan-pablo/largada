-- ============================================================
-- reset.sql — Drop completo + limpeza do Auth
--
-- ATENÇÃO: Destrói TODOS os dados, incluindo logins Google/OAuth.
--          Use apenas em ambiente de teste. Nunca em produção.
--
-- Como usar (Supabase Studio → SQL Editor):
--   1. Cole e execute este script
--   2. Execute as migrations na ordem:
--      001_core_schema.sql
--      002_cities_and_geo.sql
--      003_cities_seed.sql      (pode demorar ~30s)
--      004_analytics.sql
--      005_monetization.sql
-- ============================================================


-- ──────────────────────────────────────────────────────────
-- 1. Desabilitar triggers e FK checks temporariamente
--    Permite deletar auth.users sem conflito de dependências
-- ──────────────────────────────────────────────────────────
SET session_replication_role = replica;


-- ──────────────────────────────────────────────────────────
-- 2. Limpar Auth (Google OAuth, email/senha, sessões ativas)
-- ──────────────────────────────────────────────────────────
DELETE FROM auth.audit_log_entries;
DELETE FROM auth.flow_state;
DELETE FROM auth.mfa_amr_claims;
DELETE FROM auth.mfa_challenges;
DELETE FROM auth.mfa_factors;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.saml_providers;
DELETE FROM auth.saml_relay_states;
DELETE FROM auth.sessions;
DELETE FROM auth.sso_domains;
DELETE FROM auth.sso_providers;
DELETE FROM auth.identities;
DELETE FROM auth.users;


-- ──────────────────────────────────────────────────────────
-- 3. Restaurar FK checks
-- ──────────────────────────────────────────────────────────
SET session_replication_role = DEFAULT;


-- ──────────────────────────────────────────────────────────
-- 4. Drop de tabelas (ordem: dependentes primeiro)
-- ──────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.payment_events      CASCADE;
DROP TABLE IF EXISTS public.payment_orders      CASCADE;
DROP TABLE IF EXISTS public.payment_customers   CASCADE;
DROP TABLE IF EXISTS public.link_clicks         CASCADE;
DROP TABLE IF EXISTS public.affiliate_rules     CASCADE;
DROP TABLE IF EXISTS public.push_subscriptions  CASCADE;
DROP TABLE IF EXISTS public.rsvps               CASCADE;
DROP TABLE IF EXISTS public.race_suggestions    CASCADE;
DROP TABLE IF EXISTS public.races               CASCADE;
DROP TABLE IF EXISTS public.profiles            CASCADE;
DROP TABLE IF EXISTS public.cities              CASCADE;


-- ──────────────────────────────────────────────────────────
-- 5. Drop de funções
-- ──────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.handle_new_user()                      CASCADE;
DROP FUNCTION IF EXISTS public.update_rsvp_count()                    CASCADE;
DROP FUNCTION IF EXISTS public.update_payment_updated_at()            CASCADE;
DROP FUNCTION IF EXISTS public.get_race_notification_recipients(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.search_cities(TEXT, INT)               CASCADE;
DROP FUNCTION IF EXISTS public.get_random_cities(INT)                 CASCADE;


-- ──────────────────────────────────────────────────────────
-- 6. Drop de tipos / ENUMs
-- ──────────────────────────────────────────────────────────
DROP TYPE IF EXISTS public.payment_method    CASCADE;
DROP TYPE IF EXISTS public.billing_frequency CASCADE;
DROP TYPE IF EXISTS public.payment_status    CASCADE;
DROP TYPE IF EXISTS public.order_type        CASCADE;


-- ──────────────────────────────────────────────────────────
-- 7. Limpar histórico de migrations
--    Permite re-aplicar todas as migrations do zero
-- ──────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'supabase_migrations'
      AND table_name = 'schema_migrations'
  ) THEN
    DELETE FROM supabase_migrations.schema_migrations;
  END IF;
END $$;


-- ──────────────────────────────────────────────────────────
-- 8. Recarregar schema cache
-- ──────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
