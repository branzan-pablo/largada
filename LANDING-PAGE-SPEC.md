# LANDING-PAGE-SPEC — Largada

## Objetivo da Página

Converter visitantes (corredores amadores da região) em usuários cadastrados. A página deve comunicar o valor do produto em menos de 10 segundos de scroll e ter um caminho claro para cadastro.

---

## Estrutura de Seções

### Seção 1: Hero

**Objetivo:** Comunicar a proposta de valor em uma frase e gerar ação imediata.

**Layout:**
- Headline principal (1 linha) + subtítulo explicativo (2 linhas máximo).
- CTA primário: botão de cadastro/acesso ao app.
- CTA secundário: âncora para "saiba mais" (scroll para próxima seção).
- Elemento visual à direita ou abaixo: screenshot/mockup do app em mobile mostrando a listagem de corridas com filtros.
- Background limpo, sem imagens de fundo pesadas.

**Diretrizes:**
- Desktop: layout em 2 colunas (texto à esquerda, visual à direita).
- Mobile: stack vertical (texto em cima, visual embaixo, CTA sticky ou bem visível).
- O mockup do app deve parecer real e mostrar dados da região (Rio Preto, Votuporanga, etc.).

---

### Seção 2: Problema

**Objetivo:** Gerar identificação imediata com a dor do corredor.

**Layout:**
- 3 cards lado a lado, cada um representando uma dor:
  - Dor 1: informação espalhada em muitos lugares.
  - Dor 2: descobrir corridas tarde demais.
  - Dor 3: não saber quem vai participar.
- Cada card: ícone + título curto + frase descritiva (1-2 linhas).
- Fundo levemente diferente da seção anterior para criar separação visual.

**Diretrizes:**
- Desktop: grid de 3 colunas.
- Mobile: stack vertical ou carousel/swipe horizontal.
- Ícones simples e lineares (estilo Lucide ou Phosphor).
- Tom empático, não dramático.

---

### Seção 3: Solução

**Objetivo:** Mostrar como o produto resolve cada dor apresentada.

**Layout:**
- Transição visual clara do problema para a solução (ex: mudança de tom de fundo).
- 3 blocos alternados (imagem + texto), cada um conectado a uma dor:
  - Solução 1: calendário centralizado com filtros → screenshot dos filtros.
  - Solução 2: push notifications → ilustração ou screenshot de notificação no celular.
  - Solução 3: RSVP "vou nessa" → screenshot da lista de participantes.
- Cada bloco: título + descrição curta (2-3 linhas) + screenshot/mockup do feature.

**Diretrizes:**
- Desktop: layout alternado (imagem esquerda/texto direita, depois inverte).
- Mobile: stack vertical (imagem em cima, texto embaixo).
- Screenshots devem ser mockups reais do app com dados da região.
- Animação sutil de fade-in ao scrollar (opcional, não essencial).

---

### Seção 4: Features em Destaque

**Objetivo:** Listar features-chave de forma escaneável.

**Layout:**
- Grid de 4-6 features em cards compactos.
- Cada card: ícone + título (2-3 palavras) + descrição curta (1 linha).
- Features sugeridas para destacar:
  - Filtro por raio em km
  - Filtro por premiação
  - Busca por texto
  - Detalhes completos da prova
  - Instala como app (PWA)
  - Notificações de novas provas

**Diretrizes:**
- Desktop: grid 3x2 ou 2x3.
- Mobile: grid 2x3 ou lista vertical.
- Cards com borda sutil ou fundo levemente diferente, sem sombra pesada.
- Não repetir o que já foi mostrado na seção de Solução — aqui é complementar.

---

### Seção 5: Como Funciona

**Objetivo:** Reduzir fricção mostrando que é simples de usar.

**Layout:**
- 3 passos numerados em linha horizontal:
  - Passo 1: Crie sua conta (ícone de usuário/login).
  - Passo 2: Encontre corridas na sua região (ícone de busca/mapa).
  - Passo 3: Marque "vou nessa" e receba lembretes (ícone de sino/check).
- Linha conectora entre os passos (seta ou linha tracejada).
- Descrição curta sob cada passo (1 linha).

**Diretrizes:**
- Desktop: horizontal, 3 colunas com linha conectora.
- Mobile: vertical, steps empilhados com numeração visível.
- Minimalista — sem screenshots nesta seção, apenas ícones.

---

### Seção 6: Social Proof

**Objetivo:** Gerar confiança e identificação.

**Layout:**
- 2-3 depoimentos de corredores da região (podem ser coletados antes do lançamento com corredores reais, incluindo a esposa do fundador e conhecidos).
- Cada depoimento: foto, nome, cidade, frase curta.
- Opcional: contador de métricas (ex: "X corridas cadastradas", "X corredores na plataforma") — só incluir quando houver números reais relevantes.

**Diretrizes:**
- Desktop: cards em linha ou grid 3 colunas.
- Mobile: carousel/swipe ou stack vertical.
- Fotos reais (não stock). Se não tiver, usar avatar com iniciais.
- Depoimentos curtos (máximo 2 linhas). Autênticos, sem marketing-speak.

---

### Seção 7: CTA Final

**Objetivo:** Capturar quem scrollou até o final — está interessado mas precisa do último empurrão.

**Layout:**
- Fundo com cor de destaque (primária do brand) para se diferenciar do resto.
- Headline de reforço (reafirmar o valor).
- CTA primário: botão de cadastro (mesmo da hero, repetido).
- Texto de suporte mínimo (1 linha: "Gratuito. Sem pegadinha.").

**Diretrizes:**
- Seção curta e direta — máximo 30% da altura da viewport.
- Botão grande e visível.
- Sem distrações (sem links, sem menu, sem imagens).

---

### Seção 8: Footer

**Objetivo:** Informações institucionais e links úteis.

**Layout:**
- Logo + tagline.
- Links: Sobre, Contato, Termos de Uso, Política de Privacidade.
- Redes sociais (Instagram, se houver).
- "Feito para corredores do interior de SP" — reforço da identidade local.

**Diretrizes:**
- Fundo escuro ou neutro, contraste com o corpo da página.
- Compacto — não precisa de múltiplas colunas de links no MVP.

---

## Hierarquia de CTAs

| Prioridade | CTA | Localização | Estilo |
|---|---|---|---|
| Primário | "Criar conta" / "Acessar o app" | Hero + CTA Final + Header fixo | Botão sólido, cor primária, destaque máximo |
| Secundário | "Ver corridas" / "Explorar" | Hero (abaixo do primário) | Botão outline ou link com seta |
| Terciário | "Saiba mais" | Hero | Link/âncora com scroll suave para seção Problema |

---

## Navegação

- **Header fixo (sticky):** Logo à esquerda + CTA primário à direita. Sem menu complexo — landing page single-page.
- **Mobile:** Logo + CTA no header. Menu hamburger só se necessário (idealmente não).
- **Scroll suave** entre seções.

---

## Notas Gerais

- A landing page é separada do app. O CTA redireciona para `/login` ou `/cadastro` do app.
- Otimizar para compartilhamento via WhatsApp (Open Graph tags com imagem, título e descrição atrativos).
- Tempo de carregamento da landing < 2 segundos.
- Acessibilidade: contraste adequado, textos legíveis, navegação por teclado.
