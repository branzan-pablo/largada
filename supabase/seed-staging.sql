-- ============================================================
-- Seed de staging
-- Cole este arquivo no SQL Editor do projeto Supabase staging
-- DEPOIS de rodar todas as migrações 001..018.
--
-- O que faz:
--   - Cria 5 corridas de exemplo no Noroeste Paulista
--   - Gera ~80 page views e ~20 cliques distribuídos nos últimos 30 dias
--     para popular o dashboard de analytics
--
-- O que NÃO faz:
--   - Não cria usuários (o Supabase Auth gerencia isso)
--   - Não vincula corridas a um owner específico (created_by = NULL).
--     Para "reclamar" as corridas como suas após login, rode o snippet
--     no final deste arquivo.
-- ============================================================

-- Limpar seed anterior (idempotente)
DELETE FROM public.race_views WHERE race_id IN (
  SELECT id FROM public.races WHERE slug LIKE 'staging-%'
);
DELETE FROM public.link_clicks WHERE race_id IN (
  SELECT id FROM public.races WHERE slug LIKE 'staging-%'
);
DELETE FROM public.races WHERE slug LIKE 'staging-%';


-- ──────────────────────────────────────────────────────────
-- 1. Corridas de exemplo
-- ──────────────────────────────────────────────────────────
INSERT INTO public.races (
  name, slug, date, start_time, city, state, address,
  latitude, longitude, distances, registration_price,
  registration_link, registration_deadline, prize_type,
  prize_details, organizer, description,
  status, origin, is_promoted, rsvp_count
) VALUES
  ('Maratona de Rio Preto 2026 (staging)', 'staging-maratona-rio-preto',
   CURRENT_DATE + INTERVAL '45 days', '06:00',
   'São José do Rio Preto', 'SP', 'Represa Municipal',
   -20.8113, -49.3758, ARRAY['42km','21km','10km','5km'], 'R$ 189,00',
   'https://example.com/inscricao-1', CURRENT_DATE + INTERVAL '30 days', 'money',
   'Premiação top-5 de cada categoria', 'Noroeste Running',
   'Corrida de exemplo para staging.',
   'confirmed', 'admin', true, 42),

  ('Corrida do Trabalhador (staging)', 'staging-trabalhador-aracatuba',
   CURRENT_DATE + INTERVAL '20 days', '07:00',
   'Araçatuba', 'SP', 'Praça Rui Barbosa',
   -21.2089, -50.4328, ARRAY['10km','5km'], 'R$ 89,00',
   'https://example.com/inscricao-2', CURRENT_DATE + INTERVAL '10 days', 'trophy',
   'Troféus top-3', 'Araçatuba Runners',
   'Corrida de exemplo para staging.',
   'confirmed', 'admin', false, 18),

  ('Night Run Catanduva (staging)', 'staging-night-run-catanduva',
   CURRENT_DATE + INTERVAL '60 days', '19:00',
   'Catanduva', 'SP', 'Parque do Samambaia',
   -21.1389, -48.9726, ARRAY['10km','5km'], 'R$ 75,00',
   'https://example.com/inscricao-3', CURRENT_DATE + INTERVAL '50 days', 'none',
   NULL, 'Catanduva Night Runners',
   'Corrida de exemplo para staging.',
   'confirmed', 'admin', false, 22),

  ('Meia Maratona Votuporanga (staging)', 'staging-meia-votuporanga',
   CURRENT_DATE + INTERVAL '90 days', '06:00',
   'Votuporanga', 'SP', 'Parque da Cultura',
   -20.4218, -49.9725, ARRAY['21km','10km'], 'R$ 120,00',
   'https://example.com/inscricao-4', CURRENT_DATE + INTERVAL '80 days', 'money',
   'R$ 2.000 1º lugar', 'Votu Running Club',
   'Corrida de exemplo para staging.',
   'confirmed', 'admin', true, 25),

  ('5K Solidária (staging)', 'staging-5k-solidaria-birigui',
   CURRENT_DATE + INTERVAL '15 days', '08:00',
   'Birigui', 'SP', 'Praça da Matriz',
   -21.2883, -50.34, ARRAY['5km'], 'R$ 50,00',
   'https://example.com/inscricao-5', CURRENT_DATE + INTERVAL '7 days', 'trophy',
   'Troféu participação', 'Birigui Solidária',
   'Corrida de exemplo para staging.',
   'confirmed', 'admin', false, 8);


-- ──────────────────────────────────────────────────────────
-- 2. Page views — distribuídos em 30 dias, com pico próximo ao deadline
-- ──────────────────────────────────────────────────────────
INSERT INTO public.race_views (race_id, viewed_at)
SELECT
  r.id,
  now() - (random() * interval '30 days')
FROM public.races r,
     generate_series(1, CASE
       WHEN r.is_promoted THEN 25 -- promovidas: mais views
       ELSE 12
     END) AS gs
WHERE r.slug LIKE 'staging-%';


-- ──────────────────────────────────────────────────────────
-- 3. Cliques — ~25% das views viram clique (CTR realista)
-- ──────────────────────────────────────────────────────────
INSERT INTO public.link_clicks (race_id, clicked_at)
SELECT
  r.id,
  now() - (random() * interval '30 days')
FROM public.races r,
     generate_series(1, CASE
       WHEN r.is_promoted THEN 7
       ELSE 3
     END) AS gs
WHERE r.slug LIKE 'staging-%';


-- ──────────────────────────────────────────────────────────
-- Verificação rápida
-- ──────────────────────────────────────────────────────────
SELECT
  r.name,
  r.is_promoted,
  COUNT(DISTINCT v.id) AS views,
  COUNT(DISTINCT c.id) AS clicks,
  ROUND(COUNT(DISTINCT c.id)::numeric / NULLIF(COUNT(DISTINCT v.id), 0) * 100, 1) AS ctr_pct
FROM public.races r
LEFT JOIN public.race_views v  ON v.race_id = r.id
LEFT JOIN public.link_clicks c ON c.race_id = r.id
WHERE r.slug LIKE 'staging-%'
GROUP BY r.id, r.name, r.is_promoted
ORDER BY views DESC;


-- ──────────────────────────────────────────────────────────
-- (opcional) Reclamar as corridas como dono — rode APÓS login no staging
-- ──────────────────────────────────────────────────────────
-- UPDATE public.races
-- SET created_by = (
--   SELECT id FROM auth.users WHERE email = 'lucas.cabral@adaptedtech.com.br'
-- )
-- WHERE slug LIKE 'staging-%';
