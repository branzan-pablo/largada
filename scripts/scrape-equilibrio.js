/**
 * Web Scraper - Equilíbrio Esportes (equilibrio.esp.br)
 *
 * Estratégia: API Interna (WordPress REST API) + Scraping HTML
 *
 * Endpoints utilizados:
 *   1. /wp-json/wp/v2/corridas-proximos  → CPT com corridas futuras
 *   2. /wp-json/wp/v2/product?_embed     → WooCommerce (preço + imagem)
 *
 * Para dados detalhados (datas, distâncias, regulamento, preços por lote),
 * faz scraping HTML das páginas individuais de cada corrida.
 *
 * Uso: node scripts/scrape-equilibrio.js [--output <arquivo.json>]
 */

const BASE_URL = 'https://equilibrio.esp.br';

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ao acessar ${url}`);
  return res.json();
}

async function fetchHTML(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ao acessar ${url}`);
  return res.text();
}

function stripHTML(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extrai cidade e estado do título.
 * Testa explicitamente os últimos segmentos separados por – ou |
 */
function extractCidadeEstado(titulo) {
  // Normalizar separadores
  const normalizado = titulo.replace(/\s*\d{4}\s*$/, '').trim();

  // Tenta o último segmento depois de – ou | que contenha "CIDADE-UF"
  const segmentos = normalizado.split(/\s*[–|]\s*/);

  // Iterar do último para o primeiro
  for (let i = segmentos.length - 1; i >= 0; i--) {
    const seg = segmentos[i].trim();
    const m = seg.match(/^(.+?)\s*[-–]\s*([A-Z]{2})$/);
    if (m) {
      return { cidade: m[1].trim(), estado: m[2].trim() };
    }
  }

  // Fallback: procurar padrão "de CIDADE-UF" em qualquer parte
  const fallback = normalizado.match(/\bde\s+(.+?)\s*[-–]\s*([A-Z]{2})\b/i);
  if (fallback) {
    return { cidade: fallback[1].trim(), estado: fallback[2].trim() };
  }

  return { cidade: null, estado: null };
}

/**
 * Extrai a data da corrida do texto da página.
 */
function extractDataEvento(texto) {
  const meses = {
    janeiro: '01', fevereiro: '02', 'março': '03', abril: '04',
    maio: '05', junho: '06', julho: '07', agosto: '08',
    setembro: '09', outubro: '10', novembro: '11', dezembro: '12',
  };

  // Padrão 1: "dia DD de MÊS de AAAA"
  const match = texto.match(
    /(?:dia|n[oa]?\s+dia)\s+(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i
  );
  if (match) {
    const dia = match[1].padStart(2, '0');
    const mes = meses[match[2].toLowerCase()];
    const ano = match[3];
    if (mes) return `${ano}-${mes}-${dia}`;
  }

  // Padrão 2: "realizado no dia DD de MÊS de AAAA"
  const match1b = texto.match(
    /realizado\s+(?:no\s+)?dia\s+(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i
  );
  if (match1b) {
    const dia = match1b[1].padStart(2, '0');
    const mes = meses[match1b[2].toLowerCase()];
    const ano = match1b[3];
    if (mes) return `${ano}-${mes}-${dia}`;
  }

  // Padrão 3: "(DD/MM/AAAA)" ou "DD/MM/AAAA"
  const match2 = texto.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match2) return `${match2[3]}-${match2[2]}-${match2[1]}`;

  return null;
}

/**
 * Extrai distâncias do texto (ex: 5km, 6km, 7.5km).
 * Filtra para distâncias de corrida (3-42.2km).
 */
function extractDistancias(texto) {
  const matches = texto.match(/(\d+(?:[.,]\d+)?)\s*km/gi);
  if (!matches) return null;

  const seen = new Set();
  const distancias = [];
  for (const m of matches) {
    const numStr = m.replace(',', '.').match(/(\d+(?:\.\d+)?)/)?.[1];
    if (!numStr) continue;
    const num = parseFloat(numStr);
    if (num >= 3 && num <= 42.2 && !seen.has(numStr)) {
      seen.add(numStr);
      distancias.push(`${numStr}km`);
    }
  }

  return distancias.length > 0 ? distancias : null;
}

/**
 * Extrai o valor mínimo de inscrição (1º lote) do texto.
 * Busca especificamente na seção de inscrições.
 */
function extractValorInscricao(texto) {
  // Procurar seção de inscrições/lotes
  const secaoInscricao = texto.match(/(?:inscri[çc][oõ]es|1[ºo]\s*lote|valor)[^]*?(?:2[ºo]\s*lote|retirada|kit)/is);
  const textoAlvo = secaoInscricao ? secaoInscricao[0] : texto;

  const matches = textoAlvo.match(/R\$\s*(\d+(?:[.,]\d{2})?)/g);
  if (!matches) return null;

  const valores = matches
    .map(m => {
      const num = m.replace('R$', '').replace(/\s/g, '').replace(',', '.');
      return parseFloat(num);
    })
    .filter(v => v >= 20 && v <= 500);

  if (valores.length === 0) return null;
  return Math.min(...valores);
}

/**
 * Extrai data limite de inscrição.
 */
function extractDataLimiteInscricao(texto) {
  const meses = {
    janeiro: '01', fevereiro: '02', 'março': '03', abril: '04',
    maio: '05', junho: '06', julho: '07', agosto: '08',
    setembro: '09', outubro: '10', novembro: '11', dezembro: '12',
  };

  // "encerradas ... dia DD de MÊS de AAAA"
  const match = texto.match(
    /encerrad[ao]s?\s+(?:via\s+internet\s+)?(?:no\s+)?dia\s+(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i
  );
  if (match) {
    const dia = match[1].padStart(2, '0');
    const mes = meses[match[2].toLowerCase()];
    const ano = match[3];
    if (mes) return `${ano}-${mes}-${dia}`;
  }

  // "encerradas ... DD/MM/AAAA"
  const match1b = texto.match(
    /encerrad[ao]s?\s+(?:via\s+internet\s+)?(?:no\s+)?dia\s+(\d{2})\/(\d{2})\/(\d{4})/i
  );
  if (match1b) return `${match1b[3]}-${match1b[2]}-${match1b[1]}`;

  // Último lote "até DD/MM/AAAA" (último match = data final)
  const matchDates = [...texto.matchAll(/(?:até|a)\s+(\d{2})\/(\d{2})\/(\d{4})/gi)];
  if (matchDates.length > 0) {
    const last = matchDates[matchDates.length - 1];
    return `${last[3]}-${last[2]}-${last[1]}`;
  }

  // "dia DD de MÊS de AAAA" após "encerr" ou "3º lote"
  const match3 = texto.match(
    /(?:3[ºo]\s*lote|último\s*lote)[^]*?(?:até|a)\s+(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i
  );
  if (match3) {
    const dia = match3[1].padStart(2, '0');
    const mes = meses[match3[2].toLowerCase()];
    const ano = match3[3];
    if (mes) return `${ano}-${mes}-${dia}`;
  }

  return null;
}

/**
 * Extrai local de largada.
 */
function extractLocalLargada(texto) {
  // "largada e chegada no/na LUGAR"
  const match = texto.match(
    /largada\s+(?:e\s+chegada\s+)?(?:n[oa]\s+|será\s+n[oa]\s+)(.+?)(?:\.|,|\n)/i
  );
  if (match) {
    let local = match[1].trim();
    // Remover "SP" trailing se já tiver no estado
    local = local.replace(/\s*[-–]\s*SP\s*$/, '');
    return local || null;
  }

  // "LARGADA E CHEGADA" + nova linha + local
  const match2 = texto.match(/LARGADA\s+E\s+CHEGADA\s*\n(.+)/i);
  if (match2) return match2[1].trim();

  return null;
}

/**
 * Extrai link de inscrição (Sympla).
 */
function extractLinkInscricao(html) {
  const match = html.match(/href="(https?:\/\/www\.sympla\.com\.br\/[^"]+)"/i);
  return match ? match[1] : null;
}

/**
 * Extrai descrição resumida do evento.
 */
function extractDescricao(texto) {
  // Seção "OBJETIVO"
  const match = texto.match(/OBJETIVO[.\s]*\n(.+?)(?:\n[A-Z]|\n\d+)/s);
  if (match) {
    const desc = match[1].trim().replace(/&nbsp;/g, ' ').substring(0, 500);
    if (desc.length > 20) return desc;
  }

  // Seção "O EVENTO"
  const match2 = texto.match(/O EVENTO\s*\n(.+?)(?:\n[A-Z]{3,}|\n\d+\s*[–\-.]\s)/s);
  if (match2) {
    const desc = match2[1].trim().replace(/&nbsp;/g, ' ').substring(0, 500);
    if (desc.length > 20) return desc;
  }

  return null;
}

/**
 * Busca a imagem do produto WooCommerce correspondente usando fuzzy slug matching.
 */
function findProductImage(slug, produtosPorSlug) {
  // Match exato
  if (produtosPorSlug[slug]?.uagb_featured_image_src?.full?.[0]) {
    return produtosPorSlug[slug].uagb_featured_image_src.full[0];
  }

  // Fuzzy: slug do produto contém ou é contido no slug da corrida
  for (const [pSlug, produto] of Object.entries(produtosPorSlug)) {
    if (slug.includes(pSlug) || pSlug.includes(slug)) {
      if (produto?.uagb_featured_image_src?.full?.[0]) {
        return produto.uagb_featured_image_src.full[0];
      }
    }
  }

  return null;
}

/**
 * Tenta buscar a imagem diretamente do HTML da página de detalhe.
 */
function extractImageFromHTML(html) {
  // Procurar og:image
  const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  if (ogMatch) return ogMatch[1];

  // Procurar imagem principal no conteúdo
  const imgMatch = html.match(/<img[^>]+src="(https?:\/\/equilibrio\.esp\.br\/wp-content\/uploads\/[^"]+)"/i);
  if (imgMatch) return imgMatch[1];

  return null;
}

// ─── Main Scraper ──────────────────────────────────────────────────────────────

async function scrapeEquilibrio() {
  console.log('🔍 Iniciando scraping de equilibrio.esp.br...\n');

  // PASSO 1: API - Corridas futuras
  console.log('📡 Estratégia 1: API Interna WordPress REST API');
  console.log('   Endpoint: /wp-json/wp/v2/corridas-proximos');

  const corridasAPI = await fetchJSON(
    `${BASE_URL}/wp-json/wp/v2/corridas-proximos?per_page=100`
  );
  console.log(`   ✅ ${corridasAPI.length} corridas encontradas\n`);

  // PASSO 2: API - Produtos WooCommerce (preço + imagem)
  console.log('   Endpoint: /wp-json/wp/v2/product?_embed');
  const produtosAPI = await fetchJSON(
    `${BASE_URL}/wp-json/wp/v2/product?per_page=100&_embed`
  );
  console.log(`   ✅ ${produtosAPI.length} produto(s) WooCommerce\n`);

  const produtosPorSlug = {};
  for (const p of produtosAPI) {
    produtosPorSlug[p.slug] = p;
  }

  // PASSO 3: Scraping HTML das páginas de detalhe
  console.log('📄 Estratégia 2: Scraping HTML das páginas de detalhe\n');

  const corridas = [];

  for (const corridaAPI of corridasAPI) {
    const titulo = stripHTML(corridaAPI.title.rendered);
    const slug = corridaAPI.slug;

    console.log(`   🏃 Processando: ${titulo}`);

    // A página de detalhe tem slug idêntico mas no path raiz (não no CPT)
    const pageURL = `${BASE_URL}/${slug}/`;

    let textoDetalhe = '';
    let htmlDetalhe = '';
    try {
      htmlDetalhe = await fetchHTML(pageURL);
      textoDetalhe = stripHTML(htmlDetalhe);
    } catch (e) {
      console.log(`     ⚠ Não foi possível acessar ${pageURL}: ${e.message}`);
      // Tentar sem trailing barra ou com variações
      try {
        const altSlug = slug.replace(/-s$/, '-sp');
        const altURL = `${BASE_URL}/${altSlug}/`;
        if (altSlug !== slug) {
          htmlDetalhe = await fetchHTML(altURL);
          textoDetalhe = stripHTML(htmlDetalhe);
          console.log(`     ✅ Acessado via URL alternativa: ${altURL}`);
        }
      } catch (e2) {
        console.log(`     ⚠ URL alternativa também falhou`);
      }
    }

    // Extração
    const { cidade, estado } = extractCidadeEstado(titulo);
    const data = extractDataEvento(textoDetalhe);
    const distancias = extractDistancias(textoDetalhe);
    const valorInscricao = extractValorInscricao(textoDetalhe);
    const dataLimiteInscricao = extractDataLimiteInscricao(textoDetalhe);
    const localLargada = extractLocalLargada(textoDetalhe);
    const linkInscricao = extractLinkInscricao(htmlDetalhe);
    const descricao = extractDescricao(textoDetalhe);

    // Imagem: tentar WooCommerce primeiro, depois HTML
    let imagemURL = findProductImage(slug, produtosPorSlug);
    if (!imagemURL) {
      imagemURL = extractImageFromHTML(htmlDetalhe);
    }

    // Status
    let status = 'inscrições abertas';
    if (dataLimiteInscricao) {
      const limite = new Date(dataLimiteInscricao);
      const agora = new Date();
      if (agora > limite) {
        status = 'inscrições encerradas';
      }
    }

    const corrida = {
      nome: titulo,
      data,
      cidade,
      estado,
      local_de_largada: localLargada,
      distancias,
      valor_inscricao: valorInscricao,
      data_limite_inscricao: dataLimiteInscricao,
      descricao,
      organizador: 'Equilíbrio Esportes',
      link_oficial: pageURL,
      link_inscricao: linkInscricao,
      image_url: imagemURL,
      status,
    };

    corridas.push(corrida);
    console.log(`     ✅ Dados extraídos com sucesso`);
  }

  return corridas;
}

// ─── CLI ───────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const outputIndex = args.indexOf('--output');
  const outputFile = outputIndex >= 0 ? args[outputIndex + 1] : null;

  try {
    const corridas = await scrapeEquilibrio();

    console.log(`\n✅ Scraping finalizado! ${corridas.length} corridas extraídas.\n`);

    const json = JSON.stringify(corridas, null, 2);

    if (outputFile) {
      const fs = await import('fs');
      fs.writeFileSync(outputFile, json, 'utf-8');
      console.log(`📁 JSON salvo em: ${outputFile}`);
    } else {
      console.log('── JSON Final ──────────────────────────────────────────');
      console.log(json);
    }
  } catch (error) {
    console.error('❌ Erro durante scraping:', error.message);
    process.exit(1);
  }
}

main();
