-- ============================================================
-- seed.sql — 20 corridas de teste
-- Cobre diferentes estados, tipos de premiação, status,
-- distâncias, e casos de promoção paga.
-- Todas vinculadas ao único perfil existente (admin/owner).
-- ============================================================

INSERT INTO public.races (
  name, slug, date, start_time,
  city, state, address, latitude, longitude,
  distances, registration_price, registration_link, registration_deadline,
  prize_type, prize_details,
  route_description, organizer, description,
  status, rsvp_count, is_promoted, promoted_until, origin,
  created_by
) VALUES

-- 1 ── São Paulo/SP · 42k · premiação em dinheiro · destaque ativo
(
  'Maratona Internacional de São Paulo',
  'maratona-internacional-sao-paulo',
  '2026-04-12', '06:00',
  'São Paulo', 'SP',
  'Av. Paulista, 1578 - Bela Vista, São Paulo',
  -23.5617, -46.6558,
  ARRAY['21k','42k'],
  '21k: R$180 | 42k: R$250',
  'https://example.com/maratona-sp',
  '2026-04-05',
  'money',
  'Maratona: R$10.000 (1º), R$5.000 (2º), R$2.500 (3º) — masc/fem. Meia: R$3.000 (1º), R$1.500 (2º).',
  'Largada na Av. Paulista, percurso certificado pela CBAt passando por Ibirapuera, Vila Madalena e retorno pelo centro expandido.',
  'Associação de Atletismo de São Paulo',
  'A maior prova de rua do Brasil reúne atletas de elite e amadores num percurso histórico pela capital paulista. Classificatória para Boston e Berlin.',
  'confirmed', 342, true, '2026-03-25 23:59:59+00', 'admin',
  (SELECT id FROM public.profiles LIMIT 1)
),

-- 2 ── Rio de Janeiro/RJ · 5k+10k · troféu
(
  'Corrida Lagoa Rodrigo de Freitas',
  'corrida-lagoa-rodrigo-de-freitas',
  '2026-03-22', '07:00',
  'Rio de Janeiro', 'RJ',
  'Av. Epitácio Pessoa - Lagoa, Rio de Janeiro',
  -22.9711, -43.1966,
  ARRAY['5k','10k'],
  'R$85',
  'https://example.com/lagoa-run',
  '2026-03-15',
  'trophy',
  'Troféu para os 3 primeiros de cada categoria e faixa etária.',
  'Volta completa ao redor da Lagoa Rodrigo de Freitas com vista para o Corcovado. Percurso plano e rápido.',
  'Rio Running Events',
  'Clássica prova carioca com o cenário mais bonito da cidade. Percurso plano, perfeito para buscar marcas pessoais.',
  'confirmed', 128, false, NULL, 'admin',
  (SELECT id FROM public.profiles LIMIT 1)
),

-- 3 ── Belo Horizonte/MG · trail 21k+42k · dinheiro
(
  'Ultra BH Mountain Race',
  'ultra-bh-mountain-race',
  '2026-05-03', '05:30',
  'Belo Horizonte', 'MG',
  'Parque Estadual Serra do Rola-Moça - Nova Lima, BH',
  -20.0161, -44.0256,
  ARRAY['21k','42k'],
  '21k: R$160 | 42k: R$220',
  'https://example.com/ultra-bh',
  '2026-04-25',
  'money',
  '42k: R$5.000 (1º), R$2.500 (2º), R$1.200 (3º). 21k: R$2.000 (1º), R$1.000 (2º).',
  'Trilha técnica com 1.800m de ganho de elevação. Terreno misto de mata atlântica, pedras e gramado. Abastecimentos a cada 7km.',
  'BH Trail Adventures',
  'A prova de trail mais desafiadora de Minas Gerais. Cenário deslumbrante da Serra do Rola-Moça com corredores de todo o Brasil.',
  'confirmed', 89, false, NULL, 'admin',
  (SELECT id FROM public.profiles LIMIT 1)
),

-- 4 ── Curitiba/PR · 5k+10k · troféu+dinheiro
(
  'Corrida das Flores de Curitiba',
  'corrida-das-flores-curitiba',
  '2026-04-19', '07:30',
  'Curitiba', 'PR',
  'Jardim Botânico - R. Eng. Ostoja Roguski, 690, Curitiba',
  -25.4409, -49.2373,
  ARRAY['5k','10k'],
  'R$70',
  'https://example.com/corrida-flores-cwb',
  '2026-04-12',
  'both',
  'Dinheiro: R$1.500 (1º), R$800 (2º), R$400 (3º). Troféu até 5º lugar por faixa etária.',
  'Percurso pelas alamedas do Jardim Botânico com vista para a estufa de ferro. Terreno levemente ondulado.',
  'Curitiba Runners Club',
  'A corrida mais fotogênica do sul do Brasil acontece em plena florada do Jardim Botânico. Venha com sua família!',
  'confirmed', 201, false, NULL, 'admin',
  (SELECT id FROM public.profiles LIMIT 1)
),

-- 5 ── Porto Alegre/RS · noturna 5k+10k · sem premiação
(
  'Night Run Beira-Rio Porto Alegre',
  'night-run-beira-rio-porto-alegre',
  '2026-03-28', '20:00',
  'Porto Alegre', 'RS',
  'Av. Edvaldo Pereira Paiva - Orla do Guaíba, Porto Alegre',
  -30.0407, -51.2427,
  ARRAY['5k','10k'],
  'R$75',
  'https://example.com/night-run-poa',
  '2026-03-21',
  'none',
  NULL,
  'Percurso plano ao longo da Orla do Guaíba com iluminação especial e DJs ao vivo nos pontos de apoio.',
  'POA Night Sports',
  'Corra à beira do Guaíba com o pôr do sol como cenário. Evento com festa pós-prova inclusa na inscrição.',
  'confirmed', 95, false, NULL, 'admin',
  (SELECT id FROM public.profiles LIMIT 1)
),

-- 6 ── Salvador/BA · 5k+10k+21k · troféu
(
  'Corrida do Pelourinho',
  'corrida-do-pelourinho',
  '2026-06-07', '06:30',
  'Salvador', 'BA',
  'Terreiro de Jesus - Pelourinho, Salvador',
  -12.9714, -38.5088,
  ARRAY['5k','10k','21k'],
  '5k: R$60 | 10k: R$80 | 21k: R$110',
  'https://example.com/corrida-pelourinho',
  '2026-05-31',
  'trophy',
  'Troféu artesanal baiano para os 3 primeiros overall e por categoria em cada distância.',
  'Largada no Terreiro de Jesus, descida pelo Comércio, Barra e retorno pela orla de Ondina. Percurso com leves aclives no centro histórico.',
  'Federação Baiana de Atletismo',
  'Corra pelas ruas históricas de Salvador com a energia e a cultura baiana. Uma experiência única no coração do Pelourinho.',
  'confirmed', 77, false, NULL, 'admin',
  (SELECT id FROM public.profiles LIMIT 1)
),

-- 7 ── Recife/PE · praia 5k+10k · dinheiro+troféu
(
  'Beach Run Boa Viagem',
  'beach-run-boa-viagem',
  '2026-05-17', '06:00',
  'Recife', 'PE',
  'Av. Boa Viagem - Praia de Boa Viagem, Recife',
  -8.1195, -34.9007,
  ARRAY['5k','10k'],
  'R$65',
  'https://example.com/beach-run-recife',
  '2026-05-10',
  'both',
  'R$2.000 (1º), R$1.000 (2º), R$500 (3º) nas categorias elite. Troféu até 5º lugar amador.',
  'Percurso à beira-mar pela Praia de Boa Viagem, totalmente plano e com brisa do mar. Largada ao nascer do sol.',
  'Recife Beach Sports',
  'A corrida mais fresca de Pernambuco! Percurso à beira do Atlântico com o sol nascendo no mar.',
  'confirmed', 156, false, NULL, 'admin',
  (SELECT id FROM public.profiles LIMIT 1)
),

-- 8 ── Fortaleza/CE · meia maratona · dinheiro · destaque ativo
(
  'Meia Maratona Beira-Mar Fortaleza',
  'meia-maratona-beira-mar-fortaleza',
  '2026-04-26', '05:30',
  'Fortaleza', 'CE',
  'Av. Beira Mar - Meireles, Fortaleza',
  -3.7266, -38.4916,
  ARRAY['10k','21k'],
  '10k: R$80 | 21k: R$130',
  'https://example.com/meia-fortaleza',
  '2026-04-19',
  'money',
  'Meia: R$8.000 (1º), R$4.000 (2º), R$2.000 (3º). 10k: R$2.000 (1º), R$1.000 (2º).',
  'Percurso certificado pela AIMS ao longo da Av. Beira Mar, totalmente plano. Condições ideais para recordes — largada às 5h30 evitando o calor.',
  'Federação Cearense de Atletismo',
  'A prova mais rápida do Nordeste! Percurso plano à beira-mar de Fortaleza com largada no fresco da madrugada.',
  'confirmed', 213, true, '2026-04-01 23:59:59+00', 'admin',
  (SELECT id FROM public.profiles LIMIT 1)
),

-- 9 ── Brasília/DF · 5k+10k · troféu
(
  'Corrida da Esplanada',
  'corrida-da-esplanada',
  '2026-05-24', '06:00',
  'Brasília', 'DF',
  'Esplanada dos Ministérios - Eixo Monumental, Brasília',
  -15.7997, -47.8642,
  ARRAY['5k','10k'],
  'R$70',
  'https://example.com/corrida-esplanada',
  '2026-05-17',
  'trophy',
  'Troféu comemorativo para os 3 primeiros de cada categoria. Medalha finisher para todos.',
  'Largada em frente ao Congresso Nacional, passando pelo Museu Nacional e retorno pelo Eixo Monumental. Percurso plano e sinalizado.',
  'SESC DF Esportes',
  'Corra pelos cartões-postais da capital federal com o cenário único de Brasília ao amanhecer.',
  'confirmed', 134, false, NULL, 'admin',
  (SELECT id FROM public.profiles LIMIT 1)
),

-- 10 ── Florianópolis/SC · 5k+10k · dinheiro+troféu
(
  'Corrida das Dunas Florianópolis',
  'corrida-das-dunas-florianopolis',
  '2026-04-05', '07:00',
  'Florianópolis', 'SC',
  'Av. das Rendeiras - Lagoa da Conceição, Florianópolis',
  -27.5990, -48.4698,
  ARRAY['5k','10k'],
  'R$80',
  'https://example.com/corrida-dunas-fpolis',
  '2026-03-29',
  'both',
  'R$1.500 (1º), R$750 (2º), R$350 (3º) geral. Troféu por categoria e faixa etária.',
  'Percurso ao redor da Lagoa da Conceição com vista para as dunas. Trecho de trilha nas dunas (+/- 2km) para as categorias 10k.',
  'Floripa Trail & Run',
  'A natureza privilegiada da Ilha da Magia como cenário. Percurso misto de asfalto e dunas com a Lagoa da Conceição.',
  'confirmed', 167, false, NULL, 'admin',
  (SELECT id FROM public.profiles LIMIT 1)
),

-- 11 ── Campinas/SP · trail noturno 10k+21k · dinheiro
(
  'Night Trail Campinas',
  'night-trail-campinas',
  '2026-03-14', '19:30',
  'Campinas', 'SP',
  'Parque Estadual Mata de Santa Genebra - Rod. Dom Pedro I, Campinas',
  -22.8878, -46.9891,
  ARRAY['10k','21k'],
  '10k: R$95 | 21k: R$140',
  'https://example.com/night-trail-campinas',
  '2026-03-07',
  'money',
  'R$2.000 (1º), R$1.000 (2º), R$500 (3º) em cada distância — masc/fem.',
  'Trilha noturna na Mata de Santa Genebra com uso de headlamp obrigatório. Terreno técnico com raízes e trechos de lama.',
  'Campinas Trail Adventures',
  'A única prova noturna de trail de Campinas. Headlamp incluso no kit. Adrenalina garantida na mata fechada!',
  'confirmed', 48, false, NULL, 'admin',
  (SELECT id FROM public.profiles LIMIT 1)
),

-- 12 ── Ribeirão Preto/SP · 5k+10k · troféu
(
  'Corrida do Vinho Ribeirão Preto',
  'corrida-do-vinho-ribeirao-preto',
  '2026-06-28', '07:30',
  'Ribeirão Preto', 'SP',
  'Av. Independência - Bosque Municipal, Ribeirão Preto',
  -21.1895, -47.8009,
  ARRAY['5k','10k'],
  'R$65',
  'https://example.com/corrida-vinho-rp',
  '2026-06-21',
  'trophy',
  'Troféu artístico com tema vitivinícola para os 3 primeiros. Medalha finisher para todos.',
  'Percurso pelas principais avenidas de Ribeirão Preto passando pelo Bosque Municipal. Leve ondulação.',
  'Ribeirão Runners',
  'A corrida mais tradicional do interior paulista. Kit inclui taça e degustação de vinhos da região na festa pós-prova.',
  'confirmed', 62, false, NULL, 'admin',
  (SELECT id FROM public.profiles LIMIT 1)
),

-- 13 ── Goiânia/GO · 5k+10k+21k · dinheiro
(
  'Goiânia City Run',
  'goiania-city-run',
  '2026-05-10', '06:00',
  'Goiânia', 'GO',
  'Parque Flamboyant - Av. José Hermeto do Espírito Santo, Goiânia',
  -16.7107, -49.2408,
  ARRAY['5k','10k','21k'],
  '5k: R$55 | 10k: R$75 | 21k: R$120',
  'https://example.com/goiania-city-run',
  '2026-05-03',
  'money',
  'Meia: R$4.000 (1º), R$2.000 (2º), R$1.000 (3º). 10k: R$1.500 (1º), R$750 (2º).',
  'Percurso plano pelo Parque Flamboyant e Setor Bueno. Três distâncias com largadas escalonadas.',
  'Federação Goiana de Atletismo',
  'A maior prova de rua de Goiás com percurso pelos parques e avenidas mais bonitas de Goiânia.',
  'confirmed', 184, false, NULL, 'admin',
  (SELECT id FROM public.profiles LIMIT 1)
),

-- 14 ── Vitória/ES · orla 5k+10k · troféu
(
  'Corrida da Baía de Vitória',
  'corrida-da-baia-de-vitoria',
  '2026-04-25', '06:30',
  'Vitória', 'ES',
  'Av. Marechal Mascarenhas de Moraes - Enseada do Suá, Vitória',
  -20.3156, -40.2952,
  ARRAY['5k','10k'],
  'R$60',
  'https://example.com/corrida-baia-vitoria',
  '2026-04-18',
  'trophy',
  'Troféu para os 3 primeiros geral e por faixa etária em cada distância.',
  'Percurso pela orla da Enseada do Suá com vista para a Baía de Vitória e os mangues. Terreno plano.',
  'Vitória Running',
  'Contemple a beleza única da Baía de Vitória enquanto corre pela orla mais bonita do Espírito Santo.',
  'confirmed', 73, false, NULL, 'admin',
  (SELECT id FROM public.profiles LIMIT 1)
),

-- 15 ── Natal/RN · 5k+10k · dinheiro+troféu
(
  'Arena das Dunas Run',
  'arena-das-dunas-run',
  '2026-05-31', '06:00',
  'Natal', 'RN',
  'Arena das Dunas - Av. Sen. Salgado Filho, 5001, Natal',
  -5.8357, -35.2116,
  ARRAY['5k','10k'],
  'R$70',
  'https://example.com/arena-dunas-run',
  '2026-05-24',
  'both',
  'R$2.000 (1º), R$1.000 (2º), R$500 (3º) overall. Troféu até 5º lugar por categoria.',
  'Largada na Arena das Dunas, percurso pela Via Costeira com vista para o Atlântico. Trecho pelas dunas do Parque das Dunas.',
  'Natal Sport Events',
  'Corra ao redor do estádio mais bonito do Brasil com o mar de Natal ao fundo. Uma experiência inesquecível!',
  'confirmed', 91, false, NULL, 'admin',
  (SELECT id FROM public.profiles LIMIT 1)
),

-- 16 ── Sorocaba/SP · trail 10k+21k · dinheiro · destaque ativo
(
  'Trail das Serras Sorocaba',
  'trail-das-serras-sorocaba',
  '2026-04-18', '06:00',
  'Sorocaba', 'SP',
  'Parque Zoológico Municipal Quinzinho de Barros - Sorocaba',
  -23.4977, -47.4544,
  ARRAY['10k','21k'],
  '10k: R$90 | 21k: R$140',
  'https://example.com/trail-serras-sorocaba',
  '2026-04-11',
  'money',
  'R$3.000 (1º), R$1.500 (2º), R$700 (3º) em cada distância — masc/fem.',
  'Trilha nas serras ao redor de Sorocaba com 900m de ganho de elevação no 21k. Terreno variado: mata fechada, campo e pedras.',
  'Serra Trail Team',
  'O maior evento de trail running do interior de São Paulo. Percurso técnico com vistas panorâmicas das serras sorocabanas.',
  'confirmed', 117, true, '2026-03-20 23:59:59+00', 'admin',
  (SELECT id FROM public.profiles LIMIT 1)
),

-- 17 ── Londrina/PR · 5k+10k · troféu
(
  'Corrida do Café Londrina',
  'corrida-do-cafe-londrina',
  '2026-06-14', '07:00',
  'Londrina', 'PR',
  'Calçadão de Londrina - R. XV de Novembro, Centro, Londrina',
  -23.3095, -51.1627,
  ARRAY['5k','10k'],
  'R$65',
  'https://example.com/corrida-cafe-londrina',
  '2026-06-07',
  'trophy',
  'Troféu temático do café para os 3 primeiros geral. Medalha finisher para todos os participantes.',
  'Percurso pelas principais avenidas do centro de Londrina passando pelos pontos históricos da cidade.',
  'Londrina Runners',
  'A corrida que celebra a história cafeeira de Londrina. Kit inclui café especial da região e camiseta exclusiva.',
  'confirmed', 103, false, NULL, 'admin',
  (SELECT id FROM public.profiles LIMIT 1)
),

-- 18 ── Joinville/SC · maratona 21k+42k · dinheiro
(
  'Maratona de Joinville',
  'maratona-de-joinville',
  '2026-07-05', '06:00',
  'Joinville', 'SC',
  'Palácio dos Festivais - Av. José Vieira, 315, Joinville',
  -26.3045, -48.8464,
  ARRAY['21k','42k'],
  '21k: R$150 | 42k: R$210',
  'https://example.com/maratona-joinville',
  '2026-06-28',
  'money',
  'Maratona: R$8.000 (1º), R$4.000 (2º), R$2.000 (3º). Meia: R$3.000 (1º), R$1.500 (2º).',
  'Percurso certificado pela AIMS pelas ruas arborizadas de Joinville. Clima ameno de julho favorece marcas pessoais.',
  'Associação Atlética de Joinville',
  'A maior prova de rua de Santa Catarina com percurso pelas ruas históricas da Cidade das Flores.',
  'confirmed', 78, false, NULL, 'admin',
  (SELECT id FROM public.profiles LIMIT 1)
),

-- 19 ── Manaus/AM · 5k+10k · troféu
(
  'Corrida Amazônica Manaus',
  'corrida-amazonica-manaus',
  '2026-06-21', '05:30',
  'Manaus', 'AM',
  'Av. Eduardo Ribeiro - Centro Histórico, Manaus',
  -3.1303, -60.0234,
  ARRAY['5k','10k'],
  'R$70',
  'https://example.com/corrida-amazonica',
  '2026-06-14',
  'trophy',
  'Troféu artesanal amazônico para os 3 primeiros de cada categoria.',
  'Percurso pelo centro histórico de Manaus passando pelo Teatro Amazonas, Mercado Municipal e Porto de Manaus. Largada às 5h30 para fugir do calor.',
  'Federação Amazonense de Atletismo',
  'Uma prova única no coração da maior floresta do mundo. Largada ao amanhecer com o frescor amazônico antes do sol quente.',
  'confirmed', 55, false, NULL, 'admin',
  (SELECT id FROM public.profiles LIMIT 1)
),

-- 20 ── São Paulo/SP · 5k+10k · sem premiação · adiada (para testar status)
(
  'SP Centro Histórico Run',
  'sp-centro-historico-run',
  '2026-05-16', '08:00',
  'São Paulo', 'SP',
  'Praça da Sé - Centro Histórico, São Paulo',
  -23.5505, -46.6333,
  ARRAY['5k','10k'],
  'R$65',
  'https://example.com/sp-centro-run',
  '2026-05-09',
  'none',
  NULL,
  'Percurso pelo centro histórico de SP passando pela Praça da Sé, Viaduto do Chá, Pinacoteca e Parque da Luz.',
  'SP Urban Runners',
  'Descubra o centro histórico de São Paulo correndo. Prova ADIADA — nova data a confirmar. Inscrições mantidas.',
  'postponed', 38, false, NULL, 'admin',
  (SELECT id FROM public.profiles LIMIT 1)
);
