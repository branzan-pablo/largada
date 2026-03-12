-- ============================================================
-- Limpeza de Dados — Manter apenas races e cities
-- Reasociar todas as corridas ao usuário alvo
-- Rodar no Supabase SQL Editor (service_role)
-- ============================================================

BEGIN;

-- 1. Reasociar todas as corridas ao usuário alvo
-- (necessário ANTES de deletar profiles, pois races.created_by → profiles(id) é NO ACTION)
UPDATE races SET created_by = '0166828b-c01b-4a2a-8bea-315a2410b2e9';

-- 2. Limpar todas as tabelas dependentes de uma vez
-- (TRUNCATE individual falha quando outra tabela tem FK apontando — mesmo vazia.
--  Um único TRUNCATE com todas as tabelas resolve FKs internas automaticamente.)
TRUNCATE
  subscription_promotions,
  organizer_subscriptions,
  payment_events,
  payment_orders,
  payment_customers,
  link_clicks,
  rsvps,
  race_suggestions,
  push_subscriptions,
  strava_tokens,
  affiliate_rules
  CASCADE;

-- 3. Deletar profiles exceto o usuário alvo
-- (Todas as tabelas que referenciam profiles com NO ACTION já foram truncadas:
--  race_suggestions.reviewed_by e races.created_by já apontam só pro alvo)
DELETE FROM profiles WHERE id != '0166828b-c01b-4a2a-8bea-315a2410b2e9';

-- 4. Deletar auth.users exceto o usuário alvo
-- (profiles.id → auth.users ON DELETE CASCADE, mas profiles já foram removidos no passo 3)
DELETE FROM auth.users WHERE id != '0166828b-c01b-4a2a-8bea-315a2410b2e9';

-- 5. Resetar campos derivados nas races
UPDATE races SET rsvp_count = 0, is_promoted = false, promoted_until = NULL;

COMMIT;
