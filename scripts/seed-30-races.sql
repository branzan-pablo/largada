-- 30 corridas mock para inserir no Supabase
-- Cidades da região de São José do Rio Preto e Araçatuba - SP
-- Todas com status "confirmed", origin "admin", is_promoted = false
-- created_by vinculado ao user 5c917d11-1fb3-4f71-a4ad-3030bcd92bef

INSERT INTO races (
  name, slug, date, start_time, city, state, address,
  latitude, longitude, distances, registration_price,
  registration_link, registration_deadline, prize_type,
  prize_details, image_url, organizer, description,
  status, origin, is_promoted, rsvp_count, created_by
) VALUES

-- 1 — São José do Rio Preto
('Maratona de Rio Preto 2026', 'maratona-de-rio-preto-2026', '2026-03-15', '06:00',
 'São José do Rio Preto', 'SP', 'Represa Municipal - Av. Dario Giometti',
 -20.8113, -49.3758, ARRAY['42km', '21km', '10km', '5km'], 'R$ 189,00',
 'https://example.com/maratona-rio-preto', '2026-03-10', 'money',
 'Premiação em dinheiro para os 5 primeiros de cada categoria', NULL,
 'Noroeste Running', 'A maior maratona do noroeste paulista! Percorra as avenidas de Rio Preto.',
 'confirmed', 'admin', false, 42, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 2 — Araçatuba
('Corrida do Trabalhador Araçatuba', 'corrida-do-trabalhador-aracatuba', '2026-03-22', '07:00',
 'Araçatuba', 'SP', 'Praça Rui Barbosa - Centro',
 -21.2089, -50.4328, ARRAY['10km', '5km'], 'R$ 89,00',
 'https://example.com/corrida-trabalhador-aracatuba', '2026-03-18', 'trophy',
 'Troféus para os 3 primeiros', NULL,
 'Araçatuba Runners', 'Corrida pelo centro histórico de Araçatuba.',
 'confirmed', 'admin', false, 18, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 3 — Catanduva
('Night Run Catanduva', 'night-run-catanduva', '2026-04-05', '19:00',
 'Catanduva', 'SP', 'Parque do Samambaia',
 -21.1389, -48.9726, ARRAY['10km', '5km'], 'R$ 75,00',
 'https://example.com/night-run-catanduva', '2026-03-30', 'none',
 NULL, NULL,
 'Catanduva Night Runners', 'Corrida noturna pelo Parque do Samambaia. Kit com camiseta e LED.',
 'confirmed', 'admin', false, 22, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 4 — Votuporanga
('Meia Maratona de Votuporanga', 'meia-maratona-votuporanga', '2026-04-12', '06:00',
 'Votuporanga', 'SP', 'Parque da Cultura - Centro',
 -20.4218, -49.9725, ARRAY['21km', '10km'], 'R$ 120,00',
 'https://example.com/meia-votuporanga', '2026-04-05', 'money',
 'R$ 2.000 para o 1º lugar masculino e feminino', NULL,
 'Votu Running Club', 'Corra pelas ruas arborizadas de Votuporanga!',
 'confirmed', 'admin', false, 25, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 5 — Birigui
('Corrida do Calçado Birigui', 'corrida-do-calcado-birigui', '2026-04-18', '07:00',
 'Birigui', 'SP', 'Praça Três Poderes - Centro',
 -21.2886, -50.3401, ARRAY['10km', '5km', '3km'], 'R$ 65,00',
 'https://example.com/corrida-calcado-birigui', '2026-04-15', 'trophy',
 'Troféus para os 3 primeiros de cada faixa etária', NULL,
 'Birigui Runners', 'A capital do calçado infantil recebe sua corrida anual!',
 'confirmed', 'admin', false, 15, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 6 — São José do Rio Preto
('Color Run Rio Preto', 'color-run-rio-preto', '2026-04-26', '08:00',
 'São José do Rio Preto', 'SP', 'Bosque Municipal - Rua Voluntários de São Paulo',
 -20.8025, -49.3796, ARRAY['5km'], 'R$ 99,00',
 'https://example.com/color-run-rio-preto', '2026-04-22', 'none',
 NULL, NULL,
 'Color Run Interior', 'A corrida mais divertida do interior! Banho de tinta a cada km.',
 'confirmed', 'admin', false, 65, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 7 — Fernandópolis
('Desafio Fernandópolis', 'desafio-fernandopolis', '2026-05-03', '06:30',
 'Fernandópolis', 'SP', 'Parque Municipal de Exposições',
 -20.2839, -50.2461, ARRAY['15km', '10km', '5km'], 'R$ 85,00',
 'https://example.com/desafio-fernandopolis', '2026-04-28', 'both',
 'Troféus + R$ 500 para os 3 primeiros', NULL,
 'Fernandópolis Running', 'Corrida pelas estradas rurais de Fernandópolis.',
 'confirmed', 'admin', false, 12, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 8 — Penápolis
('Corrida do Amendoim Penápolis', 'corrida-do-amendoim-penapolis', '2026-05-10', '07:00',
 'Penápolis', 'SP', 'Av. Bento de Abreu - Centro',
 -21.4183, -50.0770, ARRAY['10km', '5km'], 'R$ 70,00',
 'https://example.com/corrida-amendoim-penapolis', '2026-05-05', 'trophy',
 'Troféus artesanais para os 5 primeiros', NULL,
 'Penápolis Runners', 'A capital do amendoim recebe corredores de toda a região!',
 'confirmed', 'admin', false, 14, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 9 — São José do Rio Preto
('Corrida da Represa Rio Preto', 'corrida-da-represa-rio-preto', '2026-05-17', '06:00',
 'São José do Rio Preto', 'SP', 'Represa Municipal - Pista de Cooper',
 -20.8150, -49.3800, ARRAY['21km', '10km', '5km'], 'R$ 110,00',
 'https://example.com/corrida-represa-rp', '2026-05-10', 'money',
 'Premiação total de R$ 5.000', NULL,
 'Noroeste Running', 'Corra ao redor da represa mais bonita do interior paulista.',
 'confirmed', 'admin', false, 38, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 10 — Olímpia
('Corrida das Termas Olímpia', 'corrida-das-termas-olimpia', '2026-05-24', '06:30',
 'Olímpia', 'SP', 'Av. Brasil - Centro',
 -20.7369, -48.9114, ARRAY['10km', '5km'], 'R$ 80,00',
 'https://example.com/corrida-termas-olimpia', '2026-05-20', 'trophy',
 'Troféus + ingresso para as termas', NULL,
 'Olímpia Running', 'Corrida na capital das águas quentes! Ingresso para termas incluso no kit.',
 'confirmed', 'admin', false, 33, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 11 — Araçatuba
('Meia Maratona de Araçatuba', 'meia-maratona-aracatuba', '2026-05-31', '06:00',
 'Araçatuba', 'SP', 'Parque dos Castores - Av. dos Araçás',
 -21.1965, -50.4512, ARRAY['21km', '10km'], 'R$ 130,00',
 'https://example.com/meia-aracatuba', '2026-05-25', 'money',
 'R$ 3.000 para o 1º lugar geral', NULL,
 'Araçatuba Runners', 'Meia maratona passando pelo Parque dos Castores e orla do rio.',
 'confirmed', 'admin', false, 30, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 12 — Mirassol
('Corrida de Mirassol', 'corrida-de-mirassol', '2026-06-01', '07:00',
 'Mirassol', 'SP', 'Praça Cel. Pereira - Centro',
 -20.8168, -49.5205, ARRAY['10km', '5km'], 'R$ 65,00',
 'https://example.com/corrida-mirassol', '2026-05-28', 'none',
 NULL, NULL,
 'Mirassol Runners', 'Corrida pelas ruas tranquilas de Mirassol. Para toda a família!',
 'confirmed', 'admin', false, 11, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 13 — Jales
('Desafio Noroeste Jales', 'desafio-noroeste-jales', '2026-06-07', '06:30',
 'Jales', 'SP', 'Av. Francisco Jalles - Entrada da cidade',
 -20.2690, -50.5460, ARRAY['15km', '10km', '5km'], 'R$ 85,00',
 'https://example.com/desafio-noroeste-jales', '2026-06-01', 'both',
 'Troféus + R$ 1.000 para o 1º lugar', NULL,
 'Jales Running', 'Desafio pelo interior do noroeste paulista.',
 'confirmed', 'admin', false, 17, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 14 — Lins
('Corrida do Interior Lins', 'corrida-do-interior-lins', '2026-06-14', '07:00',
 'Lins', 'SP', 'Parque Ecológico - Rod. Marechal Rondon',
 -21.6786, -49.7503, ARRAY['10km', '5km'], 'R$ 69,00',
 'https://example.com/corrida-interior-lins', '2026-06-08', 'trophy',
 'Troféus para os 3 primeiros de cada categoria', NULL,
 'Lins Runners', 'Corrida ecológica pelo parque de Lins.',
 'confirmed', 'admin', false, 19, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 15 — São José do Rio Preto
('Night Run Rio Preto', 'night-run-rio-preto', '2026-06-21', '19:30',
 'São José do Rio Preto', 'SP', 'Shopping Iguatemi - Av. Brigadeiro Faria Lima',
 -20.7900, -49.3960, ARRAY['10km', '5km'], 'R$ 79,00',
 'https://example.com/night-run-rio-preto', '2026-06-17', 'none',
 NULL, NULL,
 'Noroeste Running', 'Corrida noturna pelas principais avenidas de Rio Preto.',
 'confirmed', 'admin', false, 24, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 16 — Andradina
('Corrida da Integração Andradina', 'corrida-da-integracao-andradina', '2026-06-28', '06:30',
 'Andradina', 'SP', 'Praça Antônio de Souza Arantes - Centro',
 -20.8952, -51.3793, ARRAY['10km', '5km', '3km'], 'R$ 60,00',
 'https://example.com/corrida-integracao-andradina', '2026-06-22', 'trophy',
 'Troféus para os 5 primeiros', NULL,
 'Andradina Running', 'Corra pelo centro de Andradina e conheça a cidade!',
 'confirmed', 'admin', false, 10, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 17 — Monte Aprazível
('Corrida Rural Monte Aprazível', 'corrida-rural-monte-aprazivel', '2026-07-05', '06:30',
 'Monte Aprazível', 'SP', 'Praça São José - Centro',
 -20.7727, -49.7140, ARRAY['12km', '6km'], 'R$ 55,00',
 'https://example.com/corrida-rural-monte-aprazivel', '2026-06-30', 'none',
 NULL, NULL,
 'Interior Trail', 'Corrida rural pelas estradas de terra de Monte Aprazível.',
 'confirmed', 'admin', false, 9, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 18 — Araçatuba
('Night Run Araçatuba', 'night-run-aracatuba', '2026-07-12', '19:00',
 'Araçatuba', 'SP', 'Av. Joaquim Pompeu de Toledo - Orla do Rio',
 -21.2030, -50.4420, ARRAY['8km', '4km'], 'R$ 69,00',
 'https://example.com/night-run-aracatuba', '2026-07-08', 'none',
 NULL, NULL,
 'Araçatuba Runners', 'Corrida noturna pela orla do Rio Tietê em Araçatuba.',
 'confirmed', 'admin', false, 20, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 19 — Tanabi
('Corrida dos Lagos Tanabi', 'corrida-dos-lagos-tanabi', '2026-07-19', '07:00',
 'Tanabi', 'SP', 'Lago Municipal - Av. Brasil',
 -20.6258, -49.6552, ARRAY['10km', '5km'], 'R$ 60,00',
 'https://example.com/corrida-lagos-tanabi', '2026-07-13', 'trophy',
 'Troféus para os 3 primeiros', NULL,
 'Tanabi Running', 'Corrida ao redor do Lago Municipal de Tanabi.',
 'confirmed', 'admin', false, 13, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 20 — Guararapes
('Desafio Guararapes', 'desafio-guararapes', '2026-07-25', '06:30',
 'Guararapes', 'SP', 'Praça da Bandeira - Centro',
 -21.2603, -50.6428, ARRAY['15km', '10km', '5km'], 'R$ 75,00',
 'https://example.com/desafio-guararapes', '2026-07-21', 'both',
 'Troféus + R$ 500 para os 3 primeiros', NULL,
 'Guararapes Runners', 'Desafio entre as fazendas e estradas rurais de Guararapes.',
 'confirmed', 'admin', false, 11, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 21 — São José do Rio Preto
('Maratona Noroeste Paulista', 'maratona-noroeste-paulista', '2026-08-02', '05:30',
 'São José do Rio Preto', 'SP', 'Complexo Esportivo Anísio Haddad',
 -20.8200, -49.3650, ARRAY['42km', '21km', '10km'], 'R$ 199,00',
 'https://example.com/maratona-noroeste', '2026-07-25', 'money',
 'Premiação total de R$ 10.000', NULL,
 'Noroeste Running', 'A grande maratona do noroeste paulista! Percurso rápido e plano.',
 'confirmed', 'admin', false, 50, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 22 — Ilha Solteira
('Corrida da Usina Ilha Solteira', 'corrida-da-usina-ilha-solteira', '2026-08-09', '06:00',
 'Ilha Solteira', 'SP', 'Av. Brasil - Próximo à Usina Hidrelétrica',
 -20.4321, -51.3427, ARRAY['21km', '10km', '5km'], 'R$ 95,00',
 'https://example.com/corrida-usina-ilha-solteira', '2026-08-03', 'trophy',
 'Troféus para os 5 primeiros de cada distância', NULL,
 'Ilha Solteira Running', 'Corra com vista para a represa da Usina Hidrelétrica!',
 'confirmed', 'admin', false, 16, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 23 — Araçatuba
('Maratona de Araçatuba', 'maratona-de-aracatuba-2026', '2026-08-16', '06:00',
 'Araçatuba', 'SP', 'Ginásio Municipal de Esportes',
 -21.2010, -50.4350, ARRAY['42km', '21km', '10km'], 'R$ 179,00',
 'https://example.com/maratona-aracatuba', '2026-08-10', 'money',
 'R$ 5.000 para o 1º lugar geral', NULL,
 'Araçatuba Runners', 'Maratona plana e rápida pelo interior paulista.',
 'confirmed', 'admin', false, 35, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 24 — José Bonifácio
('Corrida da Laranja José Bonifácio', 'corrida-da-laranja-jose-bonifacio', '2026-08-23', '07:00',
 'José Bonifácio', 'SP', 'Praça Matriz - Centro',
 -21.0530, -49.6876, ARRAY['10km', '5km'], 'R$ 55,00',
 'https://example.com/corrida-laranja-jb', '2026-08-18', 'trophy',
 'Troféus artesanais para os 3 primeiros', NULL,
 'JB Running', 'Corrida pela terra da laranja no coração do noroeste.',
 'confirmed', 'admin', false, 8, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 25 — São José do Rio Preto
('São Silvestre Rio Preto', 'sao-silvestre-rio-preto', '2026-08-30', '08:00',
 'São José do Rio Preto', 'SP', 'Praça Cívica - Rui Barbosa',
 -20.8120, -49.3790, ARRAY['15km', '10km', '5km'], 'R$ 110,00',
 'https://example.com/silvestre-rio-preto', '2026-08-25', 'money',
 'R$ 3.000 para o 1º lugar geral', NULL,
 'Noroeste Running', 'A São Silvestre do noroeste paulista! Edição de inverno.',
 'confirmed', 'admin', false, 40, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 26 — Buritama
('Corrida de Buritama', 'corrida-de-buritama', '2026-09-06', '07:00',
 'Buritama', 'SP', 'Praça da Matriz - Centro',
 -21.0660, -50.1480, ARRAY['10km', '5km'], 'R$ 55,00',
 'https://example.com/corrida-buritama', '2026-09-01', 'none',
 NULL, NULL,
 'Buritama Runners', 'Corrida familiar pelas ruas de Buritama.',
 'confirmed', 'admin', false, 10, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 27 — Novo Horizonte
('Desafio Novo Horizonte', 'desafio-novo-horizonte', '2026-09-13', '06:30',
 'Novo Horizonte', 'SP', 'Parque Municipal - Rod. Cesário José de Castilho',
 -21.4680, -49.2220, ARRAY['15km', '10km', '5km'], 'R$ 80,00',
 'https://example.com/desafio-novo-horizonte', '2026-09-08', 'both',
 'Troféus + R$ 500 para os primeiros', NULL,
 'NH Running', 'Desafio entre canaviais e estradas rurais de Novo Horizonte.',
 'confirmed', 'admin', false, 14, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 28 — Valparaíso
('Corrida do Cerrado Valparaíso', 'corrida-do-cerrado-valparaiso', '2026-09-20', '06:30',
 'Valparaíso', 'SP', 'Praça Central - Centro',
 -21.2260, -50.8690, ARRAY['10km', '5km'], 'R$ 65,00',
 'https://example.com/corrida-cerrado-valparaiso', '2026-09-15', 'trophy',
 'Troféus para os 3 primeiros', NULL,
 'Valparaíso Running', 'Corrida com paisagem de cerrado no extremo oeste paulista.',
 'confirmed', 'admin', false, 9, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 29 — Pereira Barreto
('Corrida da Represa Pereira Barreto', 'corrida-da-represa-pereira-barreto', '2026-09-27', '06:00',
 'Pereira Barreto', 'SP', 'Orla da Represa de Três Irmãos',
 -20.6375, -51.1090, ARRAY['21km', '10km'], 'R$ 95,00',
 'https://example.com/corrida-represa-pb', '2026-09-20', 'money',
 'R$ 2.000 para o 1º lugar', NULL,
 'PB Running', 'Corra com vista para a represa de Três Irmãos!',
 'confirmed', 'admin', false, 13, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef'),

-- 30 — São José do Rio Preto
('Circuito Rio Preto de Corridas', 'circuito-rio-preto-de-corridas', '2026-09-30', '06:30',
 'São José do Rio Preto', 'SP', 'Parque Ecológico - Rua Jaguaré',
 -20.8050, -49.3850, ARRAY['21km', '10km', '5km'], 'R$ 95,00',
 'https://example.com/circuito-rio-preto', '2026-09-25', 'trophy',
 'Troféus para os 5 primeiros de cada categoria', NULL,
 'Noroeste Running', 'Última etapa do circuito regional! Corra pelo Parque Ecológico.',
 'confirmed', 'admin', false, 27, '5c917d11-1fb3-4f71-a4ad-3030bcd92bef');
