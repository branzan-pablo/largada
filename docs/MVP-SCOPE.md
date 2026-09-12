# MVP-SCOPE — Largada

> Estado técnico atual: o esquema é composto por 28 migrações e inclui
> monetização AbacatePay, planos de organizador, analytics, integração Strava,
> push notifications, ingestão por scrapers e recomendações assistidas por IA.

## 1. O que ESTÁ no MVP

### MUST HAVE (sem isso não lança)

| Feature | Justificativa |
|---|---|
| **Auth: Email/senha + Google + Strava** | Três opções cobrem todos os perfis: casual (email), prático (Google), corredor engajado (Strava). |
| **Listagem de corridas com filtros** (cidade, data, distância, raio km, premiação) | Core do produto. Sem isso, não há valor. Filtros completos diferenciam de uma simples lista. |
| **Busca por texto** | Complemento essencial dos filtros. Corredores frequentemente procuram uma prova específica pelo nome. |
| **Página de detalhe da corrida** (todos os campos: data, local, distâncias, valor, link inscrição, prazo, premiação detalhada, percurso texto/imagem) | Sem informação completa, o corredor ainda precisa ir a outra fonte. Isso mata o propósito do produto. |
| **RSVP "Vou Nessa"** com contador e lista de participantes | Camada social mínima. Diferencia de um calendário estático e gera efeito de rede. |
| **Seção "Minhas Corridas" no perfil** | Dá ao usuário uma razão para voltar — seu calendário pessoal de provas. |
| **Cadastro manual de corridas (admin)** | Fonte primária de dados no MVP. Sem dados, sem produto. |
| **Formulário de sugestão de corrida** | Escala o cadastro de dados com a comunidade. Reduz dependência do admin. |
| **Painel admin** (CRUD corridas + fila de sugestões + dashboard básico) | Operação mínima para manter o produto funcionando. |
| **Push notifications via Web Push (VAPID)** (nova corrida + lembrete de prazo) | Resolve a dor nº 1 de forma proativa — corredor não precisa lembrar de checar o app. |
| **PWA** (manifest + service worker + prompt de instalação) | Experiência de app nativo no celular sem app store. Necessário para push funcionar. |
| **100% responsivo (mobile-first)** | Corredor acessa pelo celular. Se não funcionar bem no mobile, o produto falha. |
| **SEO e Open Graph** | Corridas serão compartilhadas via WhatsApp. O preview precisa ser bonito e informativo. |
| **Landing page** | Porta de entrada para aquisição de novos usuários. |

### SHOULD HAVE (entra se der tempo)

| Feature | Justificativa |
|---|---|
| **Visualização em calendário mensal** | Alternativa visual útil para planejamento, mas a listagem com filtro de data já resolve o básico. |
| **Notificação de status da sugestão** | Melhora a experiência de quem contribui, mas não é crítico para o core do produto. |

---

## 2. O que NÃO está no MVP (Future Scope)

| Feature | Por que não entra | Quando considerar |
|---|---|---|
| **Mapa interativo de percurso** | Complexidade alta (integração com mapas, dados GPS). Texto + imagem resolve no MVP. | v2 — quando houver demanda clara dos usuários. |
| **Integração de dados do Strava** (sync de treinos, pace, distância) | API do Strava requer aprovação e adiciona complexidade. Login é suficiente por agora. | v2 — quando a camada social evoluir. |
| **Grupos de treino / chat** | Feature social complexa que requer moderação e massa crítica de usuários. | v3 — quando houver 500+ usuários ativos. |
| **Painel para organizadores** | Requer um segundo produto (B2B) com fluxo, permissões e possivelmente cobrança. | v3 — quando o produto tiver tração e organizadores procurarem a plataforma. |
| **Scraping automatizado** | Fontes são heterogêneas (Instagram, sites variados). Manutenção alta, qualidade inconsistente. | v2 — focar em fontes estruturadas (Ticket Sports, Sympla) primeiro. |
| **App nativo (iOS/Android)** | PWA cobre 90% da experiência. App nativo só se justifica com features que exigem (GPS tracking, etc). | v4 — se o PWA atingir limites. |
| **Resultados de corridas passadas** | Valor alto, mas requer estrutura de dados complexa (tempos, categorias, classificação). | v2 — dados de resultados são um grande diferencial futuro. |
| **Sistema de avaliação de corridas** | Útil para ajudar corredores a escolher provas, mas precisa de volume de dados. | v2 — após corredores participarem de provas listadas. |
| **Monetização** (anúncios, destaque pago, assinatura) | MVP foca em validação e tração, não em receita. | Após atingir 500+ usuários e ter organizadores interessados. |

---

## 3. Justificativa das Decisões de Escopo

**Princípio guia:** o MVP deve resolver a dor nº 1 (encontrar corridas facilmente) de forma completa e confiável, com o mínimo de features sociais para criar diferenciação e retenção.

**Por que tantos filtros no MVP?** Porque filtrar é o core da proposta de valor. Um calendário sem bons filtros é só uma lista — e listas já existem em grupos de WhatsApp. Os filtros (especialmente raio em km e premiação) são o diferencial.

**Por que push notifications no MVP?** Porque resolve a dor de forma proativa. O corredor não precisa criar o hábito de abrir o app — o app vai até ele. Isso é crítico para retenção nos primeiros meses quando o hábito ainda não existe.

**Por que não scraping no MVP?** Qualidade > quantidade. É melhor ter 30 corridas com dados completos e corretos do que 100 com dados incompletos. O cadastro manual + sugestões da comunidade garante qualidade. Scraping pode introduzir dados ruins que minam a confiança.

---

## 4. Hipóteses a Validar com o MVP

| # | Hipótese | Como medir | Sinal positivo |
|---|---|---|---|
| H1 | Corredores da região têm dificuldade real em encontrar corridas de forma centralizada. | Cadastros na plataforma sem investimento em mídia paga (apenas WhatsApp orgânico). | 100+ cadastros em 2 meses. |
| H2 | Um calendário centralizado com bons filtros é suficiente para gerar retorno recorrente. | Frequência de retorno semanal. | 30% dos usuários voltam 1x/semana. |
| H3 | A camada social (RSVP) gera efeito de rede e aumenta engajamento. | % de usuários que usam "Vou Nessa" e compartilham corridas. | 20% dos ativos marcam pelo menos 1 prova. |
| H4 | Push notifications aumentam retenção. | Comparar retenção de usuários com push ativado vs desativado. | Retenção 2x maior com push ativado. |
| H5 | A comunidade contribui com sugestões de corridas, reduzindo a dependência do admin. | Número de sugestões recebidas por mês. | 5+ sugestões/mês após o primeiro mês. |
| H6 | Corredores profissionais/elite veem valor no filtro de premiação. | Uso do filtro de premiação por dinheiro. | 15% das buscas usam filtro de premiação. |

---

## 5. Métricas de Sucesso do MVP

### Métricas Primárias (North Star)

| Métrica | Meta (3 meses) | Ferramenta de medição |
|---|---|---|
| Usuários cadastrados | 200+ | Supabase Auth dashboard |
| Retorno semanal | 30% dos cadastrados | Analytics (pageview por usuário/semana) |

### Métricas Secundárias

| Métrica | Meta (3 meses) | Ferramenta de medição |
|---|---|---|
| Corridas cadastradas | 30+ provas | Supabase database |
| Taxa de RSVP | 20% dos ativos marcam pelo menos 1 prova | Query no banco |
| Push opt-in rate | 50% dos cadastrados | Supabase (push_subscriptions) |
| Sugestões recebidas | 15+ no total | Supabase database |
| Bounce rate da landing page | < 60% | Analytics |
| Tempo médio na listagem | > 2 minutos | Analytics |

### Critérios de Go/No-Go para v2

| Decisão | Condição |
|---|---|
| **Investir em v2** | 200+ usuários E 30%+ retenção semanal em 3 meses. |
| **Pivotar** | < 100 usuários OU < 15% retenção semanal após 3 meses. |
| **Desistir** | < 50 usuários após 3 meses com esforço de divulgação ativo. |
