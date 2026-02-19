-- ============================================================
-- Migration 008: Função para buscar cidades aleatórias
-- ============================================================
-- Usada na landing page (seção Cobertura Nacional) para
-- exibir um conjunto variado de cidades a cada requisição.
-- ORDER BY RANDOM() é viável aqui: a tabela tem ~5.571 linhas
-- e o resultado é limitado a p_limit antes de ser devolvido.
-- ============================================================

CREATE OR REPLACE FUNCTION get_random_cities(p_limit INT DEFAULT 60)
RETURNS TABLE(name VARCHAR, state_code CHAR(2)) AS $$
  SELECT name, state_code
  FROM public.cities
  WHERE active = true
  ORDER BY RANDOM()
  LIMIT p_limit;
$$ LANGUAGE sql VOLATILE;

NOTIFY pgrst, 'reload schema';
