# Auditoria Técnica Completa — Largada MVP

> **Data:** 17 de fevereiro de 2026
> **Versão do projeto:** 0.1.0
> **Branch analisada:** `main`
> **Auditor:** Claude Sonnet 4.6 (análise automatizada + revisão de código)

---

## Sumário Executivo

O **Largada** é uma plataforma de descoberta e gestão de corridas de rua focada no interior do Estado de São Paulo. É uma Progressive Web App (PWA) full-stack construída sobre Next.js 16 + React 19, com Supabase como BaaS e Web Push (VAPID) para notificações push.

O projeto está em estágio MVP com arquitetura sólida e bem organizada para o escopo proposto. Há pontos de atenção principalmente nas áreas de **segurança operacional** (rate limiting em memória, exposição de erros de BD), **escalabilidade** (filtros client-side, sem cache de API) e **qualidade de código** (ausência de testes, sem CI/CD formal). Nenhuma vulnerabilidade crítica foi encontrada, mas há achados de severidade média que devem ser endereçados antes de um lançamento em produção de maior escala.

**Pontuação geral estimada:** 7.2 / 10 para um MVP

---

## Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Análise de Arquitetura](#3-análise-de-arquitetura)
4. [Auditoria de Segurança](#4-auditoria-de-segurança)
5. [Análise de Performance](#5-análise-de-performance)
6. [Qualidade de Código](#6-qualidade-de-código)
7. [Análise de Dependências](#7-análise-de-dependências)
8. [Sistema de Notificações & PWA](#8-sistema-de-notificações--pwa)
9. [Banco de Dados & API](#9-banco-de-dados--api)
10. [Escalabilidade](#10-escalabilidade)
11. [Pontos Positivos](#11-pontos-positivos)
12. [Recomendações Priorizadas](#12-recomendações-priorizadas)

---

## 1. Visão Geral do Projeto

### Propósito

Centralizar informações sobre corridas de rua no interior de São Paulo, permitindo:

- Descoberta e filtragem de eventos por cidade, distância, premiação, data e raio geográfico
- RSVP (confirmação de presença) em corridas
- Sugestão de novas corridas pela comunidade
- Notificações push quando novas corridas são publicadas na cidade do usuário
- Painel administrativo para gestão de eventos e moderação de sugestões

### Público-alvo

Corredores amadores e semi-profissionais do interior paulista.

### Modelo de operação

- MVP com equipe enxuta (provavelmente solo ou dupla)
- Dados inseridos manualmente por admins ou via sugestões da comunidade
- Monetização não evidenciada no código (sem integrações de pagamento)

---

## 2. Stack Tecnológico

| Camada             | Tecnologia            | Versão          | Situação                  |
| ------------------ | --------------------- | --------------- | ------------------------- |
| Framework Frontend | Next.js               | 16.1.6          | Atual                     |
| UI Library         | React                 | 19.2.3          | Atual                     |
| Linguagem          | TypeScript            | 5.x             | Atual                     |
| Estilização        | Tailwind CSS          | v4.x            | Atual (beta/cutting-edge) |
| Componentes UI     | shadcn/ui + Radix UI  | 3.8.4 / 1.4.3   | Atual                     |
| Banco de Dados     | Supabase (PostgreSQL) | 2.95.3 (client) | Estável                   |
| Autenticação       | Supabase Auth         | —               | Estável                   |
| Notificações Push  | web-push (VAPID)      | 3.6.7           | Estável                   |
| Validação          | Zod                   | 4.3.6           | Atual                     |
| Data/Hora          | date-fns              | 4.1.0           | Atual                     |
| Ícones             | Lucide React          | 0.563.0         | Atual                     |
| Toasts             | Sonner                | 2.0.7           | Atual                     |

### Observações sobre versões

- **Next.js 16.1.6**: Versão muito recente (liberada em 2026). Pode conter breaking changes não documentados. Manter monitoramento do changelog.
- **React 19.2.3**: React 19 ainda é relativamente novo no ecossistema; algumas bibliotecas de terceiros podem ter incompatibilidades.
- **Tailwind CSS v4**: Versão ainda em estágio de maturidade, com API diferente da v3. Mudança para abordagem PostCSS ao invés do arquivo `tailwind.config.js` tradicional. Não há arquivo `tailwind.config.ts` no projeto — configuração embutida no CSS global via `@import "tailwindcss"`.
- **Zod 4.3.6**: Zod v4 tem algumas mudanças de API em relação ao v3 (o código já usa `zod/v4` no import de validations.ts).
- **web-push 3.6.7**: Biblioteca leve para envio de Web Push via protocolo VAPID. Sem dependência de serviços externos (Firebase/FCM).

---

## 3. Análise de Arquitetura

### 3.1 Estrutura de Diretórios

A estrutura segue as convenções do **Next.js App Router** com boas práticas:

```
src/
├── app/             # Roteamento (App Router)
│   ├── (landing)/   # Route Group — Landing Page
│   ├── (app)/       # Route Group — App autenticado
│   ├── api/         # API Routes (server-side)
│   └── auth/        # Callbacks OAuth
├── components/      # Componentes organizados por domínio
│   ├── ui/          # shadcn/ui (primitivos)
│   ├── auth/
│   ├── races/
│   ├── admin/
│   ├── landing/
│   ├── layout/
│   └── pwa/
├── lib/             # Lógica de negócio e utilitários
├── contexts/        # Estado global (React Context)
├── hooks/           # Custom hooks
└── types/           # Tipos TypeScript
```

**Avaliação:** Excelente separação de responsabilidades. A divisão por domínio (`races/`, `auth/`, `admin/`) facilita a navegação e manutenção.

### 3.2 Padrão de Renderização

- **Server Components** como padrão (correto para Next.js 13+)
- **`"use client"`** aplicado cirurgicamente apenas onde necessário (formulários, auth, interatividade)
- **API Routes** para mutações e integrações externas
- **Middleware** para autenticação e proteção de rotas

**Avaliação:** Padrão consistente e alinhado com as melhores práticas do Next.js App Router.

### 3.3 Gerenciamento de Estado

| Tipo                  | Abordagem                                 | Avaliação            |
| --------------------- | ----------------------------------------- | -------------------- |
| Auth global           | React Context (`auth-context.tsx`)        | Adequado para MVP    |
| UI de Modal           | React Context (`login-modal-context.tsx`) | Adequado             |
| Estado de formulários | `useState` local                          | Adequado             |
| Dados da API          | `fetch` direto + hook `useInfiniteRaces`  | Funcional, sem cache |

**Ausência notável:** Nenhuma solução de cache de dados do servidor (sem React Query, SWR ou equivalente). Dados são refetchados a cada navegação.

### 3.4 Fluxo de Autenticação

```
Usuário → Supabase Auth (Email/Google/Strava)
       → Middleware (validação de sessão + proteção de rotas)
       → auth-context (estado global no cliente)
       → requireAuth() / requireAdmin() (proteção nas API Routes)
```

**Dupla verificação:** Autenticação é verificada tanto no middleware (para páginas) quanto nas API routes (para endpoints) — padrão correto e seguro.

### 3.5 Decisões Arquiteturais Notáveis

| Decisão                           | Justificativa                     | Impacto                                     |
| --------------------------------- | --------------------------------- | ------------------------------------------- |
| Monolito Next.js (frontend + API) | Simplicidade para MVP             | Acoplamento, mas aceitável no escopo        |
| Supabase como BaaS                | Reduz infraestrutura              | Dependência de vendor, mas justificada      |
| Web Push VAPID                    | Padrão aberto, sem vendor lock-in | Leve e integrado ao Supabase                |
| Filtro geográfico client-side     | Evita PostGIS                     | Limitação de escala (documentada no código) |
| Rate limiting in-memory           | Simplicidade MVP                  | Não funciona em múltiplas instâncias        |
| Context API para estado           | Zero dependência externa          | Suficiente para o escopo                    |

---

## 4. Auditoria de Segurança

### 4.1 Autenticação e Autorização

#### ✅ Pontos Positivos

- Supabase Auth com suporte a JWT e refresh automático de sessão
- Middleware protege rotas no nível do servidor (não apenas client-side)
- Verificação de role admin em `/admin` tanto no middleware quanto na API
- `requireAuth()` e `requireAdmin()` aplicados consistentemente nas API routes
- RLS (Row Level Security) ativo no Supabase para a tabela `profiles`

#### ⚠️ Achados de Atenção

**[MÉDIA] Proteção de rota admin baseada em role armazenado no banco de dados do próprio cliente**

No middleware (`src/middleware.ts:47-56`), o role do usuário é lido da tabela `profiles` que é um dado controlado pelo próprio banco, não pelo JWT. Se um usuário conseguir modificar seu próprio `role` via outra vulnerabilidade, ganharia acesso admin. Recomenda-se armazenar o role no metadata do JWT do Supabase (`app_metadata`) que não é editável pelo cliente.

```typescript
// middleware.ts:47-56 — role lido do banco de dados controlado pelo usuário
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();
```

**[BAIXA] Exposição de mensagens de erro do banco de dados**

Em múltiplas API routes, mensagens de erro do Supabase são retornadas diretamente ao cliente:

```typescript
// api/races/route.ts:86-88
if (error) {
  return NextResponse.json({ error: error.message }, { status: 400 });
}
```

Mensagens de erro de banco de dados podem vazar informações sobre a estrutura interna. Em produção, retornar mensagens genéricas para erros 500 e logar o detalhe server-side.

**[BAIXA] Sem proteção CSRF explícita**

As API routes utilizam `fetch` sem tokens CSRF. Next.js mitiga parcialmente com verificação de `Origin` header por padrão, mas não há proteção CSRF explícita implementada.

### 4.2 Validação de Dados

#### ✅ Pontos Positivos

- Zod validando **todos** os inputs de API (login, registro, criação de corrida, sugestões)
- Sanitização de input de busca (escape de wildcards LIKE do Postgres):
  ```typescript
  // api/races/route.ts:69
  const sanitized = search.replace(/[%_\\]/g, "\\$&");
  ```
- Normalização de URLs antes de armazenar (`normalizeUrl()`)
- Validação de coordenadas geográficas (lat: -90/90, lng: -180/180)

#### ⚠️ Achados de Atenção

**[MÉDIA] Sem limite no tamanho dos campos de texto**

No `raceSchemaBase`, campos como `description`, `routeDescription`, `prizeDetails` não têm `maxLength`. Um admin malicioso (ou conta comprometida) poderia inserir payloads grandes.

```typescript
// validations.ts:44-46 — sem .max()
description: z.string().optional(),
routeDescription: z.string().optional(),
prizeDetails: z.string().optional(),
```

**[BAIXA] `origin` não validado pelo schema Zod**

```typescript
// api/races/route.ts:176 — leitura do `raw` original, não do `parsed.data`
origin: raw.origin === "approved_suggestion" ? "approved_suggestion" : "admin",
```

O campo `origin` é lido do request bruto em vez do objeto Zod validado. Apesar do ternário prevenir valores arbitrários, o padrão é inconsistente — deveria estar no schema.

### 4.3 Rate Limiting

#### ⚠️ Achados de Atenção

**[ALTA] Rate limiter em memória não funciona em deploy multi-instância**

O arquivo `src/lib/rate-limit.ts` usa um `Map` JavaScript em memória:

```typescript
// rate-limit.ts:1
const rateMap = new Map<string, { count: number; resetAt: number }>();
```

**Problemas:**

1. Em ambientes serverless (Vercel), cada função é uma instância separada — o estado não é compartilhado entre invocações
2. O estado é perdido a cada cold start / redeploy
3. Um usuário pode contornar o limite simplesmente sendo roteado para outra instância

**Impacto no MVP:** Baixo (volume de usuários pequeno), mas deve ser endereçado antes de escalar.
**Solução:** Migrar para `@upstash/ratelimit` com Redis (o próprio código já documenta isso).

**[BAIXA] Cleanup de entradas expiradas ineficiente**

```typescript
// rate-limit.ts:17 — cleanup só ocorre quando rateMap.size > 100
if (rateMap.size > 100) {
```

A condição `size > 100` pode deixar entradas expiradas acumulando por muito tempo sem limpeza.

### 4.4 Segurança de Chaves e Secrets

#### ✅ Pontos Positivos

- `.env.local.example` documenta todas as variáveis necessárias
- Chaves privadas (service role, VAPID private key, Strava secret) não são expostas como `NEXT_PUBLIC_`
- `CRON_SECRET` para proteger o endpoint de cron

#### ⚠️ Achados de Atenção

**[BAIXA] CRON_SECRET: verificação não localizada no código auditado**

O `.env.local.example` documenta `CRON_SECRET`, mas a verificação desta variável no endpoint `/api/cron/deadline-reminder` não pôde ser verificada. Confirmar que o endpoint valida o header `Authorization: Bearer <CRON_SECRET>` antes de executar.

### 4.5 Proteção de Rotas de API Públicas

| Endpoint                   | Autenticação    | Autorização | Rate Limit |
| -------------------------- | --------------- | ----------- | ---------- |
| GET /api/races             | Nenhuma         | Nenhuma     | Nenhum     |
| POST /api/races            | ✅ requireAdmin | ✅ admin    | Nenhum     |
| PATCH /api/races/[id]      | ✅ requireAdmin | ✅ admin    | Nenhum     |
| DELETE /api/races/[id]     | ✅ requireAdmin | ✅ admin    | Nenhum     |
| POST /api/rsvp             | ✅ requireAuth  | —           | ✅ 10/min  |
| POST /api/suggestions      | ✅ requireAuth  | —           | ✅ 5/dia   |
| PATCH /api/suggestions     | ✅ requireAdmin | ✅ admin    | Nenhum     |
| POST /api/push/subscribe   | ✅ requireAuth  | —           | ✅ 10/hora |
| POST /api/push/unsubscribe | ✅ requireAuth  | —           | Nenhum     |
| PATCH /api/profile         | ✅ requireAuth  | —           | Nenhum     |

**[BAIXA] GET /api/races sem autenticação nem rate limiting:** Pode ser abusado para scraping massivo. Para MVP com baixo tráfego é aceitável, mas monitorar.

---

## 5. Análise de Performance

### 5.1 Carregamento de Página

#### ✅ Boas Práticas

- Server Components reduzem o JavaScript enviado ao cliente
- Imagens configuradas com `next/image` e domínios remotos permitidos
- Lazy loading implícito por padrão no Next.js
- PWA com Service Worker para cache de assets estáticos
- Infinite scroll (`useInfiniteRaces`) evita carregar todas as corridas de uma vez

#### ⚠️ Pontos de Atenção

**[MÉDIA] Filtro de raio geográfico feito no cliente após busca no banco**

```typescript
// api/races/route.ts:92-101
if (lat && lng && radius) {
  filteredData = filteredData.filter(
    (race) => haversineDistance(...) <= maxRadius
  );
}
```

O servidor busca uma página de dados (ex: 20 itens), depois filtra por raio. Se a maioria dos itens for descartada pelo filtro, a paginação fica imprecisa e `hasMore` pode retornar `true` mesmo sem mais resultados válidos. Com banco de dados crescendo, isso piora progressivamente.

**[BAIXA] Sem cache de API (sem stale-while-revalidate, sem CDN cache headers)**

As respostas de GET `/api/races` não incluem headers `Cache-Control`. Cada requisição bate diretamente no Supabase.

**[BAIXA] Notificação push síncrona na criação de corrida**

```typescript
// api/races/route.ts:190-194
// Send push notifications before returning (Vercel kills the runtime after response)
try {
  await notifyNewRace(data.id);
}
```

O comentário no código aponta o problema: a resposta ao admin espera o envio de todas as notificações push antes de retornar. Com muitos tokens, isso aumenta significativamente o tempo de resposta. A solução ideal seria usar background jobs (Vercel Cron, Inngest, etc.).

### 5.2 Bundle Size

- `web-push` é server-side apenas — zero impacto no bundle do cliente (ao contrário do antigo Firebase SDK).
- shadcn/ui com tree-shaking adequado.

---

## 6. Qualidade de Código

### 6.1 Organização e Legibilidade

**Pontuação: 8/10**

- Nomes de arquivos e variáveis consistentes (kebab-case para arquivos, camelCase para funções, PascalCase para componentes)
- Comentários explicativos em decisões não-óbvias (ex: comentário sobre rate-limit em memória, filtro Haversine client-side)
- Separação clara entre lógica de negócio (`lib/`) e apresentação (`components/`)
- Tipos TypeScript bem definidos em `src/types/`

### 6.2 Tratamento de Erros

**Pontuação: 6/10**

- Try-catch presentes nas operações críticas
- Feedback ao usuário via toasts (sonner)
- **Problema:** Erros de banco retornados diretamente ao cliente (ver seção 4.1)
- **Problema:** Sem logging centralizado / monitoramento de erros (sem Sentry, LogRocket, etc.)
- Funções de notificação têm fallback silencioso (retornam `{ sent: 0, failed: 0 }` em caso de erro) — pode ocultar problemas

### 6.3 Testes

**Pontuação: 0/10 (ausência total)**

**[CRÍTICO para escala] Nenhum teste automatizado encontrado:**

- Sem testes unitários
- Sem testes de integração
- Sem testes end-to-end (Playwright, Cypress)
- Sem scripts de teste no `package.json`

Para um MVP isso é comum, mas representa risco crescente à medida que o projeto evolui.

### 6.4 Linting e Formatação

- ESLint configurado com `eslint-config-next`
- Sem Prettier configurado (indentação pode variar)
- Sem Husky / lint-staged para validação no commit
- TypeScript strict mode habilitado no `tsconfig.json`

### 6.5 Padrões de Código Específicos

#### Padrões bem aplicados:

```typescript
// validations.ts — Zod com transform para URLs
registrationLink: z.string()
  .transform(normalizeUrl)
  .pipe(z.url("Link inválido"));

// api/races/route.ts — verificação dupla admin (middleware + API)
const authResult = await requireAdmin();
if (authResult instanceof NextResponse) return authResult;

// rate-limit.ts — documentação de limitação conhecida
// NOTE: Works per-instance — resets on redeploy / cold-start.
// For production at scale, swap with @upstash/ratelimit + Redis.
```

#### Padrões a melhorar:

```typescript
// api/races/route.ts:176 — raw lido fora do schema validado
origin: (raw.origin === "approved_suggestion" ? "approved_suggestion" : "admin",
  // Deveria estar no raceSchema

  // notifications.ts — envio síncrono bloqueia resposta ao admin
  await notifyNewRace(data.id));
// Deveria ser assíncrono via queue ou background job
```

---

## 7. Análise de Dependências

### 7.1 Dependências de Produção

| Pacote                     | Versão  | Avaliação | Risco |
| -------------------------- | ------- | --------- | ----- |
| `next`                     | 16.1.6  | Atual     | Baixo |
| `react` / `react-dom`      | 19.2.3  | Atual     | Baixo |
| `@supabase/supabase-js`    | 2.95.3  | Atual     | Baixo |
| `@supabase/ssr`            | 0.8.0   | Atual     | Baixo |
| `web-push`                 | 3.6.7   | Estável   | Baixo |
| `zod`                      | 4.3.6   | Atual     | Baixo |
| `date-fns`                 | 4.1.0   | Atual     | Baixo |
| `radix-ui`                 | 1.4.3   | Atual     | Baixo |
| `lucide-react`             | 0.563.0 | Atual     | Baixo |
| `sonner`                   | 2.0.7   | Atual     | Baixo |
| `tailwind-merge`           | 3.4.0   | Atual     | Baixo |
| `class-variance-authority` | 0.7.1   | Estável   | Baixo |
| `clsx`                     | 2.1.1   | Estável   | Baixo |

### 7.2 Dependências de Desenvolvimento

| Pacote                 | Versão | Avaliação            |
| ---------------------- | ------ | -------------------- |
| `typescript`           | 5.x    | Atual                |
| `tailwindcss`          | v4.x   | Atual (cutting-edge) |
| `@tailwindcss/postcss` | v4.x   | Atual                |
| `eslint`               | 9.x    | Atual                |
| `shadcn`               | 3.8.4  | Atual                |
| `supabase` (CLI)       | 2.76.9 | Atual                |
| `tw-animate-css`       | 1.4.0  | Atual                |

### 7.3 Dependências Ausentes

| Dependência Recomendada                  | Uso                                | Prioridade |
| ---------------------------------------- | ---------------------------------- | ---------- |
| `@upstash/ratelimit` + `@upstash/redis`  | Rate limiting distribuído          | Alta       |
| `@sentry/nextjs`                         | Monitoramento de erros em produção | Média      |
| Framework de testes (`vitest` ou `jest`) | Testes unitários                   | Média      |
| `playwright` ou `cypress`                | Testes E2E                         | Baixa      |
| `prettier`                               | Formatação consistente             | Baixa      |
| `husky` + `lint-staged`                  | Validação pré-commit               | Baixa      |

### 7.4 Observações sobre Dependências

**BaaS unificado (Supabase) + web-push:** A migração de Firebase Cloud Messaging para Web Push (VAPID) via `web-push` simplificou a arquitetura:

- Apenas 1 BaaS (Supabase) para gerenciar — dados, auth e subscriptions de push
- `web-push` é uma biblioteca leve (~20KB) usada apenas server-side — zero impacto no bundle do cliente
- Protocolo VAPID é padrão aberto — sem vendor lock-in com Google/Firebase
- Subscriptions armazenadas na tabela `push_subscriptions` no próprio Supabase

---

## 8. Sistema de Notificações & PWA

### 8.1 PWA

**Status:** Bem implementado para o propósito

| Feature              | Status     | Observação                                                  |
| -------------------- | ---------- | ----------------------------------------------------------- |
| `manifest.json`      | ✅         | Completo com ícones, tema, display                          |
| Service Worker       | ✅         | Servido dinamicamente via route handler                     |
| Ícones PWA           | ✅         | SVG + PNG, incluindo variante maskable                      |
| Prompt de instalação | ✅         | Com tratamento especial para iOS                            |
| Offline support      | ⚠️ Parcial | SW gerencia apenas notificações push, sem cache de conteúdo |
| Theme color          | ✅         | `#fc5200` consistente com a marca                           |

**[MÉDIA] Sem estratégia de cache offline para conteúdo**

O Service Worker atual gerencia apenas notificações push em background. Não há estratégia de caching (Workbox ou similar) para assets, páginas ou dados. O app não funciona offline além das notificações.

### 8.2 Web Push (VAPID)

**Fluxo completo e bem implementado:**

```
Usuário habilita notificações
  → Permission API (Notification.requestPermission)
  → Service Worker registrado
  → PushSubscription criada via PushManager.subscribe (chave pública VAPID)
  → Subscription salva no Supabase (push_subscriptions: endpoint, p256dh, auth)
  → Admin cria corrida
  → notifyNewRace() busca subscriptions por raio geográfico (PostGIS)
  → web-push envia via protocolo VAPID direto ao push service
  → SW exibe notificação (background)
```

**Pontos positivos:**

- Protocolo VAPID padrão aberto — sem dependência de Firebase/Google
- `web-push` é server-side only — zero impacto no bundle do cliente
- Limpeza automática de subscriptions expiradas (HTTP 404/410) após falha de envio
- Matching por raio geográfico via PostGIS (`get_race_notification_recipients`)
- Fallback para match exato de cidade quando `city_id` está ausente
- Apenas 1 BaaS (Supabase) — sem complexidade de gerenciar Firebase em paralelo
- Tratamento especial para iOS (requer PWA instalada)

**[BAIXA] Sem deduplicação por usuário na busca de subscriptions**

Um usuário com múltiplos dispositivos terá múltiplas subscriptions. A query não agrupa por `user_id`, então o mesmo usuário pode receber N notificações em N dispositivos. Isso é comportamento esperado na maioria dos casos, mas vale avaliar se desejável.

---

## 9. Banco de Dados & API

### 9.1 Schema do Banco

**Tabelas identificadas:**

| Tabela               | Finalidade                                  | RLS                              |
| -------------------- | ------------------------------------------- | -------------------------------- |
| `profiles`           | Perfis de usuário                           | ✅ (usuário só acessa o próprio) |
| `races`              | Corridas cadastradas                        | ⚠️ Verificar                     |
| `rsvps`              | Confirmações de presença                    | ⚠️ Verificar                     |
| `race_suggestions`   | Sugestões da comunidade                     | ⚠️ Verificar                     |
| `push_subscriptions` | Subscriptions de Web Push (VAPID)           | ⚠️ Verificar                     |
| `cities`             | Cidades da região com coordenadas (PostGIS) | ✅ (leitura pública)             |

**[MÉDIA] RLS não verificável nas tabelas não-profiles**

A auditoria não teve acesso ao schema SQL do Supabase para verificar as políticas RLS nas demais tabelas. É crítico garantir que:

- `rsvps`: usuário só pode ler/criar/deletar os próprios RSVPs
- `race_suggestions`: usuário só pode ler/deletar as próprias sugestões
- `push_subscriptions`: usuário só pode gerenciar as próprias subscriptions
- `races`: leitura pública, escrita apenas por admins

### 9.2 Design das API Routes

**Avaliação geral: 7.5/10**

#### Boas práticas encontradas:

- Validação com Zod em todas as rotas de escrita
- `requireAuth()` / `requireAdmin()` aplicados consistentemente
- Rate limiting nas rotas sensíveis
- Slugs com verificação de colisão
- Paginação implementada (cursor-based via range)

#### Melhorias sugeridas:

**[BAIXA] Sem versionamento de API**

As rotas estão em `/api/races`, `/api/rsvp` sem versionamento (`/api/v1/`). Dificulta evoluções sem breaking changes no futuro.

**[BAIXA] Verbos HTTP inconsistentes para RSVP**

O endpoint `POST /api/rsvp` faz toggle (cria se não existe, deleta se existe). O comportamento deveria ser `PUT` (idempotente) ou ter rotas separadas `POST /api/rsvp` e `DELETE /api/rsvp/:id`.

**[BAIXA] Sem index na busca por cidade em notificações**

A query em `notifyNewRace()` filtra por `profiles.city` em memória após join. Se o banco tiver índice em `profiles.city`, isso poderia ser feito no SQL diretamente.

### 9.3 Strava OAuth

A integração com Strava está presente (`/auth/strava/callback`), mas não foi possível verificar o uso dos dados do Strava além do login. Verificar se dados de atividade do Strava estão sendo utilizados ou se é apenas login social.

---

## 10. Escalabilidade

### 10.1 Limites Atuais Identificados

| Componente        | Limite Atual                         | Solução para Escala                    |
| ----------------- | ------------------------------------ | -------------------------------------- |
| Rate limiting     | In-memory (single-instance)          | Upstash Redis                          |
| Filtro geográfico | Client-side após query paginada      | PostGIS / pg_sphere                    |
| Notificações push | Envio síncrono na criação de corrida | Queue assíncrona (Inngest/Vercel Cron) |
| Cache de API      | Nenhum                               | Redis / CDN cache headers              |
| Logs e erros      | console.log / console.error          | Sentry + estruturado                   |

### 10.2 Arquitetura para Crescimento

O projeto está bem posicionado para crescer incrementalmente:

1. **Fase atual (0-1k usuários):** Arquitetura atual suficiente
2. **Fase 2 (1k-10k usuários):** Adicionar rate limiting Redis, cache de API
3. **Fase 3 (10k+ usuários):** PostGIS para filtros geográficos, filas para notificações, CDN para assets

### 10.3 Dependência do Supabase Free Tier

Sem informação de tier do Supabase, mas para MVP pode haver limitações de:

- Conexões simultâneas de banco
- Requests de API mensais
- Storage para imagens de percurso
- Edge Functions (se usadas no futuro)

---

## 11. Pontos Positivos

Esta seção destaca o que foi bem feito no projeto.

### 11.1 Arquitetura

- **Route Groups do Next.js App Router** bem utilizados para separar landing e app
- **Middleware centralizado** para auth e proteção de rotas
- **Dupla verificação de autorização** (middleware + API routes)
- **Server Components como padrão** — reduz bundle e melhora performance
- **Separação limpa** entre lib (lógica), components (UI) e app (routing)

### 11.2 Segurança

- **Validação completa** com Zod em todas as entradas de API
- **Sanitização** do input de busca (escape de wildcards SQL LIKE)
- **Limpeza automática** de push subscriptions expiradas (HTTP 404/410)
- **Secrets separados** entre cliente (NEXT*PUBLIC*) e servidor
- **Nenhuma injeção SQL** encontrada — queries todas via Supabase client tipado

### 11.3 Developer Experience

- **TypeScript strict** habilitado
- **Tipos bem definidos** para todas as entidades do domínio
- **Comentários de contexto** em decisões não-óbvias (rate-limit, haversine client-side)
- **Constantes centralizadas** (`lib/constants.ts`) para cidades, distâncias, etc.
- **Validações reutilizáveis** em `lib/validations.ts`

### 11.4 UX / PWA

- **PWA completa** com instalação, ícones e manifest
- **Web Push VAPID** com matching por raio geográfico (PostGIS) e fallback para iOS (requer PWA instalada)
- **Infinite scroll** para lista de corridas
- **Filtros mobile** com sheet drawer separado
- **Feedback visual** consistente via sonner toasts

---

## 12. Recomendações Priorizadas

### 🔴 Crítico / Alta Prioridade

| #   | Problema                                                           | Solução                                                                | Esforço |
| --- | ------------------------------------------------------------------ | ---------------------------------------------------------------------- | ------- |
| 1   | Rate limiting in-memory não funciona em serverless multi-instância | Migrar para `@upstash/ratelimit` + Redis                               | Médio   |
| 2   | Notificações push síncronas na criação de corrida                  | Usar queue/background job para envio assíncrono                        | Médio   |
| 3   | Sem testes automatizados                                           | Começar com testes unitários de `lib/` + testes de API routes críticas | Alto    |

### 🟡 Média Prioridade

| #   | Problema                                            | Solução                                                  | Esforço |
| --- | --------------------------------------------------- | -------------------------------------------------------- | ------- |
| 4   | Erros de banco expostos ao cliente                  | Criar helper de resposta de erro com mensagens genéricas | Baixo   |
| 5   | Role admin baseado em tabela de banco               | Migrar para `app_metadata` do Supabase Auth (JWT)        | Médio   |
| 6   | Sem monitoramento de erros em produção              | Integrar Sentry (`@sentry/nextjs`)                       | Baixo   |
| 7   | Sem cache de API (dados de corridas)                | Adicionar `Cache-Control` headers ou ISR no Next.js      | Baixo   |
| 8   | Campos de texto opcionais sem `maxLength` no schema | Adicionar `.max()` nos campos de texto livres            | Baixo   |
| 9   | Filtro geográfico impreciso na paginação            | Adicionar PostGIS ao Supabase ou reestruturar a query    | Alto    |

### 🟢 Baixa Prioridade / Nice to Have

| #   | Problema                                     | Solução                                                                      | Esforço |
| --- | -------------------------------------------- | ---------------------------------------------------------------------------- | ------- |
| 10  | Sem cache offline para conteúdo              | Adicionar Workbox ao Service Worker                                          | Médio   |
| 11  | Sem Prettier                                 | Configurar Prettier + lint-staged + Husky                                    | Baixo   |
| 12  | API sem versionamento                        | Reorganizar em `/api/v1/`                                                    | Médio   |
| 13  | `origin` fora do schema Zod                  | Mover campo `origin` para dentro do `raceSchema`                             | Baixo   |
| 14  | Notificações síncronas na criação de corrida | Usar Vercel Cron ou queue para processamento assíncrono                      | Médio   |
| 15  | Cleanup do rate-limit map ineficiente        | Usar `setInterval` para limpeza periódica (irrelevante se migrar para Redis) | Baixo   |

---

## Apêndice: Inventário de Arquivos

### Estrutura completa identificada

```
src/app/
├── (landing)/page.tsx          # Página inicial / marketing
├── (landing)/layout.tsx
├── (app)/layout.tsx            # Layout com Header + BottomNav
├── (app)/corridas/page.tsx     # Lista de corridas (com filtros)
├── (app)/corrida/[slug]/page.tsx  # Detalhe da corrida
├── (app)/perfil/page.tsx       # Perfil do usuário
├── (app)/sugerir/page.tsx      # Formulário de sugestão
├── (app)/admin/                # Painel administrativo
├── (app)/reset-password/
├── api/races/route.ts          # GET (lista) + POST (criar)
├── api/races/[id]/route.ts     # PATCH (editar) + DELETE
├── api/rsvp/route.ts           # POST (toggle RSVP)
├── api/suggestions/route.ts    # POST + PATCH + DELETE
├── api/push/subscribe/route.ts    # POST push subscription (VAPID)
├── api/push/unsubscribe/route.ts  # POST remove push subscription
├── api/profile/route.ts        # PATCH perfil
├── api/cron/deadline-reminder/route.ts  # GET (cron job)
├── auth/callback/route.ts      # OAuth Supabase callback
├── auth/confirm/route.ts       # Confirmação de email
├── auth/strava/callback/route.ts  # Strava OAuth
├── sw.js/route.ts                  # Service Worker (push + PWA)
├── layout.tsx                  # Root layout
├── globals.css
├── error.tsx
├── robots.ts
└── sitemap.ts

src/components/ (~30 componentes)
src/lib/ (~10 módulos de lógica)
src/contexts/ (2 contextos)
src/hooks/ (3 hooks)
src/types/ (4 arquivos de tipos)
src/middleware.ts

public/
├── manifest.json
└── icons/ (ícones PWA em SVG + PNG)
```

---

_Auditoria gerada em 17/02/2026. Para atualizar, re-executar análise após mudanças significativas na codebase._
