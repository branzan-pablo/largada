-- ============================================================
-- seed-equilibrio.sql
-- 5 corridas reais extraídas de equilibrio.esp.br
-- Todas organizadas pela Equilíbrio Esportes (interior de SP)
--
-- Uso: Execute no Supabase Studio (SQL Editor)
-- Idempotente: usa ON CONFLICT (slug) DO NOTHING
-- ============================================================

INSERT INTO public.races (
  name, slug, date, start_time,
  city, state, address, latitude, longitude,
  city_id,
  distances, registration_price, registration_link, registration_deadline,
  prize_type, prize_details,
  image_url, route_description, organizer, description,
  status, rsvp_count, is_promoted, promoted_until, origin, link,
  created_by
) VALUES

-- 1 ── 29ª Corrida Pedestre Cidade de Lourdes-SP · 7.5km · 07/03/2026
(
  '29ª Corrida Pedestre Cidade de Lourdes-SP 2026',
  '29a-corrida-pedestre-cidade-de-lourdes-sp-2026',
  '2026-03-07', '17:00',
  'Lourdes', 'SP',
  'Rodovia vicinal da cidade de Lourdes-SP',
  -20.9653, -50.2250,
  (SELECT id FROM public.cities WHERE LOWER(name) = 'lourdes' AND state_code = 'SP' LIMIT 1),
  ARRAY['7.5km'],
  'R$30 (inscrição única) — moradores de Lourdes: gratuito',
  'https://www.sympla.com.br/evento/29-corrida-pedestre-cidade-de-lourdes-sp/3301163',
  '2026-03-07',
  'both',
  'Geral Masc/Fem: 1º Troféu+R$600, 2º Troféu+R$500, 3º Troféu+R$400, 4º Troféu+R$350, 5º Troféu+R$300. Cidade Masc/Fem: 1º Troféu+R$500 até 5º Troféu+R$250. Troféu por faixa etária.',
  NULL, -- image_url
  'Percurso de 7,5km pela rodovia vicinal da cidade de Lourdes. Largada às 17h.',
  'Equilíbrio Esportes',
  'Iniciativa de caráter eminentemente esportivo e social, voltada para o público praticante de corrida de rua, com objetivo de através da prática esportiva encontrar melhor qualidade de vida. Promoção da Prefeitura Municipal de Lourdes, com cronometragem da Equilíbrio Esportes. Inscrições limitadas a 250 participantes — medalha para os 250 primeiros inscritos.',
  'confirmed', 0, false, NULL, 'admin',
  'https://equilibrio.esp.br/29a-corrida-pedestre-cidade-de-lourdes-sp-2026/',
  (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)
),

-- 2 ── 11ª Edição RUN AVOA · Votuporanga-SP · 6km · 15/03/2026
(
  '11ª Edição RUN AVOA – Votuporanga-SP',
  '11a-edicao-run-avoa-votuporanga-sp',
  '2026-03-15', '07:00',
  'Votuporanga', 'SP',
  'Parque da Cultura de Votuporanga-SP',
  -20.4221, -49.9725,
  (SELECT id FROM public.cities WHERE LOWER(name) = 'votuporanga' AND state_code = 'SP' LIMIT 1),
  ARRAY['6km'],
  '1º Lote: R$75 (geral) / R$35 (60+ anos) | 2º Lote: R$85 | 3º Lote: R$110',
  'https://www.sympla.com.br/evento/11-ediCAo--run-avoa---votuporangasp/3262889',
  '2026-03-10',
  'both',
  'Geral Masc/Fem: 1º R$700+Troféu, 2º R$400+Troféu, 3º R$300+Troféu, 4º R$200+Troféu, 5º R$100+Troféu. Cinco maiores equipes: troféu. Troféu por faixa etária e PCD.',
  'https://equilibrio.esp.br/wp-content/uploads/2025/12/11a-EDICAO-RUN-AVOA-VOTUPORANGA-SP.webp', -- image_url
  'Percurso de 6km com largada e chegada no Parque da Cultura de Votuporanga. Largada às 07h.',
  'Equilíbrio Esportes',
  'Realização da Associação Votuporanguense de Atletismo (AVOA) com apoio da Prefeitura Municipal de Votuporanga. Comemora o aniversário da AVOA, promovendo o atletismo no município e região. Kit inclui camiseta alusiva, chip eletrônico, medalha finisher, isotônicos, frutas e água. Máximo 800 participantes.',
  'confirmed', 0, false, NULL, 'admin',
  'https://equilibrio.esp.br/11a-edicao-run-avoa-votuporanga-sp/',
  (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)
),

-- 3 ── 1ª Corrida ZRUN Night Run · Fernandópolis-SP · 5km · 04/04/2026
(
  '1ª Corrida ZRUN Night Run – Fernandópolis-SP',
  '1a-corrida-zrun-night-run-fernandopolis-sp',
  '2026-04-04', '18:20',
  'Fernandópolis', 'SP',
  'New House - R. dos Arnaldos, 3782, Parque Universitário, Fernandópolis-SP',
  -20.2839, -50.2456,
  (SELECT id FROM public.cities WHERE LOWER(name) = 'fernandópolis' AND state_code = 'SP' LIMIT 1),
  ARRAY['5km'],
  'Lote Único: R$85 (geral) / R$45 (PCD e 60+ anos)',
  'https://equilibrio.esp.br/1a-corrida-zrun-night-run-fernandopolis-s/',
  '2026-03-31',
  'trophy',
  'Troféu para os 5 primeiros overall (geral e cidade), por faixa etária e PCD. Cinco maiores equipes: troféu.',
  NULL, -- image_url
  'Percurso de 5km com largada e chegada na New House. Corrida noturna com largada às 18h20. Pulseira neon inclusa no kit.',
  'Equilíbrio Esportes',
  'Realização da Time Run Assessoria e Amigos, com apoio da Prefeitura Municipal de Fernandópolis. Corrida noturna com objetivo de promover o atletismo no município e região. Kit inclui camiseta, chip eletrônico, medalha finisher, meia de poliamida (100 primeiros), cerveja Michelob (200 primeiros), barra de proteína e pulseira neon. Máximo 500 participantes.',
  'confirmed', 0, false, NULL, 'admin',
  'https://equilibrio.esp.br/1a-corrida-zrun-night-run-fernandopolis-s/',
  (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)
),

-- 4 ── 14ª Corrida De Santo Atanásio · Macaubal-SP · 6km · 26/04/2026
(
  '14ª Corrida De Santo Atanásio – Macaubal-SP',
  '14a-corrida-de-santo-atanasio-macaubal-sp',
  '2026-04-26', '07:00',
  'Macaubal', 'SP',
  'Praça da Matriz, Macaubal-SP',
  -20.7453, -49.9688,
  (SELECT id FROM public.cities WHERE LOWER(name) = 'macaubal' AND state_code = 'SP' LIMIT 1),
  ARRAY['6km'],
  '1º Lote: R$70 | 2º Lote: R$85 | 3º Lote: R$100',
  'https://www.sympla.com.br/evento/14-corrida-de-santo-atanAsio---macaubal-sp/3266091',
  '2026-04-26',
  'both',
  'Geral Masc/Fem: 1º ao 5º Dinheiro+Troféu. Cidade Masc/Fem: 1º ao 5º Dinheiro+Troféu, 6º ao 10º Troféu. PNE: troféu 1º ao 3º. Troféu por faixa etária.',
  NULL, -- image_url
  'Percurso de 6km com largada e chegada na Praça da Matriz de Macaubal. Largada às 07h.',
  'Equilíbrio Esportes',
  'Realização da Prefeitura Municipal de Macaubal, Câmara Municipal, Secretarias Municipais e Polícia Militar. Promove o atletismo no município e região, favorecendo a descoberta de novos valores. Kit inclui camiseta alusiva, número de peito, chip eletrônico, medalha, frutas, pipoca, paçoca e água à vontade.',
  'confirmed', 0, false, NULL, 'admin',
  'https://equilibrio.esp.br/14a-corrida-de-santo-atanasio-macaubal-sp/',
  (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)
),

-- 5 ── 1ª Corrida Pedestre Prospere Run · Valentim Gentil-SP · 5km · 17/05/2026
(
  '1ª Corrida Pedestre Prospere Run – Valentim Gentil-SP',
  '1a-corrida-pedestre-prospere-run-valentim-gentil-sp',
  '2026-05-17', '07:00',
  'Valentim Gentil', 'SP',
  'Av. da Chopplandia, Valentim Gentil-SP',
  -20.4225, -50.0883,
  (SELECT id FROM public.cities WHERE LOWER(name) = 'valentim gentil' AND state_code = 'SP' LIMIT 1),
  ARRAY['5km'],
  '1º Lote: R$65 (geral) / R$35 (60+ anos) | 2º Lote: R$80 | 3º Lote: R$100',
  'https://www.sympla.com.br/evento/1-corrida-pedestre-prospere-run---valentim-gentil-sp/3295357',
  '2026-05-10',
  'both',
  'Os 5 primeiros Overall masc/fem recebem dinheiro + troféu. Troféu por faixa etária e PCD. Cinco maiores equipes: troféu. Sorteio de brindes na cerimônia.',
  NULL, -- image_url
  'Percurso asfáltico de 5km com largada na Av. da Chopplandia. Largada às 07h. Duração máxima: 1h30min.',
  'Equilíbrio Esportes',
  'A 1ª corrida de rua de Valentim Gentil. Kit inclui camiseta de alta qualidade, chip eletrônico, medalha finisher, sacochila e brindes da organização. Máximo 500 participantes. Frutas e água à vontade no pós-prova.',
  'confirmed', 0, false, NULL, 'admin',
  'https://equilibrio.esp.br/1a-corrida-pedestre-prospere-run-valentim-gentil-sp/',
  (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)
)

ON CONFLICT (slug) DO NOTHING;
